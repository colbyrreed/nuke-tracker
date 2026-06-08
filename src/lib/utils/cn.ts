// src/lib/utils/cn.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Formatting ───────────────────────────────────────────────────────────────

export function formatProbability(prob: number, decimals = 1): string {
  return `${(prob * 100).toFixed(decimals)}%`
}

export function formatOdds(americanOdds: number): string {
  return americanOdds > 0 ? `+${americanOdds}` : `${americanOdds}`
}

export function formatBoost(boost: number): string {
  return `${boost > 0 ? '+' : ''}${boost.toFixed(1)}%`
}

export function formatExitVelo(mph: number): string {
  return `${mph.toFixed(1)} mph`
}

export function formatDistance(ft: number): string {
  return `${ft} ft`
}

// ─── Odds Math ────────────────────────────────────────────────────────────────

export function americanToImplied(odds: number): number {
  return odds > 0
    ? 100 / (odds + 100)
    : Math.abs(odds) / (Math.abs(odds) + 100)
}

export function impliedToAmerican(prob: number): number {
  return prob < 0.5
    ? Math.round(100 / prob - 100)
    : Math.round(-100 * prob / (1 - prob))
}

export function combinedParlayProbability(probs: number[]): number {
  return probs.reduce((acc, p) => acc * p, 1)
}

export function expectedValue(probability: number, odds: number): number {
  const payout = odds > 0 ? odds / 100 : 100 / Math.abs(odds)
  return probability * payout - (1 - probability)
}

// ─── Score helpers ────────────────────────────────────────────────────────────

export function nukeScoreColor(score: number): string {
  if (score >= 80) return '#22c97e'
  if (score >= 60) return '#f5b940'
  if (score >= 40) return '#f04a2a'
  return '#8098b8'
}

export function confidenceLabel(confidence: number): 'high' | 'med' | 'low' {
  if (confidence >= 0.75) return 'high'
  if (confidence >= 0.45) return 'med'
  return 'low'
}

export function windDirectionLabel(degrees: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  return dirs[Math.round(degrees / 22.5) % 16]
}

export function battingOrderSuffix(order: number): string {
  if (order === 1) return '1st'
  if (order === 2) return '2nd'
  if (order === 3) return '3rd'
  return `${order}th`
}
