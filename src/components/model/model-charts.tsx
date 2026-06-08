// src/components/model/model-charts.tsx
'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface FeatureWeight {
  label: string
  weight: number
  color: string
}

const DEFAULT_FEATURES: FeatureWeight[] = [
  { label: 'Exit Velocity',  weight: 0.18, color: '#f04a2a' },
  { label: 'Barrel Rate',    weight: 0.18, color: '#f04a2a' },
  { label: 'Pitcher HR/9',   weight: 0.17, color: '#f5b940' },
  { label: 'Park Factor',    weight: 0.14, color: '#f5b940' },
  { label: 'Weather',        weight: 0.12, color: '#3b9eff' },
  { label: 'Platoon Split',  weight: 0.09, color: '#22c97e' },
  { label: 'Recent Form',    weight: 0.07, color: '#8098b8' },
  { label: 'Matchup History',weight: 0.05, color: '#8098b8' },
]

export function FeatureWeightsChart({ features = DEFAULT_FEATURES }: { features?: FeatureWeight[] }) {
  return (
    <div className="flex flex-col gap-3">
      {features.map((f, i) => (
        <motion.div
          key={f.label}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3"
        >
          <div className="text-xs text-nuke-muted2 min-w-[120px] text-right">{f.label}</div>
          <div className="flex-1 h-4 bg-border rounded overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${f.weight * 100 / 0.22 * 100}%` }}
              transition={{ delay: i * 0.05 + 0.2, duration: 0.6, ease: 'easeOut' }}
              className="h-full rounded flex items-center justify-end pr-1.5"
              style={{ background: f.color, maxWidth: '100%' }}
            >
              <span className="text-[9px] font-semibold text-white">{(f.weight * 100).toFixed(0)}%</span>
            </motion.div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

interface ModelCard {
  name: string
  desc: string
  weight: number
  accuracy: number
  color: string
}

const ENSEMBLE_MODELS: ModelCard[] = [
  { name: 'XGBoost',       desc: 'Primary · gradient boosting',  weight: 0.35, accuracy: 68.1, color: '#f04a2a' },
  { name: 'LightGBM',      desc: 'Secondary · recency-weighted', weight: 0.30, accuracy: 66.8, color: '#f5b940' },
  { name: 'Neural Network',desc: 'Deep model · 3-layer MLP',     weight: 0.20, accuracy: 64.3, color: '#3b9eff' },
  { name: 'Random Forest', desc: 'Ensemble · 100 trees',         weight: 0.15, accuracy: 63.7, color: '#22c97e' },
]

export function EnsembleModelsPanel() {
  return (
    <div className="flex flex-col gap-2">
      {ENSEMBLE_MODELS.map((m, i) => (
        <motion.div
          key={m.name}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="bg-surface-2 border border-border rounded-lg px-4 py-3 flex items-center justify-between"
        >
          <div>
            <div className="text-sm font-semibold text-white">{m.name}</div>
            <div className="text-[10px] text-nuke-muted mt-0.5">{m.desc} · {(m.weight * 100).toFixed(0)}% weight</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm font-medium" style={{ color: m.color }}>{m.accuracy}%</div>
            <div className="text-[10px] text-nuke-muted">Accuracy</div>
          </div>
        </motion.div>
      ))}

      {/* Ensemble output */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-nuke-red rounded-lg px-4 py-3 flex items-center justify-between mt-1"
      >
        <div>
          <div className="text-sm font-bold text-white">Ensemble Output</div>
          <div className="text-[10px] text-white/70 mt-0.5">50,000 Monte Carlo sims/hitter/day</div>
        </div>
        <div className="font-mono text-lg font-bold text-white">67.3%</div>
      </motion.div>
    </div>
  )
}

interface AccuracyMetric {
  label: string
  value: string
  sub?: string
  good: boolean
}

export function AccuracyMetrics({ metrics }: { metrics?: AccuracyMetric[] }) {
  const defaultMetrics: AccuracyMetric[] = [
    { label: 'Top-10 Accuracy', value: '67.3%', sub: 'Season avg', good: true },
    { label: 'Brier Score',     value: '0.071', sub: 'Lower is better', good: true },
    { label: 'Season ROI',      value: '+14.2%', sub: 'Value plays only', good: true },
    { label: 'Predictions',     value: '18,241', sub: 'Logged forever', good: true },
  ]

  const display = metrics ?? defaultMetrics

  return (
    <div className="grid grid-cols-2 gap-3">
      {display.map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="bg-surface-2 rounded-lg px-4 py-3"
        >
          <div className="text-[10px] text-nuke-muted uppercase tracking-wide">{m.label}</div>
          <div className={cn('font-mono text-xl font-medium mt-1', m.good ? 'text-nuke-green' : 'text-nuke-red')}>
            {m.value}
          </div>
          {m.sub && <div className="text-[10px] text-nuke-muted mt-0.5">{m.sub}</div>}
        </motion.div>
      ))}
    </div>
  )
}
