import { prisma } from '../config/db'

// ─── Plan config ─────────────────────────────────────────
export const PLAN_CONFIG = {
  FREE: {
    name:              'Free',
    price:             0,
    aiTrialMessages:   2,     // 2 lifetime trial messages only
    aiCreditsPerMonth: 0,
    byok:              false,
    color:             '#5c6388',
  },
  PRO: {
    name:              'Pro',
    price:             9.99,
    aiTrialMessages:   0,
    aiCreditsPerMonth: 500,   // 500 messages/month
    byok:              true,
    color:             '#6c63ff',
  },
  PREMIUM: {
    name:              'Premium',
    price:             24.99,
    aiTrialMessages:   0,
    aiCreditsPerMonth: 2000,  // 2000 messages/month
    byok:              true,
    color:             '#00d4aa',
  },
} as const

// ─── AI access result type ────────────────────────────────
export type AiAccessResult =
  | { allowed: true;  mode: 'BYOK' | 'CREDITS' | 'TRIAL' }
  | { allowed: false; reason: 'NOT_PAID' | 'TRIAL_EXHAUSTED' | 'CREDITS_EXHAUSTED'; message: string }

// ─── Core gate: called before every AI request ────────────
export async function checkAiAccess(userId: string): Promise<AiAccessResult> {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: {
      plan:               true,
      planStatus:         true,
      currentPeriodEnd:   true,
      aiMode:             true,
      encryptedApiKey:    true,
      aiTrialUsed:        true,
      aiTrialLimit:       true,
      aiCreditsRemaining: true,
    },
  })

  if (!user) return { allowed: false, reason: 'NOT_PAID', message: 'User not found' }

  const isPaid = (user.plan === 'PRO' || user.plan === 'PREMIUM')
    && user.planStatus === 'ACTIVE'
    && (!user.currentPeriodEnd || new Date(user.currentPeriodEnd) > new Date())

  // BYOK — paid plans only
  if (user.aiMode === 'BYOK' && user.encryptedApiKey) {
    if (!isPaid) {
      return {
        allowed: false,
        reason:  'NOT_PAID',
        message: 'Connecting your own API key requires a Pro or Premium plan.',
      }
    }
    return { allowed: true, mode: 'BYOK' }
  }

  // Free users — trial only (2 lifetime messages)
  if (!isPaid) {
    if (user.aiTrialUsed >= user.aiTrialLimit) {
      return {
        allowed: false,
        reason:  'TRIAL_EXHAUSTED',
        message: `You've used your ${user.aiTrialLimit} free AI trial messages. Upgrade to Pro or Premium to continue.`,
      }
    }
    return { allowed: true, mode: 'TRIAL' }
  }

  // Paid users — check monthly credits
  if (user.aiCreditsRemaining <= 0) {
    return {
      allowed: false,
      reason:  'CREDITS_EXHAUSTED',
      message: "You've used all your AI credits for this month. They refresh on your next billing date.",
    }
  }

  return { allowed: true, mode: 'CREDITS' }
}

// ─── Deduct after a successful AI call ───────────────────
export async function deductAiCredit(userId: string, mode: 'TRIAL' | 'CREDITS' | 'BYOK') {
  if (mode === 'BYOK') return  // billed to their own Anthropic account
  if (mode === 'TRIAL') {
    await prisma.user.update({ where: { id: userId }, data: { aiTrialUsed: { increment: 1 } } })
    return
  }
  await prisma.user.update({ where: { id: userId }, data: { aiCreditsRemaining: { decrement: 1 } } })
}

// ─── Full AI + subscription status (for frontend) ─────────
export async function getAiStatus(userId: string) {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: {
      plan: true, planStatus: true, currentPeriodEnd: true,
      aiMode: true, encryptedApiKey: true,
      aiTrialUsed: true, aiTrialLimit: true,
      aiCreditsRemaining: true, aiCreditsTotal: true, aiCreditsResetAt: true,
    },
  })
  if (!user) throw new Error('User not found')

  const isPaid = (user.plan === 'PRO' || user.plan === 'PREMIUM')
    && user.planStatus === 'ACTIVE'
    && (!user.currentPeriodEnd || new Date(user.currentPeriodEnd) > new Date())

  return {
    plan:             user.plan,         // 'FREE' | 'PRO' | 'PREMIUM'
    planStatus:       user.planStatus,
    isPro:            isPaid,            // true for both Pro and Premium
    isPremium:        user.plan === 'PREMIUM' && isPaid,
    currentPeriodEnd: user.currentPeriodEnd,
    aiMode:           user.aiMode,
    hasByok:          !!user.encryptedApiKey,
    trialUsed:        user.aiTrialUsed,
    trialLimit:       user.aiTrialLimit,
    trialRemaining:   Math.max(0, user.aiTrialLimit - user.aiTrialUsed),
    trialExhausted:   user.aiTrialUsed >= user.aiTrialLimit,
    creditsRemaining: user.aiCreditsRemaining,
    creditsTotal:     user.aiCreditsTotal,
    creditsResetAt:   user.aiCreditsResetAt,
  }
}

