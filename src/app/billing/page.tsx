// src/app/billing/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { BillingDashboard } from '@/components/billing/billing-dashboard'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true, plan: true, email: true, name: true,
      stripeId: true, subscriptionId: true, subscriptionEnd: true,
      apiCallsToday: true,
    },
  })

  if (!user) redirect('/dashboard')
  return <BillingDashboard user={user as any} />
}
