// src/components/ai/insight-card.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, ChevronDown, ChevronUp, AlertTriangle, TrendingUp } from 'lucide-react'
import type { InsightResult } from '@/lib/ml/ai-insights'
import { cn } from '@/lib/utils/cn'

interface Props {
  insight: InsightResult
  rank: number
  hrProb: number
  nukeScore: number
  delay?: number
}

export function InsightCard({ insight, rank, hrProb, nukeScore, delay = 0 }: Props) {
  const [expanded, setExpanded] = useState(rank <= 3)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-surface border border-border rounded-lg overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-start gap-4 p-4 cursor-pointer hover:bg-white/[0.01] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank */}
        <div className="font-condensed font-black text-5xl text-nuke-red leading-none shrink-0 w-12 text-right">
          #{rank}
        </div>

        {/* Player info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h3 className="font-condensed font-bold text-xl text-white">{insight.playerName}</h3>
            <span className="font-mono text-sm text-nuke-green">{(hrProb * 100).toFixed(1)}% HR</span>
            <span className="text-xs text-nuke-muted">Score: {nukeScore}</span>
          </div>
          <p className="text-sm text-nuke-muted2 mt-1 leading-snug">{insight.headline}</p>
        </div>

        {/* AI badge + toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-purple-500/10 border border-purple-500/20 px-2 py-1 rounded text-purple-400 text-[10px] font-bold">
            <Brain size={10} />AI
          </div>
          {expanded ? <ChevronUp size={14} className="text-nuke-muted" /> : <ChevronDown size={14} className="text-nuke-muted" />}
        </div>
      </div>

      {/* Expanded content */}
      <motion.div
        initial={false}
        animate={{ height: expanded ? 'auto' : 0 }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4 pt-0">
          {/* Divider */}
          <div className="border-t border-border mb-3" />

          {/* Summary */}
          <p className="text-sm text-nuke-muted2 leading-relaxed mb-3">{insight.summary}</p>

          {/* Bullets */}
          <div className="flex flex-col gap-2 mb-3">
            {insight.bullets.map((bullet, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2"
              >
                <span className="text-nuke-red font-bold text-xs mt-0.5 shrink-0">→</span>
                <span className="text-sm text-nuke-muted2">{bullet}</span>
              </motion.div>
            ))}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-2">
            {insight.riskNote && (
              <div className="flex items-start gap-2 bg-nuke-red/5 border border-nuke-red/15 rounded px-3 py-2">
                <AlertTriangle size={12} className="text-nuke-red mt-0.5 shrink-0" />
                <span className="text-xs text-red-400">{insight.riskNote}</span>
              </div>
            )}
            {insight.trendNote && (
              <div className="flex items-start gap-2 bg-nuke-green/5 border border-nuke-green/15 rounded px-3 py-2">
                <TrendingUp size={12} className="text-nuke-green mt-0.5 shrink-0" />
                <span className="text-xs text-nuke-green">{insight.trendNote}</span>
              </div>
            )}
          </div>

          {/* Generated at */}
          <div className="mt-3 text-[10px] text-nuke-muted/50 font-mono">
            Generated {new Date(insight.generatedAt).toLocaleTimeString()}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
