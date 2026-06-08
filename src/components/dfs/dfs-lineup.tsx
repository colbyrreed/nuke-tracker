// src/components/dfs/dfs-lineup.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Download, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface DFSPlayer {
  name: string
  position: string
  team: string
  salary: number
  ownership: number
  hrProb: number
  nukeScore: number
  projPoints: number
}

const SAMPLE_FD_LINEUP: DFSPlayer[] = [
  { name: 'Aaron Judge',     position: 'OF', team: 'NYY', salary: 5400, ownership: 28.4, hrProb: 28.4, nukeScore: 94, projPoints: 14.2 },
  { name: 'Pete Alonso',     position: '1B', team: 'NYM', salary: 5100, ownership: 19.1, hrProb: 21.7, nukeScore: 85, projPoints: 11.8 },
  { name: 'Kyle Tucker',     position: 'OF', team: 'HOU', salary: 4900, ownership: 14.2, hrProb: 16.9, nukeScore: 75, projPoints: 10.4 },
  { name: 'Adolis Garcia',   position: 'OF', team: 'TEX', salary: 4600, ownership: 11.1, hrProb: 17.8, nukeScore: 78, projPoints: 10.1 },
  { name: 'Corey Seager',    position: 'SS', team: 'TEX', salary: 4800, ownership: 12.3, hrProb: 14.8, nukeScore: 71, projPoints: 9.8 },
  { name: 'Matt Olson',      position: '1B', team: 'ATL', salary: 4700, ownership: 9.4,  hrProb: 17.2, nukeScore: 77, projPoints: 10.2 },
  { name: 'Vladimir Guerrero', position: '3B', team: 'TOR', salary: 4800, ownership: 13.1, hrProb: 15.6, nukeScore: 73, projPoints: 9.6 },
  { name: 'Yordan Alvarez',  position: 'DH', team: 'HOU', salary: 4600, ownership: 10.8, hrProb: 14.2, nukeScore: 70, projPoints: 9.3 },
  { name: 'Freddie Freeman', position: 'OF', team: 'LAD', salary: 5000, ownership: 16.7, hrProb: 19.3, nukeScore: 81, projPoints: 11.1 },
]

export function DFSLineup({
  platform = 'FanDuel',
  salaryCap = 35000,
}: {
  platform?: string
  salaryCap?: number
}) {
  const [players, setPlayers] = useState(SAMPLE_FD_LINEUP)
  const [isOptimizing, setIsOptimizing] = useState(false)

  const totalSalary = players.reduce((s, p) => s + p.salary, 0)
  const totalProj = players.reduce((s, p) => s + p.projPoints, 0)
  const salaryPct = (totalSalary / salaryCap) * 100

  async function reoptimize() {
    setIsOptimizing(true)
    await new Promise((r) => setTimeout(r, 1200))
    // In production: call /api/dfs/optimize
    setIsOptimizing(false)
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={14} className="text-nuke-gold" />
          <span className="text-xs font-bold text-nuke-gold uppercase tracking-wide">{platform}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={reoptimize}
            disabled={isOptimizing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-nuke-red/10 text-nuke-red border border-nuke-red/20 rounded hover:bg-nuke-red/20 transition-all disabled:opacity-50"
          >
            <RefreshCw size={11} className={cn(isOptimizing && 'animate-spin')} />
            {isOptimizing ? 'Optimizing…' : 'Re-optimize'}
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-surface border border-border rounded hover:border-nuke-muted transition-all text-nuke-muted2">
            <Download size={11} />
            Export
          </button>
        </div>
      </div>

      {/* Players */}
      <div className="flex flex-col">
        {players.map((player, i) => (
          <motion.div
            key={player.name}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
          >
            {/* Position */}
            <span className="text-[10px] font-bold text-nuke-muted min-w-[28px] text-center bg-surface-2 rounded px-1 py-0.5">
              {player.position}
            </span>

            {/* Name + team */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white truncate">{player.name}</div>
              <div className="text-[10px] text-nuke-muted mt-0.5">{player.team}</div>
            </div>

            {/* HR Prob */}
            <div className={cn(
              'text-xs font-mono font-medium min-w-[42px] text-right',
              player.hrProb >= 20 ? 'text-nuke-green' : player.hrProb >= 14 ? 'text-nuke-gold' : 'text-nuke-muted2'
            )}>
              {player.hrProb.toFixed(1)}%
            </div>

            {/* Own% */}
            <div className="text-[10px] text-nuke-muted min-w-[36px] text-right">
              {player.ownership.toFixed(1)}%
            </div>

            {/* Salary */}
            <div className="font-mono text-xs text-nuke-gold min-w-[48px] text-right">
              ${player.salary.toLocaleString()}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border mt-3 pt-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-nuke-muted">Salary Used</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full', salaryPct > 95 ? 'bg-nuke-green' : 'bg-nuke-gold')}
                style={{ width: `${salaryPct}%` }}
              />
            </div>
            <span className="font-mono text-xs text-nuke-gold">
              ${totalSalary.toLocaleString()} / ${salaryCap.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-nuke-muted">Proj. Points</div>
          <div className="font-mono text-sm text-nuke-green font-medium mt-0.5">{totalProj.toFixed(1)}</div>
        </div>
      </div>
    </div>
  )
}
