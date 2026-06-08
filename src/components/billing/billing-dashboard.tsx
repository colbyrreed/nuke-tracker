// src/components/billing/billing-dashboard.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import {
  Crown, Zap, CheckCircle, AlertCircle, ExternalLink,
  Download, ArrowRight, RefreshCw, CreditCard,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

interface Props {
  user: {
    id: string
    email: string
    name: string | null
    plan: string
    stripeId: string | null
    subscriptionEnd: Date | null
  }
  subscription: {
    id: string
    status: string
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
    amount: number
    interval: string
    currency: string
    paymentMethod: { brand: string; last4: string; expMonth?: number; expYear?: number } | null
  } | null
  invoices: {
    id: string
    number: string | null
    amount: number
    currency: string
    status: string | null
    date: Date
    pdf: string | null
    periodStart: Date | null
    periodEnd: Date | null
  }[]
}

const PLAN_CONFIG = {
  FREE:  { label: 'Free',  color: 'text-nuke-muted', icon: '⚾', price: '$0' },
  PRO:   { label: 'Pro',   color: 'text-nuke-gold',  icon: '💣', price: '$19/mo' },
  ELITE: { label: 'Elite', color: 'text-purple-400',  icon: '🚀', price: '$49/mo' },
}

const PLAN_FEATURES: Record<string, string[]> = {
  FREE:  ['Top 10 HR rankings', 'Basic stats', 'Game schedules'],
  PRO:   ['Full 300+ rankings', 'Value Finder', 'AI Insights', 'Parlay Builder', 'All alerts'],
  ELITE: ['Everything in Pro', 'DFS Mode', 'Custom Model Builder', 'API access', 'Data export'],
}

