// src/components/dashboard/dashboard-filters.tsx
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { DashboardFilters } from '@/types'

const TEAMS = ['NYY','BOS','BAL','TOR','TB','CWS','CLE','DET','KC','MIN','HOU','LAA','OAK','SEA','TEX','LAD','SF','SD','ARI','COL','CHC','CIN','MIL','PIT','STL','PHI','NYM','WSH','ATL','MIA']

interface Props {
  initialFilters: DashboardFilters
}

export function DashboardFilters({ initialFilters }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useState(initialFilters)
  const [showTeams, setShowTeams] = useState(false)

  function update(key: keyof DashboardFilters, value: string | undefined) {
    const next = { ...filters, [key]: value || undefined }
    setFilters(next)

    const params = new URLSearchParams()
    Object.entries(next).forEach(([k, v]) => { if (v) params.set(k, v) })

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const FilterBtn = ({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 text-xs font-semibold rounded border transition-all uppercase tracking-wide',
        active
          ? 'bg-nuke-red border-nuke-red text-white'
          : 'bg-surface border-border text-nuke-muted2 hover:border-nuke-muted hover:text-white'
      )}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-2 mb-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-nuke-muted" />
          <input
            type="text"
            placeholder="Search player…"
            value={filters.search ?? ''}
            onChange={(e) => update('search', e.target.value)}
            className="bg-surface border border-border rounded px-3 py-1.5 pl-7 text-xs text-white placeholder:text-nuke-muted focus:outline-none focus:border-nuke-muted w-44"
          />
        </div>

        {/* Confidence */}
        <FilterBtn label="All" active={!filters.confidence} onClick={() => update('confidence', undefined)} />
        <FilterBtn label="High Conf" active={filters.confidence === 'high'} onClick={() => update('confidence', filters.confidence === 'high' ? undefined : 'high')} />
        <FilterBtn label="Med Conf" active={filters.confidence === 'med'} onClick={() => update('confidence', filters.confidence === 'med' ? undefined : 'med')} />

        {/* Hand */}
        <FilterBtn label="LHH" active={filters.hand === 'LEFT'} onClick={() => update('hand', filters.hand === 'LEFT' ? undefined : 'LEFT')} />
        <FilterBtn label="RHH" active={filters.hand === 'RIGHT'} onClick={() => update('hand', filters.hand === 'RIGHT' ? undefined : 'RIGHT')} />

        {/* Team picker toggle */}
        <button
          onClick={() => setShowTeams(!showTeams)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-all',
            filters.team || showTeams
              ? 'bg-nuke-red/10 border-nuke-red text-nuke-red'
              : 'bg-surface border-border text-nuke-muted2 hover:text-white'
          )}
        >
          <SlidersHorizontal size={11} />
          {filters.team ?? 'Team'}
        </button>

        {isPending && (
          <span className="text-[10px] text-nuke-muted animate-pulse">Updating…</span>
        )}
      </div>

      {/* Team picker */}
      {showTeams && (
        <div className="flex flex-wrap gap-1.5">
          {TEAMS.map((t) => (
            <button
              key={t}
              onClick={() => {
                update('team', filters.team === t ? undefined : t)
                setShowTeams(false)
              }}
              className={cn(
                'px-2 py-1 text-[10px] font-bold rounded border transition-all',
                filters.team === t
                  ? 'bg-nuke-red border-nuke-red text-white'
                  : 'bg-surface border-border text-nuke-muted2 hover:text-white'
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
