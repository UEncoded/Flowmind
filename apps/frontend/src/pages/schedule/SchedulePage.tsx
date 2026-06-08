import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { Link } from 'react-router-dom'
import { format, addDays, startOfWeek, isSameDay } from 'date-fns'
import type { Meeting, Task } from '@flowmind/shared'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7am – 8pm

const TYPE_BG: Record<string, string> = {
  focus:   'bg-accent/20 border-l-2 border-accent text-accent-light',
  meeting: 'bg-amber/15 border-l-2 border-amber text-amber',
  task:    'bg-teal/15 border-l-2 border-teal text-teal',
  block:   'bg-border-subtle border-l-2 border-border-default text-text-muted',
}

interface CalEvent {
  id: string; title: string; startHour: number; durationMins: number; type: string
}

// Sample fixed events for demo
const FIXED_EVENTS: CalEvent[] = [
  { id:'1', title:'Deep Work Block',       startHour: 9,    durationMins: 120, type:'focus'   },
  { id:'2', title:'Team Standup',          startHour: 11.5, durationMins: 30,  type:'meeting' },
  { id:'3', title:'Lunch Break',           startHour: 12,   durationMins: 60,  type:'block'   },
  { id:'4', title:'Q3 Strategy Review',    startHour: 14,   durationMins: 60,  type:'meeting' },
  { id:'5', title:'Email / Admin',         startHour: 15.5, durationMins: 30,  type:'block'   },
  { id:'6', title:'1:1 with Manager',      startHour: 16.5, durationMins: 45,  type:'meeting' },
]

const HOUR_HEIGHT = 56 // px per hour

function EventBlock({ event }: { event: CalEvent }) {
  const top    = (event.startHour - 7) * HOUR_HEIGHT
  const height = (event.durationMins / 60) * HOUR_HEIGHT

  return (
    <div
      className={clsx('absolute left-2 right-2 rounded-lg px-2.5 py-1.5 overflow-hidden', TYPE_BG[event.type])}
      style={{ top: top + 1, height: Math.max(height - 2, 20) }}
    >
      <p className="text-xs font-medium leading-snug truncate">{event.title}</p>
      <p className="text-[10px] opacity-70">
        {String(Math.floor(event.startHour)).padStart(2,'0')}:{String((event.startHour % 1) * 60).padStart(2,'0')}
      </p>
    </div>
  )
}

export default function SchedulePage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(new Date())

  const weekStart = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 })
  const weekDays  = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ['meetings-upcoming'],
    queryFn:  () => axios.get('/api/meetings', { params: { upcoming: 1 } }).then(r => r.data),
  })

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-text-primary">Schedule</h1>
          <p className="text-sm text-text-muted mt-0.5">
            Week of {format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekOffset(w => w - 1)} className="btn-icon">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setWeekOffset(0)} className="btn-ghost text-xs h-8 px-3">Today</button>
          <button onClick={() => setWeekOffset(w => w + 1)} className="btn-icon">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* AI suggestion */}
      <div className="flex items-center gap-3 px-4 py-3 bg-accent/5 border border-accent/15 rounded-xl mb-5 text-sm">
        <Sparkles size={14} className="text-accent flex-shrink-0" />
        <span className="text-text-secondary flex-1">
          AI suggests blocking <strong className="text-text-primary">9–11am tomorrow</strong> for your highest-priority task. Want to schedule it?
        </span>
        <Link to="/ai" className="text-accent text-xs font-medium hover:underline flex-shrink-0">Ask AI →</Link>
      </div>

      {/* Week header */}
      <div className="grid grid-cols-8 mb-1">
        <div className="text-xs text-text-muted p-2" />
        {weekDays.map(day => (
          <button
            key={day.toISOString()}
            onClick={() => setSelectedDay(day)}
            className={clsx(
              'p-2 rounded-xl text-center transition-all',
              isSameDay(day, selectedDay) ? 'bg-accent/10' : 'hover:bg-bg-hover',
              isSameDay(day, new Date()) && 'font-bold'
            )}
          >
            <p className="text-xs text-text-muted">{format(day, 'EEE')}</p>
            <p className={clsx(
              'text-sm font-medium mt-0.5',
              isSameDay(day, new Date()) ? 'text-accent' : 'text-text-primary'
            )}>
              {format(day, 'd')}
            </p>
          </button>
        ))}
      </div>

      {/* Time grid */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-8 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
          {/* Time labels */}
          <div className="border-r border-border-faint">
            {HOURS.map(h => (
              <div key={h} className="flex items-start justify-end pr-3 pt-1" style={{ height: HOUR_HEIGHT }}>
                <span className="text-[10px] text-text-muted">
                  {String(h).padStart(2,'0')}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map(day => {
            const isToday    = isSameDay(day, new Date())
            const isSelected = isSameDay(day, selectedDay)
            const dayMeetings = meetings.filter(m => isSameDay(new Date(m.startTime), day))

            return (
              <div
                key={day.toISOString()}
                className={clsx(
                  'relative border-r border-border-faint last:border-r-0',
                  isSelected && 'bg-accent/3'
                )}
                style={{ minHeight: HOURS.length * HOUR_HEIGHT }}
              >
                {/* Hour lines */}
                {HOURS.map(h => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-border-faint"
                    style={{ top: (h - 7) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Today's fixed events */}
                {isToday && FIXED_EVENTS.map(ev => <EventBlock key={ev.id} event={ev} />)}

                {/* Real meetings */}
                {dayMeetings.map(m => {
                  const start = new Date(m.startTime)
                  const startHour = start.getHours() + start.getMinutes() / 60
                  const dur = (new Date(m.endTime).getTime() - start.getTime()) / 60000
                  return (
                    <EventBlock
                      key={m.id}
                      event={{ id: m.id, title: m.title, startHour, durationMins: dur, type: 'meeting' }}
                    />
                  )
                })}

                {/* Now indicator */}
                {isToday && (() => {
                  const now = new Date()
                  const nowH = now.getHours() + now.getMinutes() / 60
                  if (nowH < 7 || nowH > 21) return null
                  return (
                    <div
                      className="absolute left-0 right-0 flex items-center z-10"
                      style={{ top: (nowH - 7) * HOUR_HEIGHT }}
                    >
                      <div className="w-2 h-2 rounded-full bg-coral ml-1 flex-shrink-0" />
                      <div className="flex-1 h-px bg-coral/50" />
                    </div>
                  )
                })()}
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-text-muted">
        {[
          { label: 'Focus block', color: 'bg-accent/30'  },
          { label: 'Meeting',     color: 'bg-amber/30'   },
          { label: 'Task',        color: 'bg-teal/30'    },
          { label: 'Break/Admin', color: 'bg-border-subtle' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={clsx('w-3 h-3 rounded-sm', color)} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}
