// src/app/dashboard/page.tsx
import { Suspense } from 'react'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardFilters } from '@/components/dashboard/dashboard-filters'
import { PlayerRankingsTable } from '@/components/dashboard/player-rankings-table'
import { StatsStrip } from '@/components/dashboard/stats-strip'
import { LiveGamesSidebar } from '@/components/dashboard/live-games-sidebar'
import { getDashboardData } from '@/lib/data/dashboard'
import type { DashboardFilters as Filters } from '@/types'

interface Props {
  searchParams: {
    team?: string
    position?: string
    confidence?: string
    hand?: string
    search?: string
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function DashboardPage({ searchParams }: Props) {
  const filters: Filters = {
    team: searchParams.team,
    confidence: searchParams.confidence as Filters['confidence'],
    hand: searchParams.hand as Filters['hand'],
    search: searchParams.search,
  }

  const data = await getDashboardData(filters)

  return (
    <div className="flex flex-col gap-4">
      <StatsStrip
        gameCount={data.gameCount}
        playerCount={data.playerCount}
        hrsTodayCount={data.hrsTodayCount}
        avgWeatherBoost={data.avgWeatherBoost}
      />

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <DashboardFilters initialFilters={filters} />

          <Suspense fallback={<TableSkeleton />}>
            <PlayerRankingsTable players={data.players} />
          </Suspense>
        </div>

        <div className="w-72 shrink-0 hidden xl:block">
          <LiveGamesSidebar games={data.games} />
        </div>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-surface animate-pulse">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="h-14 border-b border-border last:border-0" />
      ))}
    </div>
  )
}
