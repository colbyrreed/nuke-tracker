// src/app/lineup/page.tsx
import { db } from '@/lib/db'
import { LineupCenter } from '@/components/lineup/lineup-center'
import { AlignLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 120

export default async function LineupPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const games = await db.game.findMany({
    where: { date: { gte: today, lt: tomorrow } },
    include: {
      homeTeam: true,
      awayTeam: true,
      stadium: true,
      pitchers: {
        include: { pitcher: true },
        where: { role: 'STARTER' },
      },
      lineups: {
        include: {
          player: true,
        },
        orderBy: { battingOrder: 'asc' },
      },
    },
    orderBy: { date: 'asc' },
  })

  // Enrich lineups with today's Nuke scores
  const today2 = new Date()
  today2.setHours(0, 0, 0, 0)

  const playerIds = games.flatMap((g) => g.lineups.map((l) => l.playerId))
  const scores = await db.dailyScore.findMany({
    where: {
      playerId: { in: playerIds },
      date: today2,
    },
    select: {
      playerId: true,
      nukeScore: true,
      hrProbability: true,
      confidence: true,
    },
  })
  const scoreMap = new Map(scores.map((s) => [s.playerId, s]))

  const confirmedCount = games.filter((g) => g.homeLineupConfirmed || g.awayLineupConfirmed).length
  const totalLineupPlayers = games.reduce((s, g) => s + g.lineups.length, 0)

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <AlignLeft className="text-nuke-green" size={24} />
          <div>
            <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
              Lineup <span className="text-nuke-red">Center</span>
            </h1>
            <p className="text-xs text-nuke-muted mt-1">
              Official &amp; projected lineups with Nuke Score per slot · Refreshes every 2 minutes
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Games Today', value: games.length, color: 'text-white' },
            { label: 'Confirmed', value: confirmedCount, color: confirmedCount > 0 ? 'text-nuke-green' : 'text-nuke-muted2' },
            { label: 'Players Slotted', value: totalLineupPlayers, color: 'text-nuke-muted2' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-center">
              <div className={`font-mono text-base font-medium ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-nuke-muted uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Batting order impact note */}
      <div className="bg-nuke-blue/5 border border-nuke-blue/20 rounded-lg px-4 py-3 text-xs text-nuke-muted2">
        <span className="text-nuke-blue font-bold">Lineup Position Impact: </span>
        Batting 1st gets ~4.7 PA/game vs ~3.4 for 9th. Nuke Tracker weights expected plate appearances directly into each player's HR probability — lineup confirmation triggers an immediate model rescore.
      </div>

      <LineupCenter games={games as any} scoreMap={scoreMap} />
    </div>
  )
}
