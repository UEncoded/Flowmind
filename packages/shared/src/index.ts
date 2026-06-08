// ─── USER ─────────────────────────────────────────────────────────────────────

export type AiMode = 'APP_QUOTA' | 'BYOK'

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
  timezone: string
  persona?: UserPersona
  aiMode: AiMode
  // Legacy — kept for backwards compat
  aiDailyQuota?: number
  // Plan & subscription
  plan?: 'FREE' | 'PRO' | 'PREMIUM'
  planStatus?: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'EXPIRED'
  currentPeriodEnd?: string | null
  // AI credits
  aiTrialUsed?: number
  aiTrialLimit?: number
  aiCreditsRemaining?: number
  aiCreditsTotal?: number
  createdAt: string
}

export interface UserSettings {
  id: string
  userId: string
  theme: 'dark' | 'light'
  pomodoroWork: number
  pomodoroBreak: number
  pomodoroSessions: number
  notifEmail: boolean
  notifPush: boolean
  notifMeetingRemind: number
  weekStartsOn: number
  dailyGoalHours: number
  // Persona
  persona: UserPersona
}

// Who is this user? Personalises AI prompts, UI copy, and default templates
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
  remote_worker:   'Remote Worker',
  hybrid_worker:   'Hybrid Worker',
  onsite_worker:   'On-site Worker',
  student:         'Student',
  business_owner:  'Business Owner',
  homemaker:       'Homemaker / Parent',
  job_seeker:      'Job Seeker',
  freelancer:      'Freelancer / Self-employed',
  other:           'Other',
}

export const PERSONA_DESCRIPTIONS: Record<UserPersona, string> = {
  remote_worker:   'Working from home or remotely full time',
  hybrid_worker:   'Mix of office and remote days',
  onsite_worker:   'Primarily in office, factory, or on-site',
  student:         'School, college, or university',
  business_owner:  'Running or managing a business',
  homemaker:       'Managing a household and family',
  job_seeker:      'Between jobs, seeking opportunities',
  freelancer:      'Freelance, contract, or self-employed',
  other:           'My situation is different',
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  name: string
  email: string
  password: string
  timezone?: string
  persona?: UserPersona
}

export interface AuthResponse extends AuthTokens {
  user: User
}

// ─── TASKS ────────────────────────────────────────────────────────────────────

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'
export type Priority   = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Task {
  id: string
  userId: string
  title: string
  description?: string | null
  status: TaskStatus
  priority: Priority
  category?: string | null
  dueDate?: string | null
  completedAt?: string | null
  order: number
  tags: string[]
  parentId?: string | null
  subtasks?: Task[]
  createdAt: string
  updatedAt: string
}

export interface CreateTaskRequest {
  title: string
  description?: string
  status?: TaskStatus
  priority?: Priority
  category?: string
  dueDate?: string
  tags?: string[]
  parentId?: string
}

// ─── HABITS ───────────────────────────────────────────────────────────────────

export type Frequency = 'DAILY' | 'WEEKLY' | 'CUSTOM'

export interface Habit {
  id: string
  userId: string
  name: string
  description?: string | null
  icon: string
  color: string
  frequency: Frequency
  targetDays: number[]
  reminderTime?: string | null
  isActive: boolean
  order: number
  streak?: number
  completedToday?: boolean
  createdAt: string
  updatedAt: string
}

export interface HabitLog {
  id: string
  habitId: string
  userId: string
  date: string
  completed: boolean
  note?: string | null
  createdAt: string
}

// ─── FOCUS ────────────────────────────────────────────────────────────────────

export interface FocusSession {
  id: string
  userId: string
  mode: 'pomodoro' | 'deep-work' | 'ultra'
  workMinutes: number
  breakMinutes: number
  completedPomodoros: number
  totalMinutes: number
  taskNote?: string | null
  startedAt: string
  endedAt?: string | null
  createdAt: string
}

export interface FocusStats {
  today: { minutes: number; pomodoros: number; sessions: number }
  week:  { minutes: number; sessions: number }
}

// ─── MEETINGS ─────────────────────────────────────────────────────────────────

export type MeetingStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export interface Meeting {
  id: string
  userId: string
  title: string
  description?: string | null
  startTime: string
  endTime: string
  location?: string | null
  meetingUrl?: string | null
  attendees: string[]
  status: MeetingStatus
  recordingUrl?: string | null
  transcript?: string | null
  aiSummary?: string | null
  actionItems?: ActionItem[] | null
  reminderSent: boolean
  createdAt: string
  updatedAt: string
}

export interface ActionItem {
  id: string
  text: string
  assignee?: string
  done: boolean
}

// ─── MOOD ─────────────────────────────────────────────────────────────────────

export interface MoodLog {
  id: string
  userId: string
  mood: 1 | 2 | 3 | 4 | 5
  energy?: number | null
  stress?: number | null
  note?: string | null
  loggedAt: string
}

export const MOOD_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Excellent',
}

export const MOOD_EMOJIS: Record<number, string> = {
  1: '😴',
  2: '😞',
  3: '😐',
  4: '😊',
  5: '🤩',
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export interface AiMessage {
  id: string
  userId: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  context?: string | null
  createdAt: string
}

export interface AiQuota {
  used: number
  limit: number
  remaining: number
}

export interface AiChatRequest {
  message: string
  sessionId?: string
  context?: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface AiChatResponse {
  sessionId: string
  content: string
  mode: AiMode
  tokensUsed?: number
}

// ─── ANALYTICS ────────────────────────────────────────────────────────────────

export interface AnalyticsOverview {
  tasks:  { total: number; doneToday: number; doneThisWeek: number }
  focus:  { minutesToday: number }
  habits: { completedToday: number }
  mood:   number | null
  aiStreak: number
}

export interface ProductivityWeek {
  weekStart: string
  tasksCompleted: number
  focusMinutes: number
  habitsCompleted: number
}

export interface HeatmapCell {
  date: string
  score: number
  level: 0 | 1 | 2 | 3 | 4 | 5
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export interface Notification {
  id: string
  userId: string
  type: 'meeting_reminder' | 'task_due' | 'habit_reminder' | 'ai_insight' | 'system'
  title: string
  body: string
  data?: Record<string, unknown> | null
  read: boolean
  sentAt: string
}

// ─── API HELPERS ──────────────────────────────────────────────────────────────

export interface ApiError {
  error: string
  code?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