export function BillingDashboard({ user, subscription, invoices }: Props) {
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const plan = PLAN_CONFIG[user.plan as keyof typeof PLAN_CONFIG] ?? PLAN_CONFIG.FREE

  async function openPortal() {
    setIsPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const { url, error } = await res.json()
      if (url) window.location.href = url
      else console.error('Portal error:', error)
    } catch (err) {
      console.error('Portal request failed:', err)
    } finally {
      setIsPortalLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Current plan */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-border rounded-xl p-5 lg:col-span-1"
        >
          <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-3">Current Plan</div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{plan.icon}</span>
            <div>
              <div className={cn('font-condensed font-black text-2xl', plan.color)}>{plan.label}</div>
              <div className="text-xs text-nuke-muted">{plan.price}</div>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-1.5 mb-4">
            {PLAN_FEATURES[user.plan]?.map((f) => (
              <div key={f} className="flex items-center gap-2 text-xs text-nuke-muted2">
                <CheckCircle size={11} className="text-nuke-green shrink-0" />
                {f}
              </div>
            ))}
          </div>

          {user.plan !== 'ELITE' && (
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-nuke-gold text-black font-bold text-sm hover:bg-nuke-gold/90 transition-all"
            >
              <Zap size={13} />
              Upgrade Plan
            </Link>
          )}
        </motion.div>

        {/* Subscription status */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-surface border border-border rounded-xl p-5 lg:col-span-2"
        >
          <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-3">Subscription</div>

          {subscription ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Status */}
                <div>
                  <div className="text-[10px] text-nuke-muted mb-1">Status</div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      subscription.status === 'active' ? 'bg-nuke-green' : 'bg-nuke-red'
                    )} />
                    <span className="text-sm font-medium text-white capitalize">{subscription.status}</span>
                  </div>
                </div>

                {/* Renewal */}
                <div>
                  <div className="text-[10px] text-nuke-muted mb-1">
                    {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'}
                  </div>
                  <div className="text-sm font-medium text-white">
                    {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <div className="text-[10px] text-nuke-muted mb-1">Amount</div>
                  <div className="text-sm font-medium text-white">
                    ${subscription.amount.toFixed(2)}/{subscription.interval}
                  </div>
                </div>

                {/* Payment method */}
                <div>
                  <div className="text-[10px] text-nuke-muted mb-1">Payment</div>
                  {subscription.paymentMethod ? (
                    <div className="flex items-center gap-1.5 text-sm text-white">
                      <CreditCard size={13} className="text-nuke-muted" />
                      {subscription.paymentMethod.brand.charAt(0).toUpperCase() + subscription.paymentMethod.brand.slice(1)} ····{subscription.paymentMethod.last4}
                    </div>
                  ) : (
                    <span className="text-sm text-nuke-muted">—</span>
                  )}
                </div>
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="flex items-start gap-2 bg-nuke-red/5 border border-nuke-red/20 rounded-lg px-3 py-2 mb-4">
                  <AlertCircle size={13} className="text-nuke-red mt-0.5 shrink-0" />
                  <span className="text-xs text-red-400">
                    Your subscription will cancel on {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}. You'll retain access until then.
                  </span>
                </div>
              )}

              {/* Manage button */}
              {user.stripeId && (
                <button
                  onClick={openPortal}
                  disabled={isPortalLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 border border-border text-sm font-semibold text-white hover:border-nuke-muted transition-all disabled:opacity-70"
                >
                  {isPortalLoading ? (
                    <RefreshCw size={13} className="animate-spin" />
                  ) : (
                    <ExternalLink size={13} />
                  )}
                  {isPortalLoading ? 'Opening portal…' : 'Manage Subscription'}
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-start gap-3">
              <div className="text-sm text-nuke-muted">
                {user.plan === 'FREE'
                  ? 'You\'re on the free plan. Upgrade to unlock all features.'
                  : 'No active subscription found.'}
              </div>
              <Link
                href="/pricing"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nuke-gold text-black font-bold text-sm hover:bg-nuke-gold/90 transition-all"
              >
                View Plans <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </motion.div>
      </div>

      {/* Invoice history */}
      {invoices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-border rounded-xl p-5"
        >
          <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-3">Invoice History</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {['Invoice', 'Date', 'Period', 'Amount', 'Status', ''].map((h) => (
                    <th key={h} className="text-left text-[10px] font-semibold text-nuke-muted uppercase tracking-wider pb-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-[#0f1e30] last:border-0 hover:bg-white/[0.01] transition-colors"
                  >
                    <td className="py-2.5 pr-4 font-mono text-xs text-nuke-muted2">{inv.number ?? inv.id.slice(0, 8)}</td>
                    <td className="py-2.5 pr-4 text-xs text-nuke-muted2">{format(new Date(inv.date), 'MMM d, yyyy')}</td>
                    <td className="py-2.5 pr-4 text-xs text-nuke-muted">
                      {inv.periodStart && inv.periodEnd
                        ? `${format(new Date(inv.periodStart), 'MM/dd')} – ${format(new Date(inv.periodEnd), 'MM/dd/yy')}`
                        : '—'}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-sm text-white">${inv.amount.toFixed(2)}</td>
                    <td className="py-2.5 pr-4">
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded',
                        inv.status === 'paid' ? 'bg-nuke-green/10 text-nuke-green' : 'bg-nuke-red/10 text-red-400'
                      )}>
                        {inv.status ?? 'pending'}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {inv.pdf && (
                        <a
                          href={inv.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] text-nuke-muted hover:text-white transition-colors"
                        >
                          <Download size={11} /> PDF
                        </a>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Account info */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-surface border border-border rounded-xl p-5"
      >
        <div className="text-xs font-bold text-nuke-muted uppercase tracking-wide mb-3">Account</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-[10px] text-nuke-muted mb-1">Name</div>
            <div className="text-white">{user.name ?? '—'}</div>
          </div>
          <div>
            <div className="text-[10px] text-nuke-muted mb-1">Email</div>
            <div className="text-white">{user.email}</div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
