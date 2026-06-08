// src/components/player/player-stat-grid.tsx
'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface StatCell {
  label: string
  value: string | number
  sub?: string
  good?: boolean
}

export function PlayerStatGrid({
  player, recentHRs, avgEV,
}: {
  player: any
  recentHRs: number
  avgEV: number
}) {
  const stats: StatCell[] = [
    { label: 'Season HR',      value: player.homeRuns, good: player.homeRuns >= 15 },
    { label: 'Avg / OPS',      value: `${player.avg.toFixed(3)} / ${player.ops.toFixed(3)}` },
    { label: 'Barrel %',       value: `${player.barrelPct.toFixed(1)}%`, good: player.barrelPct >= 10 },
    { label: 'Hard Hit %',     value: `${player.hardHitPct.toFixed(1)}%`, good: player.hardHitPct >= 40 },
    { label: 'Avg Exit Velo',  value: `${player.avgExitVelo.toFixed(1)} mph`, good: player.avgExitVelo >= 92 },
    { label: 'xSLG',           value: player.xSLG.toFixed(3), good: player.xSLG >= 0.45 },
    { label: 'Fly Ball %',     value: `${player.flyBallPct.toFixed(1)}%`, good: player.flyBallPct >= 35 },
    { label: 'Pull %',         value: `${player.pullPct.toFixed(1)}%` },
    { label: 'HRs Last 30d',   value: recentHRs, good: recentHRs >= 3 },
    { label: 'Avg EV (30d)',   value: avgEV > 0 ? `${avgEV.toFixed(1)} mph` : '—', good: avgEV >= 92 },
    { label: 'ISO',            value: player.iso.toFixed(3), good: player.iso >= 0.18 },
    { label: 'Sweet Spot %',   value: `${player.sweetSpotPct.toFixed(1)}%`, good: player.sweetSpotPct >= 30 },
  ]

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="bg-surface border border-border rounded-lg px-3 py-2.5 text-center"
        >
          <div className="text-[10px] text-nuke-muted uppercase tracking-wide">{stat.label}</div>
          <div className={cn(
            'font-mono text-sm font-medium mt-1',
            stat.good === true ? 'text-nuke-green' : stat.good === false ? 'text-red-400' : 'text-white'
          )}>
            {stat.value}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
