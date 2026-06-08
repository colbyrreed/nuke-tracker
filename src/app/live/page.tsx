// src/app/live/page.tsx
import { Suspense } from 'react'
import { db } from '@/lib/db'
import { LiveFeed } from '@/components/live/live-feed'
import { LiveLeaderboard } from '@/components/live/live-leaderboard'
import { LiveStatsStrip } from '@/components/live/live-stats-strip'

export const dynamic = 'force-dynamic'
export const revalidate = 15

export default async function LivePage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [hrEvents, leaderboard] = await Promise.all([
    db.statcastEvent.findMany({
      where: { isHomeRun: true, gameDate: { gte: today } },
      orderBy: { gameDate: 'desc' },
      take: 50,
      include: { player: { include: { team: true } } },
    }),
    db.statcastEvent.groupBy({
      by: ['playerId'],
      where: { isHomeRun: true, gameDate: { gte: today } },
      _count: { id: true },
      _max: { distance: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ])

  // Enrich leaderboard with player info
  const playerIds = leaderboard.map((l) => l.playerId)
  const players = await db.player.findMany({
    where: { id: { in: playerIds } },
    include: { team: true },
  })
  const playerMap = new Map(players.map((p) => [p.id, p]))

  const enrichedLeaderboard = leaderboard.map((l) => ({
    player: playerMap.get(l.playerId),
    hrCount: l._count.id,
    maxDistance: l._max.distance ?? 0,
  }))

  // Transform events for client
  const events = hrEvents.map((e) => ({
    id: e.id,
    gameId: e.gameId ?? '',
    playerId: e.playerId,
    playerName: (e.player as any).name,
    team: (e.player as any).team?.abbreviation ?? '—',
    inning: e.inning ?? 0,
    inningHalf: 'bottom',
    exitVelocity: e.exitVelocity ?? 0,
    distance: e.distance ?? 0,
    launchAngle: e.launchAngle ?? 0,
    pitchType: e.pitchType ?? 'Unknown',
    timestamp: e.gameDate,
    videoUrl: undefined,
  }))

  const totalHRs = hrEvents.length
  const avgEV = hrEvents.length > 0
    ? hrEvents.reduce((s, e) => s + (e.exitVelocity ?? 0), 0) / hrEvents.length
    : 0
  const avgDist = hrEvents.length > 0
    ? hrEvents.reduce((s, e) => s + (e.distance ?? 0), 0) / hrEvents.length
    : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
            Live <span className="text-nuke-red">HR</span> Tracker
          </h1>
          <p className="text-xs text-nuke-muted mt-1">Real-time home run feed · Updates every 15 seconds</p>
        </div>
        <LiveStatsStrip totalHRs={totalHRs} avgEV={avgEV} avgDist={avgDist} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Feed */}
        <div className="lg:col-span-2">
          <div className="text-[10px] font-bold text-nuke-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-nuke-green animate-pulse" />
            Live HR Feed
          </div>
          <Suspense fallback={<div className="text-nuke-muted text-sm text-center py-8">Loading feed…</div>}>
            <LiveFeed initialEvents={events as any} />
          </Suspense>
        </div>

        {/* Leaderboard */}
        <div>
          <div className="text-[10px] font-bold text-nuke-muted uppercase tracking-wider mb-2">
            Today's HR Leaders
          </div>
          <LiveLeaderboard entries={enrichedLeaderboard as any} />
        </div>
      </div>
    </div>
  )
}
