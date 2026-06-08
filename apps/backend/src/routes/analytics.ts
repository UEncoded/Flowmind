// analytics.ts
import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../config/db'
import { getAiStreak } from '../services/aiService'

export const analyticsRouter = Router()
analyticsRouter.use(authenticate)

analyticsRouter.get('/overview', async (req: AuthRequest, res: Response) => {
  const uid = req.user!.id
  const tod = new Date(); tod.setHours(0,0,0,0)
  const wk  = new Date(); wk.setDate(wk.getDate()-7)
  const [doneToday,doneWeek,focus,habits,mood,aiStreak] = await Promise.all([
    prisma.task.count({ where:{ userId:uid, status:'DONE', completedAt:{ gte:tod } } }),
    prisma.task.count({ where:{ userId:uid, status:'DONE', completedAt:{ gte:wk  } } }),
    prisma.focusSession.aggregate({ where:{ userId:uid, startedAt:{ gte:tod } }, _sum:{ totalMinutes:true } }),
    prisma.habitLog.count({ where:{ userId:uid, date:tod, completed:true } }),
    prisma.moodLog.findFirst({ where:{ userId:uid, loggedAt:{ gte:tod } }, orderBy:{ loggedAt:'desc' } }),
    getAiStreak(uid),
  ])
  res.json({ tasks:{ doneToday, doneThisWeek:doneWeek }, focus:{ minutesToday: focus._sum.totalMinutes||0 }, habits:{ completedToday:habits }, mood:mood?.mood||null, aiStreak })
})

analyticsRouter.get('/productivity', async (req: AuthRequest, res: Response) => {
  const uid = req.user!.id
  const weeks = await Promise.all(Array.from({length:5},(_,i)=>{
    const s = new Date(); s.setDate(s.getDate()-i*7-7); s.setHours(0,0,0,0)
    const e = new Date(s); e.setDate(e.getDate()+7)
    return Promise.all([
      prisma.task.count({ where:{ userId:uid, status:'DONE', completedAt:{ gte:s,lt:e } } }),
      prisma.focusSession.aggregate({ where:{ userId:uid, startedAt:{ gte:s,lt:e } }, _sum:{ totalMinutes:true } }),
      prisma.habitLog.count({ where:{ userId:uid, date:{ gte:s,lt:e }, completed:true } }),
    ]).then(([tasks,focus,habits])=>({ weekStart:s.toISOString().slice(0,10), tasksCompleted:tasks, focusMinutes:focus._sum.totalMinutes||0, habitsCompleted:habits }))
  }))
  res.json(weeks.reverse())
})

analyticsRouter.get('/heatmap', async (req: AuthRequest, res: Response) => {
  const uid = req.user!.id
  const since = new Date(); since.setDate(since.getDate()-35); since.setHours(0,0,0,0)
  const [tasks,habits,focus] = await Promise.all([
    prisma.task.findMany({ where:{ userId:uid, status:'DONE', completedAt:{ gte:since } }, select:{ completedAt:true } }),
    prisma.habitLog.findMany({ where:{ userId:uid, date:{ gte:since }, completed:true }, select:{ date:true } }),
    prisma.focusSession.findMany({ where:{ userId:uid, startedAt:{ gte:since } }, select:{ startedAt:true, totalMinutes:true } }),
  ])
  const scores = new Map<string,number>()
  tasks.forEach(t=>{ if(t.completedAt){ const k=t.completedAt.toISOString().slice(0,10); scores.set(k,(scores.get(k)||0)+2) } })
  habits.forEach(h=>{ const k=new Date(h.date).toISOString().slice(0,10); scores.set(k,(scores.get(k)||0)+1) })
  focus.forEach(f=>{ const k=f.startedAt.toISOString().slice(0,10); scores.set(k,(scores.get(k)||0)+Math.floor(f.totalMinutes/10)) })
  const result = Array.from({length:35},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-(34-i)); const k=d.toISOString().slice(0,10); const sc=scores.get(k)||0; return { date:k, score:sc, level:sc===0?0:sc<=2?1:sc<=4?2:sc<=6?3:sc<=8?4:5 as any } })
  res.json(result)
})
