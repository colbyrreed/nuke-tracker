// src/components/pitchers/pitcher-table.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface PitcherRow {
  rank: number
  pitcher: {
    id: string; name: string; throws: string; era: number; xERA: number
    hr9: number; flyBallPct: number; hardContactPct: number; barrelPct: number; hrVulnScore: number
  }
  game: { homeTeam: { abbreviation: string }; awayTeam: { abbreviation: string }; stadium?: { name: string } }
  teamSide: string
  weatherBoost: number
  parkFactor: number
}

function VulnBar({ score }: { score: number }) {
  const color = score >= 75 ? '#f04a2a' : score >= 50 ? '#f5b940' : '#22c97e'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="font-condensed font-bold text-lg leading-none" style={{ color }}>{score}</span>
    </div>
  )
}

type SortKey = 'hrVulnScore' | 'hr9' | 'barrelPct' | 'flyBallPct' | 'hardContactPct' | 'xERA'

export function PitcherTable({ pitchers }: { pitchers: PitcherRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('hrVulnScore')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === 'desc' ? 'asc' : 'desc')
    else { setSortKey(key); setSortDir('desc') }
  }

  const sorted = [...pitchers].sort((a, b) => {
    const va = a.pitcher[sortKey]
    const vb = b.pitcher[sortKey]
    return sortDir === 'desc' ? vb - va : va - vb
  })

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      className="px-3 py-2.5 text-left text-[10px] font-semibold text-nuke-muted uppercase tracking-wider border-b border-border cursor-pointer whitespace-nowrap select-none hover:text-white"
      onClick={() => toggleSort(k)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={9} className={sortKey === k ? 'text-nuke-red' : 'text-nuke-muted/40'} />
      </div>
    </th>
  )

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#0d1825]">
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-nuke-muted uppercase tracking-wider border-b border-border">#</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-nuke-muted uppercase tracking-wider border-b border-border">Pitcher</th>
              <SortHeader label="Vuln Score" k="hrVulnScore" />
              <SortHeader label="HR/9" k="hr9" />
              <SortHeader label="Barrel%" k="barrelPct" />
              <SortHeader label="Fly Ball%" k="flyBallPct" />
              <SortHeader label="Hard Contact%" k="hardContactPct" />
              <SortHeader label="xERA" k="xERA" />
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-nuke-muted uppercase tracking-wider border-b border-border">Game</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-nuke-muted uppercase tracking-wider border-b border-border">Weather</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <motion.tr
                key={row.pitcher.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.025 }}
                className="border-b border-[#0f1e30] hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-3 py-3">
                  <span className={cn('font-condensed font-bold text-lg', i < 3 ? 'text-nuke-gold' : 'text-nuke-muted')}>
                    {i + 1}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="font-semibold text-white">{row.pitcher.name}</div>
                  <div className="text-[10px] text-nuke-muted mt-0.5">{row.pitcher.throws}HP</div>
                </td>
                <td className="px-3 py-3">
                  <VulnBar score={row.pitcher.hrVulnScore} />
                </td>
                <td className="px-3 py-3">
                  <span className={cn('font-mono text-sm font-medium',
                    row.pitcher.hr9 >= 1.5 ? 'text-nuke-red' : row.pitcher.hr9 >= 1.0 ? 'text-nuke-gold' : 'text-nuke-green'
                  )}>
                    {row.pitcher.hr9.toFixed(2)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <span className={cn('font-mono text-sm',
                    row.pitcher.barrelPct >= 12 ? 'text-nuke-red' : row.pitcher.barrelPct >= 8 ? 'text-nuke-gold' : 'text-nuke-muted2'
                  )}>
                    {row.pitcher.barrelPct.toFixed(1)}%
                  </span>
                </td>
                <td className="px-3 py-3 font-mono text-sm text-nuke-muted2">{row.pitcher.flyBallPct.toFixed(1)}%</td>
                <td className="px-3 py-3 font-mono text-sm text-nuke-muted2">{row.pitcher.hardContactPct.toFixed(1)}%</td>
                <td className="px-3 py-3">
                  <span className={cn('font-mono text-sm',
                    row.pitcher.xERA >= 4.5 ? 'text-nuke-red' : row.pitcher.xERA >= 3.5 ? 'text-nuke-gold' : 'text-nuke-green'
                  )}>
                    {row.pitcher.xERA.toFixed(2)}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="text-xs text-white">
                    {row.game.awayTeam.abbreviation} @ {row.game.homeTeam.abbreviation}
                  </div>
                  <div className="text-[10px] text-nuke-muted mt-0.5">{row.game.stadium?.name?.split(' ').slice(0, 2).join(' ') ?? '—'}</div>
                </td>
                <td className="px-3 py-3">
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded',
                    row.weatherBoost >= 3 ? 'boost-favorable' : row.weatherBoost <= -3 ? 'boost-unfavorable' : 'boost-neutral'
                  )}>
                    {row.weatherBoost >= 0 ? '+' : ''}{row.weatherBoost.toFixed(1)}%
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
