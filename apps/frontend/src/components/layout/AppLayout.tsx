import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, CheckSquare, Timer, Activity,
  BarChart2, Calendar, Sparkles, Settings, LogOut,
  ChevronLeft, ChevronRight, Bell, Menu, X, Zap, Rocket,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard'           },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tasks',  dot: true   },
  { to: '/focus',     icon: Timer,           label: 'Focus'               },
  { to: '/meetings',  icon: Calendar,        label: 'Meetings'            },
  { to: '/habits',    icon: Activity,        label: 'Habits'              },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics'           },
]

const BOTTOM_NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home'   },
  { to: '/tasks',     icon: CheckSquare,     label: 'Tasks'  },
  { to: '/focus',     icon: Timer,           label: 'Focus'  },
  { to: '/ai',        icon: Sparkles,        label: 'AI'     },
  { to: '/habits',    icon: Activity,        label: 'Habits' },
]

export default function AppLayout() {
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const { data: unread } = useQuery({
    queryKey: ['notif-count'],
    queryFn:  () => axios.get('/api/notifications/unread-count').then(r => r.data),
    refetchInterval: 60_000,
  })

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn:  () => axios.get('/api/ai/status').then(r => r.data),
  })

  const handleLogout = async () => {
    await logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const initials = (user?.name || 'U')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  const isPaid = aiStatus?.isPro

  // ── Single sidebar content shared by desktop + mobile ──
  const SidebarInner = () => (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Logo row + collapse / close button */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <div className={clsx('flex items-center gap-2.5', collapsed && 'justify-center w-full')}>
          <div
            className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0"
            style={{ background: '#6c5ce7' }}
          >
            <Zap size={16} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-[15px] text-text-primary tracking-tight">
              FlowMind
            </span>
          )}
        </div>

        {!collapsed && (
          <>
            {/* X close button — mobile only */}
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden w-7 h-7 rounded-[7px] border border-border-default bg-white flex items-center justify-center text-text-muted hover:text-text-secondary transition-all"
              aria-label="Close menu"
            >
              <X size={14} />
            </button>

            {/* Collapse arrow — desktop only */}
            <button
              onClick={() => setCollapsed(true)}
              className="hidden lg:flex w-7 h-7 rounded-[7px] border border-border-default bg-white items-center justify-center text-text-muted hover:text-text-secondary hover:bg-bg-base transition-all"
              title="Collapse sidebar"
            >
              <ChevronLeft size={14} />
            </button>
          </>
        )}

        {/* Expand button when collapsed — desktop only */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="hidden lg:flex absolute top-4 right-[-14px] w-7 h-7 rounded-full border border-border-default bg-white items-center justify-center text-text-muted hover:text-accent hover:border-accent-border shadow-sm transition-all z-10"
            title="Expand sidebar"
          >
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 pt-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, dot }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => clsx(
              'flex items-center gap-2.5 rounded-[10px] transition-all duration-150 group relative',
              collapsed ? 'justify-center p-2.5 w-10 h-10 mx-auto' : 'px-3 py-2.5',
              isActive
                ? 'bg-[#f0efff] text-[#6c5ce7] font-semibold'
                : 'text-text-secondary hover:bg-bg-base hover:text-text-primary'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon size={17} className={clsx('flex-shrink-0', isActive && 'text-[#6c5ce7]')} />
                {!collapsed && <span className="text-[13px] flex-1">{label}</span>}
                {!collapsed && dot && (
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                )}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white border border-border-subtle rounded-lg text-xs font-medium text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-card">
                    {label}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Divider */}
        <div className="h-px bg-border-subtle my-2" />

        {/* AI Assistant */}
        <NavLink
          to="/ai"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) => clsx(
            'flex items-center gap-2.5 rounded-[10px] transition-all group relative',
            collapsed ? 'justify-center p-2.5 w-10 h-10 mx-auto' : 'px-3 py-2.5',
            isActive
              ? 'bg-[#f0efff] text-[#6c5ce7] font-semibold'
              : 'text-text-secondary hover:bg-bg-base hover:text-text-primary'
          )}
        >
          {({ isActive }) => (
            <>
              <Sparkles size={17} className={clsx('flex-shrink-0', isActive && 'text-[#6c5ce7]')} />
              {!collapsed && (
                <>
                  <span className="text-[13px] flex-1">AI Assistant</span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: '#6c5ce7' }}
                  >
                    NEW
                  </span>
                </>
              )}
              {collapsed && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-white border border-border-subtle rounded-lg text-xs font-medium text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-card">
                  AI Assistant
                </div>
              )}
            </>
          )}
        </NavLink>

        {/* Settings */}
        <NavLink
          to="/settings"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) => clsx(
            'flex items-center gap-2.5 rounded-[10px] transition-all group relative',
            collapsed ? 'justify-center p-2.5 w-10 h-10 mx-auto' : 'px-3 py-2.5',
            isActive
              ? 'bg-[#f0efff] text-[#6c5ce7] font-semibold'
              : 'text-text-secondary hover:bg-bg-base hover:text-text-primary'
          )}
        >
          <Settings size={17} className="flex-shrink-0" />
          {!collapsed && <span className="text-[13px]">Settings</span>}
        </NavLink>
      </nav>

      {/* Upgrade to Pro card */}
      {!collapsed && !isPaid && (
        <div className="px-3 py-3 flex-shrink-0">
          <div
            className="rounded-[14px] p-4 border"
            style={{ background: '#f0efff', borderColor: '#e0ddff' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Rocket size={14} style={{ color: '#6c5ce7' }} />
              <span className="text-[12px] font-bold" style={{ color: '#6c5ce7' }}>
                Upgrade to Pro
              </span>
            </div>
            <p className="text-[11.5px] text-text-secondary leading-relaxed mb-3">
              Unlock deeper insights and advanced productivity tools.
            </p>
            <Link
              to="/settings?tab=subscription"
              onClick={() => setMobileOpen(false)}
              className="block w-full h-[33px] rounded-[9px] text-white text-[12px] font-bold text-center leading-[33px] transition-all hover:opacity-90"
              style={{ background: '#6c5ce7' }}
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      )}

      {/* User row */}
      <div
        className={clsx(
          'flex-shrink-0 border-t border-border-subtle',
          collapsed ? 'p-2' : 'px-3 py-3'
        )}
      >
        <div
          className={clsx(
            'flex items-center gap-2.5 rounded-[10px] cursor-pointer hover:bg-bg-base transition-all p-2',
            collapsed && 'justify-center'
          )}
        >
          <div
            className="w-[33px] h-[33px] rounded-full flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0"
            style={{ background: '#6c5ce7' }}
          >
            {initials}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-text-primary truncate">{user?.name}</p>
                <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-text-muted hover:text-red-500 transition-colors p-1 flex-shrink-0"
                title="Log out"
              >
                <LogOut size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen h-[100dvh] bg-bg-base overflow-hidden">

      {/* ── Desktop sidebar ── */}
      <aside
        className={clsx(
          'hidden lg:flex flex-col border-r border-border-subtle bg-white flex-shrink-0 transition-all duration-300 relative',
          collapsed ? 'w-[60px]' : 'w-[210px]'
        )}
      >
        <SidebarInner />
      </aside>

      {/* ── Mobile backdrop overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar ── */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 w-[240px] bg-white border-r border-border-subtle z-50 flex flex-col transition-transform duration-300 lg:hidden shadow-xl',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarInner />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-white flex-shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 rounded-[9px] border border-border-subtle flex items-center justify-center text-text-secondary hover:bg-bg-base transition-all"
            aria-label="Open menu"
          >
            <Menu size={18} />
          </button>

          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-[8px] flex items-center justify-center"
              style={{ background: '#6c5ce7' }}
            >
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-[14px] text-text-primary">FlowMind</span>
          </div>

          <button className="w-9 h-9 rounded-[9px] border border-border-subtle flex items-center justify-center text-text-secondary relative hover:bg-bg-base transition-all">
            <Bell size={18} />
            {unread?.count > 0 && (
              <span
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center border-2 border-white"
                style={{ background: '#6c5ce7' }}
              >
                {unread.count}
              </span>
            )}
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-bg-base">
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden flex-shrink-0 bg-white border-t border-border-subtle pb-safe">
          <div className="flex items-center justify-around px-2 py-2">
            {BOTTOM_NAV.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => clsx(
                  'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[10px] transition-all min-w-[52px]',
                  isActive ? 'text-[#6c5ce7]' : 'text-text-muted'
                )}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={20} className={isActive ? 'text-[#6c5ce7]' : ''} />
                    <span className="text-[10px] font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}