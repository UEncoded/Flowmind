import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { prisma } from '../config/db'
import { authenticate, AuthRequest } from '../middleware/auth'

export const authRouter = Router()

const signupSchema = z.object({
  name:     z.string().min(2).max(80),
  email:    z.string().email(),
  password: z.string().min(8).max(100),
  timezone: z.string().optional(),
  persona:  z.enum([
    'remote_worker','hybrid_worker','onsite_worker','student',
    'business_owner','homemaker','job_seeker','freelancer','other',
  ]).optional(),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
})

function makeTokens(userId: string, email: string, name: string, persona: string) {
  const accessToken  = jwt.sign({ id: userId, email, name, persona }, process.env.JWT_SECRET!,         { expiresIn: process.env.JWT_EXPIRES_IN         || '15m' })
  const refreshToken = jwt.sign({ id: userId },                        process.env.JWT_REFRESH_SECRET!, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'  })
  return { accessToken, refreshToken }
}

async function saveRefresh(userId: string, token: string) {
  await prisma.refreshToken.create({
    data: { token, userId, expiresAt: new Date(Date.now() + 7 * 86_400_000) },
  })
}

// POST /api/auth/signup
authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const body = signupSchema.parse(req.body)
    if (await prisma.user.findUnique({ where: { email: body.email } }))
      return res.status(409).json({ error: 'Email already registered' })

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name:  body.name,
        passwordHash: await bcrypt.hash(body.password, 12),
        timezone: body.timezone || 'UTC',
        persona:  (body.persona || 'other') as any,
        settings: { create: {} },
      },
      select: { id: true, email: true, name: true, aiMode: true, persona: true, timezone: true },
    })

    const tokens = makeTokens(user.id, user.email, user.name, user.persona)
    await saveRefresh(user.id, tokens.refreshToken)
    res.status(201).json({ user, ...tokens })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message })
    console.error(err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: body.email } })
    if (!user || !(await bcrypt.compare(body.password, user.passwordHash)))
      return res.status(401).json({ error: 'Invalid email or password' })

    const tokens = makeTokens(user.id, user.email, user.name, user.persona)
    await saveRefresh(user.id, tokens.refreshToken)

    res.json({
      user: { id: user.id, email: user.email, name: user.name, aiMode: user.aiMode, persona: user.persona, timezone: user.timezone },
      ...tokens,
    })
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors[0].message })
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/auth/refresh
authRouter.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' })
  try {
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { id: string }
    const stored  = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.userId !== payload.id || stored.expiresAt < new Date())
      return res.status(401).json({ error: 'Invalid or expired refresh token' })

    const user = await prisma.user.findUnique({ where: { id: payload.id }, select: { id: true, email: true, name: true, persona: true } })
    if (!user) return res.status(401).json({ error: 'User not found' })

    await prisma.refreshToken.delete({ where: { token: refreshToken } })
    const tokens = makeTokens(user.id, user.email, user.name, user.persona)
    await saveRefresh(user.id, tokens.refreshToken)
    res.json(tokens)
  } catch { res.status(401).json({ error: 'Invalid refresh token' }) }
})

// POST /api/auth/logout
authRouter.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  if (req.body.refreshToken)
    await prisma.refreshToken.deleteMany({ where: { token: req.body.refreshToken } })
  res.json({ message: 'Logged out' })
})

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, name: true, avatarUrl: true, timezone: true, aiMode: true, aiDailyQuota: true, persona: true, createdAt: true, settings: true },
  })
  res.json(user)
})
