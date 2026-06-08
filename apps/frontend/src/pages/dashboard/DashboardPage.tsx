import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  ChevronRight, Bell, Plus, ArrowRight,
  CheckCircle2, Circle, Timer, Calendar,
  Flame, Sparkles, BarChart2, Zap, TrendingUp,
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { PERSONA_LABELS, MOOD_EMOJIS, type UserPersona, type Task } from '@flowmind/shared'

// ── Stat card ──────────────────────────────────────────────
function StatCard({
  label, value, sub, iconBg, iconColor, icon: Icon, lineColor,
}: {
  label: string; value: string; sub: string
  iconBg: string; iconColor: string; icon: any; lineColor: string
}) {
  return (
    <div className="bg-white border border-border-subtle rounded-card p-[18px] flex flex-col animate-fade-up">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[11.5px] font-medium text-text-secondary mb-1">{label}</p>
          <p className="font-display font-extrabold text-[28px] text-text-primary leading-none tracking-tight">
            {value}
          </p>
          <p className="text-[11px] text-text-muted mt-1">{sub}</p>
        </div>
        <div
          className="w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <Icon size={22} style={{ color: iconColor }} />
        </div>
      </div>
      <div className="h-[3px] rounded-full mt-1" style={{ background: lineColor }} />
    </div>
  )
}

