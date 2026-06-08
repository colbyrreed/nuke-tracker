// src/components/weather/weather-center.tsx
'use client'

import { motion } from 'framer-motion'
import { Wind, Thermometer, Droplets, Mountain, Home } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface WeatherGame {
  id: string
  date: Date
  homeTeam: { abbreviation: string; name: string }
  awayTeam: { abbreviation: string; name: string }
  stadium?: {
    name: string
    altitude: number
    roofType: string
  }
  weather?: {
    temperature: number
    humidity: number
    windSpeed: number
    windDirection: number
    windDirectionLabel: string
    hrBoost: number
    ballCarry: string
    roofOpen: boolean
    pressure: number
  }
}

function WindCompass({ direction, speed }: { direction: number; speed: number }) {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      {/* Compass ring */}
      <svg viewBox="0 0 64 64" className="absolute inset-0 w-full h-full opacity-30">
        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="1" className="text-border" />
        {['N','E','S','W'].map((dir, i) => (
          <text
            key={dir}
            x={32 + Math.sin(i * Math.PI / 2) * 22}
            y={32 - Math.cos(i * Math.PI / 2) * 22 + 3}
            textAnchor="middle"
            fontSize="6"
            fill="#607090"
          >
            {dir}
          </text>
        ))}
      </svg>
      {/* Wind arrow */}
      <svg
        viewBox="0 0 64 64"
        className="absolute inset-0 w-full h-full"
        style={{ transform: `rotate(${direction}deg)` }}
      >
        <line x1="32" y1="44" x2="32" y2="18" stroke="#3b9eff" strokeWidth="2.5" strokeLinecap="round" />
        <polygon points="32,12 28,22 36,22" fill="#3b9eff" />
      </svg>
      {/* Speed */}
      <span className="text-[10px] font-mono font-bold text-white z-10">{speed.toFixed(0)}</span>
    </div>
  )
}

function WeatherCard({ game, delay = 0 }: { game: WeatherGame; delay?: number }) {
  const wx = game.weather
  const boost = wx?.hrBoost ?? 0
  const isGood = boost >= 3
  const isBad = boost <= -3

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'bg-surface border rounded-lg p-4',
        isGood ? 'border-nuke-green/25' : isBad ? 'border-nuke-red/25' : 'border-border'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-condensed font-bold text-lg text-white">
            {game.awayTeam.abbreviation} <span className="text-nuke-muted font-normal text-sm">@</span> {game.homeTeam.abbreviation}
          </div>
          <div className="text-[10px] text-nuke-muted flex items-center gap-1 mt-0.5">
            <Home size={9} />{game.stadium?.name ?? 'TBD'}
          </div>
        </div>
        <div className="text-right">
          <div className={cn('font-mono text-xl font-bold', isGood ? 'text-nuke-green' : isBad ? 'text-red-400' : 'text-nuke-muted2')}>
            {boost >= 0 ? '+' : ''}{boost.toFixed(1)}%
          </div>
          <div className="text-[10px] text-nuke-muted">HR Boost</div>
        </div>
      </div>

      {wx ? (
        <>
          {/* Wind + compass */}
          <div className="flex items-center gap-4 mb-3">
            <WindCompass direction={wx.windDirection} speed={wx.windSpeed} />
            <div className="flex-1">
              <div className="text-sm font-semibold text-white">
                {wx.windSpeed.toFixed(0)} mph {wx.windDirectionLabel}
              </div>
              <div className={cn(
                'text-xs font-medium mt-1',
                wx.ballCarry === 'Favorable' ? 'text-nuke-green' :
                wx.ballCarry === 'Unfavorable' ? 'text-red-400' : 'text-nuke-muted2'
              )}>
                {wx.ballCarry === 'Favorable' ? '↑ Ball carries' :
                 wx.ballCarry === 'Unfavorable' ? '↓ Ball suppressed' : '→ Neutral carry'}
              </div>
            </div>
          </div>

          {/* Stat row */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="flex items-center gap-1.5 bg-surface-2 rounded px-2 py-1.5">
              <Thermometer size={11} className="text-nuke-gold" />
              <div>
                <div className="text-xs font-mono text-white">{wx.temperature.toFixed(0)}°F</div>
                <div className="text-[9px] text-nuke-muted">Temp</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-2 rounded px-2 py-1.5">
              <Droplets size={11} className="text-nuke-blue" />
              <div>
                <div className="text-xs font-mono text-white">{wx.humidity.toFixed(0)}%</div>
                <div className="text-[9px] text-nuke-muted">Humidity</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-surface-2 rounded px-2 py-1.5">
              <Mountain size={11} className="text-nuke-muted2" />
              <div>
                <div className="text-xs font-mono text-white">{game.stadium?.altitude?.toLocaleString() ?? '—'}ft</div>
                <div className="text-[9px] text-nuke-muted">Altitude</div>
              </div>
            </div>
          </div>

          {/* Roof status */}
          <div className={cn(
            'text-center text-[10px] font-bold py-1 rounded',
            wx.roofOpen
              ? 'bg-nuke-green/10 text-nuke-green border border-nuke-green/20'
              : 'bg-nuke-blue/10 text-nuke-blue border border-nuke-blue/20'
          )}>
            {game.stadium?.roofType === 'FIXED_DOME'
              ? '🏟 Fixed Dome — Weather Irrelevant'
              : game.stadium?.roofType === 'RETRACTABLE'
              ? wx.roofOpen ? '☀️ Retractable Roof — Open' : '🏠 Retractable Roof — Closed'
              : '☁️ Open Air Stadium'}
          </div>
        </>
      ) : (
        <div className="text-center py-4 text-nuke-muted text-xs">
          Weather data unavailable — check back closer to game time
        </div>
      )}
    </motion.div>
  )
}

export function WeatherCenter({ games }: { games: WeatherGame[] }) {
  const sorted = [...games].sort((a, b) => (b.weather?.hrBoost ?? 0) - (a.weather?.hrBoost ?? 0))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sorted.map((game, i) => (
        <WeatherCard key={game.id} game={game} delay={i * 0.04} />
      ))}
      {games.length === 0 && (
        <div className="col-span-full text-center py-16 text-nuke-muted text-sm">
          No games today or weather data not yet loaded. Run data sync to populate.
        </div>
      )}
    </div>
  )
}
