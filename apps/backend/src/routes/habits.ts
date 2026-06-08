import { Router, Response } from 'express'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../config/db'

export const habitsRouter = Router()
habitsRouter.use(authenticate)

const habitSchema = z.object({
  name:         z.string().min(1).max(100),
  description:  z.string().optional(),
  icon:         z.string().optional(),
  color:        z.string().optional(),
  frequency:    z.enum(['DAILY','WEEKLY','CUSTOM']).optional(),
  targetDays:   z.array(z.number().int().min(1).max(7)).optional(),
  reminderTime: z.string().optional(),
})

async function streak(habitId: string, userId: string): Promise<number> {
  const logs = await prisma.habitLog.findMany({
    where: { habitId, userId, completed: true }, orderBy: { date: 'desc' }, select: { date: true },
  })
  if (!logs.length) return 0
  let s = 0, cur = new Date(); cur.setHours(0,0,0,0)
  for (const l of logs) {
    const d = new Date(l.date); d.setHours(0,0,0,0)
    if (Math.floor((cur.getTime()-d.getTime())/86400000) === s) { s++; cur = d } else break
  }
  return s
}

habitsRouter.get('/', async (req: AuthRequest, res: Response) => {
  const habits = await prisma.habit.findMany({ where: { userId: req.user!.id, isActive: true }, orderBy: { order: 'asc' } })
  const out = await Promise.all(habits.map(async (h) => ({ ...h, streak: await streak(h.id, req.user!.id) })))
  res.json(out)
})

habitsRouter.get('/today', async (req: AuthRequest, res: Response) => {
  const today = new Date(); today.setHours(0,0,0,0)
  const [habits, logs] = await Promise.all([
    prisma.habit.findMany({ where: { userId: req.user!.id, isActive: true } }),
    prisma.habitLog.findMany({ where: { userId: req.user!.id, date: today } }),
  ])
  const map = new Map(logs.map((l) => [l.habitId, l]))
  res.json(habits.map((h) => ({ ...h, completedToday: map.get(h.id)?.completed ?? false, streak: 0 })))
})

habitsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = habitSchema.parse(req.body)
    const habit = await prisma.habit.create({ data: { ...body, userId: req.user!.id } })
    res.status(201).json(habit)
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

habitsRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const ex = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.user!.id } })
  if (!ex) return res.status(404).json({ error: 'Habit not found' })
  const body = habitSchema.partial().parse(req.body)
  res.json(await prisma.habit.update({ where: { id: req.params.id }, data: body }))
})

habitsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const ex = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.user!.id } })
  if (!ex) return res.status(404).json({ error: 'Habit not found' })
  await prisma.habit.update({ where: { id: req.params.id }, data: { isActive: false } })
  res.json({ message: 'Archived' })
})

habitsRouter.post('/:id/log', async (req: AuthRequest, res: Response) => {
  const { date, completed = true, note } = req.body
  const d = date ? new Date(date) : new Date(); d.setHours(0,0,0,0)
  const ex = await prisma.habit.findFirst({ where: { id: req.params.id, userId: req.user!.id } })
  if (!ex) return res.status(404).json({ error: 'Habit not found' })
  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: req.params.id, date: d } },
    create: { habitId: req.params.id, userId: req.user!.id, date: d, completed, note },
    update: { completed, note },
  })
  res.json({ log, streak: await streak(req.params.id, req.user!.id) })
})

habitsRouter.get('/:id/logs', async (req: AuthRequest, res: Response) => {
  const days = Number(req.query.days || 30)
  const since = new Date(); since.setDate(since.getDate()-days); since.setHours(0,0,0,0)
  res.json(await prisma.habitLog.findMany({
    where: { habitId: req.params.id, userId: req.user!.id, date: { gte: since } }, orderBy: { date: 'asc' },
  }))
})
