import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Plus, Flame, CheckCircle2, Circle } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import type { Habit } from '@flowmind/shared'

const ICONS  = ['⭐','🏋️','💧','📚','🧘','✍️','🎯','🌅','🥗','💊','🚶','🎵','🧹','💰','📵','😴']
const COLORS = ['#6c63ff','#00d4aa','#ffd166','#ff6b6b','#f72585','#06d6a0','#4895ef','#ff9f1c']
const DAYS   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

interface HabitWithExtra extends Habit { completedToday: boolean; streak?: number }

export default function HabitsPage() {
  const [showAdd,  setShowAdd]  = useState(false)
  const [newName,  setNewName]  = useState('')
  const [newIcon,  setNewIcon]  = useState('⭐')
  const [newColor, setNewColor] = useState('#6c63ff')
  const [newReminder, setNewReminder] = useState('')
  const qc = useQueryClient()

  const { data: habits = [] } = useQuery<HabitWithExtra[]>({
    queryKey: ['habits-today'],
    queryFn:  () => axios.get('/api/habits/today').then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: allHabits = [] } = useQuery<HabitWithExtra[]>({
    queryKey: ['habits-all'],
    queryFn:  () => axios.get('/api/habits').then(r => r.data),
  })

  const logHabit = useMutation({
    mutationFn: ({ id, done }: { id: string; done: boolean }) =>
      axios.post(`/api/habits/${id}/log`, { completed: done }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['habits-today'] }),
  })

  const addHabit = useMutation({
    mutationFn: () => axios.post('/api/habits', {
      name: newName, icon: newIcon, color: newColor,
      reminderTime: newReminder || undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['habits-today'] })
      qc.invalidateQueries({ queryKey: ['habits-all'] })
      setShowAdd(false)
      setNewName('')
      toast.success('Habit added!')
    },
  })

  const completed = habits.filter(h => h.completedToday).length
  const total     = habits.length
  const pct       = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-text-primary">Habits</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary h-9 px-4 text-sm flex items-center gap-1.5">
          <Plus size={15} /> Add habit
        </button>
      </div>

      {/* Progress bar */}
      <div className="card p-5 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-text-secondary">{completed} of {total} habits done today</span>
          <span className="font-display font-bold text-lg text-text-primary">{pct}%</span>
        </div>
        <div className="h-2 bg-border-subtle rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct === 100
                ? 'linear-gradient(90deg,#06d6a0,#00d4aa)'
                : 'linear-gradient(90deg,#6c63ff,#00d4aa)',
            }}
          />
        </div>
        {pct === 100 && (
          <p className="text-sm text-green mt-2 font-medium">🎉 Perfect day! All habits complete.</p>
        )}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Habit list — spans 3 */}
        <div className="lg:col-span-3 space-y-2">
          {habits.length === 0 && (
            <div className="text-center py-12 card">
              <p className="text-2xl mb-2">🌱</p>
              <p className="text-sm text-text-muted">No habits yet. Add your first one!</p>
            </div>
          )}
          {habits.map(habit => (
            <div
              key={habit.id}
              className={clsx(
                'card p-4 flex items-center gap-4 transition-all',
                habit.completedToday && 'opacity-75'
              )}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${habit.color}20` }}
              >
                {habit.icon}
              </div>

              <div className="flex-1 min-w-0">
                <p className={clsx(
                  'text-sm font-medium',
                  habit.completedToday ? 'line-through text-text-muted' : 'text-text-primary'
                )}>
                  {habit.name}
                </p>
                {(habit.streak ?? 0) > 0 && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Flame size={11} className="text-amber" />
                    <span className="text-xs text-amber">{habit.streak}-day streak</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => logHabit.mutate({ id: habit.id, done: !habit.completedToday })}
                className="flex-shrink-0 transition-transform hover:scale-110 active:scale-95"
              >
                {habit.completedToday
                  ? <CheckCircle2 size={26} style={{ color: habit.color }} />
                  : <Circle size={26} className="text-border-strong hover:text-accent transition-colors" />
                }
              </button>
            </div>
          ))}
        </div>

        {/* Right panel — spans 2 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Weekly grid */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-text-primary mb-4">Weekly Overview</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left text-text-muted font-normal pb-2 pr-3 w-28">Habit</th>
                    {DAYS.map(d => (
                      <th key={d} className="text-text-muted font-normal pb-2 px-1">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allHabits.slice(0, 6).map(habit => (
                    <tr key={habit.id}>
                      <td className="pr-3 py-1 text-text-secondary truncate max-w-[7rem]">
                        {habit.icon} {habit.name.split(' ')[0]}
                      </td>
                      {Array.from({ length: 7 }).map((_, i) => (
                        <td key={i} className="px-1 py-1 text-center">
                          <div
                            className="w-4 h-4 rounded mx-auto"
                            style={{
                              background: i < (new Date().getDay() || 7)
                                ? `${habit.color}${Math.random() > 0.3 ? 'cc' : '22'}`
                                : 'rgba(255,255,255,0.05)',
                            }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Streaks leaderboard */}
          <div className="card p-5">
            <h3 className="font-semibold text-sm text-text-primary mb-4">🏆 Top Streaks</h3>
            <div className="space-y-3">
              {[...allHabits]
                .sort((a, b) => (b.streak || 0) - (a.streak || 0))
                .slice(0, 5)
                .map((habit, i) => (
                  <div key={habit.id} className="flex items-center gap-3">
                    <span className="text-text-muted text-xs w-4">{i + 1}</span>
                    <span className="text-base">{habit.icon}</span>
                    <span className="text-sm text-text-secondary flex-1 truncate">{habit.name}</span>
                    <div className="flex items-center gap-1">
                      <Flame size={12} className="text-amber" />
                      <span className="text-xs font-bold text-amber">{habit.streak || 0}</span>
                    </div>
                  </div>
                ))
              }
              {allHabits.length === 0 && (
                <p className="text-xs text-text-muted text-center py-2">No habits yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-bg-subtle border border-border-default rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-base text-text-primary">New Habit</h3>
              <button onClick={() => setShowAdd(false)} className="btn-icon w-8 h-8 text-text-muted">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Name *</label>
                <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Morning exercise" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(icon => (
                    <button key={icon} onClick={() => setNewIcon(icon)} className={clsx('w-9 h-9 rounded-lg text-lg transition-all', newIcon===icon ? 'bg-accent/20 ring-1 ring-accent' : 'bg-bg-muted hover:bg-bg-hover')}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Colour</label>
                <div className="flex gap-2">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setNewColor(c)} className={clsx('w-8 h-8 rounded-full transition-all', newColor===c && 'ring-2 ring-offset-2 ring-offset-bg-subtle ring-white')} style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Daily reminder (optional)</label>
                <input type="time" className="input" value={newReminder} onChange={e => setNewReminder(e.target.value)} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => newName.trim() && addHabit.mutate()} disabled={!newName.trim() || addHabit.isPending} className="btn-primary flex-1">
                {addHabit.isPending ? 'Adding…' : 'Add habit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
