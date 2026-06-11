// ─── Persona ─────────────────────────────────────────────
export type UserPersona =
  | 'remote_worker'
  | 'hybrid_worker'
  | 'onsite_worker'
  | 'student'
  | 'business_owner'
  | 'homemaker'
  | 'job_seeker'
  | 'freelancer'
  | 'other'

export const PERSONA_LABELS: Record<UserPersona, string> = {
  remote_worker:  'Remote Worker',
  hybrid_worker:  'Hybrid Worker',
  onsite_worker:  'On-site Worker',
  student:        'Student',
  business_owner: 'Business Owner',
  homemaker:      'Homemaker / Parent',
  job_seeker:     'Job Seeker',
  freelancer:     'Freelancer / Self-employed',
  other:          'Other',
}

export const PERSONA_DESCRIPTIONS: Record<UserPersona, string> = {
  remote_worker:  'Working from home or remotely',
  hybrid_worker:  'Mix of office and remote work',
  onsite_worker:  'Primarily in office, factory, or on-site',
  student:        'School, college, or university',
  business_owner: 'Running or managing a business',
  homemaker:      'Managing a household and family',
  job_seeker:     'Between jobs, seeking opportunities',
  freelancer:     'Freelance, contract, or self-employed',
  other:          'My situation is different',
}

export const MOOD_EMOJIS: Record<number, string> = {
  1: '😴', 2: '😞', 3: '😐', 4: '😊', 5: '🤩',
}

// ─── User ────────────────────────────────────────────────
export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  timezone: string
  persona?: UserPersona
  aiMode: 'APP_QUOTA' | 'BYOK'
  plan?: 'FREE' | 'PRO' | 'PREMIUM'
  planStatus?: string
  aiTrialUsed?: number
  aiTrialLimit?: number
  aiCreditsRemaining?: number
  aiCreditsTotal?: number
  createdAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ─── Tasks ───────────────────────────────────────────────
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'

export interface Task {
  id: string
  userId: string
  title: string
  description?: string
  status: TaskStatus
  priority: Priority
  category?: string
  dueDate?: string
  completedAt?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

// ─── Habits ──────────────────────────────────────────────
export interface Habit {
  id: string
  userId: string
  name: string
  description?: string
  icon: string
  color: string
  streak?: number
  isActive: boolean
  reminderTime?: string
  createdAt: string
  updatedAt: string
}