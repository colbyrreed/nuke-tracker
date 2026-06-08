// src/app/api/billing/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let subscription = null
  let invoices: any[] = []
  let paymentMethod = null

  if (user.stripeId) {
    try {
      const [subs, inv] = await Promise.all([
        stripe.subscriptions.list({ customer: user.stripeId, limit: 1, status: 'active' }),
        stripe.invoices.list({ customer: user.stripeId, limit: 5 }),
      ])

      subscription = subs.data[0] ?? null

      invoices = inv.data.map((i) => ({
        id: i.id,
        amount: i.amount_paid / 100,
        currency: i.currency,
        status: i.status,
        date: new Date(i.created * 1000).toISOString(),
        pdf: i.invoice_pdf,
      }))

      // Get default payment method
      if (subscription?.default_payment_method) {
        const pm = await stripe.paymentMethods.retrieve(
          subscription.default_payment_method as string
        )
        if (pm.card) {
          paymentMethod = {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          }
        }
      }
    } catch (err) {
      console.error('[Billing] Stripe fetch failed:', err)
    }
  }

  // API usage stats
  const apiCallsToday = user.apiCallsToday
  const apiLimit = user.plan === 'ELITE' ? 10000 : user.plan === 'PRO' ? 0 : 0

  return NextResponse.json({
    plan: user.plan,
    subscriptionEnd: user.subscriptionEnd,
    subscription: subscription
      ? {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          trialEnd: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        }
      : null,
    paymentMethod,
    invoices,
    usage: { apiCallsToday, apiLimit },
  })
}
