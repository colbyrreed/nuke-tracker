// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const PLAN_MAP: Record<string, 'FREE' | 'PRO' | 'ELITE'> = {
  [process.env.STRIPE_PRO_PRICE_ID!]:   'PRO',
  [process.env.STRIPE_ELITE_PRICE_ID!]: 'ELITE',
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('[Stripe] webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.CheckoutSession
        await handleCheckoutCompleted(session)
        break
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(sub)
        break
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(sub)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }
    }
  } catch (err) {
    console.error('[Stripe] event processing error:', err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.CheckoutSession) {
  const clerkId = session.metadata?.clerkId
  if (!clerkId) return

  const subscription = await stripe.subscriptions.retrieve(
    session.subscription as string
  )
  const priceId = subscription.items.data[0].price.id
  const plan = PLAN_MAP[priceId] ?? 'PRO'

  await db.user.update({
    where: { clerkId },
    data: {
      plan,
      stripeId: session.customer as string,
      subscriptionId: subscription.id,
      subscriptionEnd: new Date(subscription.current_period_end * 1000),
    },
  })
}

async function handleSubscriptionUpdated(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0].price.id
  const plan = PLAN_MAP[priceId] ?? 'PRO'

  await db.user.updateMany({
    where: { stripeId: sub.customer as string },
    data: {
      plan,
      subscriptionId: sub.id,
      subscriptionEnd: new Date(sub.current_period_end * 1000),
    },
  })
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  await db.user.updateMany({
    where: { stripeId: sub.customer as string },
    data: {
      plan: 'FREE',
      subscriptionId: null,
      subscriptionEnd: null,
    },
  })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.warn('[Stripe] payment failed for customer:', invoice.customer)
  // TODO: send notification, grace period logic
}
