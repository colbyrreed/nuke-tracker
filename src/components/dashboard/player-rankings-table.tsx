// src/components/dashboard/player-rankings-table.tsx
'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from '@tanstack/react-table'
import { ArrowUpDown, ArrowUp, ArrowDown, Plus } from 'lucide-react'
import type { DashboardPlayer } from '@/types'
import { useParlayStore } from '@/store'
import { cn } from '@/lib/utils/cn'

const col = createColumnHelper<DashboardPlayer>()

function NukeScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            score >= 80 ? 'bg-nuke-green' : score >= 60 ? 'bg-nuke-gold' : 'bg-nuke-red/70'
          )}
        />
      </div>
      <span className="font-mono text-xs text-white min-w-[2ch] text-right">{score}</span>
    </div>
  )
}

function HRProbBadge({ prob }: { prob: number }) {
  const pct = (prob * 100).toFixed(1)
  return (
    <span className={cn(
      'font-mono text-sm font-medium',
      prob >= 0.2 ? 'text-nuke-green' : prob >= 0.14 ? 'text-nuke-gold' : 'text-nuke-muted2'
    )}>
      {pct}%
    </span>
  )
}

function BoostBadge({ value, label }: { value: number; label: string }) {
  if (Math.abs(value) < 0.5) {
    return <span className="boost-neutral">—</span>
  }
  return (
    <span className={value > 0 ? 'boost-favorable' : 'boost-unfavorable'}>
      {value > 0 ? '↑' : '↓'}{label}
    </span>
  )
}

function ConfidenceDot({ confidence }: { confidence: number }) {
  const level = confidence >= 0.75 ? 'high' : confidence >= 0.45 ? 'med' : 'low'
  const labels = { high: 'High', med: 'Med', low: 'Low' }
  const colors = { high: 'bg-nuke-green', med: 'bg-nuke-gold', low: 'bg-nuke-muted' }
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('w-2 h-2 rounded-full', colors[level])} />
      <span className={cn('text-xs', `conf-${level}`)}>{labels[level]}</span>
    </div>
  )
}

function PlayerCell({ player }: { player: DashboardPlayer }) {
  const initials = player.player.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-[10px] font-bold text-nuke-muted2 shrink-0">
        {initials}
      </div>
      <div>
        <div className="text-sm font-semibold text-white leading-none">{player.player.name}</div>
        <div className="text-[10px] text-nuke-muted mt-0.5">
          {player.team?.abbreviation} · {player.pitcher?.name ?? 'vs TBD'}
        </div>
      </div>
    </div>
  )
}

function EdgeCell({ edge, bookOdds }: { edge?: number | null; bookOdds?: number | null }) {
  if (edge == null || bookOdds == null) return <span className="text-nuke-muted text-xs">—</span>
  const edgePct = (edge * 100).toFixed(1)
  return (
    <div>
      <div className={cn('text-sm font-mono font-medium', edge > 0 ? 'text-nuke-green' : 'text-red-400')}>
        {edge > 0 ? '+' : ''}{edgePct}%
      </div>
      <div className="text-[10px] text-nuke-muted">Book: {(bookOdds * 100).toFixed(1)}%</div>
    </div>
  )
}

export function PlayerRankingsTable({ players }: { players: DashboardPlayer[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const router = useRouter()
  const addLeg = useParlayStore((s) => s.addLeg)

  const columns = [
    col.accessor('rank', {
      header: '#',
      cell: (info) => {
        const rank = info.getValue()
        return (
          <span className={cn(
            'font-condensed font-bold text-lg w-8 inline-block text-right',
            rank && rank <= 3 ? 'text-nuke-gold' : 'text-nuke-muted'
          )}>
            {rank ?? '—'}
          </span>
        )
      },
      size: 40,
    }),

    col.display({
      id: 'player',
      header: 'Player',
      cell: (info) => <PlayerCell player={info.row.original} />,
      size: 200,
    }),

    col.accessor((row) => row.score.hrProbability, {
      id: 'hrProb',
      header: 'HR Prob',
      cell: (info) => <HRProbBadge prob={info.getValue()} />,
      size: 80,
    }),

    col.accessor((row) => row.score.nukeScore, {
      id: 'nukeScore',
      header: 'Nuke Score',
      cell: (info) => <NukeScoreBar score={info.getValue()} />,
      size: 130,
    }),

    col.accessor((row) => row.score.confidence, {
      id: 'confidence',
      header: 'Confidence',
      cell: (info) => <ConfidenceDot confidence={info.getValue()} />,
      size: 90,
    }),

    col.accessor((row) => row.score.weatherBoost, {
      id: 'weather',
      header: 'Weather',
      cell: (info) => <BoostBadge value={info.getValue()} label={`${Math.abs(info.getValue()).toFixed(0)}%`} />,
      size: 80,
    }),

    col.accessor((row) => row.score.parkBoost, {
      id: 'park',
      header: 'Park',
      cell: (info) => <BoostBadge value={info.getValue()} label={`${Math.abs(info.getValue()).toFixed(0)}%`} />,
      size: 80,
    }),

    col.display({
      id: 'edge',
      header: 'Value Edge',
      cell: (info) => (
        <EdgeCell
          edge={info.row.original.score.edge}
          bookOdds={info.row.original.score.bookOdds}
        />
      ),
      size: 90,
    }),

    col.display({
      id: 'actions',
      header: '',
      cell: (info) => {
        const p = info.row.original
        return (
          <button
            onClick={(e) => {
              e.stopPropagation()
              addLeg({
                playerId: p.player.id,
                playerName: p.player.name,
                hrProb: p.score.hrProbability,
              })
            }}
            className="p-1.5 rounded bg-nuke-red/0 hover:bg-nuke-red/10 text-nuke-muted hover:text-nuke-red transition-all"
            title="Add to parlay"
          >
            <Plus size={14} />
          </button>
        )
      },
      size: 40,
    }),
  ]

  const table = useReactTable({
    data: players,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="rounded-lg border border-border bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-[#0d1825]">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize() }}
                    className="px-3 py-2.5 text-left text-[10px] font-semibold text-nuke-muted uppercase tracking-wider border-b border-border whitespace-nowrap"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={cn('flex items-center gap-1', header.column.getCanSort() && 'cursor-pointer select-none hover:text-white')}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <span className="text-nuke-muted/50">
                            {header.column.getIsSorted() === 'asc' ? <ArrowUp size={10} /> :
                             header.column.getIsSorted() === 'desc' ? <ArrowDown size={10} /> :
                             <ArrowUpDown size={10} />}
                          </span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            <AnimatePresence>
              {table.getRowModel().rows.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onMouseEnter={() => setHoveredRow(row.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => router.push(`/player/${row.original.player.id}`)}
                  className={cn(
                    'border-b border-[#0f1e30] cursor-pointer transition-colors',
                    hoveredRow === row.id ? 'bg-white/[0.02]' : ''
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2.5 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {players.length === 0 && (
        <div className="py-16 text-center text-nuke-muted text-sm">
          No players found for today. Run the data sync to populate scores.
        </div>
      )}
    </div>
  )
}
