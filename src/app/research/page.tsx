// src/app/research/page.tsx
import { db } from '@/lib/db'
import { ResearchDatabase } from '@/components/research/research-database'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: { q?: string; team?: string; minHR?: string }
}

export default async function ResearchPage({ searchParams }: Props) {
  const q = searchParams.q ?? ''
  const team = searchParams.team
  const minHR = searchParams.minHR ? parseInt(searchParams.minHR) : undefined

  const where: any = { active: true }
  if (q) where.name = { contains: q, mode: 'insensitive' }
  if (team) where.team = { abbreviation: team }
  if (minHR !== undefined) where.homeRuns = { gte: minHR }

  const [players, totalPlayers] = await Promise.all([
    db.player.findMany({
      where,
      include: { team: true },
      orderBy: [{ homeRuns: 'desc' }, { name: 'asc' }],
      take: 50,
    }),
    db.player.count({ where: { active: true } }),
  ])

  return (
    <ResearchDatabase
      players={players as any}
      totalPlayers={totalPlayers}
      initialQuery={q}
    />
  )
}
