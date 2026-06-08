# FlowMind — Smart Workspace for Everyone

> One app. Every lifestyle. Organised.

FlowMind is a full-stack, AI-powered personal workspace built for **remote workers, hybrid workers, on-site workers, students, business owners, homemakers, job seekers, and freelancers**. It adapts to who you are.

---

## Monorepo Structure

```
flowmind/                          ← root (one git repo)
├── apps/
│   ├── backend/                   ← Node.js + Express + TypeScript API
│   │   ├── prisma/schema.prisma   ← PostgreSQL schema (10 tables)
│   │   ├── src/
│   │   │   ├── routes/            ← auth, tasks, habits, focus, meetings,
│   │   │   │                         analytics, ai, mood, notifications, settings
│   │   │   ├── services/          ← aiService (BYOK + quota), cronService
│   │   │   ├── middleware/        ← JWT auth, error handler
│   │   │   └── config/            ← db (Prisma), redis (ioredis)
│   │   └── .env.example
│   │
│   ├── frontend/                  ← React 18 + TypeScript + Tailwind CSS
│   │   └── src/
│   │       ├── pages/             ← Landing, Login, Signup, Dashboard,
│   │       │                         Tasks, Focus, Meetings, Habits,
│   │       │                         Analytics, Schedule, AI, Settings
│   │       ├── components/        ← AppLayout (sidebar + mobile nav)
│   │       └── store/             ← Zustand auth store
│   │
│   └── mobile/                    ← React Native + Expo (iOS + Android)
│       ├── app/                   ← Expo Router file-based navigation
│       │   ├── login.tsx
│       │   ├── signup.tsx
│       │   └── (tabs)/            ← Dashboard, Tasks, Focus, Habits, AI
│       └── src/
│           ├── store/             ← Zustand + SecureStore auth
│           └── constants/theme.ts ← Design tokens
│
└── packages/
    └── shared/                    ← TypeScript types shared by all apps
        └── src/index.ts           ← User, Task, Habit, Meeting, AI types...
```

---

## Quick Start

### Prerequisites

