// src/app/pricing/page.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Zap, Lock, Crown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    icon: '⚾',
    color: 'border-border',
    highlight: false,
    features: [
      'Top 10 HR rankings daily',
      'Basic player stats',
      'Game schedules',
      'Park factors overview',
      'Weather summary',
    ],
    missing: [
      'Full 300+ player rankings',
      'Value Finder & edge plays',
      'AI Insights',
      'Parlay Builder',
      'DFS Mode',
      'Custom Model Builder',
      'API access',
    ],
    cta: 'Current Plan',
    priceId: null,
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'per month',
    icon: '💣',
    color: 'border-nuke-gold',
    highlight: true,
    badge: 'Most Popular',
    features: [
      'Full 300+ player rankings',
      'Value Finder with edge plays',
      'AI Insights (top 10 players)',
      'Parlay Builder (Safe/Agg/Sleeper)',
      'Pitcher Targets',
      'Live HR Tracker',
      'Weather & Park Center',
      'Lineup Center',
      'Trend Lab',
      'Email alerts',
    ],
    missing: ['DFS Mode', 'Custom Model Builder', 'API access', 'Data export'],
    cta: 'Upgrade to Pro',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
  {
    name: 'Elite',
    price: '$49',
    period: 'per month',
    icon: '🚀',
    color: 'border-purple-500',
    highlight: false,
    features: [
      'Everything in Pro',
      'DFS Mode (FD + DK optimizer)',
      'Custom Model Builder',
      'API access (10K calls/day)',
      'Data export (CSV/JSON)',
      'Priority support',
      'Admin dashboard access',
      'Bulk player analysis',
      'Historical data export',
      'Early access to new features',
    ],
    missing: [],
    cta: 'Upgrade to Elite',
    priceId: process.env.NEXT_PUBLIC_STRIPE_ELITE_PRICE_ID,
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function checkout(priceId: string | null | undefined, planName: string) {
    if (!priceId) return
    setLoading(planName)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-3xl">💣</div>
            <span className="font-condensed font-black text-3xl text-white tracking-wide">NUKE TRACKER</span>
          </div>
          <h1 className="font-condensed font-black text-5xl text-white tracking-wide mb-3">
            Choose Your <span className="text-nuke-red">Plan</span>
          </h1>
          <p className="text-nuke-muted2 text-base max-w-md mx-auto">
            The most advanced MLB home run analytics. Start free, upgrade when you're ready to dominate.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                'relative rounded-xl border-2 p-6 flex flex-col',
                plan.highlight ? 'bg-nuke-gold/5' : 'bg-surface',
                plan.color
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-nuke-gold text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wide">
                  {plan.badge}
                </div>
              )}

              <div className="text-3xl mb-3">{plan.icon}</div>
              <div className="font-condensed font-black text-2xl text-white">{plan.name}</div>
              <div className="flex items-baseline gap-1 mt-2 mb-6">
                <span className="font-condensed font-black text-4xl text-white">{plan.price}</span>
                <span className="text-nuke-muted text-sm">/{plan.period}</span>
              </div>

              {/* Features */}
              <div className="flex flex-col gap-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={13} className="text-nuke-green mt-0.5 shrink-0" />
                    <span className="text-xs text-nuke-muted2">{f}</span>
                  </div>
                ))}
                {plan.missing.map((f) => (
                  <div key={f} className="flex items-start gap-2 opacity-40">
                    <Lock size={11} className="text-nuke-muted mt-0.5 shrink-0" />
                    <span className="text-xs text-nuke-muted">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => checkout(plan.priceId, plan.name)}
                disabled={!plan.priceId || loading === plan.name}
                className={cn(
                  'w-full py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2',
                  plan.highlight
                    ? 'bg-nuke-gold text-black hover:bg-nuke-gold/90'
                    : plan.name === 'Elite'
                    ? 'bg-purple-500 text-white hover:bg-purple-600'
                    : 'bg-border text-nuke-muted cursor-default',
                  loading === plan.name && 'opacity-70 cursor-wait'
                )}
              >
                {plan.name === 'Elite' ? <Crown size={14} /> : plan.name === 'Pro' ? <Zap size={14} /> : null}
                {loading === plan.name ? 'Redirecting…' : plan.cta}
              </button>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-nuke-muted text-xs mt-8">
          All plans include a 7-day free trial. Cancel anytime. Questions? team@nuketracker.com
        </p>
      </div>
    </div>
  )
}
