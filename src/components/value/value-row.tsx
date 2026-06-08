// src/components/value/value-row.tsx
'use client'

import { motion } from 'framer-motion'
import { Plus, ExternalLink } from 'lucide-react'
import type { ValuePlay } from '@/types'
import { useParlayStore } from '@/store'
import { cn } from '@/lib/utils/cn'

interface Props {
  play: ValuePlay
  rank: number
  delay?: number
}

const BOOK_COLORS: Record<string, string> = {
  DRAFTKINGS: 'text-[#53d337]',
  FANDUEL:    'text-[#1493ff]',
  BETMGM:     'text-[#f5a623]',
  CAESARS:    'text-[#c8a96e]',
}

const BOOK_LABELS: Record<string, string> = {
  DRAFTKINGS: 'DraftKings',
  FANDUEL:    'FanDuel',
  BETMGM:     'BetMGM',
  CAESARS:    'Caesars',
}

export function ValueRow({ play, rank, delay = 0 }: Props) {
  const addLeg = useParlayStore((s) => s.addLeg)
  const edgePct = (play.edge * 100).toFixed(1)
  const modelPct = (play.modelProb * 100).toFixed(1)
  const bookPct = (play.bookProb * 100).toFixed(1)

  const edgeWidth = Math.min((play.edge / 0.15) * 100, 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-4"
    >
      {/* Rank */}
      <span className={cn(
        'font-condensed font-bold text-xl min-w-[2rem] text-right',
        rank <= 3 ? 'text-nuke-gold' : 'text-nuke-muted'
      )}>
        {rank}
      </span>

      {/* Player */}
      <div className="min-w-[140px]">
        <div className="text-sm font-semibold text-white">{play.player.player.name}</div>
        <div className="text-[10px] text-nuke-muted mt-0.5">{play.player.team?.abbreviation ?? '—'}</div>
      </div>

      {/* Model prob */}
      <div className="text-center min-w-[70px]">
        <div className="text-[10px] text-nuke-muted uppercase tracking-wide">Model</div>
        <div className="font-mono text-sm text-white font-medium">{modelPct}%</div>
      </div>

      {/* Arrow */}
      <div className="text-nuke-muted text-xs">→</div>

      {/* Book prob */}
      <div className="text-center min-w-[70px]">
        <div className="text-[10px] text-nuke-muted uppercase tracking-wide">Book</div>
        <div className="font-mono text-sm text-nuke-muted2 font-medium">{bookPct}%</div>
      </div>

      {/* Edge */}
      <div className="text-center min-w-[70px]">
        <div className="text-[10px] text-nuke-muted uppercase tracking-wide">Edge</div>
        <div className={cn('font-mono text-sm font-bold', play.edge > 0 ? 'text-nuke-green' : 'text-red-400')}>
          {play.edge > 0 ? '+' : ''}{edgePct}%
        </div>
      </div>

      {/* Edge bar */}
      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${edgeWidth}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.1 }}
          className="h-full rounded-full bg-nuke-green"
        />
      </div>

      {/* Best book */}
      <div className={cn('text-xs font-semibold min-w-[80px]', BOOK_COLORS[play.bestBook] ?? 'text-nuke-muted2')}>
        {BOOK_LABELS[play.bestBook] ?? play.bestBook}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => addLeg({
            playerId: play.player.player.id,
            playerName: play.player.player.name,
            hrProb: play.modelProb,
            bookProb: play.bookProb,
          })}
          className="p-1.5 rounded bg-nuke-red/0 hover:bg-nuke-red/10 text-nuke-muted hover:text-nuke-red transition-all"
          title="Add to parlay"
        >
          <Plus size={14} />
        </button>
        <button
          className="p-1.5 rounded hover:bg-white/5 text-nuke-muted hover:text-white transition-all"
          title="Open at sportsbook"
        >
          <ExternalLink size={14} />
        </button>
      </div>
    </motion.div>
  )
}
