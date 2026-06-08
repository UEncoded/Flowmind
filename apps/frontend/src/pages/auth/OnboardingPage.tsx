import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { PERSONA_LABELS } from '@flowmind/shared'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const persona  = user?.persona ? PERSONA_LABELS[user.persona as keyof typeof PERSONA_LABELS] : 'your lifestyle'

  const tips = [
    'Add your first task using the Tasks page',
    'Start a 25-minute focus session with the Pomodoro timer',
    'Set up 2–3 daily habits to track',
    'Ask the AI assistant anything — it knows your context',
  ]

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-6">
      <div className="max-w-md w-full animate-fade-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{background:'linear-gradient(135deg,#6c63ff,#00d4aa)'}}>
            <span className="text-2xl">🚀</span>
          </div>
          <h1 className="font-display font-bold text-2xl text-text-primary mb-2">
            You're all set, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-text-secondary text-sm">
            FlowMind is personalised for <strong className="text-text-primary">{persona}</strong>. Your AI assistant is ready.
          </p>
        </div>

        <div className="card p-5 mb-5">
          <p className="text-sm font-semibold text-text-secondary mb-4 uppercase tracking-wider text-xs">Quick start</p>
          <div className="space-y-3">
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 size={16} className="text-teal flex-shrink-0 mt-0.5" />
                <span className="text-sm text-text-secondary">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => navigate('/dashboard')} className="btn-primary w-full">
          Go to my workspace <ArrowRight size={15} className="inline ml-1" />
        </button>
      </div>
    </div>
  )
}
