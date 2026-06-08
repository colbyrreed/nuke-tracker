// src/types/index.ts

export type Plan = 'FREE' | 'PRO' | 'ELITE'
export type Hand = 'LEFT' | 'RIGHT' | 'SWITCH'
export type GameStatus = 'SCHEDULED' | 'WARMUP' | 'IN_PROGRESS' | 'FINAL' | 'POSTPONED'
export type ParlayType = 'SAFE' | 'AGGRESSIVE' | 'SLEEPER' | 'CUSTOM'
export type Sportsbook = 'DRAFTKINGS' | 'FANDUEL' | 'BETMGM' | 'CAESARS'

// ─── Player ──────────────────────────────

export interface Player {
  id: string
  name: string
  firstName: string
  lastName: string
  position: string
  bats: Hand
  teamId: string | null
  team?: Team
  season: number
  gamesPlayed: number
  homeRuns: number
  avg: number
  obp: number
  slg: number
  ops: number
  iso: number
  barrelPct: number
  hardHitPct: number
  sweetSpotPct: number
  avgExitVelo: number
  maxExitVelo: number
  avgLaunchAngle: number
  pullPct: number
  flyBallPct: number
  xSLG: number
  xWOBA: number
}

export interface PlayerWithScore extends Player {
  score: DailyScore
}

// ─── Daily Score ─────────────────────────

export interface DailyScore {
  id: string
  playerId: string
  date: Date
  gameId?: string
  nukeScore: number
  hrProbability: number
  expectedHRs: number
  confidence: number
  valueScore: number
  riskScore: number
  leverageScore: number
  upsideScore: number
  weatherBoost: number
  parkBoost: number
  matchupBoost: number
  formBoost: number
  battingOrder?: number
  bookOdds?: number
  edge?: number
  rank?: number
  actualHR?: boolean
}

// ─── Team ────────────────────────────────

export interface Team {
  id: string
  name: string
  abbreviation: string
  city: string
  division: string
  league: string
  stadiumId?: string
  stadium?: Stadium
}

// ─── Stadium ─────────────────────────────

export interface Stadium {
  id: string
  name: string
  city: string
  state: string
  latitude: number
  longitude: number
  altitude: number
  roofType: 'OPEN' | 'RETRACTABLE' | 'FIXED_DOME'
  leftField: number
  leftCenter: number
  centerField: number
  rightCenter: number
  rightField: number
  parkFactor: number
  hrFactor: number
  lhHrFactor: number
  rhHrFactor: number
}

// ─── Game ────────────────────────────────

export interface Game {
  id: string
  date: Date
  status: GameStatus
  inning?: number
  inningHalf?: string
  homeTeamId: string
  homeTeam: Team
  awayTeamId: string
  awayTeam: Team
  homeScore: number
  awayScore: number
  stadiumId?: string
  stadium?: Stadium
  hrEnvironment: number
  projectedHRs: number
  homeOdds?: number
  awayOdds?: number
  overUnder?: number
  homeLineupConfirmed: boolean
  awayLineupConfirmed: boolean
  weather?: Weather
  pitchers?: GamePitcher[]
  lineups?: LineupEntry[]
}

// ─── Weather ─────────────────────────────

export interface Weather {
  id: string
  gameId: string
  temperature: number
  humidity: number
  windSpeed: number
  windDirection: number
  windDirectionLabel: string
  pressure: number
  altitude: number
  airDensity: number
  hrBoost: number
  ballCarry: 'Favorable' | 'Neutral' | 'Unfavorable'
  roofOpen: boolean
  fetchedAt: Date
}

// ─── Pitcher ─────────────────────────────

export interface Pitcher {
  id: string
  name: string
  throws: Hand
  teamId?: string
  era: number
  xERA: number
  fip: number
  whip: number
  hr9: number
  flyBallPct: number
  hardContactPct: number
  barrelPct: number
  avgFastball: number
  hrVulnScore: number
}

