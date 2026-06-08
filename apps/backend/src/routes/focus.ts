// focus.ts
import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../config/db'

export const focusRouter = Router()
focusRouter.use(authenticate)

focusRouter.get('/', async (req: AuthRequest, res: Response) => {
  res.json(await prisma.focusSession.findMany({ where: { userId: req.user!.id }, orderBy: { startedAt: 'desc' }, take: Number(req.query.limit||20) }))
})
focusRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { mode, workMinutes, breakMinutes } = req.body
  res.status(201).json(await prisma.focusSession.create({ data: { userId: req.user!.id, mode, workMinutes, breakMinutes, startedAt: new Date() } }))
})
focusRouter.patch('/:id/end', async (req: AuthRequest, res: Response) => {
  const { completedPomodoros, totalMinutes, taskNote } = req.body
  res.json(await prisma.focusSession.update({ where: { id: req.params.id }, data: { endedAt: new Date(), completedPomodoros, totalMinutes, taskNote } }))
})
focusRouter.get('/stats', async (req: AuthRequest, res: Response) => {
  const uid = req.user!.id
  const tod = new Date(); tod.setHours(0,0,0,0)
  const wk  = new Date(); wk.setDate(wk.getDate()-7)
  const [t,w] = await Promise.all([
    prisma.focusSession.aggregate({ where:{ userId:uid, startedAt:{gte:tod} }, _sum:{totalMinutes:true,completedPomodoros:true}, _count:true }),
    prisma.focusSession.aggregate({ where:{ userId:uid, startedAt:{gte:wk}  }, _sum:{totalMinutes:true},                          _count:true }),
  ])
  res.json({ today:{ minutes:t._sum.totalMinutes||0, pomodoros:t._sum.completedPomodoros||0, sessions:t._count }, week:{ minutes:w._sum.totalMinutes||0, sessions:w._count } })
})
