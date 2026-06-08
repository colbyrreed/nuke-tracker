// src/app/parlay/page.tsx
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import { ParlayBuilder } from '@/components/parlay/parlay-builder'
import { AutoParlays } from '@/components/parlay/auto-parlays'
import { ProGate } from '@/components/ui/pro-gate'

export const dynamic = 'force-dynamic'
export const revalidate = 300

export default async function ParlayPage() {
  const { userId } = await auth()
  const user = userId
    ? await db.user.findUnique({ where: { clerkId: userId }, select: { plan: true } })
    : null
  const isPro = user?.plan === 'PRO' || user?.plan === 'ELITE'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch today's top players for auto-parlay generation
  const topScores = await db.dailyScore.findMany({
    where: { date: today, confidence: { gte: 0.6 } },
    orderBy: { nukeScore: 'desc' },
    take: 20,
    include: { player: { include: { team: true } } },
  })

  // Build safe (top 3 high-conf), aggressive (mid-tier), sleeper (high edge, lower prob)
  const safePlayers = topScores.slice(0, 3)
  const aggrPlayers = topScores.slice(3, 7)
  const sleeperPlayers = topScores
    .filter((s) => s.edge !== null && s.edge > 0.06 && s.hrProbability < 0.15)
    .slice(0, 3)

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4">
        <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
          Parlay <span className="text-nuke-red">Builder</span>
        </h1>
        <p className="text-xs text-nuke-muted mt-1">
          Build HR parlays · Auto-generated Safe, Aggressive &amp; Sleeper options
        </p>
      </div>

      {isPro ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Auto parlays */}
          <div>
            <div className="text-[10px] font-bold text-nuke-muted uppercase tracking-wider mb-2">Auto-Generated Parlays</div>
            <AutoParlays
              safe={safePlayers as any}
              aggressive={aggrPlayers as any}
              sleeper={sleeperPlayers as any}
            />
          </div>

          {/* Custom builder */}
          <div>
            <div className="text-[10px] font-bold text-nuke-muted uppercase tracking-wider mb-2">Custom Parlay Builder</div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <ParlayBuilder />
            </div>
          </div>
        </div>
      ) : (
        <ProGate
          title="Unlock Parlay Builder"
          description="Build custom HR parlays, see combined probability, expected value, and auto-generated Safe, Aggressive, and Sleeper parlay suggestions."
          plan="PRO"
        />
      )}
    </div>
  )
}
