// src/components/park/park-card.tsx
'use client'

import { motion } from 'framer-motion'
import { Mountain } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface StadiumData {
  id: string
  name: string
  city: string
  state: string
  altitude: number
  roofType: string
  leftField: number
  leftCenter: number
  centerField: number
  rightCenter: number
  rightField: number
  parkFactor: number
  hrFactor: number
  lhHrFactor: number
  rhHrFactor: number
  team?: { name: string; abbreviation: string }
}

function HRFactorBadge({ factor }: { factor: number }) {
  const pct = ((factor - 1) * 100)
  const isHitter = factor > 1
  return (
    <div className={cn(
      'text-center px-3 py-1.5 rounded text-xs font-bold',
      isHitter
        ? 'bg-nuke-green/10 text-nuke-green border border-nuke-green/20'
        : 'bg-nuke-red/10 text-red-400 border border-nuke-red/20'
    )}>
      {isHitter ? '↑' : '↓'} {Math.abs(pct).toFixed(1)}% HRs
    </div>
  )
}

function DiamondSvg({ lf, lcf, cf, rcf, rf }: { lf: number; lcf: number; cf: number; rcf: number; rf: number }) {
  return (
    <div className="bg-surface-2 rounded-lg p-4 text-center">
      <svg viewBox="0 0 180 120" className="w-full max-w-[200px] mx-auto opacity-70">
        {/* Outfield arc */}
        <path
          d="M 20 110 Q 90 20 160 110"
          fill="none"
          stroke="#1e2f45"
          strokeWidth="2"
        />
        {/* Infield diamond */}
        <polygon
          points="90,95 110,75 90,55 70,75"
          fill="none"
          stroke="#1e2f45"
          strokeWidth="1.5"
        />
        {/* Home plate */}
        <circle cx="90" cy="100" r="3" fill="#607090" />
        {/* Dimension labels */}
        <text x="10" y="108" fill="#3b9eff" fontSize="8" fontFamily="monospace">{lf}</text>
        <text x="32" y="58" fill="#8098b8" fontSize="7" fontFamily="monospace">{lcf}</text>
        <text x="82" y="22" fill="#8098b8" fontSize="7" fontFamily="monospace">{cf}</text>
        <text x="132" y="58" fill="#8098b8" fontSize="7" fontFamily="monospace">{rcf}</text>
        <text x="154" y="108" fill="#3b9eff" fontSize="8" fontFamily="monospace">{rf}</text>
      </svg>
    </div>
  )
}

export function ParkCard({ stadium, rank, delay = 0 }: { stadium: StadiumData; rank?: number; delay?: number }) {
  const isHitterFriendly = stadium.hrFactor > 1

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn(
        'bg-surface border rounded-lg p-4',
        isHitterFriendly ? 'border-nuke-green/20' : 'border-border'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          {rank && (
            <div className="text-[10px] text-nuke-muted font-mono mb-1">#{rank}</div>
          )}
          <div className="font-condensed font-bold text-lg text-white leading-tight">{stadium.name}</div>
          <div className="text-xs text-nuke-muted mt-0.5">{stadium.city}, {stadium.state}</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-bold" style={{ color: isHitterFriendly ? '#22c97e' : '#8098b8' }}>
            {stadium.hrFactor.toFixed(3)}
          </div>
          <div className="text-[10px] text-nuke-muted">HR Factor</div>
        </div>
      </div>

      {/* Diamond */}
      <DiamondSvg
        lf={stadium.leftField}
        lcf={stadium.leftCenter}
        cf={stadium.centerField}
        rcf={stadium.rightCenter}
        rf={stadium.rightField}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="bg-surface-2 rounded px-3 py-2">
          <div className="text-[10px] text-nuke-muted">LHH HR Factor</div>
          <div className={cn('font-mono text-sm font-medium', stadium.lhHrFactor > 1 ? 'text-nuke-green' : 'text-nuke-muted2')}>
            {stadium.lhHrFactor.toFixed(3)}
          </div>
        </div>
        <div className="bg-surface-2 rounded px-3 py-2">
          <div className="text-[10px] text-nuke-muted">RHH HR Factor</div>
          <div className={cn('font-mono text-sm font-medium', stadium.rhHrFactor > 1 ? 'text-nuke-green' : 'text-nuke-muted2')}>
            {stadium.rhHrFactor.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Altitude + roof */}
      <div className="flex items-center justify-between mt-3 text-xs">
        <div className="flex items-center gap-1.5 text-nuke-muted2">
          <Mountain size={11} />
          <span>{stadium.altitude.toLocaleString()} ft altitude</span>
          {stadium.altitude >= 3000 && (
            <span className="text-nuke-green text-[10px] font-bold">↑ Ball carries</span>
          )}
        </div>
        <div className={cn(
          'text-[10px] font-semibold px-2 py-0.5 rounded',
          stadium.roofType === 'OPEN' ? 'text-nuke-muted bg-border' :
          stadium.roofType === 'RETRACTABLE' ? 'text-nuke-gold bg-nuke-gold/10' :
          'text-nuke-blue bg-nuke-blue/10'
        )}>
          {stadium.roofType.replace('_', ' ')}
        </div>
      </div>

      {/* Overall HR rating */}
      <div className="mt-3">
        <HRFactorBadge factor={stadium.hrFactor} />
      </div>
    </motion.div>
  )
}
