import cron from 'node-cron'
import { prisma } from '../config/db'

export function startCronJobs() {
  // Meeting reminders — every minute
  cron.schedule('* * * * *', async () => {
    const in15 = new Date(Date.now() + 15*60000)
    const in16 = new Date(Date.now() + 16*60000)
    const meetings = await prisma.meeting.findMany({ where:{ startTime:{ gte:in15, lte:in16 }, status:'SCHEDULED', reminderSent:false } })
    for (const m of meetings) {
      await prisma.notification.create({ data:{ userId:m.userId, type:'meeting_reminder', title:`Meeting in 15 min`, body:`"${m.title}" starts soon.`, data:{ meetingId:m.id } } })
      await prisma.meeting.update({ where:{ id:m.id }, data:{ reminderSent:true } })
    }
  })

  // Daily task digest — 8am
  cron.schedule('0 8 * * *', async () => {
    const s = new Date(); s.setHours(0,0,0,0)
    const e = new Date(); e.setHours(23,59,59,999)
    const tasks = await prisma.task.findMany({ where:{ dueDate:{ gte:s, lte:e }, status:{ in:['TODO','IN_PROGRESS'] } }, select:{ userId:true, title:true, id:true } })
    const byUser = new Map<string, typeof tasks>()
    tasks.forEach(t=>{ const a=byUser.get(t.userId)||[]; a.push(t); byUser.set(t.userId,a) })
    for (const [userId, ts] of byUser) {
      await prisma.notification.create({ data:{ userId, type:'task_due', title:`${ts.length} task${ts.length>1?'s':''} due today`, body:ts.slice(0,3).map(t=>t.title).join(', '), data:{ taskIds:ts.map(t=>t.id) } } })
    }
  })

  // Habit reminders — every 15 min
  cron.schedule('*/15 * * * *', async () => {
    const now = new Date()
    const timeStr = `${String(now.getHours()).padStart(2,'0')}:${String(Math.round(now.getMinutes()/15)*15).padStart(2,'0')}`
    const habits = await prisma.habit.findMany({ where:{ reminderTime:timeStr, isActive:true } })
    for (const h of habits) {
      const today = new Date(); today.setHours(0,0,0,0)
      const done = await prisma.habitLog.findUnique({ where:{ habitId_date:{ habitId:h.id, date:today } } })
      if (!done) await prisma.notification.create({ data:{ userId:h.userId, type:'habit_reminder', title:`Reminder: ${h.name}`, body:`Don't break your streak! Log "${h.name}" now.`, data:{ habitId:h.id } } })
    }
  })

  console.log('⏰ Cron jobs started')
  // Ping database every 3 days to prevent Supabase free tier pause
 cron.schedule('0 6 */3 * *', async () => {
  await prisma.user.count()
  console.log('✅ Supabase keep-alive ping sent')
})
}
