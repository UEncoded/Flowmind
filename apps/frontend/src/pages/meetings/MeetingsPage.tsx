import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Plus, Video, MapPin, Users, Clock, Sparkles, AlertTriangle, CheckCircle2, Circle } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import type { Meeting, MeetingStatus } from '@flowmind/shared'

const STATUS_PILL: Record<MeetingStatus, string> = {
  SCHEDULED:   'bg-accent/15 text-accent-light',
  IN_PROGRESS: 'bg-teal/15 text-teal',
  COMPLETED:   'bg-green/15 text-green',
  CANCELLED:   'bg-border-subtle text-text-muted',
}

function MeetingCard({ meeting, onSummarise }: { meeting: Meeting; onSummarise: (m: Meeting) => void }) {
  const start = new Date(meeting.startTime)
  const end   = new Date(meeting.endTime)
  const isNow = start <= new Date() && new Date() <= end

  return (
    <div className={clsx('card p-5 transition-all hover:border-border-default', isNow && 'border-teal/30 bg-teal/5')}>
      <div className="flex items-start gap-4">
        <div className={clsx('w-12 rounded-xl p-2.5 text-center flex-shrink-0', isNow ? 'bg-teal/20' : 'bg-bg-muted')}>
          <p className="font-display font-bold text-lg leading-none" style={{ color: isNow ? '#00d4aa' : '#f0f2ff' }}>
            {String(start.getHours()).padStart(2,'0')}
          </p>
          <p className="text-xs text-text-muted leading-none mt-0.5">
            {String(start.getMinutes()).padStart(2,'0')}
          </p>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-semibold text-sm text-text-primary">{meeting.title}</h3>
            {isNow && <span className="badge bg-teal/20 text-teal text-[10px] animate-pulse">● LIVE</span>}
            <span className={clsx('badge text-[10px] ml-auto', STATUS_PILL[meeting.status])}>
              {meeting.status.replace('_',' ')}
            </span>
          </div>

          {meeting.description && (
            <p className="text-xs text-text-muted mb-2 line-clamp-2">{meeting.description}</p>
          )}

          <div className="flex flex-wrap gap-3 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {start.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})} – {end.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1">
                <MapPin size={11} /> {meeting.location}
              </span>
            )}
            {meeting.attendees.length > 0 && (
              <span className="flex items-center gap-1">
                <Users size={11} /> {meeting.attendees.length} attendees
              </span>
            )}
            {meeting.meetingUrl && (
              <a href={meeting.meetingUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-accent hover:underline">
                <Video size={11} /> Join
              </a>
            )}
          </div>

          {/* AI summary */}
          {meeting.aiSummary && (
            <div className="mt-3 p-3 bg-accent/5 border border-accent/15 rounded-lg">
              <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-accent">
                <Sparkles size={11} /> AI Summary
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{meeting.aiSummary.slice(0, 200)}…</p>
            </div>
          )}

          {meeting.actionItems && Array.isArray(meeting.actionItems) && meeting.actionItems.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Action items</p>
              <div className="space-y-1">
                {(meeting.actionItems as any[]).slice(0, 3).map((item: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    {item.done ? <CheckCircle2 size={12} className="text-teal" /> : <Circle size={12} className="text-border-strong" />}
                    <span className={item.done ? 'line-through text-text-muted' : 'text-text-secondary'}>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {meeting.status === 'COMPLETED' && !meeting.aiSummary && (
        <button
          onClick={() => onSummarise(meeting)}
          className="mt-3 w-full btn-ghost h-8 text-xs text-accent hover:text-accent-light flex items-center justify-center gap-1.5 border border-accent/20 rounded-lg"
        >
          <Sparkles size={12} /> Generate AI summary
        </button>
      )}
    </div>
  )
}

export default function MeetingsPage() {
  const [showAdd, setShowAdd]   = useState(false)
  const [tab,     setTab]       = useState<'today'|'upcoming'|'past'>('today')
  const [form, setForm] = useState({
    title:'', description:'', startTime:'', endTime:'', location:'', meetingUrl:'', attendees:'',
  })
  const qc = useQueryClient()

  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ['meetings', tab],
    queryFn:  () => {
      if (tab === 'today') return axios.get('/api/meetings/today').then(r => r.data)
      return axios.get('/api/meetings', { params: tab === 'upcoming' ? { upcoming: 1 } : {} }).then(r => r.data)
    },
  })

  const addMeeting = useMutation({
    mutationFn: () => axios.post('/api/meetings', {
      ...form,
      attendees: form.attendees.split(',').map(e => e.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      setShowAdd(false)
      setForm({ title:'', description:'', startTime:'', endTime:'', location:'', meetingUrl:'', attendees:'' })
      toast.success('Meeting scheduled!')
    },
  })

  const summariseMeeting = useMutation({
    mutationFn: (id: string) =>
      axios.post(`/api/meetings/${id}/summarize`, {
        transcript: `[Meeting transcript for ${id} — paste real transcript here]`,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] })
      toast.success('AI summary generated!')
    },
    onError: (e: any) => {
      if (e.response?.data?.code === 'QUOTA_EXCEEDED') toast.error('AI quota exceeded — add your API key')
      else toast.error('Failed to generate summary')
    },
  })

  const upcoming = meetings.filter(m => new Date(m.startTime) > new Date())
  const today    = meetings
  const past     = meetings.filter(m => m.status === 'COMPLETED')

  const displayed = tab === 'today' ? today : tab === 'upcoming' ? upcoming : past

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto pb-24 lg:pb-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-text-primary">Meetings</h1>
          <p className="text-sm text-text-muted mt-0.5">{today.length} today</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary h-9 px-4 text-sm flex items-center gap-1.5">
          <Plus size={15} /> Schedule
        </button>
      </div>

      {/* Alert */}
      {today.some(m => {
        const diff = (new Date(m.startTime).getTime() - Date.now()) / 60000
        return diff > 0 && diff < 20
      }) && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber/10 border border-amber/20 rounded-xl text-sm mb-5">
          <AlertTriangle size={14} className="text-amber flex-shrink-0" />
          <span className="text-text-secondary">
            A meeting starts in less than 20 minutes. Make sure you're prepared!
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 bg-bg-muted p-1 rounded-xl w-fit">
        {(['today','upcoming','past'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 h-8 rounded-lg text-sm font-medium transition-all capitalize',
              tab === t ? 'bg-bg-card text-text-primary shadow-sm' : 'text-text-muted hover:text-text-secondary'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Meeting list */}
      <div className="space-y-3">
        {displayed.length === 0 ? (
          <div className="text-center py-12 card">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-sm text-text-muted">No {tab} meetings</p>
          </div>
        ) : (
          displayed.map(m => (
            <MeetingCard key={m.id} meeting={m} onSummarise={m => summariseMeeting.mutate(m.id)} />
          ))
        )}
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-bg-subtle border border-border-default rounded-2xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-base text-text-primary">Schedule Meeting</h3>
              <button onClick={() => setShowAdd(false)} className="btn-icon w-8 h-8 text-text-muted">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Title *</label>
                <input className="input" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Meeting title" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
                <textarea className="input resize-none h-16" value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} placeholder="Agenda, notes…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Start *</label>
                  <input type="datetime-local" className="input" value={form.startTime} onChange={e => setForm(f=>({...f,startTime:e.target.value}))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">End *</label>
                  <input type="datetime-local" className="input" value={form.endTime} onChange={e => setForm(f=>({...f,endTime:e.target.value}))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Location</label>
                <input className="input" value={form.location} onChange={e => setForm(f=>({...f,location:e.target.value}))} placeholder="Office, Zoom, etc." />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Meeting URL</label>
                <input className="input" value={form.meetingUrl} onChange={e => setForm(f=>({...f,meetingUrl:e.target.value}))} placeholder="https://meet.google.com/…" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Attendees (comma-separated emails)</label>
                <input className="input" value={form.attendees} onChange={e => setForm(f=>({...f,attendees:e.target.value}))} placeholder="colleague@company.com, boss@company.com" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => form.title && form.startTime && form.endTime && addMeeting.mutate()}
                disabled={!form.title || !form.startTime || !form.endTime || addMeeting.isPending}
                className="btn-primary flex-1"
              >
                {addMeeting.isPending ? 'Scheduling…' : 'Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