// ── Quick action card ───────────────────────────────────────
function QuickCard({
  title, sub, iconBg, iconColor, icon: Icon, to,
}: {
  title: string; sub: string; iconBg: string; iconColor: string; icon: any; to: string
}) {
  return (
    <Link
      to={to}
      className="bg-white border border-border-subtle rounded-[14px] p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 hover:border-accent-border hover:shadow-card-hover transition-all group"
    >
      <div
        className="w-9 h-9 sm:w-[42px] sm:h-[42px] rounded-[10px] sm:rounded-[12px] flex items-center justify-center flex-shrink-0"
        style={{ background: iconBg }}
      >
        <Icon size={18} style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] sm:text-[13px] font-bold text-text-primary leading-tight mb-0.5">{title}</p>
        <p className="text-[10.5px] sm:text-[11.5px] text-text-secondary leading-tight">{sub}</p>
      </div>
      <ArrowRight size={14} className="text-text-muted group-hover:text-accent transition-colors flex-shrink-0 hidden sm:block" />
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const persona = (user?.persona || 'other') as UserPersona

  const { data: overview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn:  () => axios.get('/api/analytics/overview').then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: todayTasks = [] } = useQuery<Task[]>({
    queryKey: ['tasks-today'],
    queryFn:  () => axios.get('/api/tasks/today').then(r => r.data),
  })

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn:  () => axios.get('/api/ai/status').then(r => r.data),
  })

  const toggleTask = useMutation({
    mutationFn: (task: Task) =>
      axios.patch(`/api/tasks/${task.id}`, {
        status: task.status === 'DONE' ? 'TODO' : 'DONE',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks-today'] }),
  })

  const logMood = useMutation({
    mutationFn: (mood: number) => axios.post('/api/mood', { mood }),
    onSuccess: () => toast.success('Mood logged!'),
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const focusHours = overview?.focus?.minutesToday
    ? `${Math.floor(overview.focus.minutesToday / 60)}h ${overview.focus.minutesToday % 60}m`
    : '0m'

  const firstName = user?.name?.split(' ')[0] || 'there'
  const personaLabel = PERSONA_LABELS[persona] || ''

  const SCHEDULE = [
    { time: '09:00', name: 'Deep Work Block',    detail: '2 hrs — no interruptions', color: '#6c5ce7', now: true  },
    { time: '11:30', name: 'Team Standup',        detail: 'Zoom · 4 attendees',       color: '#a29bfe', now: false },
    { time: '14:00', name: 'Q3 Strategy Review',  detail: 'Boardroom A · 8 people',   color: '#e74c3c', now: false },
    { time: '16:30', name: '1:1 with Manager',    detail: 'Zoom · Private',            color: '#00b894', now: false },
  ]

  return (
    <div className="p-6 max-w-[1200px] mx-auto pb-24 lg:pb-6">

      {/* ── Topbar ── */}
      <div className="flex items-start justify-between mb-6 animate-fade-up">
        <div>
          <p className="text-[12.5px] text-text-secondary flex items-center gap-2 mb-1">
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
            <span className="w-1 h-1 rounded-full bg-text-muted inline-block" />
            <span>{personaLabel}</span>
          </p>
          <h1 className="font-display font-extrabold text-[26px] text-text-primary tracking-tight leading-tight">
            {greeting()}, {firstName} 🔥
          </h1>
        </div>

        {/* Desktop topbar right */}
        <div className="hidden lg:flex items-center gap-3 pt-1">
          <button className="relative w-[38px] h-[38px] rounded-[10px] bg-white border border-border-default flex items-center justify-center text-text-secondary hover:border-accent-border hover:text-accent transition-all">
            <Bell size={18} />
            {overview?.aiStreak > 0 && (
              <span
                className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-bg-base"
                style={{ background: '#6c5ce7' }}
              >
                {Math.min(overview.aiStreak, 9)}
              </span>
            )}
          </button>
          <div
            className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[13px] font-bold text-white border-2 border-border-subtle cursor-pointer"
            style={{ background: '#6c5ce7' }}
          >
            {(user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard
          label="Tasks Due Today"
          value={`${overview?.tasks?.doneToday || 0}`}
          sub={`of ${todayTasks.length} due`}
          iconBg="#f0efff" iconColor="#6c5ce7" icon={CheckCircle2}
          lineColor="#ebebf0"
        />
        <StatCard
          label="Deep Work"
          value={focusHours}
          sub="today"
          iconBg="#e8faf5" iconColor="#00b894" icon={Timer}
          lineColor="#00b894"
        />
        <StatCard
          label="AI Streak"
          value={`${overview?.aiStreak || 0}`}
          sub="days"
          iconBg="#fffbea" iconColor="#f9c74f" icon={Zap}
          lineColor="#f9c74f"
        />
        <StatCard
          label="Habits Done"
          value={`${overview?.habits?.completedToday || 0}`}
          sub="today"
          iconBg="#fff3e8" iconColor="#fd7e14" icon={Flame}
          lineColor="#fd7e14"
        />
      </div>

      {/* ── Main two-col grid ── */}
      <div className="grid lg:grid-cols-[1fr_290px] gap-5">

        {/* ── LEFT ── */}
        <div>
          {/* Priority Tasks card */}
          <div className="bg-white border border-border-subtle rounded-card overflow-hidden mb-4 animate-fade-up">
            <div className="flex items-center justify-between px-[18px] py-4 border-b border-border-subtle">
              <h2 className="text-[14px] font-bold text-text-primary flex items-center gap-2">
                <CheckCircle2 size={17} style={{ color: '#6c5ce7' }} />
                Priority Tasks
              </h2>
              <Link
                to="/tasks"
                className="text-[12.5px] font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity"
                style={{ color: '#6c5ce7' }}
              >
                View all tasks <ChevronRight size={13} />
              </Link>
            </div>

            {todayTasks.length === 0 ? (
              /* Empty state — matches design */
              <div className="flex flex-col items-center py-10 px-5 text-center">
                <div
                  className="w-[88px] h-[88px] rounded-full flex items-center justify-center mb-4 relative"
                  style={{ background: '#f0efff' }}
                >
                  <span className="text-[42px]">📋</span>
                  <div
                    className="absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
                    style={{ background: '#6c5ce7' }}
                  >
                    <CheckCircle2 size={12} className="text-white" />
                  </div>
                </div>
                <p className="text-[14.5px] font-bold text-text-primary mb-1">All clear for today! 🎉</p>
                <p className="text-[12.5px] text-text-secondary mb-5">No tasks due today. Enjoy your momentum.</p>
                <button
                  onClick={() => navigate('/tasks')}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-white text-[13px] font-bold transition-all hover:opacity-90"
                  style={{ background: '#6c5ce7' }}
                >
                  <Plus size={15} /> Add Task
                </button>
              </div>
            ) : (
              /* Task list */
              <div>
                {todayTasks.slice(0, 6).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask.mutate(task)}
                    className="w-full flex items-center gap-3 px-[18px] py-3.5 border-b border-border-subtle last:border-b-0 hover:bg-bg-base transition-all text-left group"
                  >
                    <div className={clsx(
                      'w-[20px] h-[20px] rounded-[6px] border-2 flex items-center justify-center flex-shrink-0 transition-all',
                      task.status === 'DONE'
                        ? 'border-[#6c5ce7] bg-[#6c5ce7]'
                        : 'border-border-default group-hover:border-[#6c5ce7]'
                    )}>
                      {task.status === 'DONE' && <CheckCircle2 size={11} className="text-white" />}
                    </div>
                    <span className={clsx(
                      'flex-1 text-[13.5px] font-medium',
                      task.status === 'DONE' ? 'line-through text-text-muted' : 'text-text-primary'
                    )}>
                      {task.title}
                    </span>
                    <span className={clsx(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-[5px] flex-shrink-0',
                      task.priority === 'URGENT' ? 'bg-[#fdf0ee] text-[#e74c3c]' :
                      task.priority === 'HIGH'   ? 'bg-[#fff3e8] text-[#fd7e14]' :
                      task.priority === 'MEDIUM' ? 'bg-[#f0efff] text-[#6c5ce7]' :
                                                   'bg-bg-base  text-text-muted'
                    )}>
                      {task.priority}
                    </span>
                  </button>
                ))}
                {todayTasks.length > 6 && (
                  <Link to="/tasks" className="block text-center text-[12px] py-3 text-[#6c5ce7] hover:underline font-medium">
                    +{todayTasks.length - 6} more tasks
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3       animate-fade-up">
           <QuickCard
               title="Start Focus"
               sub="Deep work"
               iconBg="#f0efff" iconColor="#6c5ce7"
               icon={Timer} to="/focus"
            />
            <QuickCard
               title="Add Meeting"
               sub="Schedule it"
               iconBg="#e8faf5" iconColor="#00b894"
               icon={Calendar} to="/meetings"
            />
           <QuickCard
               title="Log Habit"
               sub="Track progress"
               iconBg="#fff3e8" iconColor="#fd7e14"
               icon={Flame} to="/habits"
               />
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="flex flex-col gap-4">

          {/* AI Insight */}
          <div className="bg-white border border-border-subtle rounded-card p-4 animate-fade-up">
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6c5ce7,#a29bfe)' }}
              >
                <Sparkles size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-[13.5px] font-bold text-text-primary">AI Insight</p>
              </div>
              <span
                className="text-[10px] font-bold px-2.5 py-1 rounded-[6px] border"
                style={{ background: '#f0efff', color: '#6c5ce7', borderColor: '#e0ddff' }}
              >
                Today
              </span>
            </div>
            <p className="text-[12.5px] text-text-secondary leading-[1.7] mb-3">
              {persona === 'student'
                ? "You're in a productive window. Block 90 minutes for deep study before checking messages."
                : persona === 'homemaker'
                ? "Your morning routine sets the tone. Schedule personal time before household tasks begin."
                : persona === 'job_seeker'
                ? "Apply to 3 roles now while energy is high. Save networking messages for the afternoon."
                : <>You are in your <strong className="text-text-primary font-semibold">peak focus window.</strong> Tackle your hardest task now while energy is high. Your consistency is building!</>
              }
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Prioritise', icon: TrendingUp },
                { label: 'Plan day',   icon: Calendar  },
                { label: 'Ask AI',     icon: Sparkles  },
              ].map(({ label, icon: Icon }) => (
                <Link
                  key={label}
                  to="/ai"
                  className="flex items-center gap-1.5 text-[11.5px] font-medium px-3 py-1.5 rounded-[7px] border text-text-secondary hover:border-accent-border hover:text-accent hover:bg-[#f0efff] transition-all"
                  style={{ background: '#f5f6fa', borderColor: '#e0dff0' }}
                >
                  <Icon size={12} /> {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white border border-border-subtle rounded-card overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
              <h3 className="text-[13.5px] font-bold text-text-primary flex items-center gap-2">
                <Calendar size={16} style={{ color: '#6c5ce7' }} />
                Today's Schedule
              </h3>
              <span className="text-[11px] text-text-muted">
                {new Date().toLocaleDateString('en-US', { month:'short', day:'numeric' })}
              </span>
            </div>
            {SCHEDULE.map(({ time, name, detail, color, now }) => (
              <div
                key={time}
                className={clsx(
                  'flex gap-3 px-4 py-2.5 border-b border-border-subtle last:border-b-0 items-start',
                  now && 'bg-[#f8f7ff]'
                )}
              >
                <span className="text-[11px] text-text-muted w-8 flex-shrink-0 pt-0.5 font-medium">
                  {time}
                </span>
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                  style={{ background: color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-semibold text-text-primary">{name}</p>
                  <p className="text-[11px] text-text-muted mt-0.5">{detail}</p>
                </div>
                {now && (
                  <span
                    className="text-[9px] font-extrabold px-2 py-0.5 rounded-[4px] text-white flex-shrink-0 tracking-wide"
                    style={{ background: '#6c5ce7' }}
                  >
                    NOW
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* This Week */}
          <div className="bg-white border border-border-subtle rounded-card p-4 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13.5px] font-bold text-text-primary flex items-center gap-2">
                <BarChart2 size={16} style={{ color: '#6c5ce7' }} />
                This Week
              </h3>
              <Link
                to="/analytics"
                className="text-[12px] font-semibold hover:opacity-80 transition-opacity"
                style={{ color: '#6c5ce7' }}
              >
                View stats
              </Link>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: 'Tasks completed',
                  val:   `${overview?.tasks?.doneThisWeek || 0} / 12`,
                  pct:   Math.min(100, ((overview?.tasks?.doneThisWeek || 0) / 12) * 100),
                  color: '#6c5ce7',
                },
                {
                  label: 'Focus hours',
                  val:   `${Math.floor((overview?.focus?.minutesToday || 0) / 60)}h / 6h`,
                  pct:   Math.min(100, ((overview?.focus?.minutesToday || 0) / 360) * 100),
                  color: '#00b894',
                },
                {
                  label: 'Habit streak',
                  val:   `${overview?.aiStreak || 0} days`,
                  pct:   Math.min(100, ((overview?.aiStreak || 0) / 14) * 100),
                  color: '#fd7e14',
                },
              ].map(({ label, val, pct, color }) => (
                <div key={label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[12px] text-text-secondary">{label}</span>
                    <span className="text-[12px] font-bold text-text-primary">{val}</span>
                  </div>
                  <div className="h-[7px] bg-bg-base rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
