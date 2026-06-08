// src/components/live/live-leaderboard.tsx
'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface Entry {
  player: { name: string; team?: { abbreviation: string } } | undefined
  hrCount: number
  maxDistance: number
}

export function LiveLeaderboard({ entries }: { entries: Entry[] }) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="bg-[#0d1825] px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-[10px] font-semibold text-nuke-muted uppercase tracking-wide">Player</span>
        <div className="flex gap-6">
          <span className="text-[10px] font-semibold text-nuke-muted uppercase tracking-wide">HRs</span>
          <span className="text-[10px] font-semibold text-nuke-muted uppercase tracking-wide">Max Dist</span>
        </div>
      </div>
      {entries.map((e, i) => (
        <motion.div
          key={e.player?.name ?? i}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center justify-between px-3 py-3 border-b border-[#0f1e30] last:border-0 hover:bg-white/[0.02] transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <span className={cn(
              'font-condensed font-bold text-lg min-w-[1.5rem] text-right',
              i === 0 ? 'text-nuke-gold' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-amber-700' : 'text-nuke-muted'
            )}>
              {i + 1}
            </span>
            <div>
              <div className="text-sm font-semibold text-white">{e.player?.name ?? '—'}</div>
              <div className="text-[10px] text-nuke-muted">{e.player?.team?.abbreviation ?? '—'}</div>
            </div>
          </div>
          <div className="flex gap-6">
            <span className="font-mono text-sm font-bold text-nuke-red min-w-[2ch] text-center">{e.hrCount}</span>
            <span className="font-mono text-sm text-nuke-muted2 min-w-[48px] text-right">{e.maxDistance}ft</span>
          </div>
        </motion.div>
      ))}
      {entries.length === 0 && (
        <div className="py-10 text-center text-nuke-muted text-sm">No HRs yet today</div>
      )}
    </div>
  )
}

// src/components/live/live-stats-strip.tsx — inline export
export function LiveStatsStrip({
  totalHRs, avgEV, avgDist,
}: { totalHRs: number; avgEV: number; avgDist: number }) {
  return (
    <div className="flex gap-3">
      {[
        { label: 'HRs Today', value: totalHRs, color: 'text-nuke-red' },
        { label: 'Avg EV',   value: avgEV > 0 ? `${avgEV.toFixed(1)} mph` : '—', color: 'text-nuke-gold' },
        { label: 'Avg Dist', value: avgDist > 0 ? `${Math.round(avgDist)} ft` : '—', color: 'text-nuke-green' },
      ].map((s) => (
        <div key={s.label} className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-center">
          <div className={`font-mono text-base font-medium ${s.color}`}>{s.value}</div>
          <div className="text-[10px] text-nuke-muted uppercase tracking-wide mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
