import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../config/db'

export const notificationsRouter = Router()
notificationsRouter.use(authenticate)

notificationsRouter.get('/', async (req: AuthRequest, res: Response) => {
  res.json(await prisma.notification.findMany({ where:{ userId:req.user!.id }, orderBy:{ sentAt:'desc' }, take:50 }))
})
notificationsRouter.get('/unread-count', async (req: AuthRequest, res: Response) => {
  res.json({ count: await prisma.notification.count({ where:{ userId:req.user!.id, read:false } }) })
})
notificationsRouter.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({ where:{ id:req.params.id, userId:req.user!.id }, data:{ read:true } })
  res.json({ message:'Marked as read' })
})
notificationsRouter.post('/read-all', async (req: AuthRequest, res: Response) => {
  await prisma.notification.updateMany({ where:{ userId:req.user!.id, read:false }, data:{ read:true } })
  res.json({ message:'All read' })
})
