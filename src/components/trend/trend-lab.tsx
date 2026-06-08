// src/components/trend/trend-lab.tsx
'use client'

import { motion } from 'framer-motion'
import { Flame, TrendingDown, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface TrendPlayer {
  player: { id: string; name: string; team?: { abbreviation: string } }
  score: { nukeScore: number; hrProbability: number }
  hrRate7: number
  hrRate30: number
  surge: number
  last7HRs: number
  last30HRs: number
  trend: 'hot' | 'cold' | 'neutral'
}

interface Props {
  hottest: TrendPlayer[]
  coldest: TrendPlayer[]
}

function TrendCard({ p, rank, delay }: { p: TrendPlayer; rank: number; delay: number }) {
  const isHot = p.trend === 'hot'
  const isCold = p.trend === 'cold'
  const surgePct = (p.surge * 100).toFixed(0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'bg-surface border rounded-lg px-4 py-3 flex items-center gap-4',
        isHot ? 'border-nuke-red/25' : isCold ? 'border-nuke-blue/20' : 'border-border'
      )}
    >
      <span className={cn('font-condensed font-bold text-xl min-w-[1.5rem] text-right', rank <= 3 ? 'text-nuke-gold' : 'text-nuke-muted')}>
        {rank}
      </span>

      {/* Trend icon */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
        isHot ? 'bg-nuke-red/15' : isCold ? 'bg-nuke-blue/15' : 'bg-border'
      )}>
        {isHot
          ? <Flame size={16} className="text-nuke-red" />
          : isCold
          ? <TrendingDown size={16} className="text-nuke-blue" />
          : <TrendingUp size={16} className="text-nuke-muted" />
        }
      </div>

      {/* Player */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{p.player.name}</div>
        <div className="text-[10px] text-nuke-muted mt-0.5">{p.player.team?.abbreviation ?? '—'}</div>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-right">
        <div>
          <div className="font-mono text-xs text-white">{p.last7HRs} HR</div>
          <div className="text-[9px] text-nuke-muted">Last 7</div>
        </div>
        <div>
          <div className="font-mono text-xs text-nuke-muted2">{p.last30HRs} HR</div>
          <div className="text-[9px] text-nuke-muted">Last 30</div>
        </div>
        <div>
          <div className={cn(
            'font-mono text-sm font-bold',
            p.surge > 0 ? 'text-nuke-red' : p.surge < 0 ? 'text-nuke-blue' : 'text-nuke-muted'
          )}>
            {p.surge > 0 ? '+' : ''}{surgePct}%
          </div>
          <div className="text-[9px] text-nuke-muted">Surge</div>
        </div>
        <div>
          <div className="font-mono text-xs text-nuke-green">{(p.score.hrProbability * 100).toFixed(1)}%</div>
          <div className="text-[9px] text-nuke-muted">HR Prob</div>
        </div>
      </div>
    </motion.div>
  )
}

export function TrendLab({ hottest, coldest }: Props) {
  const hotPlayers = hottest.filter((p) => p.trend === 'hot').slice(0, 10)
  const surgePlayers = hottest.slice(0, 15)

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center gap-3">
        <Flame className="text-nuke-red" size={26} />
        <div>
          <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
            Trend <span className="text-nuke-red">Lab</span>
          </h1>
          <p className="text-xs text-nuke-muted mt-1">
            Hot &amp; cold streaks · Barrel surges · Exit velocity trends
          </p>
        </div>
      </div>

      {/* Hot hitters callout */}
      {hotPlayers.length > 0 && (
        <div className="bg-nuke-red/5 border border-nuke-red/20 rounded-lg px-4 py-3">
          <div className="text-[10px] font-bold text-nuke-red uppercase tracking-wide mb-2">
            🔥 Red-Hot Right Now
          </div>
          <div className="flex flex-wrap gap-2">
            {hotPlayers.map((p) => (
              <div
                key={p.player.id}
                className="flex items-center gap-1.5 bg-nuke-red/10 border border-nuke-red/20 rounded px-2.5 py-1"
              >
                <span className="text-xs font-semibold text-white">{p.player.name}</span>
                <span className="text-[10px] text-nuke-muted">{p.player.team?.abbreviation}</span>
                <span className="text-[10px] font-bold text-nuke-red">+{(p.surge * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Surge leaderboard */}
        <div>
          <div className="text-[10px] font-bold text-nuke-muted uppercase tracking-wider mb-2">
            🔥 Biggest Positive Surges
          </div>
          <div className="flex flex-col gap-2">
            {surgePlayers.map((p, i) => (
              <TrendCard key={p.player.id} p={p} rank={i + 1} delay={i * 0.03} />
            ))}
          </div>
        </div>

        {/* Cold players */}
        <div>
          <div className="text-[10px] font-bold text-nuke-muted uppercase tracking-wider mb-2">
            ❄️ Cooling Off
          </div>
          <div className="flex flex-col gap-2">
            {coldest.map((p, i) => (
              <TrendCard key={p.player.id} p={p} rank={i + 1} delay={i * 0.03} />
            ))}
          </div>

          {/* Explanation */}
          <div className="mt-4 bg-surface border border-border rounded-lg p-4">
            <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-2">How Surge is Calculated</div>
            <div className="text-xs text-nuke-muted2 leading-relaxed space-y-1.5">
              <div className="flex gap-2"><span className="text-nuke-red shrink-0">→</span>Surge % = (Last 7 HR/PA rate ÷ Last 30 HR/PA rate) - 1</div>
              <div className="flex gap-2"><span className="text-nuke-red shrink-0">→</span>+50% means hitting HRs 50% more often than their 30-day baseline</div>
              <div className="flex gap-2"><span className="text-nuke-red shrink-0">→</span>Barrel rate and exit velocity surges are weighted equally</div>
              <div className="flex gap-2"><span className="text-nuke-red shrink-0">→</span>Minimum 10 AB in last 7 days to qualify</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
