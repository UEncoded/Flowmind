import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Play, Pause, RotateCcw, SkipForward, Sparkles, Flame } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

type Phase = 'work' | 'break'
const MODES = [
  { id: 'pomodoro',  label: '25/5',  work: 25, rest: 5,  name: 'Classic Pomodoro' },
  { id: 'deep-work', label: '50/10', work: 50, rest: 10, name: 'Deep Work'         },
  { id: 'ultra',     label: '90/20', work: 90, rest: 20, name: 'Ultra Deep'        },
]

const RADIUS      = 88
const CIRC        = 2 * Math.PI * RADIUS

export default function FocusPage() {
  const [modeIdx,    setModeIdx]    = useState(0)
  const [phase,      setPhase]      = useState<Phase>('work')
  const [seconds,    setSeconds]    = useState(MODES[0].work * 60)
  const [running,    setRunning]    = useState(false)
  const [sessions,   setSessions]   = useState(0)
  const [taskNote,   setTaskNote]   = useState('')
  const [sessionId,  setSessionId]  = useState<string | null>(null)
  const intervalRef                 = useRef<ReturnType<typeof setInterval> | null>(null)
  const qc = useQueryClient()

  const mode  = MODES[modeIdx]
  const total = (phase === 'work' ? mode.work : mode.rest) * 60
  const pct   = 1 - seconds / total
  const dash  = CIRC * pct
  const min   = Math.floor(seconds / 60)
  const sec   = seconds % 60

  const { data: stats } = useQuery({
    queryKey: ['focus-stats'],
    queryFn:  () => axios.get('/api/focus/stats').then(r => r.data),
    refetchInterval: running ? false : 30_000,
  })

  const startSession = useMutation({
    mutationFn: () => axios.post('/api/focus', {
      mode: mode.id, workMinutes: mode.work, breakMinutes: mode.rest,
    }).then(r => r.data),
    onSuccess: (data) => setSessionId(data.id),
  })

  const endSession = useMutation({
    mutationFn: ({ id, pomos, mins }: { id: string; pomos: number; mins: number }) =>
      axios.patch(`/api/focus/${id}/end`, {
        completedPomodoros: pomos, totalMinutes: mins, taskNote: taskNote || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-stats'] })
      setSessionId(null)
    },
  })

  const nextPhase = () => {
    if (phase === 'work') {
      const newSessions = sessions + 1
      setSessions(newSessions)
      if (sessionId) {
        endSession.mutate({ id: sessionId, pomos: newSessions, mins: newSessions * mode.work })
      }
      setPhase('break')
      setSeconds(mode.rest * 60)
      toast.success('🎉 Focus session complete! Take a break.')
    } else {
      setPhase('work')
      setSeconds(mode.work * 60)
      startSession.mutate()
    }
    setRunning(false)
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) { clearInterval(intervalRef.current!); nextPhase(); return 0 }
          return s - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current!)
    }
    return () => clearInterval(intervalRef.current!)
  }, [running, phase, modeIdx])

  const toggle = () => {
    if (!running && !sessionId && phase === 'work') startSession.mutate()
    setRunning(r => !r)
  }

  const reset = () => {
    setRunning(false)
    setPhase('work')
    setSeconds(mode.work * 60)
    setSessions(0)
    setSessionId(null)
  }

  const switchMode = (i: number) => {
    reset()
    setModeIdx(i)
    setSeconds(MODES[i].work * 60)
  }

  const focusToday = stats?.today?.minutes || 0
  const pomosToday = stats?.today?.pomodoros || 0

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-24 lg:pb-6">
      <div className="mb-5">
        <h1 className="font-display font-bold text-xl text-text-primary">Focus Timer</h1>
        <p className="text-sm text-text-muted mt-0.5">Deep work sessions with Pomodoro technique</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Timer — left (spans 3) */}
        <div className="lg:col-span-3 card p-6 flex flex-col items-center">
          {/* Mode selector */}
          <div className="flex gap-2 mb-8 self-stretch">
            {MODES.map((m, i) => (
              <button
                key={m.id}
                onClick={() => switchMode(i)}
                className={clsx(
                  'flex-1 h-9 rounded-btn text-xs font-medium transition-all border',
                  i === modeIdx
                    ? 'bg-accent/10 border-accent/30 text-accent-light'
                    : 'border-border-subtle text-text-muted hover:text-text-secondary'
                )}
              >
                {m.label}
                <span className="block text-[10px] opacity-60">{m.name}</span>
              </button>
            ))}
          </div>

          {/* Ring */}
          <div className="relative w-52 h-52 mb-6">
            <svg width="208" height="208" className="absolute inset-0 -rotate-90">
              <circle cx="104" cy="104" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
              <circle
                cx="104" cy="104" r={RADIUS} fill="none"
                stroke={phase === 'work' ? 'url(#focusGrad)' : '#00d4aa'}
                strokeWidth="10" strokeLinecap="round"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC - dash}
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
              <defs>
                <linearGradient id="focusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6c63ff" />
                  <stop offset="100%" stopColor="#8b83ff" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display font-bold text-5xl text-text-primary tracking-tight">
                {String(min).padStart(2,'0')}:{String(sec).padStart(2,'0')}
              </span>
              <span className="text-xs text-text-muted uppercase tracking-wider mt-1">
                {phase === 'work' ? mode.name : '☕ Break'}
              </span>
            </div>
          </div>

          {/* Session dots */}
          <div className="flex gap-2.5 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={clsx(
                  'w-3 h-3 rounded-full border transition-all',
                  i < sessions % 4
                    ? 'bg-accent border-accent'
                    : i === sessions % 4 && running && phase === 'work'
                    ? 'bg-accent-light border-accent-light shadow-[0_0_8px_rgba(108,99,255,0.5)]'
                    : 'bg-transparent border-border-default'
                )}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 mb-6">
            <button onClick={reset} className="btn-icon w-11 h-11 border border-border-subtle hover:border-border-default" title="Reset">
              <RotateCcw size={16} />
            </button>
            <button
              onClick={toggle}
              className="w-16 h-16 rounded-full flex items-center justify-center text-white transition-all active:scale-95 hover:opacity-90 shadow-lg"
              style={{ background: phase === 'work' ? 'linear-gradient(135deg,#6c63ff,#534ab7)' : 'linear-gradient(135deg,#00d4aa,#009980)' }}
            >
              {running ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </button>
            <button onClick={nextPhase} className="btn-icon w-11 h-11 border border-border-subtle hover:border-border-default" title="Skip">
              <SkipForward size={16} />
            </button>
          </div>

          {/* Task note */}
          <div className="w-full">
            <label className="block text-xs font-medium text-text-muted mb-1.5">Working on…</label>
            <input
              value={taskNote}
              onChange={e => setTaskNote(e.target.value)}
              placeholder="What are you focusing on? (optional)"
              className="input-sm w-full"
            />
          </div>
        </div>

        {/* Right panel (spans 2) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Today stats */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-text-primary mb-4">Today's Focus</h3>
            <div className="space-y-3">
              {[
                { label: 'Deep work time', val: `${Math.floor(focusToday/60)}h ${focusToday%60}m`, max: 360, cur: focusToday, color: '#6c63ff' },
                { label: 'Pomodoros',      val: `${pomosToday}`,                                   max: 8,   cur: pomosToday, color: '#00d4aa' },
                { label: 'Sessions',       val: `${stats?.today?.sessions || 0}`,                  max: 8,   cur: stats?.today?.sessions || 0, color: '#ffd166' },
              ].map(({ label, val, max, cur, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-text-muted">{label}</span>
                    <span className="font-medium text-text-secondary">{val}</span>
                  </div>
                  <div className="h-1.5 bg-border-subtle rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (cur / max) * 100)}%`, background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session log */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-text-primary mb-4">Session Log</h3>
            <div className="space-y-2">
              {sessions === 0 ? (
                <p className="text-xs text-text-muted text-center py-4">Start a session to see your log</p>
              ) : (
                Array.from({ length: sessions }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                    <span className="text-text-secondary flex-1">Session {i + 1} — {mode.work} min</span>
                    <span className="text-text-muted">✓</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* AI coach */}
          <div className="card p-5 border-accent/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#6c63ff,#00d4aa)'}}>
                <Sparkles size={12} className="text-white" />
              </div>
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Focus Coach</span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed mb-3">
              {running && phase === 'work'
                ? "🎯 Stay in the zone! Close all notifications. You've got this."
                : running && phase === 'break'
                ? "☕ Great work! Step away from the screen. Stretch, hydrate, breathe."
                : sessions > 0
                ? `✨ ${sessions} session${sessions > 1 ? 's' : ''} complete! Your focus is building momentum.`
                : "Ready to focus? Set your task above, then press start. One session at a time."}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
