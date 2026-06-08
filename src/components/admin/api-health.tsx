// src/components/admin/api-health.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'

interface ApiEndpoint {
  name: string
  url: string
  status: 'healthy' | 'degraded' | 'down'
  latencyMs: number
  lastCheck: Date
}

const DOT_COLORS = {
  healthy:  'bg-nuke-green shadow-[0_0_6px_rgba(34,201,126,0.5)]',
  degraded: 'bg-nuke-gold shadow-[0_0_6px_rgba(245,185,64,0.5)]',
  down:     'bg-nuke-red shadow-[0_0_6px_rgba(240,74,42,0.5)]',
}

const LATENCY_COLORS = {
  healthy:  'text-nuke-green',
  degraded: 'text-nuke-gold',
  down:     'text-red-400',
}

export function ApiHealth({ endpoints }: { endpoints: ApiEndpoint[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {endpoints.map((ep, i) => (
        <motion.div
          key={ep.name}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-3 bg-surface-2 rounded-lg px-3 py-2.5"
        >
          <span className={cn('w-2 h-2 rounded-full shrink-0', DOT_COLORS[ep.status])} />
          <span className="text-xs text-white flex-1">{ep.name}</span>
          <span className={cn('font-mono text-xs', LATENCY_COLORS[ep.status])}>
            {ep.status === 'down' ? 'DOWN' : `${ep.latencyMs}ms`}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

interface SystemMetric {
  label: string
  value: number
  color: string
}

export function SystemMetrics({ metrics }: { metrics: SystemMetric[] }) {
  return (
    <div className="flex flex-col gap-3">
      {metrics.map((m, i) => (
        <div key={m.label} className="flex items-center gap-3">
          <span className="text-xs text-nuke-muted2 min-w-[120px]">{m.label}</span>
          <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${m.value}%` }}
              transition={{ delay: i * 0.05 + 0.1, duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{ background: m.color }}
            />
          </div>
          <span className="font-mono text-xs text-white min-w-[3ch] text-right">{m.value}%</span>
        </div>
      ))}
    </div>
  )
}

export function LogFeed({ lines }: { lines: string[] }) {
  return (
    <div className="bg-surface-2 rounded-lg p-3 font-mono text-[10px] text-nuke-muted2 leading-relaxed max-h-40 overflow-y-auto">
      {lines.map((line, i) => (
        <div key={i} className={cn(
          'py-0.5',
          line.includes('ERROR') ? 'text-red-400' :
          line.includes('WARN')  ? 'text-nuke-gold' :
          line.includes('triggered') || line.includes('confirmed') ? 'text-nuke-green' : ''
        )}>
          {line}
        </div>
      ))}
    </div>
  )
}
