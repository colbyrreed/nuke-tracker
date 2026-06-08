// src/components/parlay/parlay-builder.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Shuffle, TrendingUp, AlertCircle } from 'lucide-react'
import { useParlayStore } from '@/store'
import { cn } from '@/lib/utils/cn'

const PARLAY_TYPES = [
  { key: 'SAFE',       label: '✔ Safe',       desc: 'High-confidence picks, lower odds',     color: 'text-nuke-green' },
  { key: 'AGGRESSIVE', label: '⚡ Aggressive', desc: 'Medium-confidence for bigger payout',   color: 'text-nuke-gold' },
  { key: 'SLEEPER',    label: '★ Sleeper',    desc: 'Low-owned, high upside dark horses',    color: 'text-nuke-blue' },
  { key: 'CUSTOM',     label: '⚙ Custom',     desc: 'Your own picks',                         color: 'text-nuke-muted2' },
] as const

const BOOKS = [
  { key: 'DRAFTKINGS', label: 'DraftKings', color: '#53d337' },
  { key: 'FANDUEL',    label: 'FanDuel',    color: '#1493ff' },
  { key: 'BETMGM',     label: 'BetMGM',     color: '#f5a623' },
] as const

export function ParlayBuilder() {
  const {
    legs, parlayType, selectedBook,
    removeLeg, clearLegs, setParlayType, setBook,
    combinedProbability, impliedOdds,
  } = useParlayStore()

  const combProb = combinedProbability()
  const odds = impliedOdds()
  const expectedValue = legs.length > 0
    ? ((combProb * (odds > 0 ? odds / 100 : 100 / Math.abs(odds))) - (1 - combProb)).toFixed(3)
    : '0.000'
  const evPositive = parseFloat(expectedValue) > 0

  return (
    <div className="flex flex-col gap-4">
      {/* Type selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {PARLAY_TYPES.map((type) => (
          <button
            key={type.key}
            onClick={() => setParlayType(type.key)}
            className={cn(
              'text-left px-3 py-2.5 rounded-lg border transition-all',
              parlayType === type.key
                ? 'border-nuke-red bg-nuke-red/10'
                : 'border-border bg-surface hover:border-nuke-muted'
            )}
          >
            <div className={cn('text-xs font-bold', type.color)}>{type.label}</div>
            <div className="text-[10px] text-nuke-muted mt-0.5">{type.desc}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Legs */}
        <div className="bg-surface border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-nuke-muted uppercase tracking-wide">
              Parlay Legs ({legs.length}/6)
            </h3>
            {legs.length > 0 && (
              <button onClick={clearLegs} className="text-[10px] text-nuke-muted hover:text-red-400 transition-colors">
                Clear all
              </button>
            )}
          </div>

          <AnimatePresence>
            {legs.map((leg, i) => (
              <motion.div
                key={leg.playerId}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{leg.playerName}</div>
                  <div className="text-[10px] text-nuke-muted mt-0.5">
                    HR · Model: {(leg.hrProb * 100).toFixed(1)}%
                    {leg.bookProb && ` · Book: ${(leg.bookProb * 100).toFixed(1)}%`}
                  </div>
                </div>
                <button
                  onClick={() => removeLeg(leg.playerId)}
                  className="p-1 rounded hover:bg-white/5 text-nuke-muted hover:text-red-400 transition-all"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {legs.length === 0 && (
            <div className="text-center py-8 text-nuke-muted text-xs">
              Add players from the dashboard or value finder
            </div>
          )}

          {legs.length < 6 && (
            <div className="mt-3 border border-dashed border-border rounded-lg py-3 text-center text-nuke-muted text-xs">
              + Add up to {6 - legs.length} more leg{6 - legs.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Stats panel */}
        <div className="flex flex-col gap-3">
          {/* Combined probability */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="text-xs text-nuke-muted uppercase tracking-wide mb-3">Parlay Stats</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[10px] text-nuke-muted">Combined Prob</div>
                <div className="font-mono text-xl font-medium text-white mt-0.5">
                  {legs.length > 0 ? (combProb * 100).toFixed(3) : '0.000'}%
                </div>
              </div>
              <div>
                <div className="text-[10px] text-nuke-muted">Implied Odds</div>
                <div className={cn('font-mono text-xl font-medium mt-0.5', odds > 0 ? 'text-nuke-gold' : 'text-nuke-muted2')}>
                  {legs.length > 0 ? (odds > 0 ? '+' : '') + odds : '—'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-nuke-muted">Expected Value</div>
                <div className={cn('font-mono text-xl font-medium mt-0.5', evPositive ? 'text-nuke-green' : 'text-red-400')}>
                  {evPositive ? '+' : ''}{expectedValue}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-nuke-muted">Risk Rating</div>
                <div className={cn(
                  'text-xl font-medium mt-0.5',
                  legs.length <= 2 ? 'text-nuke-green' : legs.length <= 4 ? 'text-nuke-gold' : 'text-nuke-red'
                )}>
                  {legs.length <= 2 ? 'Low' : legs.length <= 4 ? 'Medium' : 'High'}
                </div>
              </div>
            </div>
          </div>

          {/* Book selector */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="text-xs text-nuke-muted uppercase tracking-wide mb-3">Place At</div>
            <div className="flex gap-2">
              {BOOKS.map((book) => (
                <button
                  key={book.key}
                  onClick={() => setBook(book.key)}
                  style={{ borderColor: selectedBook === book.key ? book.color : undefined }}
                  className={cn(
                    'flex-1 py-2 text-xs font-bold rounded border transition-all',
                    selectedBook === book.key ? 'bg-white/5' : 'border-border hover:border-nuke-muted'
                  )}
                >
                  <span style={{ color: book.color }}>{book.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {legs.length >= 5 && (
            <div className="flex items-start gap-2 bg-nuke-gold/5 border border-nuke-gold/20 rounded px-3 py-2">
              <AlertCircle size={13} className="text-nuke-gold mt-0.5 shrink-0" />
              <span className="text-xs text-nuke-gold">Large parlays have very low combined probability. Consider a smaller parlay for better EV.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
