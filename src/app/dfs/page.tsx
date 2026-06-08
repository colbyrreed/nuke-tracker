// src/app/dfs/page.tsx
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { DFSLineup } from '@/components/dfs/dfs-lineup'
import { ProGate } from '@/components/ui/pro-gate'
import { Trophy, TrendingUp } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export default async function DFSPage() {
  const { userId } = await auth()
  const user = userId
    ? await db.user.findUnique({ where: { clerkId: userId }, select: { plan: true } })
    : null
  const isElite = user?.plan === 'ELITE'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Top HR-upside players for DFS
  const topHRPlayers = await db.dailyScore.findMany({
    where: { date: today, nukeScore: { gte: 60 } },
    orderBy: [{ upsideScore: 'desc' }, { nukeScore: 'desc' }],
    take: 15,
    include: { player: { include: { team: true } } },
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-condensed font-black text-3xl text-white tracking-wide flex items-center gap-3">
            <Trophy className="text-nuke-gold" size={26} />
            DFS <span className="text-nuke-red">Mode</span>
          </h1>
          <p className="text-xs text-nuke-muted mt-1">
            Optimize lineups for HR upside · FanDuel &amp; DraftKings
          </p>
        </div>
        <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-3 py-2 rounded-lg">
          <span className="text-purple-400 text-xs font-bold">ELITE FEATURE</span>
        </div>
      </div>

      {isElite ? (
        <>
          {/* Strategy selector */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'HR Upside', desc: 'Max HR probability', icon: '💣', active: true },
              { label: 'Balanced',  desc: 'HR + floor combo',   icon: '⚖️', active: false },
              { label: 'GPP',       label2: 'Tournaments', desc: 'Low ownership HR plays', icon: '🎯', active: false },
            ].map((s) => (
              <button
                key={s.label}
                className={`text-left px-4 py-3 rounded-lg border transition-all ${
                  s.active ? 'border-nuke-red bg-nuke-red/10' : 'border-border bg-surface hover:border-nuke-muted'
                }`}
              >
                <div className="text-base mb-1">{s.icon}</div>
                <div className="text-sm font-bold text-white">{s.label}</div>
                <div className="text-[10px] text-nuke-muted mt-0.5">{s.desc}</div>
              </button>
            ))}
          </div>

          {/* HR Upside leaders */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={13} className="text-nuke-gold" />
              <span className="text-xs font-bold text-nuke-muted uppercase tracking-wide">Top HR-Upside DFS Targets</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {topHRPlayers.slice(0, 10).map((s, i) => (
                <div key={s.playerId} className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-center">
                  <div className="text-[10px] text-nuke-muted mb-1">#{i + 1}</div>
                  <div className="text-xs font-semibold text-white leading-tight">
                    {(s.player as any).name.split(' ').pop()}
                  </div>
                  <div className="text-[10px] text-nuke-muted">{(s.player as any).team?.abbreviation ?? '—'}</div>
                  <div className="font-mono text-sm text-nuke-green mt-1">{(s.hrProbability * 100).toFixed(1)}%</div>
                  <div className="text-[10px] text-nuke-muted2">Upside: {s.upsideScore.toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Lineup optimizers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface border border-border rounded-lg p-4">
              <DFSLineup platform="FanDuel" salaryCap={35000} />
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <DFSLineup platform="DraftKings" salaryCap={50000} />
            </div>
          </div>
        </>
      ) : (
        <ProGate
          title="Unlock DFS Mode"
          description="Elite members get access to the full DFS lineup optimizer with HR-upside scoring, ownership projections, and one-click lineup export for FanDuel and DraftKings."
          plan="ELITE"
        />
      )}
    </div>
  )
}
