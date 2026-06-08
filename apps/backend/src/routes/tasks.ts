// ─── tasks.ts ─────────────────────────────────────────────────────────────────
import { Router, Response } from 'express'
import { z } from 'zod'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../config/db'

export const tasksRouter = Router()
tasksRouter.use(authenticate)

const taskSchema = z.object({
  title:       z.string().min(1).max(300),
  description: z.string().optional(),
  status:      z.enum(['TODO','IN_PROGRESS','DONE','CANCELLED']).optional(),
  priority:    z.enum(['LOW','MEDIUM','HIGH','URGENT']).optional(),
  category:    z.string().optional(),
  dueDate:     z.string().datetime().optional().nullable(),
  tags:        z.array(z.string()).optional(),
  parentId:    z.string().optional().nullable(),
})

tasksRouter.get('/', async (req: AuthRequest, res: Response) => {
  const { status, priority, category, search } = req.query
  const tasks = await prisma.task.findMany({
    where: {
      userId: req.user!.id, parentId: null,
      ...(status   ? { status:   status as any }                                       : {}),
      ...(priority ? { priority: priority as any }                                     : {}),
      ...(category ? { category: category as string }                                  : {}),
      ...(search   ? { title: { contains: search as string, mode: 'insensitive' } }   : {}),
    },
    include: { subtasks: true },
    orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
  })
  res.json(tasks)
})

tasksRouter.get('/today', async (req: AuthRequest, res: Response) => {
  const s = new Date(); s.setHours(0,0,0,0)
  const e = new Date(); e.setHours(23,59,59,999)
  const tasks = await prisma.task.findMany({
    where: { userId: req.user!.id, OR: [{ dueDate: { gte: s, lte: e } }, { status: 'IN_PROGRESS' }] },
    orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
  })
  res.json(tasks)
})

tasksRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = taskSchema.parse(req.body)
    const task = await prisma.task.create({ data: { ...body, userId: req.user!.id, dueDate: body.dueDate ? new Date(body.dueDate) : null } })
    res.status(201).json(task)
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

tasksRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const ex = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user!.id } })
  if (!ex) return res.status(404).json({ error: 'Task not found' })
  const body = taskSchema.partial().parse(req.body)
  const task = await prisma.task.update({
    where: { id: req.params.id },
    data: { ...body, dueDate: body.dueDate ? new Date(body.dueDate) : body.dueDate, completedAt: body.status === 'DONE' ? new Date() : body.status ? null : undefined },
  })
  res.json(task)
})

tasksRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const ex = await prisma.task.findFirst({ where: { id: req.params.id, userId: req.user!.id } })
  if (!ex) return res.status(404).json({ error: 'Task not found' })
  await prisma.task.delete({ where: { id: req.params.id } })
  res.json({ message: 'Deleted' })
})
