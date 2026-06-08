// src/app/value/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { getValuePlays } from '@/lib/data/dashboard'
import { ValueRow } from '@/components/value/value-row'
import { ProGate } from '@/components/ui/pro-gate'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function ValuePage() {
  const { userId } = await auth()
  const user = userId
    ? await db.user.findUnique({ where: { clerkId: userId }, select: { plan: true } })
    : null
  const isPro = user?.plan === 'PRO' || user?.plan === 'ELITE'

  const today = new Date().toISOString().split('T')[0]
  const values = isPro ? await getValuePlays() : await getValuePlays().then((v) => v.slice(0, 3))

  const avgEdge = values.length
    ? values.reduce((s, v) => s + v.edge, 0) / values.length
    : 0
  const posEdgePlays = values.filter((v) => v.edge > 0.05).length

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
            Value <span className="text-nuke-red">Finder</span>
          </h1>
          <p className="text-xs text-nuke-muted mt-1">
            Model probability vs. sportsbook — sorted by edge · Updated every 60s
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: '+Edge Plays', value: posEdgePlays, color: 'text-nuke-green' },
            { label: 'Avg Edge', value: `${avgEdge > 0 ? '+' : ''}${(avgEdge * 100).toFixed(1)}%`, color: 'text-nuke-green' },
            { label: 'Books', value: 'DK · FD · MGM', color: 'text-nuke-muted2' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-center">
              <div className={`font-mono text-base font-medium ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-nuke-muted uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-nuke-blue/5 border border-nuke-blue/20 rounded-lg px-4 py-3 text-xs text-nuke-muted2">
        <span className="text-nuke-blue font-bold">How it works: </span>
        Nuke Tracker calculates its own HR probability using the ensemble ML model. We compare that to the implied probability from sportsbook odds. A positive edge means our model thinks the player is more likely to hit a HR than the book is pricing in.
      </div>

      {/* Value plays */}
      <div className="flex flex-col gap-2">
        {values.map((play, i) => (
          <ValueRow key={play.player.player.id} play={play} rank={i + 1} delay={i * 0.04} />
        ))}
        {values.length === 0 && (
          <div className="text-center py-16 text-nuke-muted text-sm">
            No value plays found yet today. Odds sync runs every 60 seconds.
          </div>
        )}
      </div>

      {/* Pro gate */}
      {!isPro && (
        <ProGate
          title="See All Value Plays"
          description="Upgrade to Pro to unlock the full value finder with all edge plays, live odds comparison, and one-click parlay building."
          plan="PRO"
        />
      )}
    </div>
  )
}