- Node.js >= 20
- PostgreSQL (local or [Neon](https://neon.tech) / [Railway](https://railway.app))
- Redis (local or [Upstash](https://upstash.com))
- An [Anthropic API key](https://console.anthropic.com) (for AI features)

### 1. Clone and install

```bash
git clone https://github.com/yourusername/flowmind.git
cd flowmind
npm install          # installs all workspaces at once
```

### 2. Configure environment

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env` — the key values:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/flowmind"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="run: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
JWT_REFRESH_SECRET="another long random string"
ANTHROPIC_API_KEY="sk-ant-your-key"
ENCRYPTION_KEY="run: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
FRONTEND_URL="http://localhost:5173"
```

### 3. Set up the database

```bash
npm run db:migrate   # runs prisma migrate dev
npm run db:seed      # creates demo user: demo@flowmind.app / demo1234
```

### 4. Run everything

```bash
npm run dev          # starts backend + frontend together (Turborepo)
```

Or individually:
```bash
npm run dev:backend   # → http://localhost:3001
npm run dev:frontend  # → http://localhost:5173
```

---

## Open in VS Code

Double-click **`flowmind.code-workspace`** to open the monorepo in VS Code with all folders pre-configured and recommended extensions listed.

---

## Pages & Features

| Page | Route | What it does |
|------|-------|-------------|
| Landing | `/` | Marketing — persona-aware messaging |
| Sign up | `/signup` | 2-step: account → pick your persona |
| Log in | `/login` | JWT auth with demo account |
| Dashboard | `/dashboard` | Metrics, AI insight, schedule preview, mood check |
| Tasks | `/tasks` | Full task CRUD — priority, tags, due dates, subtasks |
| Focus | `/focus` | Pomodoro timer (3 modes) + session log + AI coach |
| Meetings | `/meetings` | Schedule, record, AI transcript summaries + action items |
| Habits | `/habits` | Daily tracker, streaks, weekly grid, wellness scores |
| Analytics | `/analytics` | Heatmap, productivity trends, AI monthly analysis |
| Schedule | `/schedule` | Smart weekly calendar with AI time-blocking |
| AI | `/ai` | Full chat — persona-aware, daily streak, BYOK or free tier |
| Settings | `/settings` | Profile, Pomodoro config, notifications, AI key |

---

## AI Integration

FlowMind supports two AI modes, configurable per user:

### Free Tier (app-funded)
- 10 AI requests per day (configurable)
- Uses the app's own Anthropic API key
- Daily count tracked in **Redis**, reset at midnight
- Shown as a quota bar in the AI page sidebar

### BYOK — Bring Your Own Key
- User pastes their Anthropic API key in Settings → AI
- Stored **AES-256-GCM encrypted** in PostgreSQL
- Never sent to the frontend — decrypted server-side only
- Unlimited usage, billed to the user's own account

### Daily Streak
- Tracked via `ai_usage_logs` table
- Each day the user sends a message = +1 streak
- Breaks on the first missed day
- Shown as a fire badge (🔥) in the AI page

### Persona-aware AI
The AI system prompt changes based on the user's persona:
- **Homemaker** → advice on household scheduling, carving personal time
- **Student** → study techniques, exam prep, assignment tracking
- **Job seeker** → structured job search, interview prep, staying motivated
- **Business owner** → strategic prioritisation, delegation, burnout prevention
- (and 5 more personas)

---

## Mobile App

### Development

```bash
cd apps/mobile
npx expo start         # scan with Expo Go on your phone
npx expo start --ios   # iOS simulator
npx expo start --android # Android emulator
```

### Environment

Create `apps/mobile/.env`:
```env
EXPO_PUBLIC_API_URL=http://localhost:3001
```

In production, change this to your deployed backend URL.

### Build and deploy

```bash
npm install -g eas-cli
eas login

# iOS (App Store)
eas build --platform ios --profile production
eas submit --platform ios

# Android (Google Play)
eas build --platform android --profile production
eas submit --platform android
```

### Mobile features

| Feature | Status |
|---------|--------|
| Login / Signup + Persona | ✅ |
| Bottom tab navigation | ✅ |
| Dashboard with metrics | ✅ |
| Tasks — full CRUD | ✅ |
| Focus / Pomodoro timer | ✅ |
| Habits + streak | ✅ |
| AI assistant chat | ✅ |
| Meetings, Analytics, Schedule | 🔜 next iteration |
| Push notifications (Expo) | 🔜 |
| Meeting audio recording (expo-av) | 🔜 |
| Offline mode (React Query cache) | 🔜 |

---

## Web as PWA

The frontend is PWA-ready. To enable, uncomment the `VitePWA` plugin in `apps/frontend/vite.config.ts` and install:

```bash
cd apps/frontend
npm install vite-plugin-pwa
```

Users can then "Add to Home Screen" from Chrome/Safari — no App Store needed.

---

## Deployment

### Backend (Railway / Render / Fly.io)

1. Create a PostgreSQL database and Redis instance
2. Set environment variables from `.env.example`
3. Deploy the `apps/backend` folder
4. Run `npx prisma migrate deploy` on first deploy

### Frontend (Vercel)

1. Connect your GitHub repo
2. Set root to `apps/frontend`
3. Add `VITE_API_URL=https://your-backend.railway.app`
4. Deploy — Vercel auto-detects Vite

### One-command deploy with Railway

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway up
```

---

## Git Workflow

```bash
# First push
git init
git add .
git commit -m "feat: initial FlowMind monorepo"
git remote add origin https://github.com/yourusername/flowmind.git
git push -u origin main
```

### Recommended branch strategy

```
main          ← stable, deployed
develop       ← integration branch
feature/xyz   ← new features
fix/abc       ← bug fixes
```

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache + queues | Redis (ioredis) |
| Auth | JWT (access + refresh tokens) + bcrypt |
| AI | Anthropic Claude (claude-sonnet-4) |
| Frontend | React 18 + TypeScript + Tailwind CSS |
| State | Zustand + React Query |
| Routing | React Router v6 |
| Mobile | React Native + Expo SDK 51 |
| Mobile nav | Expo Router (file-based) |
| Mobile storage | expo-secure-store |
| Monorepo | npm workspaces + Turborepo |
| Shared types | `@flowmind/shared` package |

---

## Demo Account

After seeding:
- **Email:** `demo@flowmind.app`
- **Password:** `demo1234`

---

Built for everyone. ☀️
