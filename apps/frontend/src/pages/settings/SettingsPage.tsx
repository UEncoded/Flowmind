import SubscriptionTab from './SubscriptionTab'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Key, Lock, Zap, User, Bell, Timer, Sparkles, LogOut, Crown } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { PERSONA_LABELS, type UserPersona } from '@flowmind/shared'

const PERSONA_ICONS: Record<UserPersona, string> = {
  remote_worker:  '🏠',
  hybrid_worker:  '🔄',
  onsite_worker:  '🏢',
  student:        '🎓',
  business_owner: '💼',
  homemaker:      '🏡',
  job_seeker:     '🔍',
  freelancer:     '⚡',
  other:          '✨',
}

const TIMEZONES = [
  'UTC', 'Africa/Lagos', 'Africa/Nairobi', 'Africa/Johannesburg', 'Africa/Cairo',
  'Europe/London', 'Europe/Paris', 'America/New_York', 'America/Chicago',
  'America/Los_Angeles', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Australia/Sydney',
]

export default function SettingsPage() {
  const { user, logout, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [tab,        setTab]        = useState<'profile' | 'subscription' | 'ai' | 'focus' | 'notifications'>('profile')
  const [name,       setName]       = useState(user?.name || '')
  const [timezone,   setTimezone]   = useState(user?.timezone || 'UTC')
  const [persona,    setPersona]    = useState<UserPersona>((user?.persona as UserPersona) || 'other')
  const [apiKey,     setApiKey]     = useState('')
  const [showKey,    setShowKey]    = useState(false)

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn:  () => axios.get('/api/settings').then(r => r.data),
  })

  const [pomWork,     setPomWork]     = useState(settings?.pomodoroWork     || 25)
  const [pomBreak,    setPomBreak]    = useState(settings?.pomodoroBreak    || 5)
  const [pomSessions, setPomSessions] = useState(settings?.pomodoroSessions || 4)
  const [goalHours,   setGoalHours]   = useState(settings?.dailyGoalHours   || 6)

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn:  () => axios.get('/api/ai/status').then(r => r.data),
  })

  const saveProfile = useMutation({
    mutationFn: () => axios.put('/api/settings/profile', { name, timezone, persona }),
    onSuccess:  (r) => { updateUser(r.data); toast.success('Profile saved!') },
    onError:    () => toast.error('Failed to save profile'),
  })

  const saveSettings = useMutation({
    mutationFn: () => axios.put('/api/settings', {
      pomodoroWork:     pomWork,
      pomodoroBreak:    pomBreak,
      pomodoroSessions: pomSessions,
      dailyGoalHours:   goalHours,
    }),
    onSuccess: () => toast.success('Settings saved!'),
  })

  const saveApiKey = useMutation({
    mutationFn: () => axios.put('/api/ai/settings', { mode: 'BYOK', apiKey }),
    onSuccess:  () => {
      updateUser({ aiMode: 'BYOK' as const })
      toast.success('API key saved!')
      setApiKey('')
      setShowKey(false)
      qc.invalidateQueries({ queryKey: ['ai-status'] })
    },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Invalid API key'),
  })

  const removeKey = useMutation({
    mutationFn: () => axios.delete('/api/ai/key'),
    onSuccess:  () => {
      updateUser({ aiMode: 'APP_QUOTA' as const })
      toast.success('API key removed')
      qc.invalidateQueries({ queryKey: ['ai-status'] })
    },
  })

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const TABS = [
    { id: 'profile',       label: 'Profile',       icon: User     },
    { id: 'subscription',  label: 'Plan & Billing', icon: Crown    },
    { id: 'ai',            label: 'AI Settings',   icon: Sparkles },
    { id: 'focus',         label: 'Focus Timer',   icon: Timer    },
    { id: 'notifications', label: 'Notifications', icon: Bell     },
  ] as const

  const isByok    = user?.aiMode === 'BYOK'
  const isPaid    = aiStatus?.isPro
  const isPremium = aiStatus?.isPremium

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-24 lg:pb-6">
      <div className="mb-6">
        <h1 className="font-display font-bold text-xl text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-5">

        {/* Sidebar nav */}
        <div className="sm:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={clsx(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm transition-all text-left',
                  tab === id
                    ? 'bg-accent/10 text-accent-light font-medium'
                    : 'text-text-muted hover:text-text-secondary hover:bg-bg-hover'
                )}
              >
                <Icon size={16} />
                {label}
                {id === 'subscription' && !isPaid && (
                  <span className="ml-auto text-[9px] font-bold text-white bg-accent px-1.5 py-0.5 rounded-pill">
                    FREE
                  </span>
                )}
                {id === 'subscription' && isPremium && (
                  <span className="ml-auto text-[9px] font-bold text-white bg-teal px-1.5 py-0.5 rounded-pill">
                    PRO+
                  </span>
                )}
                {id === 'subscription' && isPaid && !isPremium && (
                  <span className="ml-auto text-[9px] font-bold text-white bg-accent px-1.5 py-0.5 rounded-pill">
                    PRO
                  </span>
                )}
              </button>
            ))}
            <div className="pt-3 border-t border-border-faint mt-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm text-coral hover:bg-coral/10 transition-all text-left"
              >
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* Profile */}
          {tab === 'profile' && (
            <div className="card p-6 space-y-5 animate-fade-in">
              <h2 className="font-semibold text-base text-text-primary">Profile</h2>

              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg,#6c63ff,#f72585)' }}
                >
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{user?.name}</p>
                  <p className="text-xs text-text-muted">{user?.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Full name
                </label>
                <input
                  className="input"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Timezone
                </label>
                <select
                  className="input"
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-2 xs:grid-cols-3 gap-2">
                  {(Object.entries(PERSONA_LABELS) as [UserPersona, string][]).map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setPersona(id)}
                      className={clsx(
                        'flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all',
                        persona === id
                          ? 'border-accent bg-accent/10 text-accent-light'
                          : 'border-border-subtle text-text-muted hover:border-border-default hover:text-text-secondary'
                      )}
                    >
                      <span>{PERSONA_ICONS[id]}</span>
                      <span className="text-xs leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => saveProfile.mutate()}
                disabled={saveProfile.isPending}
                className="btn-primary w-full sm:w-auto"
              >
                {saveProfile.isPending ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          )}

          {/* Plan & Billing */}
          {tab === 'subscription' && (
            <div className="animate-fade-in">
              <SubscriptionTab />
            </div>
          )}

          {/* AI Settings */}
          {tab === 'ai' && (
            <div className="card p-6 space-y-5 animate-fade-in">
              <h2 className="font-semibold text-base text-text-primary">AI Settings</h2>

              {/* Current mode card */}
              <div
                className={clsx(
                  'flex items-center gap-4 p-4 rounded-xl border',
                  isByok
                    ? 'border-teal/30 bg-teal/5'
                    : 'border-border-subtle bg-bg-muted'
                )}
              >
                {isByok
                  ? <Key size={20} className="text-teal flex-shrink-0" />
                  : <Zap size={20} className="text-accent flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">
                    {isByok
                      ? 'Your API Key — Unlimited'
                      : isPaid
                        ? 'Plan Credits'
                        : 'Free Trial'
                    }
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {isByok
                      ? 'Usage billed to your Anthropic account. Key stored encrypted.'
                      : isPaid
                        ? `${aiStatus?.creditsRemaining ?? 0} of ${aiStatus?.creditsTotal ?? 0} credits remaining this month`
                        : `${aiStatus?.trialRemaining ?? 0} of ${aiStatus?.trialLimit ?? 2} trial messages remaining`
                    }
                  </p>
                </div>
                {isByok && (
                  <button
                    onClick={() => removeKey.mutate()}
                    disabled={removeKey.isPending}
                    className="text-xs text-coral hover:underline flex-shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Credit bar for paid users */}
              {isPaid && !isByok && aiStatus?.creditsTotal > 0 && (
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-text-muted">Monthly credits used</span>
                    <span className="text-text-secondary">
                      {aiStatus.creditsTotal - aiStatus.creditsRemaining} / {aiStatus.creditsTotal}
                    </span>
                  </div>
                  <div className="h-2 bg-border-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.max(0, ((aiStatus.creditsTotal - aiStatus.creditsRemaining) / aiStatus.creditsTotal) * 100)}%`,
                        background: isPremium
                          ? 'linear-gradient(90deg,#00d4aa,#06d6a0)'
                          : 'linear-gradient(90deg,#6c63ff,#8b83ff)',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* BYOK form — paid users only */}
              {!isByok && isPaid && (
                <div className="border border-border-subtle rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock size={14} className="text-accent" />
                    <h3 className="text-sm font-medium text-text-primary">
                      Connect your Anthropic API key
                    </h3>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed mb-3">
                    Get unlimited AI messages by connecting your own key from console.anthropic.com.
                    Stored encrypted and never exposed to the browser.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      placeholder="sk-ant-api03-..."
                      className="input-sm flex-1"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="btn-icon w-9 h-9 border border-border-subtle"
                    >
                      {showKey ? '🙈' : '👁'}
                    </button>
                  </div>
                  <button
                    onClick={() => apiKey && saveApiKey.mutate()}
                    disabled={!apiKey || saveApiKey.isPending}
                    className="btn-primary w-full mt-3"
                  >
                    {saveApiKey.isPending ? 'Saving...' : 'Save key and unlock unlimited access'}
                  </button>
                </div>
              )}

              {/* Locked — free users */}
              {!isByok && !isPaid && (
                <div className="flex items-start gap-3 p-4 bg-border-faint border border-border-subtle rounded-xl">
                  <Crown size={16} className="text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      Pro or Premium required
                    </p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                      Connecting your own Claude API key is available on paid plans.
                    </p>
                    <button
                      onClick={() => setTab('subscription')}
                      className="text-xs text-accent hover:underline mt-2 font-medium"
                    >
                      View plans
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Focus Timer */}
          {tab === 'focus' && (
            <div className="card p-6 space-y-5 animate-fade-in">
              <h2 className="font-semibold text-base text-text-primary">Focus Timer</h2>

              {[
                { label: 'Work duration (min)',    value: pomWork,     set: setPomWork,     min: 5,  max: 120 },
                { label: 'Break duration (min)',   value: pomBreak,    set: setPomBreak,    min: 2,  max: 30  },
                { label: 'Sessions per cycle',     value: pomSessions, set: setPomSessions, min: 1,  max: 8   },
                { label: 'Daily focus goal (hrs)', value: goalHours,   set: setGoalHours,   min: 1,  max: 12  },
              ].map(({ label, value, set, min, max }) => (
                <div key={label}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-text-secondary">{label}</label>
                    <span className="font-display font-bold text-text-primary">{value}</span>
                  </div>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={value}
                    onChange={e => set(Number(e.target.value))}
                    className="w-full accent-[#6c63ff]"
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-1">
                    <span>{min}</span>
                    <span>{max}</span>
                  </div>
                </div>
              ))}

              <button
                onClick={() => saveSettings.mutate()}
                disabled={saveSettings.isPending}
                className="btn-primary"
              >
                {saveSettings.isPending ? 'Saving...' : 'Save settings'}
              </button>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="card p-6 space-y-4 animate-fade-in">
              <h2 className="font-semibold text-base text-text-primary">Notifications</h2>

              {[
                { label: 'Email notifications', desc: 'Get meeting reminders and digests by email' },
                { label: 'Push notifications',  desc: 'Browser and mobile push alerts'            },
                { label: 'Meeting reminders',   desc: '15 minutes before each meeting'            },
                { label: 'Habit reminders',     desc: 'Daily nudges for incomplete habits'        },
                { label: 'Task due alerts',     desc: 'Same-day alerts for due tasks'             },
                { label: 'AI daily insight',    desc: 'Morning productivity tip based on your data'},
              ].map(({ label, desc }, i) => (
                <div
                  key={label}
                  className="flex items-center justify-between py-3 border-b border-border-faint last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                  </div>
                  <button
                    className={clsx(
                      'w-11 h-6 rounded-full transition-all relative flex-shrink-0',
                      i % 3 !== 2 ? 'bg-accent' : 'bg-border-default'
                    )}
                  >
                    <div
                      className={clsx(
                        'w-4 h-4 rounded-full bg-white absolute top-1 transition-all',
                        i % 3 !== 2 ? 'left-6' : 'left-1'
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}