import { Router, Response } from 'express'
import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { authenticate, AuthRequest } from '../middleware/auth'
import { prisma } from '../config/db'
import { callAI } from '../services/aiService'

export const meetingsRouter = Router()
meetingsRouter.use(authenticate)

const schema = z.object({
  title:       z.string().min(1).max(200),
  description: z.string().optional(),
  startTime:   z.string().datetime(),
  endTime:     z.string().datetime(),
  location:    z.string().optional(),
  meetingUrl:  z.string().url().optional().or(z.literal('')),
  attendees:   z.array(z.string().email()).optional(),
})

meetingsRouter.get('/', async (req: AuthRequest, res: Response) => {
  const where: any = { userId: req.user!.id }
  if (req.query.upcoming) where.startTime = { gte: new Date() }
  res.json(await prisma.meeting.findMany({ where, orderBy: { startTime: 'asc' } }))
})

meetingsRouter.get('/today', async (req: AuthRequest, res: Response) => {
  const s = new Date(); s.setHours(0,0,0,0)
  const e = new Date(); e.setHours(23,59,59,999)
  res.json(await prisma.meeting.findMany({ where:{ userId:req.user!.id, startTime:{gte:s,lte:e} }, orderBy:{ startTime:'asc' } }))
})

meetingsRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const body = schema.parse(req.body)
    res.status(201).json(await prisma.meeting.create({ data: { ...body, userId: req.user!.id, startTime: new Date(body.startTime), endTime: new Date(body.endTime) } }))
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0].message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

meetingsRouter.patch('/:id', async (req: AuthRequest, res: Response) => {
  const ex = await prisma.meeting.findFirst({ where:{ id:req.params.id, userId:req.user!.id } })
  if (!ex) return res.status(404).json({ error: 'Meeting not found' })
  const body = schema.partial().parse(req.body)
  res.json(await prisma.meeting.update({ where:{ id:req.params.id }, data:{ ...body, startTime: body.startTime?new Date(body.startTime):undefined, endTime: body.endTime?new Date(body.endTime):undefined } }))
})

meetingsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const ex = await prisma.meeting.findFirst({ where:{ id:req.params.id, userId:req.user!.id } })
  if (!ex) return res.status(404).json({ error: 'Meeting not found' })
  await prisma.meeting.delete({ where:{ id:req.params.id } })
  res.json({ message: 'Deleted' })
})

meetingsRouter.post('/:id/summarize', async (req: AuthRequest, res: Response) => {
  const meeting = await prisma.meeting.findFirst({ where:{ id:req.params.id, userId:req.user!.id } })
  if (!meeting) return res.status(404).json({ error: 'Meeting not found' })
  const transcript = req.body.transcript || meeting.transcript
  if (!transcript) return res.status(400).json({ error: 'No transcript provided' })
  try {
    const result = await callAI({
      userId: req.user!.id,
      messages: [{ role:'user', content:`Summarise this meeting. Extract: 1) Key decisions, 2) Action items with owners, 3) Next steps.\n\nTranscript:\n${transcript}` }],
      context: 'meeting-summary', sessionId: uuid(),
    })
    const updated = await prisma.meeting.update({ where:{ id:meeting.id }, data:{ transcript, aiSummary: result.content } })
    res.json({ summary: result.content, meeting: updated })
  } catch (e:any) {
    if (e.message==='QUOTA_EXCEEDED') return res.status(429).json({ error:'AI quota exceeded', code:'QUOTA_EXCEEDED' })
    res.status(500).json({ error: 'Summarisation failed' })
  }
})
