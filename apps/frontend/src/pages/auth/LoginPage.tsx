import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const { login, isLoading }    = useAuthStore()
  const navigate                = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.message || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-bg-base flex">

      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-white border-r border-border-subtle p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#6c5ce7' }}>
            <Zap size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-[17px] text-text-primary">FlowMind</span>
        </div>

        <div>
          <blockquote className="text-[32px] font-display font-bold text-text-primary leading-tight mb-5">
            "Your day, designed<br />with intention."
          </blockquote>
          <p className="text-text-secondary text-[14px] leading-relaxed">
            FlowMind combines AI-powered task management, deep work timers, habit tracking,
            and smart scheduling — everything you need to do your best work.
          </p>
        </div>

        <div className="flex gap-8">
          {[['50K+','Active users'],['94%','Productivity boost'],['4.9★','App rating']].map(([v,l]) => (
            <div key={l}>
              <div className="font-display font-bold text-[20px]" style={{ color: '#6c5ce7' }}>{v}</div>
              <div className="text-[12px] text-text-muted mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">

          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center" style={{ background: '#6c5ce7' }}>
              <Zap size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-[17px] text-text-primary">FlowMind</span>
          </div>

          <h1 className="font-display font-bold text-[28px] text-text-primary mb-1 tracking-tight">Welcome back</h1>
          <p className="text-text-secondary text-[14px] mb-8">Sign in to your workspace</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12.5px] font-medium text-text-secondary mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@example.com" required autoFocus
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[12.5px] font-medium text-text-secondary">Password</label>
                <a href="#" className="text-[12px] font-medium" style={{ color: '#6c5ce7' }}>Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  className="input pr-11" placeholder="••••••••" required
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={isLoading}
              className="w-full h-11 rounded-btn font-semibold text-[14px] text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 mt-2"
              style={{ background: '#6c5ce7' }}
            >
              {isLoading
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><span>Sign in</span> <ArrowRight size={16} /></>
              }
            </button>
          </form>

          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-border-subtle" />
            <span className="text-[12px] text-text-muted">or</span>
            <div className="flex-1 h-px bg-border-subtle" />
          </div>

          <button
            onClick={() => { setEmail('demo@flowmind.app'); setPassword('demo1234') }}
            className="w-full h-11 rounded-btn border border-border-default text-text-secondary text-[13px] font-medium hover:border-accent-border hover:text-accent hover:bg-[#f0efff] transition-all"
          >
            Use demo account
          </button>

          <p className="text-center text-[13px] text-text-muted mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: '#6c5ce7' }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
