// src/app/api/billing/portal/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { createBillingPortalSession } from '@/lib/stripe/billing'

export async function POST() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await db.user.findUnique({ where: { clerkId: userId } })
  if (!user?.stripeId) {
    return NextResponse.json({ error: 'No billing account found. Subscribe first.' }, { status: 404 })
  }

  try {
    const url = await createBillingPortalSession(user.stripeId)
    return NextResponse.json({ url })
  } catch (err) {
    console.error('[Billing] portal session error:', err)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
