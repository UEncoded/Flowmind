import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Crown, Zap, Star, Check, Flame } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

const API = (import.meta.env as any).VITE_API_URL || 'http://localhost:3001'

interface Plan {
  id: string; name: string; price: number
  currency?: string; interval?: string; badge?: string | null
  features: string[]
  ai: { monthlyCredits: number; byok: boolean; trialMessages: number }
  cta: string
}

interface AiStatus {
  plan: string; isPro: boolean; isPremium: boolean
  planStatus: string; currentPeriodEnd: string | null
  creditsRemaining: number; creditsTotal: number; creditsResetAt: string | null
  trialRemaining: number; trialExhausted: boolean
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  FREE:    <Zap   size={20} className="text-text-muted" />,
  PRO:     <Crown size={20} className="text-accent"     />,
  PREMIUM: <Star  size={20} className="text-teal"       />,
}

export default function SubscriptionTab() {
  const qc = useQueryClient()

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
  queryKey: ['subscription-plans'],
  queryFn:  () => axios.get(`${API}/api/subscription/plans`).then(r => r.data),
  retry: 2,
  staleTime: 60_000,
})

  const { data: status } = useQuery<AiStatus>({
    queryKey: ['ai-status'],
    queryFn:  () => axios.get(`${API}/api/ai/status`).then(r => r.data),
  })

  const subscribe = useMutation({
    mutationFn: (planId: string) =>
      axios.post(`${API}/api/subscription/activate`, {
        plan:             planId,
        paymentProvider:  'manual',
        paymentReference: `manual-${planId}-${Date.now()}`,
        periodDays:       30,
      }).then(r => r.data),
    onSuccess: (_, planId) => {
      toast.success(`${planId} plan activated!`)
      qc.invalidateQueries({ queryKey: ['ai-status'] })
    },
    onError: () => toast.error('Activation failed. Please try again.'),
  })

  const cancel = useMutation({
    mutationFn: () => axios.post('/api/subscription/cancel').then(r => r.data),
    onSuccess:  () => {
      toast.success('Cancelled. Access continues until your billing date.')
      qc.invalidateQueries({ queryKey: ['ai-status'] })
    },
  })

  const currentPlan = status?.plan || 'FREE'
  const isPaid      = status?.isPro

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-base text-text-primary">Plan & Billing</h2>
        <p className="text-sm text-text-muted mt-0.5">Manage your subscription and AI credits</p>
      </div>

      {/* Active plan banner */}
      {isPaid && status && (
        <div className={clsx(
          'p-4 rounded-xl border',
          status.isPremium ? 'border-teal/30 bg-teal/5' : 'border-accent/30 bg-accent/5'
        )}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                {PLAN_ICONS[currentPlan]}
                <span className="font-semibold text-sm text-text-primary">{currentPlan} — Active</span>
              </div>

              {status.creditsTotal > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-text-muted flex items-center gap-1">
                      <Flame size={11} className="text-amber" /> AI credits this month
                    </span>
                    <span className="font-medium text-text-primary">
                      {status.creditsRemaining} / {status.creditsTotal}
                    </span>
                  </div>
                  <div className="h-2 bg-border-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(0, (status.creditsRemaining / status.creditsTotal) * 100)}%`,
                        background: status.isPremium
                          ? 'linear-gradient(90deg,#00d4aa,#06d6a0)'
                          : 'linear-gradient(90deg,#6c63ff,#8b83ff)',
                      }}
                    />
                  </div>
                  {status.creditsResetAt && (
                    <p className="text-[10px] text-text-muted mt-1.5">
                      Resets {new Date(
                        new Date(status.creditsResetAt).getTime() + 30 * 86_400_000
                      ).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </p>
                  )}
                </div>
              )}

              {status.currentPeriodEnd && (
                <p className="text-xs text-text-muted mt-2">
                  {status.planStatus === 'CANCELLED'
                    ? `Access ends ${new Date(status.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews ${new Date(status.currentPeriodEnd).toLocaleDateString()}`
                  }
                </p>
              )}
            </div>

            {status.planStatus !== 'CANCELLED' && (
              <button
                onClick={() => cancel.mutate()}
                disabled={cancel.isPending}
                className="text-xs text-coral hover:underline flex-shrink-0"
              >
                {cancel.isPending ? 'Cancelling…' : 'Cancel plan'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3 plan cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 bg-bg-muted rounded-card animate-pulse" />
            ))
          : plans.map(plan => {
              const isCurrent = plan.id === currentPlan
              const isDowngrade = currentPlan === 'PREMIUM' && plan.id === 'PRO'
              const canUpgrade  = !isCurrent && !isDowngrade && plan.id !== 'FREE'

              return (
                <div
                  key={plan.id}
                  className={clsx(
                    'relative rounded-card border p-5 flex flex-col',
                    isCurrent
                      ? plan.id === 'PREMIUM'
                        ? 'border-teal/40 bg-teal/5'
                        : plan.id === 'PRO'
                        ? 'border-accent/40 bg-accent/5'
                        : 'border-border-default bg-bg-hover'
                      : 'border-border-subtle bg-bg-card hover:border-border-default transition-colors'
                  )}
                >
                  {/* Popular / Best value badge */}
                  {plan.badge && (
                    <div className={clsx(
                      'absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-pill text-white whitespace-nowrap',
                      plan.id === 'PREMIUM' ? 'bg-teal' : 'bg-accent'
                    )}>
                      {plan.badge}
                    </div>
                  )}

                  {isCurrent && (
                    <span className="absolute top-3 right-3 text-[10px] font-semibold text-text-muted bg-border-subtle px-2 py-0.5 rounded-pill">
                      Current
                    </span>
                  )}

                  {/* Icon + name */}
                  <div className="flex items-center gap-2 mb-3">
                    {PLAN_ICONS[plan.id]}
                    <span className="font-display font-bold text-sm text-text-primary">{plan.name}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-4">
                    {plan.price === 0
                      ? <span className="font-display font-bold text-3xl text-text-primary">Free</span>
                      : <>
                          <span className="font-display font-bold text-3xl text-text-primary">${plan.price}</span>
                          <span className="text-text-muted text-sm"> / mo</span>
                        </>
                    }
                  </div>

                  {/* Credits chip */}
                  {plan.ai.monthlyCredits > 0 && (
                    <div className={clsx(
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg mb-4 text-xs font-medium',
                      plan.id === 'PREMIUM' ? 'bg-teal/15 text-teal' : 'bg-accent/15 text-accent-light'
                    )}>
                      <Flame size={11} />
                      {plan.ai.monthlyCredits.toLocaleString()} AI msgs / month
                    </div>
                  )}
                  {plan.ai.trialMessages > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg mb-4 text-xs font-medium bg-border-subtle text-text-muted">
                      {plan.ai.trialMessages} free trial messages
                    </div>
                  )}

                  {/* Feature list */}
                  <ul className="space-y-2 flex-1 mb-5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
                        <Check size={12} className={clsx(
                          'flex-shrink-0 mt-0.5',
                          plan.id === 'PREMIUM' ? 'text-teal'
                          : plan.id === 'PRO'  ? 'text-accent'
                          : 'text-text-muted'
                        )} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  {isCurrent ? (
                    <div className="h-10 flex items-center justify-center rounded-btn border border-border-default text-sm text-text-muted">
                      ✓ Active plan
                    </div>
                  ) : canUpgrade ? (
                    <button
                      onClick={() => subscribe.mutate(plan.id)}
                      disabled={subscribe.isPending}
                      className={clsx(
                        'h-10 rounded-btn text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60',
                        plan.id === 'PREMIUM'
                          ? 'bg-gradient-to-r from-teal to-green hover:opacity-90'
                          : 'bg-gradient-to-r from-accent to-accent/80 hover:opacity-90'
                      )}
                    >
                      {subscribe.isPending && subscribe.variables === plan.id
                        ? 'Activating…'
                        : plan.cta
                      }
                    </button>
                  ) : (
                    <div className="h-10 flex items-center justify-center rounded-btn border border-border-subtle text-sm text-text-muted">
                      {plan.id === 'FREE' ? 'Downgrade' : 'Lower plan'}
                    </div>
                  )}
                </div>
              )
            })
        }
      </div>

      <p className="text-xs text-text-muted text-center leading-relaxed">
        Payment integration coming soon — plans are currently activated manually for testing.
      </p>
    </div>
  )
}