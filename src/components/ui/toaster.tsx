// src/components/ui/toaster.tsx
'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  body?: string
}

// Simple global toast state
let toastListeners: Array<(toast: Toast) => void> = []

export function toast(t: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  toastListeners.forEach((fn) => fn({ ...t, id }))
}

const ICONS = {
  success: CheckCircle,
  error:   AlertCircle,
  info:    Info,
}

const COLORS = {
  success: 'border-nuke-green/30 bg-nuke-green/5 text-nuke-green',
  error:   'border-nuke-red/30 bg-nuke-red/5 text-nuke-red',
  info:    'border-nuke-blue/30 bg-nuke-blue/5 text-nuke-blue',
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (t: Toast) => {
      setToasts((prev) => [...prev, t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 4000)
    }
    toastListeners.push(handler)
    return () => { toastListeners = toastListeners.filter((fn) => fn !== handler) }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.type]
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, x: 20 }}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 bg-surface shadow-lg',
                COLORS[t.type]
              )}
            >
              <Icon size={15} className="mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white">{t.title}</div>
                {t.body && <div className="text-xs text-nuke-muted2 mt-0.5">{t.body}</div>}
              </div>
              <button
                onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                className="text-nuke-muted hover:text-white transition-colors"
              >
                <X size={13} />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
