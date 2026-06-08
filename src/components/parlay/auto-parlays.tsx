// src/components/parlay/auto-parlays.tsx
'use client'

import { motion } from 'framer-motion'
import { useParlayStore } from '@/store'
import { cn } from '@/lib/utils/cn'

interface ScoreRow {
  player: { name: string; id: string }
  hrProbability: number
  nukeScore: number
  edge?: number | null
}

interface Props {
  safe: ScoreRow[]
  aggressive: ScoreRow[]
  sleeper: ScoreRow[]
}

const TYPES = [
  { key: 'safe',       label: '✔ Safe HR Parlay',       color: 'text-nuke-green',  border: 'border-nuke-green/20',  bg: 'bg-nuke-green/5' },
  { key: 'aggressive', label: '⚡ Aggressive HR Parlay', color: 'text-nuke-gold',   border: 'border-nuke-gold/20',   bg: 'bg-nuke-gold/5' },
  { key: 'sleeper',    label: '★ Sleeper HR Parlay',    label2: 'Sleeper', color: 'text-nuke-blue',   border: 'border-nuke-blue/20',   bg: 'bg-nuke-blue/5' },
] as const

function calcCombined(players: ScoreRow[]) {
  if (!players.length) return 0
  return players.reduce((acc, p) => acc * p.hrProbability, 1)
}

function toAmericanOdds(prob: number): string {
  if (!prob) return '—'
  const odds = prob < 0.5 ? Math.round(100 / prob - 100) : Math.round(-100 * prob / (1 - prob))
  return odds > 0 ? `+${odds}` : `${odds}`
}

export function AutoParlays({ safe, aggressive, sleeper }: Props) {
  const addLeg = useParlayStore((s) => s.addLeg)

  const groups = [
    { ...TYPES[0], players: safe },
    { ...TYPES[1], players: aggressive },
    { ...TYPES[2], players: sleeper },
  ]

  return (
    <div className="flex flex-col gap-3">
      {groups.map((g, gi) => {
        const combined = calcCombined(g.players)
        const odds = toAmericanOdds(combined)

        return (
          <motion.div
            key={g.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.08 }}
            className={cn('border rounded-lg p-4', g.border, g.bg)}
          >
            <div className={cn('text-[11px] font-bold uppercase tracking-wide mb-3', g.color)}>
              {g.label}
            </div>

            {g.players.length === 0 ? (
              <div className="text-xs text-nuke-muted py-2">No qualifying players for this parlay type today.</div>
            ) : (
              <>
                <div className="flex flex-col gap-2 mb-3">
                  {g.players.map((p) => (
                    <div key={p.player.id} className="flex items-center justify-between">
                      <div className="text-sm text-white font-medium">{p.player.name} — HR</div>
                      <div className="font-mono text-xs text-nuke-muted2">{(p.hrProbability * 100).toFixed(1)}%</div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/10 pt-3 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-nuke-muted">Combined Prob</div>
                    <div className={cn('font-mono text-sm font-medium mt-0.5', g.color)}>
                      {(combined * 100).toFixed(3)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-nuke-muted">Implied Odds</div>
                    <div className="font-mono text-xl font-medium text-nuke-gold mt-0.5">{odds}</div>
                  </div>
                  <button
                    onClick={() => g.players.forEach((p) => addLeg({ playerId: p.player.id, playerName: p.player.name, hrProb: p.hrProbability }))}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded text-xs font-semibold text-white hover:bg-white/10 transition-all"
                  >
                    Add All →
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
