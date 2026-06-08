// src/components/live/live-feed.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap } from 'lucide-react'
import type { LiveHREvent } from '@/types'
import { useDashboardStore } from '@/store'

function LiveEventCard({ event, isNew }: { event: LiveHREvent; isNew: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="relative bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-4 overflow-hidden"
    >
      {/* Accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-nuke-red" />

      {/* Time + inning */}
      <div className="text-left min-w-[52px]">
        <div className="font-mono text-[10px] text-nuke-muted">
          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="font-mono text-[10px] text-nuke-muted2 mt-0.5">
          {event.inningHalf === 'top' ? '▲' : '▼'}{event.inning}
        </div>
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{event.playerName}</div>
        <div className="text-[10px] text-nuke-muted mt-0.5">{event.team} · {event.pitchType} pitch</div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        {[
          { label: 'EV mph', value: event.exitVelocity.toFixed(1) },
          { label: 'Dist', value: `${event.distance}ft` },
          { label: 'LA', value: `${event.launchAngle.toFixed(0)}°` },
        ].map((stat) => (
          <div key={stat.label} className="text-right">
            <div className="font-mono text-sm font-medium text-nuke-gold">{stat.value}</div>
            <div className="text-[9px] text-nuke-muted uppercase tracking-wide">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* HR badge */}
      <div className="shrink-0">
        {isNew ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="bg-nuke-red text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1"
          >
            <Zap size={10} />HR
          </motion.div>
        ) : (
          <div className="bg-nuke-red/20 text-nuke-red text-[10px] font-bold px-2 py-1 rounded">
            HR 💣
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function LiveFeed({ initialEvents }: { initialEvents: LiveHREvent[] }) {
  const storeEvents = useDashboardStore((s) => s.liveEvents)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())

  // Merge store events with initial
  const allEvents = storeEvents.length > 0 ? storeEvents : initialEvents

  useEffect(() => {
    if (storeEvents.length > 0) {
      const newest = storeEvents[0]
      setNewIds((prev) => new Set([newest.id]))
      const t = setTimeout(() => setNewIds(new Set()), 3000)
      return () => clearTimeout(t)
    }
  }, [storeEvents])

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {allEvents.map((event) => (
          <LiveEventCard
            key={event.id}
            event={event}
            isNew={newIds.has(event.id)}
          />
        ))}
        {allEvents.length === 0 && (
          <div className="text-center py-12 text-nuke-muted text-sm">
            No home runs yet today. Waiting for action… 👀
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
