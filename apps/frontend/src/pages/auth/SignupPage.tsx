import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, ArrowRight, Check } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { PERSONA_LABELS, PERSONA_DESCRIPTIONS, type UserPersona } from '@flowmind/shared'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const PERSONA_ICONS: Record<UserPersona, string> = {
  remote_worker:'🏠', hybrid_worker:'🔄', onsite_worker:'🏢', student:'🎓',
  business_owner:'💼', homemaker:'🏡', job_seeker:'🔍', freelancer:'⚡', other:'✨',
}
const PERSONAS = Object.entries(PERSONA_LABELS) as [UserPersona, string][]

export default function SignupPage() {
  const [step,     setStep]     = useState<1|2>(1)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [persona,  setPersona]  = useState<UserPersona>('other')
  const [showPass, setShowPass] = useState(false)
  const { signup, isLoading }   = useAuthStore()
  const navigate                = useNavigate()

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const strengthColor = ['', '#e74c3c', '#f9c74f', '#00b894'][strength]

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) return toast.error('Password must be at least 8 characters')
    setStep(2)
  }

  const handleSubmit = async () => {
    try {
      await signup(name, email, password, persona)
      toast.success('Welcome to FlowMind!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4 bg-white border-b border-border-subtle">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[9px] flex items-center justify-center" style={{ background: '#6c5ce7' }}>
            <Zap size={15} className="text-white" />
          </div>
          <span className="font-display font-bold text-[15px] text-text-primary">FlowMind</span>
        </Link>
        <Link to="/login" className="text-[13px] text-text-secondary hover:text-accent transition-colors">
          Sign in
        </Link>
      </div>

      {/* Progress */}
      <div className="px-6 py-5 max-w-[460px] mx-auto w-full">
        <div className="flex gap-2 mb-2">
          <div className="flex-1 h-1 rounded-full" style={{ background: '#6c5ce7' }} />
          <div className="flex-1 h-1 rounded-full transition-colors" style={{ background: step === 2 ? '#6c5ce7' : '#ebebf0' }} />
        </div>
        <p className="text-[12px] text-text-muted">Step {step} of 2</p>
      </div>

      <div className="flex-1 px-6 pb-10 max-w-[460px] mx-auto w-full">

        {/* Step 1 */}
        {step === 1 && (
          <div className="animate-fade-up">
            <h1 className="font-display font-bold text-[26px] text-text-primary tracking-tight mb-1">Create your account</h1>
            <p className="text-text-secondary text-[14px] mb-7">Free to start, no credit card needed</p>
            <form onSubmit={handleNext} className="space-y-4">
              <div>
                <label className="block text-[12.5px] font-medium text-text-secondary mb-1.5">Full name</label>
                <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required autoFocus />
              </div>
              <div>
                <label className="block text-[12.5px] font-medium text-text-secondary mb-1.5">Email address</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div>
                <label className="block text-[12.5px] font-medium text-text-secondary mb-1.5">Password</label>
                <div className="relative">
                  <input className="input pr-11" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 8 characters" required />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                    {showPass ? <EyeOff size={15}/> : <Eye size={15}/>}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {[1,2,3].map(l => (
                      <div key={l} className="flex-1 h-1 rounded-full transition-all" style={{ background: strength >= l ? strengthColor : '#ebebf0' }} />
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="w-full h-11 rounded-btn font-semibold text-[14px] text-white flex items-center justify-center gap-2 transition-all mt-2" style={{ background: '#6c5ce7' }}>
                Continue <ArrowRight size={16} />
              </button>
            </form>
            <p className="text-center text-[12.5px] text-text-muted mt-5">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold" style={{ color: '#6c5ce7' }}>Sign in</Link>
            </p>
          </div>
        )}

        {/* Step 2 — persona */}
        {step === 2 && (
          <div className="animate-fade-up">
            <h1 className="font-display font-bold text-[24px] text-text-primary tracking-tight mb-1">Who are you?</h1>
            <p className="text-text-secondary text-[13.5px] mb-6 leading-relaxed">
              FlowMind adapts to your life. Your AI assistant will be personalised to match.
            </p>
            <div className="grid grid-cols-2 gap-2.5 mb-6">
              {PERSONAS.map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setPersona(id)}
                  className={clsx(
                    'flex flex-col items-start gap-1.5 p-3.5 rounded-[14px] border-2 text-left transition-all',
                    persona === id
                      ? 'border-[#6c5ce7] bg-[#f0efff]'
                      : 'border-border-subtle bg-white hover:border-border-default'
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[20px]">{PERSONA_ICONS[id]}</span>
                    {persona === id && (
                      <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#6c5ce7' }}>
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <span className={clsx('text-[13px] font-semibold leading-tight', persona===id ? 'text-[#6c5ce7]' : 'text-text-primary')}>
                    {label}
                  </span>
                  <span className="text-[11px] text-text-muted leading-tight line-clamp-2">
                    {PERSONA_DESCRIPTIONS[id]}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">Back</button>
              <button
                onClick={handleSubmit} disabled={isLoading}
                className="flex-1 h-11 rounded-btn font-semibold text-[14px] text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                style={{ background: '#6c5ce7' }}
              >
                {isLoading
                  ? <span className="inline-flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Setting up...</span>
                  : 'Get started'
                }
              </button>
            </div>
            <p className="text-center text-[12px] text-text-muted mt-3">You can change this anytime in Settings.</p>
          </div>
        )}
      </div>
    </div>
  )
}
