// src/components/lineup/lineup-center.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface LineupPlayer {
  battingOrder: number
  position: string
  confirmed: boolean
  player: {
    id: string
    name: string
    bats: string
    homeRuns: number
    avg: number
    ops: number
    barrelPct: number
  }
  score?: {
    nukeScore: number
    hrProbability: number
  } | null
}

interface GameLineup {
  id: string
  date: Date
  homeTeam: { abbreviation: string; name: string }
  awayTeam: { abbreviation: string; name: string }
  stadium?: { name: string }
  homeLineupConfirmed: boolean
  awayLineupConfirmed: boolean
  homeLineup: LineupPlayer[]
  awayLineup: LineupPlayer[]
}

interface Props {
  games: GameLineup[]
  confirmedCount: number
  pendingCount: number
}

const POSITION_ORDER = ['C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'P']

function SingleLineup({
  players,
  teamAbbr,
  confirmed,
  side,
}: {
  players: LineupPlayer[]
  teamAbbr: string
  confirmed: boolean
  side: 'home' | 'away'
}) {
  const sorted = [...players].sort((a, b) => a.battingOrder - b.battingOrder)

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-condensed font-bold text-lg text-white">{teamAbbr}</span>
        <div className={cn(
          'flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded',
          confirmed
            ? 'bg-nuke-green/10 text-nuke-green border border-nuke-green/20'
            : 'bg-border text-nuke-muted'
        )}>
          {confirmed
            ? <><CheckCircle size={9} /> Confirmed</>
            : <><Clock size={9} /> Projected</>
          }
        </div>
      </div>

      <div className="flex flex-col">
        {sorted.length === 0 ? (
          <div className="text-xs text-nuke-muted py-3">Lineup not yet available</div>
        ) : (
          sorted.map((entry, i) => (
            <motion.div
              key={entry.player.id}
              initial={{ opacity: 0, x: side === 'away' ? -6 : 6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-2.5 py-2 border-b border-[#0f1e30] last:border-0 hover:bg-white/[0.01] transition-colors"
            >
              {/* Batting order */}
              <span className={cn(
                'font-condensed font-bold text-base w-5 text-right shrink-0',
                entry.battingOrder <= 3 ? 'text-nuke-gold' : 'text-nuke-muted'
              )}>
                {entry.battingOrder}
              </span>

              {/* Position */}
              <span className="text-[10px] font-bold text-nuke-muted bg-border rounded px-1 py-0.5 shrink-0 w-8 text-center">
                {entry.position}
              </span>

              {/* Player */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-white truncate">{entry.player.name}</div>
                <div className="text-[9px] text-nuke-muted font-mono">
                  {entry.player.avg.toFixed(3)} / {entry.player.ops.toFixed(3)}
                </div>
              </div>

              {/* Nuke score */}
              {entry.score && (
                <div className="text-right shrink-0">
                  <div className={cn(
                    'font-mono text-xs font-medium',
                    entry.score.hrProbability >= 0.18 ? 'text-nuke-green' :
                    entry.score.hrProbability >= 0.12 ? 'text-nuke-gold' : 'text-nuke-muted2'
                  )}>
                    {(entry.score.hrProbability * 100).toFixed(1)}%
                  </div>
                  <div className="text-[9px] text-nuke-muted">{entry.score.nukeScore}</div>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}

function GameCard({ game, delay }: { game: GameLineup; delay: number }) {
  const [expanded, setExpanded] = useState(game.homeLineupConfirmed || game.awayLineupConfirmed)
  const bothConfirmed = game.homeLineupConfirmed && game.awayLineupConfirmed

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'bg-surface border rounded-lg overflow-hidden',
        bothConfirmed ? 'border-nuke-green/25' : 'border-border'
      )}
    >
      {/* Game header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.01] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="font-condensed font-bold text-lg text-white">
            {game.awayTeam.abbreviation}
            <span className="text-nuke-muted text-sm font-normal mx-2">@</span>
            {game.homeTeam.abbreviation}
          </div>
          <div className="text-xs text-nuke-muted hidden sm:block">
            {game.stadium?.name ?? ''}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {[
              { confirmed: game.awayLineupConfirmed,  label: game.awayTeam.abbreviation },
              { confirmed: game.homeLineupConfirmed, label: game.homeTeam.abbreviation },
            ].map((side) => (
              <span
                key={side.label}
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded',
                  side.confirmed
                    ? 'bg-nuke-green/10 text-nuke-green border border-nuke-green/20'
                    : 'bg-border text-nuke-muted'
                )}
              >
                {side.label} {side.confirmed ? '✓' : '?'}
              </span>
            ))}
          </div>
          {expanded ? <ChevronUp size={14} className="text-nuke-muted" /> : <ChevronDown size={14} className="text-nuke-muted" />}
        </div>
      </button>

      {/* Expanded lineups */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-border">
          <div className="flex gap-4 mt-3">
            {/* Away */}
            <SingleLineup
              players={game.awayLineup}
              teamAbbr={game.awayTeam.abbreviation}
              confirmed={game.awayLineupConfirmed}
              side="away"
            />

            {/* Divider */}
            <div className="w-px bg-border shrink-0" />

            {/* Home */}
            <SingleLineup
              players={game.homeLineup}
              teamAbbr={game.homeTeam.abbreviation}
              confirmed={game.homeLineupConfirmed}
              side="home"
            />
          </div>
        </div>
      )}
    </motion.div>
  )
}

export function LineupCenter({ games, confirmedCount, pendingCount }: Props) {
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending'>('all')

  const filtered = games.filter((g) => {
    if (filter === 'confirmed') return g.homeLineupConfirmed && g.awayLineupConfirmed
    if (filter === 'pending') return !g.homeLineupConfirmed || !g.awayLineupConfirmed
    return true
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
            Lineup <span className="text-nuke-red">Center</span>
          </h1>
          <p className="text-xs text-nuke-muted mt-1">
            Confirmed &amp; projected lineups · Auto-updates when official lineups drop
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Games', value: games.length, color: 'text-white' },
            { label: 'Both Confirmed', value: confirmedCount, color: 'text-nuke-green' },
            { label: 'Pending',        value: pendingCount,   color: 'text-nuke-gold' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-center">
              <div className={`font-mono text-base font-medium ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-nuke-muted uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Lineup confirmed alert */}
      {confirmedCount > 0 && (
        <div className="flex items-center gap-2 bg-nuke-green/5 border border-nuke-green/20 rounded-lg px-4 py-3">
          <CheckCircle size={14} className="text-nuke-green shrink-0" />
          <span className="text-xs text-nuke-green">
            <strong>{confirmedCount}</strong> game{confirmedCount !== 1 ? 's' : ''} with both lineups confirmed — Nuke scores have been recalculated.
          </span>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: 'all' as const, label: 'All Games' },
          { key: 'confirmed' as const, label: '✓ Both Confirmed' },
          { key: 'pending' as const, label: '⏳ Pending' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded border transition-all',
              filter === f.key
                ? 'bg-nuke-red border-nuke-red text-white'
                : 'bg-surface border-border text-nuke-muted2 hover:text-white'
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-[10px] text-nuke-muted">
          <RefreshCw size={10} className="animate-spin" />
          Syncing every 2 min
        </div>
      </div>

      {/* Game cards */}
      <div className="flex flex-col gap-3">
        {filtered.map((game, i) => (
          <GameCard key={game.id} game={game} delay={i * 0.04} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-nuke-muted text-sm">
            No lineups match this filter yet.
          </div>
        )}
      </div>
    </div>
  )
}
