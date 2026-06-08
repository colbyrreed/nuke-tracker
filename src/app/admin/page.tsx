// src/app/admin/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { cache } from '@/lib/utils/cache'
import { ApiHealth, SystemMetrics, LogFeed } from '@/components/admin/api-health'
import { AdminUserTable } from '@/components/admin/admin-user-table'
import { Shield } from 'lucide-react'

export const dynamic = 'force-dynamic'

// Simple admin check — in production use a proper admin role
async function requireAdmin(userId: string | null) {
  if (!userId) redirect('/sign-in')
  const user = await db.user.findUnique({ where: { clerkId: userId } })
  // Allow ELITE users or check a separate admin flag
  if (user?.plan !== 'ELITE') redirect('/dashboard')
  return user
}

export default async function AdminPage() {
  const { userId } = await auth()
  await requireAdmin(userId)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [userStats, scoreCount, latestRun] = await Promise.all([
    db.user.groupBy({ by: ['plan'], _count: { id: true } }),
    db.dailyScore.count({ where: { date: today } }),
    cache.get<{ playerCount: number; timestamp: number }>(`model:run:${today.toISOString().split('T')[0]}`),
  ])

  const planCounts = Object.fromEntries(userStats.map((u) => [u.plan, u._count.id]))
  const totalUsers = Object.values(planCounts).reduce((s, c) => s + c, 0)

  // Mock API health (in prod, ping each endpoint)
  const endpoints = [
    { name: 'MLB Stats API',    url: 'https://statsapi.mlb.com',  status: 'healthy' as const,  latencyMs: 48 },
    { name: 'Baseball Savant', url: 'https://baseballsavant.mlb.com', status: 'healthy' as const, latencyMs: 72 },
    { name: 'OpenWeather API', url: 'https://api.openweathermap.org', status: 'healthy' as const, latencyMs: 31 },
    { name: 'The Odds API',    url: 'https://api.the-odds-api.com', status: 'degraded' as const, latencyMs: 284 },
    { name: 'Rotowire Lineups', url: 'https://rotowire.com', status: 'healthy' as const, latencyMs: 61 },
    { name: 'Redis Cache',     url: 'redis://localhost', status: 'healthy' as const, latencyMs: 2 },
    { name: 'PostgreSQL',      url: 'postgres://localhost', status: 'healthy' as const, latencyMs: 8 },
    { name: 'Tomorrow.io',     url: 'https://api.tomorrow.io', status: 'healthy' as const, latencyMs: 55 },
  ]

  const systemMetrics = [
    { label: 'CPU Usage',      value: 34, color: '#22c97e' },
    { label: 'Memory',         value: 58, color: '#f5b940' },
    { label: 'DB Connections', value: 22, color: '#3b9eff' },
    { label: 'Redis Hit Rate', value: 94, color: '#22c97e' },
    { label: 'API Rate Limit', value: 41, color: '#f04a2a' },
  ]

  const logs = [
    `[${new Date().toLocaleTimeString()}] Model recalc triggered — lineup confirmed`,
    `[${new Date(Date.now() - 30000).toLocaleTimeString()}] Weather update pushed for 8 stadiums`,
    `[${new Date(Date.now() - 90000).toLocaleTimeString()}] ${scoreCount} player scores refreshed`,
    `[${new Date(Date.now() - 150000).toLocaleTimeString()}] Odds sync — DraftKings, FanDuel, BetMGM`,
    `[${new Date(Date.now() - 210000).toLocaleTimeString()}] Redis cache invalidated: dashboard:*`,
    `[${new Date(Date.now() - 270000).toLocaleTimeString()}] Statcast sync complete — 3 new events`,
    `[${new Date(Date.now() - 330000).toLocaleTimeString()}] WARN The Odds API latency: 284ms`,
    `[${new Date(Date.now() - 390000).toLocaleTimeString()}] ${totalUsers} users active today`,
  ]

  // Recent users
  const recentUsers = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: { id: true, email: true, name: true, plan: true, createdAt: true, subscriptionEnd: true },
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Shield className="text-nuke-red" size={24} />
          <div>
            <h1 className="font-condensed font-black text-3xl text-white tracking-wide">Admin <span className="text-nuke-red">Panel</span></h1>
            <p className="text-xs text-nuke-muted mt-1">System health · User management · API monitoring</p>
          </div>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Total Users', value: totalUsers, color: 'text-white' },
            { label: 'Pro Subs',    value: planCounts['PRO'] ?? 0,   color: 'text-nuke-gold' },
            { label: 'Elite Subs',  value: planCounts['ELITE'] ?? 0, color: 'text-purple-400' },
            { label: 'Scored Today', value: scoreCount, color: 'text-nuke-green' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-center">
              <div className={`font-mono text-base font-medium ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-nuke-muted uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* API Health */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-3">API Health</div>
          <ApiHealth endpoints={endpoints} />
        </div>

        {/* System metrics + log */}
        <div className="flex flex-col gap-4">
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-3">System Resources</div>
            <SystemMetrics metrics={systemMetrics} />
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-3">Recent Logs</div>
            <LogFeed lines={logs} />
          </div>
        </div>
      </div>

      {/* Model status */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-3">Model Status</div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Players Scored Today', value: scoreCount, color: 'text-nuke-green' },
            { label: 'Last Model Run', value: latestRun ? new Date(latestRun.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—', color: 'text-white' },
            { label: 'Scoring Engine', value: 'v1.0', color: 'text-nuke-blue' },
            { label: 'Monte Carlo Sims', value: '50K/player', color: 'text-nuke-gold' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-2 rounded-lg px-3 py-2">
              <div className="text-[10px] text-nuke-muted">{s.label}</div>
              <div className={`font-mono text-sm font-medium mt-1 ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* User table */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-3">Recent Users</div>
        <AdminUserTable users={recentUsers as any} />
      </div>
    </div>
  )
}
