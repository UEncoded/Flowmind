import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Demo user — remote worker
  const hash = await bcrypt.hash('demo1234', 12)
  const user = await prisma.user.upsert({
    where: { email: 'demo@flowmind.app' },
    update: {},
    create: {
      email: 'demo@flowmind.app',
      name: 'Alex Demo',
      passwordHash: hash,
      timezone: 'Africa/Lagos',
      persona: 'remote_worker',
      aiDailyQuota: 10,
      settings: { create: { dailyGoalHours: 6, pomodoroWork: 25, pomodoroBreak: 5 } },
    },
  })

  // Tasks
  await prisma.task.createMany({
    data: [
      { userId: user.id, title: 'Review Q3 project proposal', priority: 'HIGH',   status: 'TODO',        category: 'work',     tags: ['work', 'planning'] },
      { userId: user.id, title: 'Team standup notes',         priority: 'MEDIUM', status: 'IN_PROGRESS', category: 'work',     tags: ['work', 'communication'] },
      { userId: user.id, title: 'Grocery shopping',           priority: 'LOW',    status: 'TODO',        category: 'personal', tags: ['personal', 'errands'] },
      { userId: user.id, title: 'Morning exercise',           priority: 'MEDIUM', status: 'DONE',        category: 'health',   tags: ['health'] },
      { userId: user.id, title: 'Read 20 pages',              priority: 'LOW',    status: 'TODO',        category: 'personal', tags: ['learning'] },
    ],
    skipDuplicates: true,
  })

  // Habits
  await prisma.habit.createMany({
    data: [
      { userId: user.id, name: 'Morning exercise',        icon: '🏋️', color: '#00d4aa', order: 0 },
      { userId: user.id, name: 'Drink 8 glasses of water',icon: '💧', color: '#378add', order: 1 },
      { userId: user.id, name: 'Read for 30 minutes',     icon: '📚', color: '#ffd166', order: 2 },
      { userId: user.id, name: 'Meditate',                icon: '🧘', color: '#6c63ff', order: 3 },
      { userId: user.id, name: 'Journal',                 icon: '✍️', color: '#f72585', order: 4 },
    ],
    skipDuplicates: true,
  })

  // Meetings
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)
  const tomorrowEnd = new Date(tomorrow)
  tomorrowEnd.setHours(10, 30, 0, 0)

  await prisma.meeting.createMany({
    data: [
      {
        userId: user.id,
        title: 'Team Standup',
        startTime: tomorrow,
        endTime: tomorrowEnd,
        meetingUrl: 'https://meet.google.com/demo',
        attendees: ['colleague@example.com', 'manager@example.com'],
        status: 'SCHEDULED',
      },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seed complete! Demo login: demo@flowmind.app / demo1234')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
