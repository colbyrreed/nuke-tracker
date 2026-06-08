// src/components/ui/pro-gate.tsx
'use client'

import { motion } from 'framer-motion'
import { Lock, Zap } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface Props {
  title: string
  description: string
  plan: 'PRO' | 'ELITE'
}

export function ProGate({ title, description, plan }: Props) {
  const isPro = plan === 'PRO'
  const color = isPro ? 'nuke-gold' : 'purple-400'
  const price = isPro ? '$19/mo' : '$49/mo'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'border rounded-xl px-6 py-8 text-center',
        isPro ? 'bg-nuke-gold/5 border-nuke-gold/25' : 'bg-purple-500/5 border-purple-500/25'
      )}
    >
      <div className={cn(
        'w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4',
        isPro ? 'bg-nuke-gold/10' : 'bg-purple-500/10'
      )}>
        <Lock size={20} className={isPro ? 'text-nuke-gold' : 'text-purple-400'} />
      </div>
      <h3 className="font-condensed font-bold text-xl text-white mb-2">{title}</h3>
      <p className="text-sm text-nuke-muted2 max-w-sm mx-auto mb-6">{description}</p>
      <Link
        href="/pricing"
        className={cn(
          'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all',
          isPro
            ? 'bg-nuke-gold text-black hover:bg-nuke-gold/90'
            : 'bg-purple-500 text-white hover:bg-purple-600'
        )}
      >
        <Zap size={14} />
        Upgrade to {plan} · {price}
      </Link>
    </motion.div>
  )
}
