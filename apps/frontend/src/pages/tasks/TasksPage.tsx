import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { Plus, Search, Filter, CheckCircle2, Circle, Trash2, ChevronDown } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import type { Task, TaskStatus, Priority } from '@flowmind/shared'

const PRIORITY_COLORS: Record<Priority, string> = {
  LOW:    'bg-teal/15   text-teal',
  MEDIUM: 'bg-amber/15  text-amber',
  HIGH:   'bg-coral/15  text-coral',
  URGENT: 'bg-pink/15   text-pink',
}
const STATUS_COLS: { key: TaskStatus; label: string; color: string }[] = [
  { key: 'TODO',        label: 'To Do',       color: 'border-border-default' },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-accent'         },
  { key: 'DONE',        label: 'Done',        color: 'border-teal'           },
]
const CATEGORIES = ['work','personal','health','learning','finance','household','other']

interface AddTaskForm {
  title: string; description: string; priority: Priority
  category: string; dueDate: string; tags: string
}

const defaultForm: AddTaskForm = {
  title:'', description:'', priority:'MEDIUM', category:'work', dueDate:'', tags:''
}

function TaskCard({ task, onToggle, onDelete }: {
  task: Task
  onToggle: (t: Task) => void
  onDelete: (t: Task) => void
}) {
  return (
    <div className="bg-bg-muted border border-border-faint rounded-xl p-3.5 group hover:border-border-subtle transition-all">
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggle(task)}
          className="mt-0.5 flex-shrink-0 transition-transform hover:scale-110"
        >
          {task.status === 'DONE'
            ? <CheckCircle2 size={18} className="text-accent" />
            : <Circle size={18} className="text-border-strong hover:text-accent transition-colors" />
          }
        </button>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-medium leading-snug', task.status === 'DONE' && 'line-through text-text-muted')}>
            {task.title}
          </p>
          {task.description && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2 leading-relaxed">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={clsx('badge text-[10px]', PRIORITY_COLORS[task.priority])}>
              {task.priority}
            </span>
            {task.category && (
              <span className="badge bg-border-faint text-text-muted text-[10px]">{task.category}</span>
            )}
            {task.tags.map(tag => (
              <span key={tag} className="badge bg-border-faint text-text-muted text-[10px]">#{tag}</span>
            ))}
            {task.dueDate && (
              <span className="text-[10px] text-text-muted ml-auto">
                📅 {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(task)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-text-muted hover:text-coral"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [view,        setView]        = useState<'board'|'list'>('board')
  const [search,      setSearch]      = useState('')
  const [filterPri,   setFilterPri]   = useState<Priority|'ALL'>('ALL')
  const [showAdd,     setShowAdd]     = useState(false)
  const [form,        setForm]        = useState<AddTaskForm>(defaultForm)
  const qc = useQueryClient()

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', search, filterPri],
    queryFn:  () => axios.get('/api/tasks', {
      params: {
        search:   search   || undefined,
        priority: filterPri !== 'ALL' ? filterPri : undefined,
      },
    }).then(r => r.data),
  })

  const addTask = useMutation({
    mutationFn: () => axios.post('/api/tasks', {
      title:       form.title,
      description: form.description || undefined,
      priority:    form.priority,
      category:    form.category,
      dueDate:     form.dueDate || undefined,
      tags:        form.tags.split(',').map(t => t.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setShowAdd(false)
      setForm(defaultForm)
      toast.success('Task added!')
    },
    onError: () => toast.error('Failed to add task'),
  })

  const updateTask = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      axios.patch(`/api/tasks/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const deleteTask = useMutation({
    mutationFn: (id: string) => axios.delete(`/api/tasks/${id}`),
    onSuccess:  () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Task deleted') },
  })

  const cycleStatus = (task: Task) => {
    const next: Record<TaskStatus, TaskStatus> = {
      TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'TODO', CANCELLED: 'TODO',
    }
    updateTask.mutate({ id: task.id, status: next[task.status] })
  }

  const byStatus = (status: TaskStatus) => tasks.filter(t => t.status === status)
  const counts   = { todo: byStatus('TODO').length, inProgress: byStatus('IN_PROGRESS').length, done: byStatus('DONE').length }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto pb-24 lg:pb-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-display font-bold text-xl text-text-primary">Tasks</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {counts.todo} to do · {counts.inProgress} in progress · {counts.done} done
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary h-9 px-4 text-sm flex items-center gap-1.5"
        >
          <Plus size={15} /> Add task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-xs bg-bg-muted border border-border-subtle rounded-btn px-3 h-9">
          <Search size={13} className="text-text-muted flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="bg-transparent text-sm text-text-primary placeholder-text-disabled flex-1 outline-none min-w-0"
          />
        </div>
        <div className="flex gap-1.5">
          {(['ALL','LOW','MEDIUM','HIGH','URGENT'] as const).map(p => (
            <button
              key={p}
              onClick={() => setFilterPri(p)}
              className={clsx(
                'h-9 px-3 rounded-btn text-xs font-medium transition-all border',
                filterPri === p
                  ? 'bg-accent/10 border-accent/30 text-accent-light'
                  : 'border-border-subtle text-text-muted hover:text-text-secondary hover:border-border-default'
              )}
            >
              {p === 'ALL' ? 'All' : p}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5 ml-auto">
          {(['board','list'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx(
                'h-9 px-3 rounded-btn text-xs font-medium transition-all border',
                view === v
                  ? 'bg-accent/10 border-accent/30 text-accent-light'
                  : 'border-border-subtle text-text-muted hover:border-border-default'
              )}
            >
              {v === 'board' ? '▦ Board' : '≡ List'}
            </button>
          ))}
        </div>
      </div>

      {/* Board view */}
      {view === 'board' && (
        <div className="grid sm:grid-cols-3 gap-4">
          {STATUS_COLS.map(({ key, label, color }) => (
            <div key={key}>
              <div className={clsx('flex items-center gap-2 mb-3 pb-2 border-b-2', color)}>
                <span className="text-sm font-semibold text-text-secondary">{label}</span>
                <span className="badge bg-border-subtle text-text-muted text-[10px]">
                  {byStatus(key).length}
                </span>
              </div>
              <div className="space-y-2">
                {isLoading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="h-20 bg-bg-muted border border-border-faint rounded-xl animate-pulse" />
                    ))
                  : byStatus(key).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={cycleStatus}
                        onDelete={t => deleteTask.mutate(t.id)}
                      />
                    ))
                }
                {byStatus(key).length === 0 && !isLoading && (
                  <div className="text-center py-8 text-text-muted text-xs border border-dashed border-border-faint rounded-xl">
                    No tasks here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="card p-1 space-y-0.5">
          {tasks.length === 0 && !isLoading && (
            <div className="text-center py-12 text-text-muted text-sm">No tasks found</div>
          )}
          {tasks.map(task => (
            <div key={task.id} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-bg-hover transition-all group">
              <button onClick={() => cycleStatus(task)} className="flex-shrink-0">
                {task.status === 'DONE'
                  ? <CheckCircle2 size={18} className="text-accent" />
                  : task.status === 'IN_PROGRESS'
                  ? <div className="w-[18px] h-[18px] rounded-full border-2 border-accent border-t-transparent animate-spin" />
                  : <Circle size={18} className="text-border-strong" />
                }
              </button>
              <span className={clsx('flex-1 text-sm', task.status === 'DONE' && 'line-through text-text-muted')}>
                {task.title}
              </span>
              <span className={clsx('badge text-[10px] hidden sm:inline-flex', PRIORITY_COLORS[task.priority])}>
                {task.priority}
              </span>
              {task.category && (
                <span className="text-xs text-text-muted hidden sm:block">{task.category}</span>
              )}
              {task.dueDate && (
                <span className="text-xs text-text-muted hidden md:block">
                  {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
              <button
                onClick={() => deleteTask.mutate(task.id)}
                className="opacity-0 group-hover:opacity-100 btn-icon w-7 h-7 hover:text-coral"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add task modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-bg-subtle border border-border-default rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-base text-text-primary">New Task</h3>
              <button onClick={() => setShowAdd(false)} className="btn-icon w-8 h-8 text-text-muted">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Title *</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">Description</label>
                <textarea
                  className="input resize-none h-20"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional details…"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Priority</label>
                  <select
                    className="input"
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                  >
                    {['LOW','MEDIUM','HIGH','URGENT'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Category</label>
                  <select
                    className="input"
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Due date</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">Tags (comma-sep)</label>
                  <input
                    className="input"
                    value={form.tags}
                    onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                    placeholder="work, urgent…"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={() => form.title.trim() && addTask.mutate()}
                disabled={!form.title.trim() || addTask.isPending}
                className="btn-primary flex-1"
              >
                {addTask.isPending ? 'Adding…' : 'Add task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
