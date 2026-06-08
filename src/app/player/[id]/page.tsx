// src/app/player/[id]/page.tsx
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getPlayerProfile } from '@/lib/data/dashboard'
import { PlayerHRChart } from '@/components/player/player-hr-chart'
import { PlayerStatGrid } from '@/components/player/player-stat-grid'
import { PlayerRecentTable } from '@/components/player/player-recent-table'

export const dynamic = 'force-dynamic'
export const revalidate = 300

interface Props {
  params: { id: string }
}

export default async function PlayerPage({ params }: Props) {
  const profile = await getPlayerProfile(params.id)
  if (!profile) notFound()

  const { player, todayScore, recentGames, statcastEvents } = profile

  const recentHRs = statcastEvents.filter((e) => e.isHomeRun)
  const avgEV = statcastEvents.length
    ? statcastEvents.reduce((s, e) => s + (e.exitVelocity ?? 0), 0) / statcastEvents.length
    : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Player header */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-surface-2 border border-border flex items-center justify-center font-condensed font-black text-2xl text-nuke-muted2">
              {player.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h1 className="font-condensed font-black text-3xl text-white tracking-wide">{player.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-xs text-nuke-muted">
                <span>{(player as any).team?.name ?? 'Free Agent'}</span>
                <span>·</span>
                <span>{player.position}</span>
                <span>·</span>
                <span>Bats: {player.bats === 'LEFT' ? 'L' : player.bats === 'RIGHT' ? 'R' : 'S'}</span>
              </div>
            </div>
          </div>

          {todayScore && (
            <div className="flex gap-3">
              <div className="bg-nuke-red/10 border border-nuke-red/25 rounded-lg px-4 py-3 text-center">
                <div className="font-condensed font-black text-3xl text-nuke-red leading-none">{todayScore.nukeScore}</div>
                <div className="text-[10px] text-nuke-muted mt-1 uppercase tracking-wide">Nuke Score</div>
              </div>
              <div className="bg-surface-2 border border-border rounded-lg px-4 py-3 text-center">
                <div className="font-mono text-xl font-medium text-nuke-green">{(todayScore.hrProbability * 100).toFixed(1)}%</div>
                <div className="text-[10px] text-nuke-muted mt-1 uppercase tracking-wide">HR Today</div>
              </div>
              {todayScore.edge !== null && todayScore.edge > 0 && (
                <div className="bg-nuke-green/5 border border-nuke-green/20 rounded-lg px-4 py-3 text-center">
                  <div className="font-mono text-xl font-medium text-nuke-green">+{(todayScore.edge * 100).toFixed(1)}%</div>
                  <div className="text-[10px] text-nuke-muted mt-1 uppercase tracking-wide">Value Edge</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Statcast summary */}
      <PlayerStatGrid player={player as any} recentHRs={recentHRs.length} avgEV={avgEV} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* HR trend chart */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-3">HR Trend (Last 30 Games)</div>
          <PlayerHRChart games={recentGames as any} />
        </div>

        {/* Exit velo trend */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-3">Exit Velocity Trend</div>
          <PlayerHRChart games={recentGames as any} metric="exitVelo" />
        </div>
      </div>

      {/* Recent games table */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-3">Recent Game Log</div>
        <PlayerRecentTable games={recentGames as any} />
      </div>
    </div>
  )
}
