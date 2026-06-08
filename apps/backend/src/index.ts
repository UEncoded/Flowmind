import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
dotenv.config()

import { authRouter }          from './routes/auth'
import { tasksRouter }         from './routes/tasks'
import { habitsRouter }        from './routes/habits'
import { focusRouter }         from './routes/focus'
import { meetingsRouter }      from './routes/meetings'
import { analyticsRouter }     from './routes/analytics'
import { aiRouter }            from './routes/ai'
import { notificationsRouter } from './routes/notifications'
import { settingsRouter }      from './routes/settings'
import { moodRouter }          from './routes/mood'
import { subscriptionRouter }  from './routes/subscription'
import { errorHandler }        from './middleware/errorHandler'
import { startCronJobs }       from './services/cronService'

const app  = express()
const PORT = process.env.PORT || 3001

// ─── Security ────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: (process.env.FRONTEND_URL || 'http://localhost:5173').split(','),
  credentials: true,
}))

// ─── Rate limiting ───────────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — slow down.' },
}))

// ─── Body / logging ──────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ─── Health ──────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() })
})

// ─── Routes ──────────────────────────────────────────────
app.use('/api/auth',          authRouter)
app.use('/api/tasks',         tasksRouter)
app.use('/api/habits',        habitsRouter)
app.use('/api/focus',         focusRouter)
app.use('/api/meetings',      meetingsRouter)
app.use('/api/analytics',     analyticsRouter)
app.use('/api/ai',            aiRouter)
app.use('/api/notifications', notificationsRouter)
app.use('/api/settings',      settingsRouter)
app.use('/api/mood',          moodRouter)
app.use('/api/subscription',  subscriptionRouter)

// ─── Error handler ───────────────────────────────────────
app.use(errorHandler)

// ─── Start ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀  FlowMind API  →  http://localhost:${PORT}`)
  console.log(`📋  Health check  →  http://localhost:${PORT}/health\n`)
  startCronJobs()
})

export default app
