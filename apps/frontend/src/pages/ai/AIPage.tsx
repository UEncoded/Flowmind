import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, Key, RefreshCw, Flame, Zap, Lock, Trash2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'
import { PERSONA_LABELS, type UserPersona } from '@flowmind/shared'
import { v4 as uuid } from 'uuid'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  ts: Date
}

const QUICK_PROMPTS: Record<string, string[]> = {
  remote_worker:  ['How do I beat WFH isolation?','Set me a focused 2-hour work block','Write my async standup update'],
  student:        ['Help me plan my study schedule','I have 3 exams this week — prioritise','Explain the Pomodoro technique'],
  business_owner: ['Prioritise my business tasks today','Write a 15-min leadership agenda','How do I avoid decision fatigue?'],
  homemaker:      ['Plan my week around school pickups','Help me meal plan for 5 days','How do I find time for myself?'],
  job_seeker:     ['Structure my job search routine','Help me track my applications','Motivate me — I've had 10 rejections'],
  freelancer:     ['Help me invoice and track clients','Set my rates for a new project','How do I find deep work time?'],
}

const DEFAULT_PROMPTS = [
  'Prioritise my tasks for today',
  'Give me a deep work strategy',
  'Help me plan my week',
  'I'm feeling overwhelmed — help',
]

export default function AIPage() {
  const { user, updateUser }       = useAuthStore()
  const [messages, setMessages]    = useState<Message[]>([])
  const [input,    setInput]       = useState('')
  const [sessionId]                = useState(uuid)
  const [showKey,  setShowKey]     = useState(false)
  const [apiKey,   setApiKey]      = useState('')
  const endRef    = useRef<HTMLDivElement>(null)
  const textaRef  = useRef<HTMLTextAreaElement>(null)
  const qc        = useQueryClient()

  const persona    = (user?.persona || 'other') as UserPersona
  const prompts    = QUICK_PROMPTS[persona] || DEFAULT_PROMPTS
  const isBYOK     = user?.aiMode === 'BYOK'

  const { data: quota }  = useQuery({ queryKey:['ai-quota'],  queryFn:()=>axios.get('/api/ai/quota').then(r=>r.data),  refetchInterval:30_000 })
  const { data: streak } = useQuery({ queryKey:['ai-streak'], queryFn:()=>axios.get('/api/ai/streak').then(r=>r.data) })

  const chat = useMutation({
    mutationFn: (msg: string) =>
      axios.post('/api/ai/chat', { message:msg, sessionId, context:'ai-page', history: messages.slice(-8).map(m=>({role:m.role,content:m.content})) }).then(r=>r.data),
    onMutate: (msg) => {
      setMessages(p=>[...p, { id:uuid(), role:'user', content:msg, ts:new Date() }])
      setInput('')
    },
    onSuccess: (data) => {
      setMessages(p=>[...p, { id:uuid(), role:'assistant', content:data.content, ts:new Date() }])
      qc.invalidateQueries({ queryKey:['ai-quota']  })
      qc.invalidateQueries({ queryKey:['ai-streak'] })
    },
    onError: (e:any) => {
      if (e.response?.data?.code === 'QUOTA_EXCEEDED') {
        toast.error('Daily quota reached — add your API key for unlimited access', { duration:5000 })
        setShowKey(true)
      } else {
        toast.error('AI request failed. Try again.')
      }
    },
  })

  const saveKey = useMutation({
    mutationFn: (key:string) => axios.put('/api/ai/settings', { mode:'BYOK', apiKey:key }).then(r=>r.data),
    onSuccess: () => { toast.success('Unlimited access unlocked!'); updateUser({ aiMode:'BYOK' }); setShowKey(false); setApiKey(''); qc.invalidateQueries({ queryKey:['ai-quota'] }) },
    onError:   (e:any) => toast.error(e.response?.data?.error || 'Invalid key'),
  })

  const removeKey = useMutation({
    mutationFn: ()=>axios.delete('/api/ai/key').then(r=>r.data),
    onSuccess: ()=>{ toast.success('Switched to free tier'); updateUser({ aiMode:'APP_QUOTA' }); qc.invalidateQueries({ queryKey:['ai-quota'] }) },
  })

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  const send = () => { const m=input.trim(); if(!m||chat.isPending) return; chat.mutate(m) }
  const onKey = (e:React.KeyboardEvent) => { if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send() } }

  const quotaRemaining = quota?.remaining ?? 10
  const quotaPct       = quota ? (quota.used/quota.limit)*100 : 0

  return (
    <div className="flex h-[calc(100dvh-53px)] lg:h-[calc(100dvh-41px)]">

      {/* ─── Left panel ──────────────────────────────────── */}
      <aside className="hidden xl:flex flex-col w-64 border-r border-border-faint bg-bg-subtle overflow-y-auto p-4 gap-4">

        {/* Streak */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={15} className="text-amber" />
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">Daily Streak</span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-display font-bold text-3xl text-text-primary">{streak?.streak||0}</span>
            <span className="text-text-muted text-sm">days</span>
          </div>
          <div className="flex gap-1 mt-2">
            {Array.from({length:7}).map((_,i)=>(
              <div key={i} className={clsx('flex-1 h-1 rounded-full', i<(streak?.streak||0)?'bg-amber':'bg-border-subtle')}/>
            ))}
          </div>
          <p className="text-xs text-text-muted mt-2 leading-relaxed">
            {streak?.streak > 0 ? `${streak.streak}-day streak! Keep it going.` : 'Start chatting to begin your streak.'}
          </p>
        </div>

        {/* Mode / Quota */}
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            {isBYOK ? <Key size={14} className="text-teal"/> : <Zap size={14} className="text-accent"/>}
            <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{isBYOK?'Your API Key':'Free Tier'}</span>
          </div>
          {isBYOK ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-teal animate-pulse-dot"/>
                <span className="text-sm text-teal font-medium">Unlimited access</span>
              </div>
              <p className="text-xs text-text-muted mb-3 leading-relaxed">Billed to your Anthropic account.</p>
              <button onClick={()=>removeKey.mutate()} className="btn-ghost w-full text-xs h-8 text-text-muted">Remove key</button>
            </>
          ) : (
            <>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-muted">Requests today</span>
                <span className="font-medium text-text-primary">{quota?.used||0}/{quota?.limit||10}</span>
              </div>
              <div className="h-1.5 bg-border-subtle rounded-full overflow-hidden mb-3">
                <div className="h-full rounded-full transition-all" style={{width:`${quotaPct}%`, background: quotaPct>80?'#ff6b6b':'#6c63ff'}}/>
              </div>
              <p className="text-xs text-text-muted mb-3">{quotaRemaining} left today · resets midnight</p>
              <button onClick={()=>setShowKey(!showKey)} className="w-full text-xs py-2 rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition-colors flex items-center justify-center gap-1.5">
                <Key size={11}/> Add API key for unlimited
              </button>
            </>
          )}
        </div>

        {/* BYOK form */}
        {showKey && !isBYOK && (
          <div className="card p-4 border-accent/20 animate-fade-up">
            <div className="flex items-center gap-2 mb-2">
              <Lock size={13} className="text-accent"/>
              <span className="text-sm font-medium text-text-primary">Anthropic API key</span>
            </div>
            <p className="text-xs text-text-muted mb-3 leading-relaxed">
              Get yours at <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-accent underline">console.anthropic.com</a>. Stored encrypted — never shared.
            </p>
            <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-…" className="input-sm mb-2"/>
            <button onClick={()=>saveKey.mutate(apiKey)} disabled={!apiKey||saveKey.isPending} className="btn-primary w-full h-9 text-xs">
              {saveKey.isPending?'Saving…':'Save key & unlock unlimited'}
            </button>
          </div>
        )}

        {/* Persona prompts */}
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            For you · {PERSONA_LABELS[persona]}
          </p>
          <div className="space-y-1.5">
            {prompts.map(p=>(
              <button key={p} onClick={()=>{ setInput(p); textaRef.current?.focus() }} className="w-full text-left text-xs px-3 py-2 rounded-lg bg-bg-card border border-border-subtle text-text-secondary hover:border-accent/30 hover:text-text-primary transition-all leading-relaxed">
                {p}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* ─── Chat area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-faint flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:'linear-gradient(135deg,#6c63ff,#00d4aa)'}}>
              <Sparkles size={15} className="text-white"/>
            </div>
            <div>
              <h1 className="font-display font-semibold text-[15px] text-text-primary">AI Assistant</h1>
              <p className="text-xs text-text-muted">{isBYOK?'Unlimited access':'Free tier · '}{!isBYOK&&`${quotaRemaining} requests left`}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {streak?.streak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 bg-amber/10 border border-amber/20 rounded-pill">
                <Flame size={12} className="text-amber"/>
                <span className="text-xs font-semibold text-amber">{streak.streak}d</span>
              </div>
            )}
            <button onClick={()=>setMessages([])} className="btn-icon w-8 h-8" title="New chat"><RefreshCw size={14}/></button>
            {messages.length>0 && (
              <button onClick={()=>setMessages([])} className="btn-icon w-8 h-8 text-coral/70 hover:text-coral" title="Clear chat"><Trash2 size={14}/></button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-14 h-14 rounded-2xl mb-4 flex items-center justify-center" style={{background:'linear-gradient(135deg,#6c63ff18,#00d4aa18)'}}>
                <Sparkles size={24} className="text-accent"/>
              </div>
              <h2 className="font-display font-bold text-lg text-text-primary mb-2">How can I help you today?</h2>
              <p className="text-text-muted text-sm max-w-xs mb-6 leading-relaxed">
                I'm personalised for <span className="text-text-secondary font-medium">{PERSONA_LABELS[persona]}</span>. Ask me anything.
              </p>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 w-full max-w-sm">
                {prompts.slice(0,4).map(p=>(
                  <button key={p} onClick={()=>chat.mutate(p)} className="text-left text-xs px-3 py-2.5 rounded-xl bg-bg-card border border-border-subtle text-text-secondary hover:border-accent/30 hover:text-text-primary transition-all leading-snug">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(m=>(
            <div key={m.id} className={clsx('flex gap-3 max-w-2xl', m.role==='user'&&'ml-auto flex-row-reverse')}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 text-white" style={{background: m.role==='assistant'?'linear-gradient(135deg,#6c63ff,#00d4aa)':'linear-gradient(135deg,#6c63ff,#f72585)'}}>
                {m.role==='assistant'?<Sparkles size={13}/>:(user?.name?.[0]||'U')}
              </div>
              <div className={clsx('rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[85%]', m.role==='assistant'?'bg-bg-card border border-border-subtle text-text-primary':'text-white')} style={m.role==='user'?{background:'#6c63ff'}:{}}>
                {m.content.split('\n').map((line,i)=><p key={i} className={i>0?'mt-1.5':''}>{line}</p>)}
                <p className={clsx('text-[10px] mt-2', m.role==='assistant'?'text-text-muted':'text-white/50')}>
                  {m.ts.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                </p>
              </div>
            </div>
          ))}

          {chat.isPending && (
            <div className="flex gap-3 max-w-2xl">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0" style={{background:'linear-gradient(135deg,#6c63ff,#00d4aa)'}}>
                <Sparkles size={13}/>
              </div>
              <div className="bg-bg-card border border-border-subtle rounded-2xl px-4 py-3.5 flex gap-1.5 items-center">
                {[0,1,2].map(i=><div key={i} className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" style={{animationDelay:`${i*0.2}s`}}/>)}
              </div>
            </div>
          )}
          <div ref={endRef}/>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-border-faint p-3 bg-bg-base">
          {!isBYOK && quotaRemaining === 0 && (
            <div className="mb-2 px-3 py-2 bg-coral/10 border border-coral/20 rounded-lg text-xs text-coral flex items-center justify-between gap-2">
              <span>Daily quota reached.</span>
              <button onClick={()=>setShowKey(true)} className="underline font-medium whitespace-nowrap">Add API key</button>
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={textaRef}
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask anything…"
              rows={1}
              className="flex-1 bg-bg-muted border border-border-subtle rounded-xl px-3.5 py-3 text-text-primary text-sm placeholder-text-disabled focus:outline-none focus:border-accent resize-none transition-colors leading-relaxed"
              style={{minHeight:'44px', maxHeight:'120px'}}
              onInput={e=>{ const t=e.target as HTMLTextAreaElement; t.style.height='auto'; t.style.height=Math.min(t.scrollHeight,120)+'px' }}
            />
            <button onClick={send} disabled={!input.trim()||chat.isPending||(!isBYOK&&quotaRemaining===0)} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40 active:scale-95" style={{background:'#6c63ff'}}>
              <Send size={15} className="text-white"/>
            </button>
          </div>
          <p className="text-[10px] text-text-disabled mt-1.5 text-center">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
