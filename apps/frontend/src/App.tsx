import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import LoadingScreen from './components/ui/LoadingScreen'

// ─── Lazy pages ──────────────────────────────────────────
const LandingPage    = lazy(() => import('./pages/LandingPage'))
const LoginPage      = lazy(() => import('./pages/auth/LoginPage'))
const SignupPage      = lazy(() => import('./pages/auth/SignupPage'))
const OnboardingPage = lazy(() => import('./pages/auth/OnboardingPage'))
const DashboardPage  = lazy(() => import('./pages/dashboard/DashboardPage'))
const TasksPage      = lazy(() => import('./pages/tasks/TasksPage'))
const FocusPage      = lazy(() => import('./pages/focus/FocusPage'))
const MeetingsPage   = lazy(() => import('./pages/meetings/MeetingsPage'))
const HabitsPage     = lazy(() => import('./pages/habits/HabitsPage'))
const AnalyticsPage  = lazy(() => import('./pages/analytics/AnalyticsPage'))
const SchedulePage   = lazy(() => import('./pages/schedule/SchedulePage'))
const AIPage         = lazy(() => import('./pages/ai/AIPage'))
const SettingsPage   = lazy(() => import('./pages/settings/SettingsPage'))

const qc = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } })

function Protected({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user ? <>{children}</> : <Navigate to="/login" replace />
}

function Guest({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e2130',
              color: '#f0f2ff',
              border: '1px solid rgba(255,255,255,0.10)',
              fontFamily: 'DM Sans, sans-serif',
              fontSize: '14px',
              borderRadius: '10px',
            },
          }}
        />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* Public */}
            <Route path="/"           element={<Guest><LandingPage /></Guest>} />
            <Route path="/login"      element={<Guest><LoginPage /></Guest>} />
            <Route path="/signup"     element={<Guest><SignupPage /></Guest>} />
            <Route path="/onboarding" element={<Protected><OnboardingPage /></Protected>} />

            {/* Protected — all under AppLayout */}
            <Route element={<Protected><AppLayout /></Protected>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tasks"     element={<TasksPage />} />
              <Route path="/focus"     element={<FocusPage />} />
              <Route path="/meetings"  element={<MeetingsPage />} />
              <Route path="/habits"    element={<HabitsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/schedule"  element={<SchedulePage />} />
              <Route path="/ai"        element={<AIPage />} />
              <Route path="/settings"  element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
