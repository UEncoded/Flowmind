// mood.ts
import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../config/db'

export const moodRouter = Router()
moodRouter.use(authenticate)

moodRouter.get('/', async (req: AuthRequest, res: Response) => {
  const days = Number(req.query.days||7)
  const since = new Date(); since.setDate(since.getDate()-days)
  res.json(await prisma.moodLog.findMany({ where:{ userId:req.user!.id, loggedAt:{ gte:since } }, orderBy:{ loggedAt:'asc' } }))
})

moodRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { mood, energy, stress, note } = req.body
  if (!mood||mood<1||mood>5) return res.status(400).json({ error:'mood must be 1–5' })
  res.status(201).json(await prisma.moodLog.create({ data:{ userId:req.user!.id, mood, energy, stress, note } }))
})
