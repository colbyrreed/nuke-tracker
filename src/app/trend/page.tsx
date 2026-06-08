// src/app/trend/page.tsx
import { db } from '@/lib/db'
import { TrendLab } from '@/components/trend/trend-lab'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export default async function TrendPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Players with today's scores
  const todayScores = await db.dailyScore.findMany({
    where: { date: today, nukeScore: { gte: 50 } },
    orderBy: { nukeScore: 'desc' },
    take: 30,
    include: {
      player: { include: { team: true } },
    },
  })

  const playerIds = todayScores.map((s) => s.playerId)

  // Recent game stats for trend calculation
  const [last7Stats, last30Stats] = await Promise.all([
    db.gamestat.groupBy({
      by: ['playerId'],
      where: { playerId: { in: playerIds }, date: { gte: sevenDaysAgo } },
      _sum: { homeRuns: true, atBats: true },
    }),
    db.gamestat.groupBy({
      by: ['playerId'],
      where: { playerId: { in: playerIds }, date: { gte: thirtyDaysAgo } },
      _sum: { homeRuns: true, atBats: true },
    }),
  ])

  const last7Map = new Map(last7Stats.map((s) => [s.playerId, s._sum]))
  const last30Map = new Map(last30Stats.map((s) => [s.playerId, s._sum]))

  const enriched = todayScores.map((score) => {
    const l7 = last7Map.get(score.playerId)
    const l30 = last30Map.get(score.playerId)

    const hrRate7  = l7?.atBats  ? (l7.homeRuns  ?? 0) / l7.atBats  : 0
    const hrRate30 = l30?.atBats ? (l30.homeRuns ?? 0) / l30.atBats : 0

    // Surge = recent rate vs baseline rate
    const surge = hrRate30 > 0 ? hrRate7 / hrRate30 - 1 : 0

    return {
      player: score.player,
      score,
      hrRate7,
      hrRate30,
      surge,
      last7HRs:  l7?.homeRuns  ?? 0,
      last30HRs: l30?.homeRuns ?? 0,
      trend: surge > 0.3 ? 'hot' : surge < -0.3 ? 'cold' : 'neutral',
    }
  })

  // Sort by surge for "hottest hitters" view
  const hottest = [...enriched].sort((a, b) => b.surge - a.surge)
  const coldest = [...enriched].sort((a, b) => a.surge - b.surge).slice(0, 5)

  return (
    <TrendLab
      hottest={hottest as any}
      coldest={coldest as any}
    />
  )
}
