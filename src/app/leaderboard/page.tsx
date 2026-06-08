// src/app/leaderboard/page.tsx
import { db } from '@/lib/db'
import { LeaderboardPage } from '@/components/leaderboard/leaderboard'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export default async function LeaderboardsPage() {
  const seasonStart = new Date('2026-03-28')

  // Top HR hitters by season total
  const topHRHitters = await db.gamestat.groupBy({
    by: ['playerId'],
    where: { date: { gte: seasonStart } },
    _sum: { homeRuns: true },
    orderBy: { _sum: { homeRuns: 'desc' } },
    take: 10,
  })

  const hrPlayerIds = topHRHitters.map((p) => p.playerId)
  const hrPlayers = await db.player.findMany({
    where: { id: { in: hrPlayerIds } },
    include: { team: true },
  })
  const hrPlayerMap = new Map(hrPlayers.map((p) => [p.id, p]))

  // Top value plays (highest avg edge)
  const topValuePlays = await db.dailyScore.groupBy({
    by: ['playerId'],
    where: { date: { gte: seasonStart }, edge: { gt: 0 } },
    _avg: { edge: true },
    _count: { id: true },
    orderBy: { _avg: { edge: 'desc' } },
    take: 10,
    having: { edge: { _count: { gte: 5 } } },
  })

  const valuePlayerIds = topValuePlays.map((p) => p.playerId)
  const valuePlayers = await db.player.findMany({
    where: { id: { in: valuePlayerIds } },
    include: { team: true },
  })
  const valuePlayerMap = new Map(valuePlayers.map((p) => [p.id, p]))

  // Most accurate predictions (players where actual HR matched high prob prediction)
  const correctPredictions = await db.modelPrediction.groupBy({
    by: ['playerId'],
    where: {
      date: { gte: seasonStart },
      actualResult: true,
      predictedProb: { gte: 0.15 },
    },
    _count: { id: true },
    orderBy: { _count: { id: 'desc' } },
    take: 10,
  })

  const predPlayerIds = correctPredictions.map((p) => p.playerId)
  const predPlayers = await db.player.findMany({
    where: { id: { in: predPlayerIds } },
    include: { team: true },
  })
  const predPlayerMap = new Map(predPlayers.map((p) => [p.id, p]))

  // Model accuracy over time
  const modelHistory = await db.modelAccuracy.findMany({
    orderBy: { date: 'desc' },
    take: 7,
  })

  const seasonROI = modelHistory.length
    ? modelHistory.reduce((s, h) => s + h.roi, 0) / modelHistory.length
    : 0

  return (
    <LeaderboardPage
      hrLeaders={topHRHitters.map((p, i) => ({
        rank: i + 1,
        player: hrPlayerMap.get(p.playerId),
        totalHRs: p._sum.homeRuns ?? 0,
      })) as any}
      valueLeaders={topValuePlays.map((p, i) => ({
        rank: i + 1,
        player: valuePlayerMap.get(p.playerId),
        avgEdge: p._avg.edge ?? 0,
        plays: p._count.id,
      })) as any}
      predLeaders={correctPredictions.map((p, i) => ({
        rank: i + 1,
        player: predPlayerMap.get(p.playerId),
        correctPredictions: p._count.id,
      })) as any}
      seasonROI={seasonROI}
    />
  )
}
