import Anthropic from '@anthropic-ai/sdk'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { prisma } from '../config/db'
import { checkAiAccess, deductAiCredit } from './subscriptionService'

const ALGO = 'aes-256-gcm'
const KEY  = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

export function encryptApiKey(text: string): string {
  const iv     = randomBytes(16)
  const cipher = createCipheriv(ALGO, KEY, iv)
  const enc    = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag    = cipher.getAuthTag()
  return [iv.toString('hex'), tag.toString('hex'), enc.toString('hex')].join(':')
}

export function decryptApiKey(ciphertext: string): string {
  const [ivHex, tagHex, encHex] = ciphertext.split(':')
  const decipher = createDecipheriv(ALGO, KEY, Buffer.from(ivHex, 'hex'))
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8')
}


// ─── Persona-aware system prompt ─────────────────────────
function buildSystemPrompt(persona: string): string {
  const personaContexts: Record<string, string> = {
    remote_worker:   'The user is a remote worker managing work from home. They often deal with isolation, blurred work-life boundaries, async communication, and staying focused without a traditional office structure.',
    hybrid_worker:   'The user works a mix of remote and in-office days. Help them navigate context-switching, sync days vs async days, and maintaining consistent routines across different environments.',
    onsite_worker:   'The user works primarily on-site (office, factory, clinic, etc.). Their schedule is more fixed. Focus on maximising productivity during work hours, breaks, and making the most of time outside work.',
    student:         'The user is a student. Help them with study schedules, assignment deadlines, exam prep, balancing coursework with personal life, and building good academic habits.',
    business_owner:  'The user runs or manages a business. They juggle multiple responsibilities: team management, client work, finances, growth. Help them prioritise strategically and avoid burnout.',
    homemaker:       'The user manages a household and family. Help them organise domestic tasks, family schedules, personal goals, and carve out time for self-care and personal development.',
    job_seeker:      'The user is looking for work. Help them structure their job search, track applications, prepare for interviews, stay motivated, and maintain a productive daily routine despite uncertainty.',
    freelancer:      'The user is self-employed or freelances. Help them manage client work, set their own deadlines, track projects, handle income variability, and maintain discipline without a boss.',
    other:           'The user has a unique situation. Be flexible and adapt to their context.',
  }

  return `You are FlowMind AI, a warm and practical personal productivity assistant.

User context: ${personaContexts[persona] || personaContexts['other']}

Your role:
- Give concise, actionable advice tailored to this user's actual lifestyle
- Help with task prioritisation, time management, focus, habits, meeting prep, and wellness
- Be encouraging without being patronising — treat the user as a capable adult
- When asked to summarise meetings: extract key decisions, action items (with owner), and next steps
- Use bullet points for lists, but keep overall tone conversational
- If you don't have enough context, ask one focused question rather than making assumptions

Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
}

export interface AiCallOptions {
  userId: string
  persona?: string
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  systemPrompt?: string
  context?: string
  sessionId?: string
}

export async function callAI(options: AiCallOptions) {
  const { userId, messages, context, sessionId } = options

  // 1. Check access — enforces all plan/credit/trial rules
  const access = await checkAiAccess(userId)
  if (!access.allowed) {
    const err: any = new Error(access.reason)
    err.code        = access.reason
    err.userMessage = access.message
    throw err
  }

  // 2. Get user details
  const user = await prisma.user.findUnique({
    where:  { id: userId },
    select: { aiMode: true, encryptedApiKey: true, persona: true },
  })
  if (!user) throw new Error('User not found')

  // 3. Resolve API key
  let apiKey: string
  if (access.mode === 'BYOK' && user.encryptedApiKey) {
    apiKey = decryptApiKey(user.encryptedApiKey)
  } else {
    apiKey = process.env.ANTHROPIC_API_KEY!
    if (!apiKey) throw new Error('AI is not configured on this server yet.')
  }

  // 4. Call Claude
  const client   = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system:     options.systemPrompt || buildSystemPrompt(user.persona),
    messages,
  })

  const content    = response.content.filter(b => b.type === 'text').map(b => (b as any).text).join('')
  const tokensUsed = response.usage.input_tokens + response.usage.output_tokens

  // 5. Deduct credit or increment trial counter
  await deductAiCredit(userId, access.mode)

  // 6. Save message history
  if (sessionId) {
    const last = messages[messages.length - 1]
    await prisma.aiMessage.createMany({
      data: [
        { userId, sessionId, role: last.role,   content: last.content, context: context ?? null },
        { userId, sessionId, role: 'assistant', content,               context: context ?? null },
      ],
    })
  }

  // 7. Log usage
  await prisma.aiUsageLog.create({
    data: { userId, mode: user.aiMode, tokens: tokensUsed, date: new Date() },
  })

  return { content, mode: access.mode, tokensUsed }
}

export async function getAiStreak(userId: string): Promise<number> {
  const logs = await prisma.aiUsageLog.findMany({
    where: { userId }, select: { date: true }, orderBy: { date: 'desc' }, distinct: ['date'], take: 365,
  })
  if (!logs.length) return 0
  let streak = 0
  const cursor = new Date(); cursor.setHours(0, 0, 0, 0)
  for (const log of logs) {
    const d = new Date(log.date); d.setHours(0, 0, 0, 0)
    if (Math.floor((cursor.getTime() - d.getTime()) / 86400000) === streak) streak++
    else break
  }
  return streak
}
