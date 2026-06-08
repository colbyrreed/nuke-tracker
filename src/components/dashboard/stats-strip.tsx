// src/components/dashboard/stats-strip.tsx
'use client'

import { motion } from 'framer-motion'
import { Zap, Activity, Wind, Target } from 'lucide-react'

interface Props {
  gameCount: number
  playerCount: number
  hrsTodayCount: number
  avgWeatherBoost: number
}

export function StatsStrip({ gameCount, playerCount, hrsTodayCount, avgWeatherBoost }: Props) {
  const stats = [
    { label: 'Games Today', value: gameCount, icon: Activity, color: 'text-nuke-blue' },
    { label: 'Hitters Scored', value: playerCount, icon: Target, color: 'text-nuke-muted2' },
    { label: 'HRs Hit Today', value: hrsTodayCount, icon: Zap, color: 'text-nuke-red' },
    {
      label: 'Avg Weather Boost',
      value: `${avgWeatherBoost > 0 ? '+' : ''}${avgWeatherBoost.toFixed(1)}%`,
      icon: Wind,
      color: avgWeatherBoost > 0 ? 'text-nuke-green' : 'text-red-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-1">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-3"
        >
          <stat.icon size={18} className={stat.color} />
          <div>
            <div className={`font-mono text-lg font-medium ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-nuke-muted uppercase tracking-wide">{stat.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
