// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { db } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { priceId } = await req.json()
  if (!priceId) return NextResponse.json({ error: 'Missing priceId' }, { status: 400 })

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress

  // Get or create DB user
  let dbUser = await db.user.findUnique({ where: { clerkId: userId } })
  if (!dbUser) {
    dbUser = await db.user.create({
      data: {
        clerkId: userId,
        email: email ?? `${userId}@unknown.com`,
        name: clerkUser?.fullName ?? null,
      },
    })
  }

  // Get or create Stripe customer
  let customerId = dbUser.stripeId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      name: clerkUser?.fullName ?? undefined,
      metadata: { clerkId: userId },
    })
    customerId = customer.id
    await db.user.update({ where: { id: dbUser.id }, data: { stripeId: customerId } })
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    subscription_data: { trial_period_days: 7 },
    metadata: { clerkId: userId },
    allow_promotion_codes: true,
  })

  return NextResponse.json({ url: session.url })
}
