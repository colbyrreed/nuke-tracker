// src/components/games/game-center-card.tsx
'use client'

import { motion } from 'framer-motion'
import { Wind, Thermometer, Droplets, MapPin } from 'lucide-react'
import type { Game } from '@/types'
import { cn } from '@/lib/utils/cn'

interface Props {
  game: Game
  delay?: number
}

function HREnvironmentGauge({ score }: { score: number }) {
  const color = score >= 80 ? '#22c97e' : score >= 60 ? '#f5b940' : '#8098b8'
  const label = score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 45 ? 'Neutral' : 'Poor'

  return (
    <div className="flex items-end gap-3">
      <div>
        <div className="text-[10px] text-nuke-muted uppercase tracking-wide mb-1">HR Environment</div>
        <div
          className="font-condensed font-black text-4xl leading-none"
          style={{ color }}
        >
          {score}
        </div>
        <div className="text-xs mt-1" style={{ color }}>{label}</div>
      </div>

      {/* Arc gauge */}
      <svg width="60" height="40" viewBox="0 0 60 40" className="mb-1">
        <path
          d="M 5 38 A 25 25 0 0 1 55 38"
          fill="none"
          stroke="#1e2f45"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 5 38 A 25 25 0 0 1 55 38"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 78.5} 78.5`}
        />
      </svg>
    </div>
  )
}

export function GameCenterCard({ game, delay = 0 }: Props) {
  const wx = game.weather
  const windLabel = wx?.windDirectionLabel ?? '—'
  const isBlowingOut = wx && (wx.windDirection > 270 || wx.windDirection < 90)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-surface border border-border rounded-lg p-4"
    >
      {/* Teams */}
      <div className="flex items-center justify-between mb-3">
        <div className="font-condensed font-bold text-xl text-white">
          {game.awayTeam.abbreviation}{' '}
          <span className="text-nuke-muted text-sm font-normal">@</span>{' '}
          {game.homeTeam.abbreviation}
        </div>
        <div className="text-xs text-nuke-muted">
          {new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ET
        </div>
      </div>

      {/* Stadium */}
      <div className="flex items-center gap-1 text-xs text-nuke-muted mb-3">
        <MapPin size={10} />
        <span>{game.stadium?.name ?? 'TBD'}</span>
        {game.stadium && (
          <span className="text-nuke-muted/60">· HR Factor {game.stadium.hrFactor.toFixed(3)}</span>
        )}
      </div>

      {/* Weather strip */}
      {wx && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="flex items-center gap-1.5 bg-surface-2 rounded px-2 py-1.5">
            <Wind size={11} className={isBlowingOut ? 'text-nuke-green' : 'text-red-400'} />
            <div>
              <div className="text-xs font-mono font-medium text-white">{wx.windSpeed.toFixed(0)} mph</div>
              <div className="text-[9px] text-nuke-muted">{windLabel}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-2 rounded px-2 py-1.5">
            <Thermometer size={11} className="text-nuke-gold" />
            <div>
              <div className="text-xs font-mono font-medium text-white">{wx.temperature.toFixed(0)}°F</div>
              <div className="text-[9px] text-nuke-muted">Temp</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-surface-2 rounded px-2 py-1.5">
            <Droplets size={11} className="text-nuke-blue" />
            <div>
              <div className="text-xs font-mono font-medium text-white">{wx.humidity.toFixed(0)}%</div>
              <div className="text-[9px] text-nuke-muted">Humidity</div>
            </div>
          </div>
        </div>
      )}

      {/* Weather boost badge */}
      {wx && (
        <div className={cn(
          'text-center text-xs font-bold py-1.5 rounded mb-3',
          wx.hrBoost >= 4 ? 'bg-nuke-green/10 text-nuke-green border border-nuke-green/20' :
          wx.hrBoost <= -4 ? 'bg-nuke-red/10 text-red-400 border border-nuke-red/20' :
          'bg-white/5 text-nuke-muted border border-border'
        )}>
          {wx.hrBoost >= 0 ? '+' : ''}{wx.hrBoost.toFixed(1)}% HR Weather {wx.ballCarry}
        </div>
      )}

      {/* Scores row */}
      <div className="flex items-end justify-between">
        <HREnvironmentGauge score={game.hrEnvironment} />
        <div className="text-right">
          <div className="text-[10px] text-nuke-muted uppercase tracking-wide mb-1">Proj HRs</div>
          <div className="font-mono text-2xl font-medium text-nuke-gold">{game.projectedHRs.toFixed(1)}</div>
        </div>
      </div>

      {/* Lineup status */}
      <div className="flex gap-2 mt-3">
        <div className={cn(
          'flex-1 text-center text-[10px] font-semibold py-1 rounded',
          game.awayLineupConfirmed
            ? 'bg-nuke-green/10 text-nuke-green border border-nuke-green/20'
            : 'bg-border text-nuke-muted'
        )}>
          {game.awayTeam.abbreviation} {game.awayLineupConfirmed ? '✓ Confirmed' : 'Projected'}
        </div>
        <div className={cn(
          'flex-1 text-center text-[10px] font-semibold py-1 rounded',
          game.homeLineupConfirmed
            ? 'bg-nuke-green/10 text-nuke-green border border-nuke-green/20'
            : 'bg-border text-nuke-muted'
        )}>
          {game.homeTeam.abbreviation} {game.homeLineupConfirmed ? '✓ Confirmed' : 'Projected'}
        </div>
      </div>
    </motion.div>
  )
}
