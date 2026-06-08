import { Link } from 'react-router-dom'
import { Zap, ArrowRight, CheckCircle2 } from 'lucide-react'

const FEATURES = [
  { icon:'✅', title:'Task Management', desc:'Prioritise, categorise and track tasks. For work, study, household, or job search.' },
  { icon:'⏱️', title:'Pomodoro Focus Timer', desc:'Deep work sessions with smart break reminders and daily focus stats.' },
  { icon:'📅', title:'Smart Scheduling', desc:'Visual weekly planner with AI-suggested time blocks based on your habits.' },
  { icon:'👥', title:'Meeting Manager', desc:'Schedule, record, and get AI summaries of your meetings with action items.' },
  { icon:'🔥', title:'Habit Tracker', desc:'Build daily streaks for exercise, reading, water, meditation — anything.' },
  { icon:'📊', title:'Productivity Analytics', desc:'Heatmaps, trends, mood tracking — understand when you work best.' },
  { icon:'✨', title:'AI Assistant', desc:'Personalised to your lifestyle. Free tier or unlimited with your own API key.' },
  { icon:'🔔', title:'Smart Alerts', desc:'Meeting reminders, task deadlines, habit nudges — all in one place.' },
]

const WHO = [
  { icon:'🏠', label:'Remote Workers' },
  { icon:'🔄', label:'Hybrid Workers' },
  { icon:'🏢', label:'On-site Workers' },
  { icon:'🎓', label:'Students' },
  { icon:'💼', label:'Business Owners' },
  { icon:'🏡', label:'Homemakers' },
  { icon:'🔍', label:'Job Seekers' },
  { icon:'⚡', label:'Freelancers' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:'linear-gradient(135deg,#6c63ff,#00d4aa)'}}>
            <Zap size={16} className="text-white"/>
          </div>
          <span className="font-display font-bold text-text-primary">FlowMind</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"  className="btn-ghost text-sm px-4">Sign in</Link>
          <Link to="/signup" className="btn-primary h-9 px-5 text-sm">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="px-6 py-16 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill border border-accent/30 bg-accent/10 text-xs text-accent font-medium mb-6">
          <Zap size={11}/> AI-powered · Free to start
        </div>
        <h1 className="font-display font-bold text-4xl sm:text-5xl text-text-primary leading-tight mb-5">
          Your day, your way.{' '}
          <span className="text-gradient">Organised.</span>
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed mb-8 max-w-xl mx-auto">
          FlowMind is a smart personal workspace for <em>everyone</em> — from remote workers and students to homemakers and job seekers. One app to manage tasks, habits, meetings, and your day.
        </p>
        <div className="flex flex-col xs:flex-row gap-3 justify-center">
          <Link to="/signup" className="btn-primary h-12 px-7 text-base">
            Start for free <ArrowRight size={16} className="inline ml-1"/>
          </Link>
          <Link to="/login" className="btn-secondary h-12 px-7 text-base">Sign in</Link>
        </div>
        <p className="text-xs text-text-muted mt-4">No credit card required · Free tier forever</p>
      </div>

      {/* Who it's for */}
      <div className="px-6 py-10 max-w-4xl mx-auto">
        <p className="text-center text-xs font-semibold text-text-muted uppercase tracking-widest mb-6">Built for everyone</p>
        <div className="flex flex-wrap justify-center gap-3">
          {WHO.map(({icon,label})=>(
            <div key={label} className="flex items-center gap-2 px-4 py-2.5 rounded-pill border border-border-subtle bg-bg-card text-sm text-text-secondary">
              <span>{icon}</span>{label}
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div className="px-6 py-12 max-w-5xl mx-auto">
        <h2 className="font-display font-bold text-2xl text-center text-text-primary mb-2">Everything you need</h2>
        <p className="text-text-secondary text-center text-sm mb-10">One workspace. Every tool. No overwhelm.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map(({icon,title,desc})=>(
            <div key={title} className="card-hover p-5">
              <span className="text-2xl mb-3 block">{icon}</span>
              <h3 className="font-semibold text-sm text-text-primary mb-1.5">{title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI section */}
      <div className="px-6 py-14 max-w-4xl mx-auto text-center">
        <div className="card p-8 border-accent/20">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{background:'linear-gradient(135deg,#6c63ff,#00d4aa)'}}>
            <span className="text-xl">✨</span>
          </div>
          <h2 className="font-display font-bold text-2xl text-text-primary mb-3">AI that knows your lifestyle</h2>
          <p className="text-text-secondary text-sm leading-relaxed max-w-lg mx-auto mb-6">
            The AI assistant adapts to who you are — whether you're juggling Zoom calls as a remote worker, cramming for exams as a student, or managing a household as a homemaker. It gives advice that actually fits your life.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {['10 free AI requests/day','Use your own Anthropic API key for unlimited','Builds a daily streak','Summarises your meetings','Personalised to your persona'].map(t=>(
              <div key={t} className="flex items-center gap-1.5 text-xs text-teal bg-teal/10 px-3 py-1.5 rounded-pill">
                <CheckCircle2 size={11}/>{t}
              </div>
            ))}
          </div>
          <Link to="/signup" className="btn-primary h-11 px-8 inline-flex items-center gap-2">
            Try AI free <ArrowRight size={15}/>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border-faint px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#6c63ff,#00d4aa)'}}>
            <Zap size={12} className="text-white"/>
          </div>
          <span className="font-display font-bold text-sm text-text-primary">FlowMind</span>
        </div>
        <p className="text-xs text-text-muted">© {new Date().getFullYear()} FlowMind. Built for everyone.</p>
      </footer>
    </div>
  )
}
