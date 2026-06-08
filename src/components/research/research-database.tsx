// src/components/research/research-database.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, Database, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface Player {
  id: string
  name: string
  position: string
  bats: string
  homeRuns: number
  avg: number
  ops: number
  barrelPct: number
  hardHitPct: number
  avgExitVelo: number
  xSLG: number
  iso: number
  team?: { abbreviation: string; name: string }
}

interface Props {
  players: Player[]
  totalPlayers: number
  initialQuery: string
}

const TEAMS = ['NYY','BOS','BAL','TOR','TB','CWS','CLE','DET','KC','MIN','HOU','LAA','OAK','SEA','TEX','LAD','SF','SD','ARI','COL','CHC','CIN','MIL','PIT','STL','PHI','NYM','WSH','ATL','MIA']

export function ResearchDatabase({ players, totalPlayers, initialQuery }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(initialQuery)
  const [team, setTeam] = useState('')
  const [sortKey, setSortKey] = useState<keyof Player>('homeRuns')

  function search(q: string, t?: string) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (t ?? team) params.set('team', t ?? team)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  const sorted = [...players].sort((a, b) => {
    const va = a[sortKey] as number
    const vb = b[sortKey] as number
    return vb - va
  })

  const SortBtn = ({ k, label }: { k: keyof Player; label: string }) => (
    <button
      onClick={() => setSortKey(k)}
      className={cn(
        'text-[10px] font-semibold px-2 py-1 rounded transition-all',
        sortKey === k ? 'bg-nuke-red text-white' : 'text-nuke-muted hover:text-white'
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Database className="text-nuke-blue" size={24} />
          <div>
            <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
              Research <span className="text-nuke-red">Database</span>
            </h1>
            <p className="text-xs text-nuke-muted mt-1">
              {totalPlayers} active players · Full Statcast profiles · Advanced filters
            </p>
          </div>
        </div>
        <div className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-center">
          <div className="font-mono text-base text-white">{totalPlayers}</div>
          <div className="text-[10px] text-nuke-muted uppercase tracking-wide">Players</div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-nuke-muted" />
          <input
            type="text"
            placeholder="Search player name…"
            value={query}
            onChange={(e) => { setQuery(e.target.value); search(e.target.value) }}
            className="w-full bg-surface border border-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-nuke-muted focus:outline-none focus:border-nuke-muted"
          />
        </div>
        <select
          value={team}
          onChange={(e) => { setTeam(e.target.value); search(query, e.target.value) }}
          className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-nuke-muted"
        >
          <option value="">All Teams</option>
          {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {isPending && <span className="text-[10px] text-nuke-muted animate-pulse">Searching…</span>}
      </div>

      {/* Sort controls */}
      <div className="flex gap-1 flex-wrap">
        <span className="text-[10px] text-nuke-muted self-center mr-1">Sort by:</span>
        <SortBtn k="homeRuns"    label="HR" />
        <SortBtn k="barrelPct"  label="Barrel%" />
        <SortBtn k="avgExitVelo" label="Exit Velo" />
        <SortBtn k="xSLG"       label="xSLG" />
        <SortBtn k="hardHitPct" label="Hard Hit%" />
        <SortBtn k="iso"        label="ISO" />
        <SortBtn k="ops"        label="OPS" />
      </div>

      {/* Player table */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#0d1825] border-b border-border">
                {['Player', 'Tm', 'Pos', 'HR', 'AVG', 'OPS', 'Barrel%', 'HardHit%', 'EV', 'xSLG', 'ISO', ''].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[10px] font-semibold text-nuke-muted uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((player, i) => (
                <motion.tr
                  key={player.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.015 }}
                  className="border-b border-[#0f1e30] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-3 py-2.5 font-semibold text-white whitespace-nowrap">{player.name}</td>
                  <td className="px-3 py-2.5 text-nuke-muted">{player.team?.abbreviation ?? '—'}</td>
                  <td className="px-3 py-2.5 text-nuke-muted">{player.position}</td>
                  <td className="px-3 py-2.5 font-mono font-bold text-nuke-red">{player.homeRuns}</td>
                  <td className="px-3 py-2.5 font-mono text-nuke-muted2">{player.avg.toFixed(3)}</td>
                  <td className="px-3 py-2.5 font-mono text-nuke-muted2">{player.ops.toFixed(3)}</td>
                  <td className="px-3 py-2.5 font-mono">
                    <span className={cn(player.barrelPct >= 10 ? 'text-nuke-green' : player.barrelPct >= 7 ? 'text-nuke-gold' : 'text-nuke-muted2')}>
                      {player.barrelPct.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-nuke-muted2">{player.hardHitPct.toFixed(1)}%</td>
                  <td className="px-3 py-2.5 font-mono">
                    <span className={cn(player.avgExitVelo >= 92 ? 'text-nuke-green' : 'text-nuke-muted2')}>
                      {player.avgExitVelo.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-nuke-muted2">{player.xSLG.toFixed(3)}</td>
                  <td className="px-3 py-2.5 font-mono text-nuke-muted2">{player.iso.toFixed(3)}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/player/${player.id}`} className="p-1 rounded hover:bg-white/5 text-nuke-muted hover:text-nuke-blue transition-all inline-block">
                      <ExternalLink size={12} />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {players.length === 0 && (
          <div className="py-12 text-center text-nuke-muted text-sm">
            No players found. Try a different search or filter.
          </div>
        )}
      </div>
    </div>
  )
}
