import { Router, Response } from 'express'
import { z } from 'zod'
import { v4 as uuid } from 'uuid'
import { authenticate, AuthRequest } from '../middleware/auth'
import { callAI, getAiStreak, encryptApiKey } from '../services/aiService'
import { getAiStatus } from '../services/subscriptionService'
import { prisma } from '../config/db'

export const aiRouter = Router()
aiRouter.use(authenticate)

const chatSchema = z.object({
  message:   z.string().min(1).max(4000),
  sessionId: z.string().optional(),
  context:   z.string().optional(),
  history:   z.array(z.object({ role: z.enum(['user','assistant']), content: z.string() })).optional(),
})

aiRouter.post('/chat', async (req: AuthRequest, res: Response) => {
  try {
    const body      = chatSchema.parse(req.body)
    const sessionId = body.sessionId || uuid()

    const result = await callAI({
      userId:    req.user!.id,
      messages:  [...(body.history || []), { role: 'user', content: body.message }],
      context:   body.context,
      sessionId,
    })

    res.json({ sessionId, content: result.content, mode: result.mode, tokensUsed: result.tokensUsed })

  } catch (err: any) {
    const code = err.code || err.message
    if (['NOT_PAID', 'TRIAL_EXHAUSTED', 'CREDITS_EXHAUSTED'].includes(code)) {
      return res.status(402).json({
        error:   err.userMessage || err.message,
        code,
        action:  code === 'CREDITS_EXHAUSTED' ? 'SHOW_CREDITS_EMPTY' : 'SHOW_UPGRADE_PROMPT',
      })
    }
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message })
    console.error('AI error:', err)
    res.status(500).json({ error: 'AI request failed. Please try again.' })
  }
})

aiRouter.get('/status', async (req: AuthRequest, res: Response) => {
  const status = await getAiStatus(req.user!.id)
  res.json(status)
})
aiRouter.get('/streak', async (req: AuthRequest, res: Response) => res.json({ streak: await getAiStreak(req.user!.id) }))

aiRouter.get('/sessions', async (req: AuthRequest, res: Response) => {
  const sessions = await prisma.aiMessage.groupBy({ by:['sessionId'], where:{ userId:req.user!.id, role:'user' }, _count:true, _max:{ createdAt:true }, orderBy:{ _max:{ createdAt:'desc' } }, take:20 })
  res.json(sessions)
})

aiRouter.get('/history/:sessionId', async (req: AuthRequest, res: Response) => {
  res.json(await prisma.aiMessage.findMany({ where:{ userId:req.user!.id, sessionId:req.params.sessionId }, orderBy:{ createdAt:'asc' } }))
})

aiRouter.put('/settings', async (req: AuthRequest, res: Response) => {
  const { apiKey, mode } = req.body
  if (mode==='BYOK'&&apiKey) {
    if (!apiKey.startsWith('sk-ant-')) return res.status(400).json({ error:'Invalid Anthropic API key format' })
    await prisma.user.update({ where:{ id:req.user!.id }, data:{ aiMode:'BYOK', encryptedApiKey: encryptApiKey(apiKey) } })
    return res.json({ mode:'BYOK', message:'API key saved securely' })
  }
  if (mode==='APP_QUOTA') {
    await prisma.user.update({ where:{ id:req.user!.id }, data:{ aiMode:'APP_QUOTA', encryptedApiKey:null } })
    return res.json({ mode:'APP_QUOTA' })
  }
  res.status(400).json({ error:'Invalid request' })
})

aiRouter.delete('/key', async (req: AuthRequest, res: Response) => {
  await prisma.user.update({ where:{ id:req.user!.id }, data:{ aiMode:'APP_QUOTA', encryptedApiKey:null } })
  res.json({ message:'API key removed' })
})
