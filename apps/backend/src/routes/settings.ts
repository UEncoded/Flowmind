import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../config/db'

export const settingsRouter = Router()
settingsRouter.use(authenticate)

settingsRouter.get('/', async (req: AuthRequest, res: Response) => {
  res.json(await prisma.userSettings.findUnique({ where:{ userId:req.user!.id } }))
})
settingsRouter.put('/', async (req: AuthRequest, res: Response) => {
  res.json(await prisma.userSettings.upsert({ where:{ userId:req.user!.id }, update:req.body, create:{ userId:req.user!.id, ...req.body } }))
})
settingsRouter.put('/profile', async (req: AuthRequest, res: Response) => {
  const { name, timezone, avatarUrl, persona } = req.body
  res.json(await prisma.user.update({ where:{ id:req.user!.id }, data:{ name, timezone, avatarUrl, persona }, select:{ id:true, email:true, name:true, timezone:true, avatarUrl:true, persona:true } }))
})
