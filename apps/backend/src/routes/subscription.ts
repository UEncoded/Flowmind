import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import {
  getAiStatus,
  activatePaidSubscription,
  cancelSubscription,
  PLAN_CONFIG,
} from '../services/subscriptionService'
import { prisma } from '../config/db'

export const subscriptionRouter = Router()
subscriptionRouter.use(authenticate)

// GET /api/subscription/status
subscriptionRouter.get('/status', async (req: AuthRequest, res: Response) => {
  res.json(await getAiStatus(req.user!.id))
})

// GET /api/subscription/plans
subscriptionRouter.get('/plans', (_req, res: Response) => {
  res.json([
    {
      id:       'FREE',
      name:     'Free',
      price:    0,
      badge:    null,
      features: [
        '2 AI trial messages (lifetime)',
        'Unlimited tasks, habits & focus sessions',
        'Pomodoro focus timer',
        'Meeting scheduler',
        'Habit tracker with streaks',
        'Analytics dashboard',
      ],
      ai: { trialMessages: 2, monthlyCredits: 0, byok: false },
      cta: 'Current plan',
    },
    {
      id:       'PRO',
      name:     'Pro',
      price:    PLAN_CONFIG.PRO.price,
      currency: 'USD',
      interval: 'month',
      badge:    'Most popular',
      features: [
        `${PLAN_CONFIG.PRO.aiCreditsPerMonth} AI messages per month`,
        'Credits refresh every billing cycle',
        'Connect your own Claude API key (unlimited)',
        'AI meeting summaries & action items',
        'AI daily productivity coaching',
        'Smart scheduling suggestions',
        'Priority support',
      ],
      ai: { trialMessages: 0, monthlyCredits: PLAN_CONFIG.PRO.aiCreditsPerMonth, byok: true },
      cta: 'Upgrade to Pro',
    },
    {
      id:       'PREMIUM',
      name:     'Premium',
      price:    PLAN_CONFIG.PREMIUM.price,
      currency: 'USD',
      interval: 'month',
      badge:    'Best value',
      features: [
        `${PLAN_CONFIG.PREMIUM.aiCreditsPerMonth} AI messages per month`,
        'Everything in Pro',
        'Connect your own Claude API key (unlimited)',
        'AI meeting recording & transcription',
        'Advanced analytics & reports',
        'Custom AI persona & tone',
        'Early access to new features',
        'Priority 1:1 support',
      ],
      ai: { trialMessages: 0, monthlyCredits: PLAN_CONFIG.PREMIUM.aiCreditsPerMonth, byok: true },
      cta: 'Upgrade to Premium',
    },
  ])
})

// POST /api/subscription/activate
// Call this after successful payment from your provider
subscriptionRouter.post('/activate', async (req: AuthRequest, res: Response) => {
  const { plan, paymentProvider, paymentReference, periodDays = 30 } = req.body

  if (plan !== 'PRO' && plan !== 'PREMIUM') {
    return res.status(400).json({ error: 'Invalid plan. Must be PRO or PREMIUM.' })
  }

  const now       = new Date()
  const periodEnd = new Date(now.getTime() + Number(periodDays) * 86_400_000)

  await activatePaidSubscription(req.user!.id, plan, {
    paymentProvider,
    paymentReference,
    periodStart: now,
    periodEnd,
  })

  res.json({ message: `${plan} plan activated!`, status: await getAiStatus(req.user!.id) })
})

// POST /api/subscription/cancel
subscriptionRouter.post('/cancel', async (req: AuthRequest, res: Response) => {
  await cancelSubscription(req.user!.id)
  res.json({ message: 'Subscription cancelled. Access continues until your billing period ends.' })
})

// GET /api/subscription/history
subscriptionRouter.get('/history', async (req: AuthRequest, res: Response) => {
  res.json(await prisma.subscription.findUnique({ where: { userId: req.user!.id } }))
})