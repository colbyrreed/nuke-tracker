// src/store/index.ts
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { DashboardPlayer, LiveHREvent, Game, DashboardFilters } from '@/types'

// ─── Dashboard Store ──────────────────────────────────────────────────────────

interface DashboardState {
  players: DashboardPlayer[]
  games: Game[]
  liveEvents: LiveHREvent[]
  filters: DashboardFilters
  lastUpdated: Date | null
  isLoading: boolean
  error: string | null
  hrsTodayCount: number

  setPlayers: (players: DashboardPlayer[]) => void
  setGames: (games: Game[]) => void
  addLiveEvent: (event: LiveHREvent) => void
  setFilters: (filters: Partial<DashboardFilters>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  incrementHRCount: () => void
}

export const useDashboardStore = create<DashboardState>()(
  subscribeWithSelector((set) => ({
    players: [],
    games: [],
    liveEvents: [],
    filters: {},
    lastUpdated: null,
    isLoading: true,
    error: null,
    hrsTodayCount: 0,

    setPlayers: (players) => set({ players, lastUpdated: new Date(), isLoading: false }),
    setGames: (games) => set({ games }),
    addLiveEvent: (event) =>
      set((s) => ({
        liveEvents: [event, ...s.liveEvents].slice(0, 50), // keep last 50
      })),
    setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    incrementHRCount: () => set((s) => ({ hrsTodayCount: s.hrsTodayCount + 1 })),
  }))
)

// ─── Parlay Store ─────────────────────────────────────────────────────────────

interface ParlayLegDraft {
  playerId: string
  playerName: string
  hrProb: number
  bookProb?: number
}

interface ParlayState {
  legs: ParlayLegDraft[]
  parlayType: 'SAFE' | 'AGGRESSIVE' | 'SLEEPER' | 'CUSTOM'
  selectedBook: 'DRAFTKINGS' | 'FANDUEL' | 'BETMGM'

  addLeg: (leg: ParlayLegDraft) => void
  removeLeg: (playerId: string) => void
  clearLegs: () => void
  setParlayType: (type: ParlayState['parlayType']) => void
  setBook: (book: ParlayState['selectedBook']) => void
  combinedProbability: () => number
  impliedOdds: () => number
}

export const useParlayStore = create<ParlayState>()((set, get) => ({
  legs: [],
  parlayType: 'CUSTOM',
  selectedBook: 'DRAFTKINGS',

  addLeg: (leg) =>
    set((s) => {
      if (s.legs.some((l) => l.playerId === leg.playerId)) return s
      if (s.legs.length >= 6) return s
      return { legs: [...s.legs, leg] }
    }),

  removeLeg: (playerId) =>
    set((s) => ({ legs: s.legs.filter((l) => l.playerId !== playerId) })),

  clearLegs: () => set({ legs: [] }),
  setParlayType: (parlayType) => set({ parlayType }),
  setBook: (selectedBook) => set({ selectedBook }),

  combinedProbability: () => {
    const { legs } = get()
    if (!legs.length) return 0
    return legs.reduce((acc, leg) => acc * leg.hrProb, 1)
  },

  impliedOdds: () => {
    const prob = get().combinedProbability()
    if (!prob) return 0
    // Convert decimal probability to American odds
    return prob < 0.5
      ? Math.round(100 / prob - 100)
      : Math.round(-100 * prob / (1 - prob))
  },
}))

// ─── Custom Model Store ───────────────────────────────────────────────────────

interface ModelWeightsState {
  weights: {
    exitVeloWeight: number
    barrelWeight: number
    pitcherWeight: number
    parkWeight: number
    weatherWeight: number
    platoonWeight: number
    formWeight: number
    matchupWeight: number
  }
  setWeight: (key: string, value: number) => void
  normalize: () => void
  reset: () => void
}

const DEFAULT_WEIGHTS = {
  exitVeloWeight:  0.18,
  barrelWeight:    0.18,
  pitcherWeight:   0.17,
  parkWeight:      0.14,
  weatherWeight:   0.12,
  platoonWeight:   0.09,
  formWeight:      0.07,
  matchupWeight:   0.05,
}

export const useModelStore = create<ModelWeightsState>()((set, get) => ({
  weights: { ...DEFAULT_WEIGHTS },

  setWeight: (key, value) =>
    set((s) => ({ weights: { ...s.weights, [key]: value } })),

  normalize: () => {
    const { weights } = get()
    const total = Object.values(weights).reduce((a, b) => a + b, 0)
    if (total === 0) return
    const normalized = Object.fromEntries(
      Object.entries(weights).map(([k, v]) => [k, v / total])
    ) as typeof weights
    set({ weights: normalized })
  },

  reset: () => set({ weights: { ...DEFAULT_WEIGHTS } }),
}))

// ─── Alert Store ──────────────────────────────────────────────────────────────

interface AlertState {
  unreadCount: number
  alerts: Array<{
    id: string
    type: string
    title: string
    body: string
    read: boolean
    createdAt: Date
  }>
  addAlert: (alert: AlertState['alerts'][0]) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

export const useAlertStore = create<AlertState>()((set) => ({
  unreadCount: 0,
  alerts: [],
  addAlert: (alert) =>
    set((s) => ({
      alerts: [alert, ...s.alerts],
      unreadCount: s.unreadCount + 1,
    })),
  markRead: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
  markAllRead: () =>
    set((s) => ({
      alerts: s.alerts.map((a) => ({ ...a, read: true })),
      unreadCount: 0,
    })),
}))
