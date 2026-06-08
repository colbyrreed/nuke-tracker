// src/lib/data/dashboard.ts
import { db } from '@/lib/db'
import { cache } from '@/lib/utils/cache'
import type { DashboardPlayer, DashboardFilters, Game, ValuePlay } from '@/types'

export async function getDashboardData(filters: DashboardFilters = {}) {
  const today = new Date().toISOString().split('T')[0]
  const cacheKey = `dashboard:${today}:${JSON.stringify(filters)}`

  return cache.getOrSet(cacheKey, async () => {
    // Build player where clause
    const where: any = {
      date: new Date(today),
      player: { active: true },
    }
    if (filters.team) where.player.team = { abbreviation: filters.team }
    if (filters.hand) where.player.bats = filters.hand
    if (filters.confidence) {
      const ranges: Record<string, any> = {
        high: { gte: 0.75 },
        med:  { gte: 0.45, lt: 0.75 },
        low:  { gte: 0, lt: 0.45 },
      }
      where.confidence = ranges[filters.confidence]
    }
    if (filters.search) {
      where.player.name = { contains: filters.search, mode: 'insensitive' }
    }

    const [scores, games, hrEvents] = await Promise.all([
      db.dailyScore.findMany({
        where,
        orderBy: { nukeScore: 'desc' },
        take: 50,
        include: {
          player: { include: { team: { include: { stadium: true } } } },
        },
      }),
      db.game.findMany({
        where: {
          date: { gte: new Date(`${today}T00:00:00`), lt: new Date(`${today}T23:59:59`) },
        },
        include: { homeTeam: true, awayTeam: true, weather: true, stadium: true },
      }),
      db.statcastEvent.count({
        where: {
          isHomeRun: true,
          gameDate: { gte: new Date(`${today}T00:00:00`) },
        },
      }),
    ])

    const players: DashboardPlayer[] = scores.map((s) => ({
      rank: s.rank ?? 0,
      player: s.player as any,
      team: (s.player as any).team ?? null,
      opponent: null,
      game: null,
      score: s as any,
      weather: null,
      stadium: (s.player as any).team?.stadium ?? null,
      pitcher: null,
    }))

    const avgWeatherBoost = scores.length > 0
      ? scores.reduce((sum, s) => sum + s.weatherBoost, 0) / scores.length
      : 0

    return {
      players,
      games: games as any[],
      gameCount: games.length,
      playerCount: scores.length,
      hrsTodayCount: hrEvents,
      avgWeatherBoost,
    }
  }, 60)
}

export async function getValuePlays(): Promise<ValuePlay[]> {
  const today = new Date().toISOString().split('T')[0]
  const cacheKey = `value:${today}`

  return cache.getOrSet(cacheKey, async () => {
    const scores = await db.dailyScore.findMany({
      where: {
        date: new Date(today),
        edge: { gt: 0 },
        bookOdds: { not: null },
      },
      orderBy: { edge: 'desc' },
      take: 20,
      include: {
        player: { include: { team: true } },
      },
    })

    // Get best book per player
    const odds = await db.playerOdds.findMany({
      where: {
        playerId: { in: scores.map((s) => s.playerId) },
        date: new Date(today),
      },
      orderBy: { impliedProb: 'asc' }, // best value = lowest book implied prob
    })

    const oddsMap = new Map<string, (typeof odds)[0]>()
    for (const o of odds) {
      if (!oddsMap.has(o.playerId)) oddsMap.set(o.playerId, o)
    }

    return scores
      .filter((s) => s.edge !== null && s.bookOdds !== null)
      .map((s) => {
        const bestOdds = oddsMap.get(s.playerId)
        return {
          player: {
            rank: s.rank ?? 0,
            player: s.player as any,
            team: (s.player as any).team ?? null,
            opponent: null, game: null, score: s as any,
            weather: null, stadium: null, pitcher: null,
          },
          modelProb: s.hrProbability,
          bookProb: s.bookOdds!,
          bestBook: bestOdds?.book ?? 'DRAFTKINGS',
          edge: s.edge!,
          odds: bestOdds?.overOdds ?? 0,
        } as ValuePlay
      })
  }, 60)
}

export async function getPitcherTargets() {
  const today = new Date().toISOString().split('T')[0]

  const starters = await db.gamePitcher.findMany({
    where: {
      role: 'STARTER',
      game: {
        date: { gte: new Date(`${today}T00:00:00`), lt: new Date(`${today}T23:59:59`) },
      },
    },
    include: {
      pitcher: true,
      game: { include: { homeTeam: true, awayTeam: true } },
    },
    orderBy: { pitcher: { hrVulnScore: 'desc' } },
  })

  return starters.map((sp, i) => ({
    rank: i + 1,
    pitcher: sp.pitcher,
    game: sp.game,
    teamSide: sp.teamSide,
  }))
}

export async function getTopInsights(limit = 10) {
  const today = new Date().toISOString().split('T')[0]

  return db.dailyScore.findMany({
    where: { date: new Date(today) },
    orderBy: { nukeScore: 'desc' },
    take: limit,
    include: {
      player: { include: { team: { include: { stadium: true } } } },
    },
  })
}

export async function getPlayerProfile(playerId: string) {
  const player = await db.player.findUnique({
    where: { id: playerId },
    include: { team: { include: { stadium: true } } },
  })

  if (!player) return null

  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [todayScore, recentGames, statcastEvents] = await Promise.all([
    db.dailyScore.findUnique({
      where: { playerId_date: { playerId, date: new Date(today) } },
    }),
    db.gamestat.findMany({
      where: { playerId, date: { gte: thirtyDaysAgo } },
      orderBy: { date: 'desc' },
      take: 30,
      include: { game: { include: { homeTeam: true, awayTeam: true } } },
    }),
    db.statcastEvent.findMany({
      where: { playerId, gameDate: { gte: thirtyDaysAgo } },
      orderBy: { gameDate: 'desc' },
      take: 100,
    }),
  ])

  return { player, todayScore, recentGames, statcastEvents }
}

export async function getModelAccuracy() {
  const [latest, history] = await Promise.all([
    db.modelAccuracy.findFirst({ orderBy: { date: 'desc' } }),
    db.modelAccuracy.findMany({
      orderBy: { date: 'desc' },
      take: 30,
    }),
  ])
  return { latest, history }
}
