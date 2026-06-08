// src/hooks/use-live-data.ts
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDashboardStore } from '@/store'

// ─── Auto-refresh players every 60 seconds ───────────────────────────────────

export function useLivePlayers(filters: Record<string, string> = {}) {
  const params = new URLSearchParams(filters).toString()

  return useQuery({
    queryKey: ['players', filters],
    queryFn: async () => {
      const res = await fetch(`/api/players?${params}`)
      if (!res.ok) throw new Error('Failed to fetch players')
      return res.json()
    },
    refetchInterval: 60_000, // 60s
    staleTime: 30_000,
  })
}

// ─── Live HR feed polling ─────────────────────────────────────────────────────

export function useLiveFeed() {
  const addLiveEvent = useDashboardStore((s) => s.addLiveEvent)
  const incrementHRCount = useDashboardStore((s) => s.incrementHRCount)
  const seenIds = useRef(new Set<string>())

  const query = useQuery({
    queryKey: ['live-feed'],
    queryFn: async () => {
      const res = await fetch('/api/live')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    refetchInterval: 15_000, // 15s for live feed
    staleTime: 10_000,
  })

  useEffect(() => {
    if (!query.data?.events) return
    for (const event of query.data.events) {
      if (!seenIds.current.has(event.id)) {
        seenIds.current.add(event.id)
        addLiveEvent(event)
        incrementHRCount()
      }
    }
  }, [query.data, addLiveEvent, incrementHRCount])

  return query
}

// ─── Game status polling ──────────────────────────────────────────────────────

export function useLiveGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: async () => {
      const res = await fetch('/api/games')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
}

// ─── Weather polling ──────────────────────────────────────────────────────────

export function useWeather() {
  return useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      const res = await fetch('/api/weather')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    refetchInterval: 5 * 60_000, // 5 min
    staleTime: 4 * 60_000,
  })
}

// ─── Odds polling ─────────────────────────────────────────────────────────────

export function useOdds() {
  return useQuery({
    queryKey: ['odds'],
    queryFn: async () => {
      const res = await fetch('/api/odds')
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    refetchInterval: 60_000,
    staleTime: 45_000,
  })
}

// ─── Player profile ───────────────────────────────────────────────────────────

export function usePlayerProfile(playerId: string) {
  return useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const res = await fetch(`/api/players/${playerId}`)
      if (!res.ok) throw new Error('Not found')
      return res.json()
    },
    staleTime: 5 * 60_000,
  })
}

// ─── AI Insights ─────────────────────────────────────────────────────────────

export function useInsights(playerId?: string) {
  const url = playerId ? `/api/insights?playerId=${playerId}` : '/api/insights'
  return useQuery({
    queryKey: ['insights', playerId],
    queryFn: async () => {
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed')
      return res.json()
    },
    staleTime: 30 * 60_000, // insights are expensive, cache for 30m
  })
}

// ─── Manual invalidation hook ─────────────────────────────────────────────────

export function useInvalidateOnLineup() {
  const queryClient = useQueryClient()

  return useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['players'] })
    queryClient.invalidateQueries({ queryKey: ['games'] })
    queryClient.invalidateQueries({ queryKey: ['insights'] })
  }, [queryClient])
}
