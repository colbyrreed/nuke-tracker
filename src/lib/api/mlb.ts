// src/lib/api/mlb.ts
// MLB Stats API, Statcast, Weather, Odds integrations

import axios from 'axios'
import { cache } from '../utils/cache'
import type { Game, Player, Pitcher, Weather, PlayerOdds } from '@/types'

const MLB_API = 'https://statsapi.mlb.com/api/v1'
const SAVANT_API = 'https://baseballsavant.mlb.com'
const WEATHER_API = 'https://api.openweathermap.org/data/2.5'
const TOMORROW_API = 'https://api.tomorrow.io/v4'
const ODDS_API = 'https://api.the-odds-api.com/v4'

// ─── MLB Stats API ────────────────────────────────────────────────────────────

export async function fetchTodaysGames(): Promise<Game[]> {
  const cacheKey = `games:${todayString()}`
  return cache.getOrSet(cacheKey, async () => {
    const { data } = await axios.get(`${MLB_API}/schedule`, {
      params: {
        sportId: 1,
        date: todayString(),
        hydrate: 'team,venue,weather,linescore,probablePitcher,lineups',
      },
    })
    return transformGames(data.dates?.[0]?.games ?? [])
  }, 60) // 60s TTL
}

export async function fetchGameLineup(gameId: string) {
  const cacheKey = `lineup:${gameId}`
  return cache.getOrSet(cacheKey, async () => {
    const { data } = await axios.get(`${MLB_API}/game/${gameId}/boxscore`, {
      params: { hydrate: 'player' },
    })
    return transformLineup(data)
  }, 30)
}

export async function fetchPlayer(playerId: string): Promise<Player | null> {
  const cacheKey = `player:${playerId}`
  return cache.getOrSet(cacheKey, async () => {
    const { data } = await axios.get(`${MLB_API}/people/${playerId}`, {
      params: { hydrate: 'stats(type=season,type=career)' },
    })
    return transformPlayer(data.people?.[0])
  }, 300)
}

export async function fetchRoster(teamId: string) {
  const cacheKey = `roster:${teamId}:${todayString()}`
  return cache.getOrSet(cacheKey, async () => {
    const { data } = await axios.get(`${MLB_API}/teams/${teamId}/roster`, {
      params: { rosterType: 'active' },
    })
    return data.roster ?? []
  }, 3600)
}

export async function fetchAllActiveRosters() {
  const { data } = await axios.get(`${MLB_API}/teams`, {
    params: { sportId: 1, season: 2026 },
  })
  const teams = data.teams ?? []
  const rosters = await Promise.all(
    teams.map((t: { id: number }) => fetchRoster(String(t.id)))
  )
  return rosters.flat()
}

// ─── Baseball Savant / Statcast ───────────────────────────────────────────────

export async function fetchStatcast(playerId: string) {
  const cacheKey = `statcast:${playerId}:${todayString()}`
  return cache.getOrSet(cacheKey, async () => {
    // Savant provides CSV/JSON search endpoint
    const { data } = await axios.get(`${SAVANT_API}/statcast_search`, {
      params: {
        hfPT: '',
        hfAB: 'home_run%7C',
        hfBBT: '',
        hfPR: '',
        hfZ: '',
        stadium: '',
        hfBBL: '',
        hfNewZones: '',
        hfGT: 'R%7C',
        hfC: '',
        hfSea: '2026%7C',
        hfSit: '',
        player_type: 'batter',
        hfOuts: '',
        opponent: '',
        pitcher_throws: '',
        batter_stands: '',
        hfSA: '',
        game_date_gt: '',
        game_date_lt: '',
        hfMo: '',
        hfTeam: '',
        home_road: '',
        hfRO: '',
        position: '',
        hfInfield: '',
        hfOutfield: '',
        hfInn: '',
        hfBBD: '',
        hfFlag: '',
        metric_1: '',
        group_by: 'name',
        min_pitches: 0,
        min_results: 0,
        player_event_sort: 'api_p_release_speed',
        sort_col: 'pitches',
        player_col: 'P',
        sort_order: 'desc',
        min_pas: 0,
        type: 'details',
        player_id: playerId,
      },
    })
    return parseStatcastCSV(data)
  }, 300)
}

export async function fetchPlayerStatcastSummary(playerId: string) {
  const cacheKey = `statcast_summary:${playerId}`
  return cache.getOrSet(cacheKey, async () => {
    const { data } = await axios.get(
      `${SAVANT_API}/api/statcast/player/summary`,
      { params: { player_id: playerId, season: 2026 } }
    )
    return data
  }, 300)
}

