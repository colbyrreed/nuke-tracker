// src/components/leaderboard/leaderboard.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface LeaderEntry {
  rank: number
  player?: { id: string; name: string; team?: { abbreviation: string } }
  totalHRs?: number
  avgEdge?: number
  plays?: number
  correctPredictions?: number
}

interface Props {
  hrLeaders: LeaderEntry[]
  valueLeaders: LeaderEntry[]
  predLeaders: LeaderEntry[]
  seasonROI: number
}

const TABS = [
  { key: 'hr',    label: '💣 HR Leaders' },
  { key: 'value', label: '📈 Best Value' },
  { key: 'pred',  label: '🎯 Top Predicted' },
] as const

type TabKey = typeof TABS[number]['key']

function LeaderRow({ entry, metric, delay }: { entry: LeaderEntry; metric: string; delay: number }) {
  const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 py-3 border-b border-border last:border-0"
    >
      <span className="text-lg w-8 text-center shrink-0">
        {medals[entry.rank] ?? <span className="font-condensed font-bold text-nuke-muted">{entry.rank}</span>}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{entry.player?.name ?? 'Unknown'}</div>
        <div className="text-[10px] text-nuke-muted">{entry.player?.team?.abbreviation ?? '—'}</div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm font-bold text-nuke-gold">{metric}</div>
      </div>
    </motion.div>
  )
}

export function LeaderboardPage({ hrLeaders, valueLeaders, predLeaders, seasonROI }: Props) {
  const [tab, setTab] = useState<TabKey>('hr')

  const entries: LeaderEntry[] =
    tab === 'hr' ? hrLeaders :
    tab === 'value' ? valueLeaders :
    predLeaders

  const metricFn = (e: LeaderEntry): string =>
    tab === 'hr'    ? `${e.totalHRs} HR` :
    tab === 'value' ? `+${((e.avgEdge ?? 0) * 100).toFixed(1)}% avg edge (${e.plays} plays)` :
                     `${e.correctPredictions} correct picks`

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Trophy className="text-nuke-gold" size={26} />
          <div>
            <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
              Leader<span className="text-nuke-red">boards</span>
            </h1>
            <p className="text-xs text-nuke-muted mt-1">Season rankings · Accuracy tracking · Value play history</p>
          </div>
        </div>
        <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-center">
          <div className={cn('font-mono text-base', seasonROI >= 0 ? 'text-nuke-green' : 'text-red-400')}>
            {seasonROI >= 0 ? '+' : ''}{(seasonROI * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-nuke-muted uppercase tracking-wide">Season ROI</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-xs font-semibold rounded-lg border transition-all',
              tab === t.key
                ? 'bg-nuke-red border-nuke-red text-white'
                : 'bg-surface border-border text-nuke-muted2 hover:text-white'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-lg p-4">
        {entries.length === 0 ? (
          <div className="text-center py-10 text-nuke-muted text-sm">
            No data yet for this season. Check back after more games are played.
          </div>
        ) : (
          entries.map((e, i) => (
            <LeaderRow key={e.player?.id ?? i} entry={e} metric={metricFn(e)} delay={i * 0.04} />
          ))
        )}
      </div>
    </div>
  )
}
