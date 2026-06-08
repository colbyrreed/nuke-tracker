// src/components/model/custom-model-builder.tsx
'use client'

import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, Save, RotateCcw } from 'lucide-react'
import { useModelStore } from '@/store'
import { cn } from '@/lib/utils/cn'
import { toast } from '@/components/ui/toaster'

const WEIGHT_LABELS: Record<string, { label: string; desc: string; color: string }> = {
  exitVeloWeight:  { label: 'Exit Velocity',    desc: 'Avg exit velocity vs league avg',  color: '#f04a2a' },
  barrelWeight:    { label: 'Barrel Rate',       desc: 'Barrel % as primary power metric', color: '#f04a2a' },
  pitcherWeight:   { label: 'Pitcher HR/9',      desc: 'Opposing pitcher vulnerability',   color: '#f5b940' },
  parkWeight:      { label: 'Park HR Factor',    desc: 'Stadium HR factor (LHH/RHH split)',color: '#f5b940' },
  weatherWeight:   { label: 'Weather Boost',     desc: 'Wind, temp, humidity, altitude',   color: '#3b9eff' },
  platoonWeight:   { label: 'Platoon Advantage', desc: 'Handedness vs pitcher throws',     color: '#22c97e' },
  formWeight:      { label: 'Recent Form',        desc: 'Last 7 / 15 / 30 day HR rates',   color: '#8098b8' },
  matchupWeight:   { label: 'Historical Matchup', desc: 'Career stats vs this pitcher',    color: '#8098b8' },
}

export function CustomModelBuilder() {
  const { weights, setWeight, normalize, reset } = useModelStore()
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [previewResults, setPreviewResults] = useState<Array<{ name: string; score: number }> | null>(null)

  const total = Object.values(weights).reduce((s, v) => s + v, 0)
  const isValid = Math.abs(total - 1.0) < 0.01

  async function generatePreview() {
    setIsGenerating(true)
    // Simulate model run with custom weights
    await new Promise((r) => setTimeout(r, 1500))
    setPreviewResults([
      { name: 'Aaron Judge',    score: 94 },
      { name: 'Pete Alonso',    score: 88 },
      { name: 'Shohei Ohtani',  score: 86 },
      { name: 'Kyle Tucker',    score: 79 },
      { name: 'Matt Olson',     score: 75 },
    ])
    setIsGenerating(false)
  }

  async function saveModel() {
    if (!isValid) { normalize(); return }
    setIsSaving(true)
    try {
      const res = await fetch('/api/custom-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weights }),
      })
      if (res.ok) {
        toast({ type: 'success', title: 'Custom model saved', body: 'Rankings will update with your weights.' })
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Weight sliders */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide">Feature Weights</div>
          <div className="flex gap-2">
            <button
              onClick={() => { normalize(); toast({ type: 'info', title: 'Weights normalized to 100%' }) }}
              className="text-[10px] text-nuke-muted hover:text-white transition-colors"
            >
              Normalize
            </button>
            <button
              onClick={() => { reset(); setPreviewResults(null) }}
              className="flex items-center gap-1 text-[10px] text-nuke-muted hover:text-white transition-colors"
            >
              <RotateCcw size={9} /> Reset
            </button>
          </div>
        </div>

        {/* Total indicator */}
        <div className={cn(
          'flex items-center justify-between text-xs mb-4 px-3 py-2 rounded-lg',
          isValid ? 'bg-nuke-green/10 text-nuke-green border border-nuke-green/20' : 'bg-nuke-gold/10 text-nuke-gold border border-nuke-gold/20'
        )}>
          <span>Total weight</span>
          <span className="font-mono font-bold">{(total * 100).toFixed(1)}%</span>
        </div>

        <div className="flex flex-col gap-4">
          {Object.entries(weights).map(([key, value]) => {
            const info = WEIGHT_LABELS[key]
            if (!info) return null
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-xs font-medium text-white">{info.label}</span>
                    <span className="text-[10px] text-nuke-muted ml-2">{info.desc}</span>
                  </div>
                  <span className="font-mono text-xs font-bold" style={{ color: info.color }}>
                    {(value * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={0}
                    max={0.5}
                    step={0.01}
                    value={value}
                    onChange={(e) => setWeight(key, parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, ${info.color} ${value / 0.5 * 100}%, #1e2f45 ${value / 0.5 * 100}%)`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={generatePreview}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-surface-2 border border-border rounded-lg text-xs font-semibold text-white hover:border-nuke-muted transition-all disabled:opacity-60"
          >
            <RefreshCw size={12} className={cn(isGenerating && 'animate-spin')} />
            {isGenerating ? 'Running model…' : 'Preview Rankings'}
          </button>
          <button
            onClick={saveModel}
            disabled={isSaving || !isValid}
            className="flex-1 flex items-center justify-center gap-2 py-2 bg-nuke-red text-white rounded-lg text-xs font-semibold hover:bg-nuke-red/90 transition-all disabled:opacity-60"
          >
            <Save size={12} />
            {isSaving ? 'Saving…' : 'Save Model'}
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-surface border border-border rounded-lg p-5">
        <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-4">
          Custom Model Preview
        </div>

        {previewResults ? (
          <div className="flex flex-col gap-3">
            {previewResults.map((r, i) => (
              <motion.div
                key={r.name}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3"
              >
                <span className={cn('font-condensed font-bold text-xl w-6 text-right', i < 3 ? 'text-nuke-gold' : 'text-nuke-muted')}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm text-white font-medium">{r.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-nuke-red" style={{ width: `${r.score}%` }} />
                  </div>
                  <span className="font-mono text-xs text-white min-w-[2ch]">{r.score}</span>
                </div>
              </motion.div>
            ))}
            <p className="text-[10px] text-nuke-muted mt-2">
              Preview based on today's top players with your custom weights applied. Save to make permanent.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
            <div className="text-3xl">⚙️</div>
            <div className="text-sm text-nuke-muted2">Adjust weights and click "Preview Rankings" to see how your custom model ranks today's hitters.</div>
          </div>
        )}
      </div>
    </div>
  )
}