export async function fetchRecentHRs(playerId: string, days = 30) {
  const cacheKey = `recent_hrs:${playerId}:${days}`
  return cache.getOrSet(cacheKey, async () => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const { data } = await axios.get(`${SAVANT_API}/statcast_search`, {
      params: {
        hfAB: 'home_run%7C',
        player_type: 'batter',
        player_id: playerId,
        game_date_gt: since.toISOString().split('T')[0],
        type: 'details',
      },
    })
    return parseStatcastCSV(data)
  }, 120)
}

// ─── Weather ──────────────────────────────────────────────────────────────────

export async function fetchWeatherForStadium(params: {
  lat: number
  lon: number
  gameTime: Date
}): Promise<Partial<Weather>> {
  const cacheKey = `weather:${params.lat.toFixed(2)},${params.lon.toFixed(2)}:${params.gameTime.toISOString().split('T')[0]}`
  return cache.getOrSet(cacheKey, async () => {
    try {
      // Try Tomorrow.io first (better forecast data)
      const { data } = await axios.get(`${TOMORROW_API}/timelines`, {
        params: {
          apikey: process.env.TOMORROW_API_KEY,
          location: `${params.lat},${params.lon}`,
          fields: ['temperature', 'windSpeed', 'windDirection', 'humidity', 'pressureSurfaceLevel'],
          units: 'imperial',
          timesteps: '1h',
          startTime: params.gameTime.toISOString(),
          endTime: new Date(params.gameTime.getTime() + 3 * 3600 * 1000).toISOString(),
        },
      })
      return transformTomorrowWeather(data)
    } catch {
      // Fallback to OpenWeather
      const { data } = await axios.get(`${WEATHER_API}/forecast`, {
        params: {
          lat: params.lat,
          lon: params.lon,
          appid: process.env.OPENWEATHER_API_KEY,
          units: 'imperial',
        },
      })
      return transformOpenWeather(data, params.gameTime)
    }
  }, 1800) // 30m TTL for weather
}

// ─── Odds API ─────────────────────────────────────────────────────────────────

export async function fetchPlayerHROdds(date: string): Promise<PlayerOdds[]> {
  const cacheKey = `odds:hr:${date}`
  return cache.getOrSet(cacheKey, async () => {
    try {
      const { data } = await axios.get(
        `${ODDS_API}/sports/baseball_mlb/events`,
        {
          params: {
            apiKey: process.env.ODDS_API_KEY,
            commenceTimeFrom: `${date}T00:00:00Z`,
            commenceTimeTo: `${date}T23:59:59Z`,
          },
        }
      )

      const playerOdds: PlayerOdds[] = []
      for (const event of data) {
        const odds = await fetchEventPlayerProps(event.id)
        playerOdds.push(...odds)
      }
      return playerOdds
    } catch (err) {
      console.error('[Odds API] fetch failed:', err)
      return []
    }
  }, 60)
}

async function fetchEventPlayerProps(eventId: string): Promise<PlayerOdds[]> {
  try {
    const { data } = await axios.get(
      `${ODDS_API}/sports/baseball_mlb/events/${eventId}/odds`,
      {
        params: {
          apiKey: process.env.ODDS_API_KEY,
          markets: 'batter_home_runs',
          bookmakers: 'draftkings,fanduel,betmgm',
        },
      }
    )
    return transformPlayerOdds(data, new Date().toISOString().split('T')[0])
  } catch {
    return []
  }
}

// ─── Rotowire Lineups ─────────────────────────────────────────────────────────

export async function fetchConfirmedLineups() {
  const cacheKey = `lineups:${todayString()}`
  return cache.getOrSet(cacheKey, async () => {
    // Rotowire lineup scraper endpoint (requires API key)
    const { data } = await axios.get('https://www.rotowire.com/baseball/json/lineups.json')
    return data
  }, 120)
}

// ─── Transform helpers ────────────────────────────────────────────────────────

