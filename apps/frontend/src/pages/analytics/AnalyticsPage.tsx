import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { TrendingUp, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import type { HeatmapCell, ProductivityWeek } from '@flowmind/shared'

const HEAT_COLORS = ['bg-border-faint','bg-accent/20','bg-accent/40','bg-accent/60','bg-accent/80','bg-accent']

const chartTooltipStyle = {
  backgroundColor: '#1e2130', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '10px', color: '#f0f2ff', fontSize: '12px',
}

export default function AnalyticsPage() {
  const { data: overview } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn:  () => axios.get('/api/analytics/overview').then(r => r.data),
  })

  const { data: weeks = [] } = useQuery<ProductivityWeek[]>({
    queryKey: ['analytics-productivity'],
    queryFn:  () => axios.get('/api/analytics/productivity').then(r => r.data),
  })

  const { data: heatmap = [] } = useQuery<HeatmapCell[]>({
    queryKey: ['analytics-heatmap'],
    queryFn:  () => axios.get('/api/analytics/heatmap').then(r => r.data),
  })

  const chartData = weeks.map((w, i) => ({
    name: `W${i + 1}`,
    tasks:  w.tasksCompleted,
    focus:  Math.round(w.focusMinutes / 60 * 10) / 10,
    habits: w.habitsCompleted,
  }))

  const metrics = [
    { label: 'Tasks this week', value: overview?.tasks?.doneThisWeek || 0, icon: '✅', color: '#6c63ff', change: '+12%' },
    { label: 'Focus hours today', value: `${Math.floor((overview?.focus?.minutesToday || 0) / 60)}h ${(overview?.focus?.minutesToday || 0) % 60}m`, icon: '⏱️', color: '#00d4aa', change: '+8%' },
    { label: 'AI streak', value: `${overview?.aiStreak || 0}d`, icon: '🔥', color: '#ffd166', change: 'Keep going!' },
    { label: 'Habits today', value: overview?.habits?.completedToday || 0, icon: '💪', color: '#f72585', change: '' },
  ]

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-24 lg:pb-6">
      <div className="mb-5">
        <h1 className="font-display font-bold text-xl text-text-primary">Analytics</h1>
        <p className="text-sm text-text-muted mt-0.5">Your productivity insights</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {metrics.map(({ label, value, icon, color, change }) => (
          <div key={label} className="card p-4 animate-fade-up">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xl">{icon}</span>
              {change && (
                <span className="text-[10px] text-green bg-green/10 px-2 py-0.5 rounded-pill font-medium">
                  {change}
                </span>
              )}
            </div>
            <p className="font-display font-bold text-2xl text-text-primary mb-1">{value}</p>
            <p className="text-xs text-text-muted">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* Tasks & Focus trend */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-text-primary mb-4">5-Week Productivity Trend</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill:'#5c6388', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#5c6388', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Line type="monotone" dataKey="tasks" stroke="#6c63ff" strokeWidth={2} dot={{ fill:'#6c63ff', r:3 }} name="Tasks" />
                <Line type="monotone" dataKey="habits" stroke="#00d4aa" strokeWidth={2} dot={{ fill:'#00d4aa', r:3 }} name="Habits" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-text-muted text-sm">
              Complete some tasks to see your trend
            </div>
          )}
        </div>

        {/* Focus hours bar */}
        <div className="card p-5">
          <h3 className="font-semibold text-sm text-text-primary mb-4">Weekly Focus Hours</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill:'#5c6388', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'#5c6388', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: any) => [`${v}h`, 'Focus']} />
                <Bar dataKey="focus" fill="#6c63ff" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-text-muted text-sm">
              Log focus sessions to see your data
            </div>
          )}
        </div>
      </div>

      {/* Heatmap */}
      <div className="card p-5 mb-5">
        <h3 className="font-semibold text-sm text-text-primary mb-4">Activity Heatmap — Last 35 Days</h3>
        <div className="grid grid-cols-7 gap-1.5">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="text-center text-[9px] text-text-muted pb-1">{d}</div>
          ))}
          {heatmap.map((cell, i) => (
            <div
              key={i}
              className={clsx('aspect-square rounded-sm transition-all hover:scale-125', HEAT_COLORS[cell.level])}
              title={`${cell.date}: score ${cell.score}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
          <span>Less</span>
          <div className="flex gap-1">
            {HEAT_COLORS.map((c, i) => (
              <div key={i} className={clsx('w-3 h-3 rounded-sm', c)} />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>

      {/* AI insight */}
      <div className="card p-5 border-accent/10">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#6c63ff,#00d4aa)'}}>
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">AI Analysis</span>
        </div>
        <p className="text-sm text-text-secondary leading-relaxed mb-4">
          Based on your patterns: your most productive window is typically mid-morning. Focus sessions tend to
          be more productive when preceded by a short planning ritual. Your habit consistency directly
          correlates with your task completion rate on the same day.
        </p>
        <Link to="/ai" className="text-xs text-accent hover:text-accent-light font-medium flex items-center gap-1">
          <TrendingUp size={12} /> Get personalised recommendations →
        </Link>
      </div>
    </div>
  )
}