export interface GamePitcher {
  id: string
  gameId: string
  pitcherId: string
  pitcher: Pitcher
  role: 'STARTER' | 'RELIEVER' | 'CLOSER'
  teamSide: 'home' | 'away'
}

// ─── Lineup ──────────────────────────────

export interface LineupEntry {
  id: string
  gameId: string
  playerId: string
  player: Player
  battingOrder: number
  position: string
  teamSide: 'home' | 'away'
  confirmed: boolean
}

// ─── Statcast ────────────────────────────

export interface StatcastEvent {
  id: string
  playerId: string
  gameDate: Date
  exitVelocity?: number
  launchAngle?: number
  distance?: number
  isHomeRun: boolean
  pitchType?: string
  pitchVelocity?: number
  inning?: number
}

// ─── Odds ────────────────────────────────

export interface PlayerOdds {
  id: string
  playerId: string
  date: Date
  book: Sportsbook
  market: string
  line: number
  overOdds: number
  impliedProb: number
}

export interface ValuePlay {
  player: PlayerWithScore
  modelProb: number
  bookProb: number
  bestBook: Sportsbook
  edge: number
  odds: number
}

// ─── Parlay ──────────────────────────────

export interface ParlayLeg {
  playerId: string
  player: Player
  hrProb: number
  bookProb?: number
}

export interface Parlay {
  id: string
  userId: string
  name?: string
  parlayType: ParlayType
  combinedProb: number
  impliedOdds: number
  date: Date
  legs: ParlayLeg[]
}

// ─── ML Model ────────────────────────────

export interface ModelWeights {
  exitVeloWeight: number
  barrelWeight: number
  pitcherWeight: number
  parkWeight: number
  weatherWeight: number
  platoonWeight: number
  formWeight: number
  matchupWeight: number
}

export interface ModelFeatures {
  // Batter
  barrelPct: number
  hardHitPct: number
  sweetSpotPct: number
  avgExitVelo: number
  maxExitVelo: number
  avgLaunchAngle: number
  xSLG: number
  xWOBA: number
  iso: number
  ops: number
  pullPct: number
  flyBallPct: number
  // Splits
  homeAwayFactor: number
  last7HRRate: number
  last15HRRate: number
  last30HRRate: number
  // Pitcher
  pitcherHR9: number
  pitcherFlyBallPct: number
  pitcherBarrelPct: number
  pitcherHardContactPct: number
  pitcherXERA: number
  // Matchup
  platoonAdvantage: number
  historicalMatchupFactor: number
  // Park
  parkHRFactor: number
  altitude: number
  // Weather
  weatherHRBoost: number
  windSpeedOut: number
  temperature: number
  // Context
  battingOrderFactor: number
}

export interface ScoringResult {
  playerId: string
  nukeScore: number
  hrProbability: number
  expectedHRs: number
  confidence: number
  valueScore: number
  riskScore: number
  leverageScore: number
  upsideScore: number
  weatherBoost: number
  parkBoost: number
  matchupBoost: number
  formBoost: number
  features: ModelFeatures
  monteCarloSimulations: number
}

// ─── Dashboard / API ─────────────────────

export interface DashboardPlayer {
  rank: number
  player: Player
  team: Team
  opponent: Team
  game: Game
  score: DailyScore
  weather?: Weather
  stadium?: Stadium
  pitcher?: Pitcher
}

export interface LiveHREvent {
  id: string
  gameId: string
  playerId: string
  playerName: string
  team: string
  inning: number
  inningHalf: string
  exitVelocity: number
  distance: number
  launchAngle: number
  pitchType: string
  timestamp: Date
  videoUrl?: string
}

export interface AlertPayload {
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
  userId?: string
}

// ─── Filters ─────────────────────────────

export interface DashboardFilters {
  team?: string
  position?: string
  gameId?: string
  confidence?: 'high' | 'med' | 'low'
  hand?: 'LEFT' | 'RIGHT' | 'SWITCH'
  minScore?: number
  search?: string
}

export interface DateRange {
  from: Date
  to: Date
}
