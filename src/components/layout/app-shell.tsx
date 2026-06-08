// src/components/layout/app-shell.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard, Radio, Tv2, Target, TrendingUp,
  Trophy, Shuffle, Brain, BarChart3, Users, Bell,
  Settings, Zap, Database, Map, CloudSun, AlignLeft,
  Flame, Shield, Menu, X, ChevronRight,
} from 'lucide-react'
import { useDashboardStore } from '@/store'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',       icon: LayoutDashboard, badge: null },
  { href: '/live',         label: 'Live Tracker',    icon: Radio,           badge: 'LIVE' },
  { href: '/games',        label: 'Game Center',     icon: Tv2,             badge: null },
  { href: '/pitchers',     label: 'Pitcher Targets', icon: Target,          badge: null },
  { href: '/value',        label: 'Value Finder',    icon: TrendingUp,      badge: 'PRO' },
  { href: '/parlay',       label: 'Parlay Builder',  icon: Shuffle,         badge: 'PRO' },
  { href: '/ai',           label: 'AI Insights',     icon: Brain,           badge: 'PRO' },
  { href: '/dfs',          label: 'DFS Mode',        icon: Trophy,          badge: 'ELITE' },
  { href: '/model',        label: 'Model Lab',       icon: BarChart3,       badge: null },
  { href: '/player',       label: 'Player Profiles', icon: Users,           badge: null },
  { href: '/park',         label: 'Park Center',     icon: Map,             badge: null },
  { href: '/weather',      label: 'Weather Center',  icon: CloudSun,        badge: null },
  { href: '/lineup',       label: 'Lineup Center',   icon: AlignLeft,       badge: null },
  { href: '/trend',        label: 'Trend Lab',       icon: Flame,           badge: null },
  { href: '/leaderboard',  label: 'Leaderboards',    icon: Trophy,          badge: null },
  { href: '/alerts',       label: 'Alerts',          icon: Bell,            badge: null },
  { href: '/research',     label: 'Research DB',     icon: Database,        badge: null },
  { href: '/custom-model', label: 'Custom Model',    icon: Settings,        badge: 'ELITE' },
  { href: '/admin',        label: 'Admin',           icon: Shield,          badge: null },
]

const BADGE_STYLES: Record<string, string> = {
  LIVE:  'bg-nuke-red text-white animate-pulse',
  PRO:   'bg-nuke-gold/20 text-nuke-gold border border-nuke-gold/30',
  ELITE: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const hrCount = useDashboardStore((s) => s.hrsTodayCount)
  const lastUpdated = useDashboardStore((s) => s.lastUpdated)

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: sidebarOpen ? 220 : 60 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col bg-[#06090f] border-r border-border shrink-0 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 h-14 border-b border-border shrink-0">
          <div className="w-8 h-8 bg-nuke-red rounded flex items-center justify-center shrink-0 text-base">
            💣
          </div>
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-condensed font-black text-lg tracking-wide text-white whitespace-nowrap"
              >
                NUKE TRACKER
              </motion.span>
            )}
          </AnimatePresence>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-nuke-muted hover:text-white transition-colors shrink-0"
          >
            <ChevronRight
              size={16}
              className={cn('transition-transform', sidebarOpen && 'rotate-180')}
            />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 mx-1 rounded-md transition-all group relative',
                  active
                    ? 'bg-nuke-red/10 text-white'
                    : 'text-nuke-muted hover:text-white hover:bg-white/5'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-nuke-red rounded-full"
                  />
                )}
                <item.icon size={16} className="shrink-0" />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-medium whitespace-nowrap flex-1"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {sidebarOpen && item.badge && (
                  <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', BADGE_STYLES[item.badge])}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="border-t border-border p-3">
          <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-60 bg-[#06090f] border-r border-border z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center gap-3 px-4 h-14 border-b border-border">
                <span className="text-xl">💣</span>
                <span className="font-condensed font-black text-lg tracking-wide text-white">NUKE TRACKER</span>
                <button onClick={() => setMobileOpen(false)} className="ml-auto text-nuke-muted">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-2">
                {NAV_ITEMS.map((item) => {
                  const active = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 transition-all',
                        active ? 'text-white bg-nuke-red/10' : 'text-nuke-muted2 hover:text-white'
                      )}
                    >
                      <item.icon size={16} />
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded ml-auto', BADGE_STYLES[item.badge])}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 h-14 border-b border-border bg-[#06090f] shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden text-nuke-muted hover:text-white"
          >
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 ml-auto">
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 bg-nuke-red/10 border border-nuke-red/20 px-2.5 py-1 rounded text-nuke-red">
              <span className="w-1.5 h-1.5 rounded-full bg-nuke-red animate-pulse" />
              <span className="text-[10px] font-bold tracking-wide">LIVE</span>
            </div>

            {/* HR counter */}
            <div className="hidden sm:flex items-center gap-1.5 bg-surface border border-border px-2.5 py-1 rounded">
              <Zap size={11} className="text-nuke-gold" />
              <span className="text-[10px] font-mono text-nuke-gold font-medium">{hrCount} HRs today</span>
            </div>

            {/* Last updated */}
            {lastUpdated && (
              <span className="hidden md:block text-[10px] text-nuke-muted font-mono">
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}

            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-7 h-7' } }} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