function transformGames(raw: any[]): any[] {
  return raw.map(g => ({
    id: String(g.gamePk),
    date: new Date(g.gameDate),
    status: mapGameStatus(g.status?.abstractGameState),
    homeTeamId: String(g.teams?.home?.team?.id),
    awayTeamId: String(g.teams?.away?.team?.id),
    homeTeam: {
      id: String(g.teams?.home?.team?.id),
      name: g.teams?.home?.team?.name,
      abbreviation: g.teams?.home?.team?.abbreviation,
    },
    awayTeam: {
      id: String(g.teams?.away?.team?.id),
      name: g.teams?.away?.team?.name,
      abbreviation: g.teams?.away?.team?.abbreviation,
    },
    homeScore: g.teams?.home?.score ?? 0,
    awayScore: g.teams?.away?.score ?? 0,
    stadiumId: String(g.venue?.id),
    stadium: g.venue
      ? { id: String(g.venue.id), name: g.venue.name }
      : undefined,
    homeLineupConfirmed: g.teams?.home?.lineup !== undefined,
    awayLineupConfirmed: g.teams?.away?.lineup !== undefined,
    hrEnvironment: 50,
    projectedHRs: 2.5,
  }))
}

function mapGameStatus(state: string): string {
  switch (state) {
    case 'Live': return 'IN_PROGRESS'
    case 'Final': return 'FINAL'
    case 'Preview': return 'SCHEDULED'
    default: return 'SCHEDULED'
  }
}

function transformPlayer(raw: any): Player | null {
  if (!raw) return null
  return {
    id: String(raw.id),
    name: raw.fullName,
    firstName: raw.firstName,
    lastName: raw.lastName,
    position: raw.primaryPosition?.abbreviation ?? 'OF',
    bats: raw.batSide?.code === 'L' ? 'LEFT' : raw.batSide?.code === 'S' ? 'SWITCH' : 'RIGHT',
    teamId: String(raw.currentTeam?.id),
    season: 2026,
    gamesPlayed: 0,
    homeRuns: 0,
    avg: 0, obp: 0, slg: 0, ops: 0, iso: 0,
    barrelPct: 0, hardHitPct: 0, sweetSpotPct: 0,
    avgExitVelo: 0, maxExitVelo: 0, avgLaunchAngle: 0,
    pullPct: 0, flyBallPct: 0, xSLG: 0, xWOBA: 0,
  }
}

function transformLineup(data: any) {
  const home = data.teams?.home?.battingOrder ?? []
  const away = data.teams?.away?.battingOrder ?? []
  return { home, away }
}

function transformTomorrowWeather(data: any): Partial<Weather> {
  const interval = data.data?.timelines?.[0]?.intervals?.[0]?.values ?? {}
  return {
    temperature: interval.temperature ?? 72,
    humidity: interval.humidity ?? 50,
    windSpeed: interval.windSpeed ?? 5,
    windDirection: interval.windDirection ?? 180,
    pressure: interval.pressureSurfaceLevel ?? 29.9,
  }
}

function transformOpenWeather(data: any, gameTime: Date): Partial<Weather> {
  const target = gameTime.getTime()
  const closest = data.list?.reduce((prev: any, cur: any) => {
    return Math.abs(cur.dt * 1000 - target) < Math.abs(prev.dt * 1000 - target) ? cur : prev
  })
  return {
    temperature: closest?.main?.temp ?? 72,
    humidity: closest?.main?.humidity ?? 50,
    windSpeed: closest?.wind?.speed ?? 5,
    windDirection: closest?.wind?.deg ?? 180,
    pressure: (closest?.main?.pressure ?? 1013) * 0.02953,
  }
}

function transformPlayerOdds(data: any, date: string): PlayerOdds[] {
  const results: PlayerOdds[] = []
  for (const bookmaker of data.bookmakers ?? []) {
    const market = bookmaker.markets?.find((m: any) => m.key === 'batter_home_runs')
    if (!market) continue
    for (const outcome of market.outcomes ?? []) {
      if (outcome.name !== 'Over') continue
      const americanOdds = outcome.price
      const impliedProb = americanOdds > 0
        ? 100 / (americanOdds + 100)
        : Math.abs(americanOdds) / (Math.abs(americanOdds) + 100)
      results.push({
        id: `${outcome.description}-${bookmaker.key}-${date}`,
        playerId: outcome.description,
        date: new Date(date),
        book: bookmaker.key.toUpperCase() as any,
        market: 'player_home_runs',
        line: outcome.point ?? 0.5,
        overOdds: americanOdds,
        impliedProb,
      })
    }
  }
  return results
}

function parseStatcastCSV(data: string): any[] {
  if (!data || typeof data !== 'string') return []
  const lines = data.split('\n')
  if (lines.length < 2) return []
  const headers = lines[0].split(',')
  return lines.slice(1)
    .filter(Boolean)
    .map(line => {
      const vals = line.split(',')
      return Object.fromEntries(headers.map((h, i) => [h.trim(), vals[i]?.trim()]))
    })
}

function todayString(): string {
  return new Date().toISOString().split('T')[0]
}
