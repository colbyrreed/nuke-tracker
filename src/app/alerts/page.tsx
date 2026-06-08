// src/app/alerts/page.tsx
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { AlertCenter } from '@/components/alerts/alert-center'

export const dynamic = 'force-dynamic'

export default async function AlertsPage() {
  const { userId } = await auth()
  const user = userId
    ? await db.user.findUnique({ where: { clerkId: userId }, select: { id: true, plan: true } })
    : null

  const alerts = user
    ? await db.alert.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
    : []

  const topPlayers = await db.dailyScore.findMany({
    where: { date: new Date(new Date().setHours(0, 0, 0, 0)) },
    orderBy: { nukeScore: 'desc' },
    take: 20,
    include: { player: { include: { team: true } } },
  })

  return (
    <AlertCenter
      initialAlerts={alerts as any}
      plan={user?.plan ?? 'FREE'}
      topPlayers={topPlayers as any}
    />
  )
}
