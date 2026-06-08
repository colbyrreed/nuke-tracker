// src/components/dashboard/live-games-sidebar.tsx
'use client'

import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import type { Game } from '@/types'
import { cn } from '@/lib/utils/cn'

function GameRow({ game, delay }: { game: Game; delay: number }) {
  const isLive = game.status === 'IN_PROGRESS'
  const isFinal = game.status === 'FINAL'
  const hrEnv = game.hrEnvironment

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="px-3 py-2.5 border-b border-border last:border-0 hover:bg-white/[0.01] transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          {isLive && <span className="w-1.5 h-1.5 rounded-full bg-nuke-green animate-pulse" />}
          <span className="text-xs font-semibold text-white">
            {game.awayTeam.abbreviation} @ {game.homeTeam.abbreviation}
          </span>
        </div>
        <div className={cn(
          'text-[10px] font-mono',
          isLive ? 'text-nuke-green' : isFinal ? 'text-nuke-muted' : 'text-nuke-muted2'
        )}>
          {isLive
            ? `▲${game.inning}`
            : isFinal
            ? 'Final'
            : new Date(game.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
          }
        </div>
      </div>

      {isLive && (
        <div className="flex items-center justify-between mb-1">
          <span className="font-mono text-sm text-white">{game.awayScore} - {game.homeScore}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1 bg-border rounded overflow-hidden">
          <div
            className={cn(
              'h-full rounded',
              hrEnv >= 75 ? 'bg-nuke-green' : hrEnv >= 55 ? 'bg-nuke-gold' : 'bg-nuke-muted'
            )}
            style={{ width: `${hrEnv}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-nuke-muted">{hrEnv} env</span>
      </div>
    </motion.div>
  )
}

export function LiveGamesSidebar({ games }: { games: Game[] }) {
  const sorted = [...games].sort((a, b) => {
    if (a.status === 'IN_PROGRESS') return -1
    if (b.status === 'IN_PROGRESS') return 1
    return 0
  })

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden sticky top-4">
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-[#0d1825]">
        <Activity size={12} className="text-nuke-muted" />
        <span className="text-[10px] font-semibold text-nuke-muted uppercase tracking-wide">Games Today</span>
        <span className="ml-auto text-[10px] font-mono text-nuke-muted">{games.length}</span>
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        {sorted.map((game, i) => (
          <GameRow key={game.id} game={game} delay={i * 0.03} />
        ))}
        {games.length === 0 && (
          <div className="py-8 text-center text-nuke-muted text-xs">No games today</div>
        )}
      </div>
    </div>
  )
}