// ─── Activate a paid subscription ────────────────────────
// Call this from your payment webhook (Stripe, Paystack, etc.)
export async function activatePaidSubscription(
  userId: string,
  plan: 'PRO' | 'PREMIUM',
  opts: {
    paymentProvider?:  string
    paymentReference?: string
    periodStart?:      Date
    periodEnd?:        Date
  } = {}
) {
  const now       = opts.periodStart || new Date()
  const periodEnd = opts.periodEnd   || new Date(now.getTime() + 30 * 86_400_000)
  const credits   = PLAN_CONFIG[plan].aiCreditsPerMonth

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        planStatus:          'ACTIVE',
        currentPeriodEnd:    periodEnd,
        aiCreditsRemaining:  credits,
        aiCreditsTotal:      credits,
        aiCreditsResetAt:    now,
      },
    }),
    prisma.subscription.upsert({
      where:  { userId },
      update: {
        plan, status: 'ACTIVE', creditsPerMonth: credits,
        currentPeriodStart: now, currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd:  false,
        paymentProvider:    opts.paymentProvider  ?? null,
        paymentReference:   opts.paymentReference ?? null,
      },
      create: {
        userId, plan, status: 'ACTIVE', creditsPerMonth: credits,
        currentPeriodStart: now, currentPeriodEnd: periodEnd,
        paymentProvider:    opts.paymentProvider  ?? null,
        paymentReference:   opts.paymentReference ?? null,
      },
    }),
  ])

  await prisma.notification.create({
    data: {
      userId,
      type:  'system',
      title: `🎉 Welcome to ${PLAN_CONFIG[plan].name}!`,
      body:  `You now have ${credits} AI messages this month.`,
    },
  })
}

// ─── Renew monthly credits ────────────────────────────────
// Call from cron job on billing date
export async function renewMonthlyCredits(userId: string) {
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { plan: true },
  })
  if (user?.plan !== 'PRO' && user?.plan !== 'PREMIUM') return

  const credits = PLAN_CONFIG[user.plan as 'PRO' | 'PREMIUM'].aiCreditsPerMonth
  await prisma.user.update({
    where: { id: userId },
    data:  { aiCreditsRemaining: credits, aiCreditsTotal: credits, aiCreditsResetAt: new Date() },
  })
}

// ─── Cancel subscription ──────────────────────────────────
export async function cancelSubscription(userId: string) {
  await prisma.subscription.updateMany({
    where: { userId },
    data:  { status: 'CANCELLED', cancelAtPeriodEnd: true },
  })
  await prisma.user.update({
    where: { id: userId },
    data:  { planStatus: 'CANCELLED' },
  })
}

// ─── Downgrade expired subscriptions (run daily via cron) ─
export async function downgradeExpiredSubscriptions() {
  const expired = await prisma.user.findMany({
    where: {
      plan:            { in: ['PRO', 'PREMIUM'] },
      currentPeriodEnd: { lt: new Date() },
      planStatus:       { in: ['ACTIVE', 'CANCELLED'] },
    },
    select: { id: true },
  })

  for (const u of expired) {
    await prisma.user.update({
      where: { id: u.id },
      data:  {
        plan:               'FREE',
        planStatus:         'EXPIRED',
        aiCreditsRemaining: 0,
        aiMode:             'APP_QUOTA',
        encryptedApiKey:    null,
      },
    })
    await prisma.subscription.updateMany({
      where: { userId: u.id },
      data:  { status: 'EXPIRED' },
    })
    await prisma.notification.create({
      data: {
        userId: u.id,
        type:   'system',
        title:  'Your plan has expired',
        body:   'Renew your subscription to continue using AI features.',
      },
    })
  }

  if (expired.length) console.log(`⬇️  Downgraded ${expired.length} expired users`)
}