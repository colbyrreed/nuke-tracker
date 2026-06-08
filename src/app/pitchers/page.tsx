// src/app/pitchers/page.tsx
import { db } from '@/lib/db'
import { PitcherTable } from '@/components/pitchers/pitcher-table'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function PitchersPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get today's starting pitchers
  const starters = await db.gamePitcher.findMany({
    where: {
      role: 'STARTER',
      game: { date: { gte: today, lt: tomorrow } },
    },
    include: {
      pitcher: true,
      game: {
        include: {
          homeTeam: true,
          awayTeam: true,
          stadium: true,
          weather: true,
        },
      },
    },
    orderBy: { pitcher: { hrVulnScore: 'desc' } },
  })

  const enriched = starters.map((s, i) => {
    const game = s.game
    const opposingTeam = s.teamSide === 'home' ? game.awayTeam : game.homeTeam
    return {
      rank: i + 1,
      pitcher: s.pitcher,
      game,
      teamSide: s.teamSide,
      opposingTeam,
      weatherBoost: game.weather?.hrBoost ?? 0,
      parkFactor: game.stadium?.hrFactor ?? 1.0,
    }
  })

  const avgVuln = enriched.length
    ? Math.round(enriched.reduce((s, e) => s + e.pitcher.hrVulnScore, 0) / enriched.length)
    : 0

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
            Pitcher <span className="text-nuke-red">Targets</span>
          </h1>
          <p className="text-xs text-nuke-muted mt-1">
            Starting pitchers ranked by HR vulnerability today
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Starters Today', value: starters.length, color: 'text-white' },
            { label: 'Avg Vuln Score', value: avgVuln, color: avgVuln >= 60 ? 'text-nuke-red' : 'text-nuke-muted2' },
            { label: 'HR/9 Leader', value: enriched[0]?.pitcher.hr9.toFixed(2) ?? '—', color: 'text-nuke-red' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-center">
              <div className={`font-mono text-base font-medium ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-nuke-muted uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top target callout */}
      {enriched[0] && (
        <div className="bg-nuke-red/5 border border-nuke-red/25 rounded-lg px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-nuke-red font-bold uppercase tracking-wide mb-1">
              🎯 Today's #1 Target
            </div>
            <div className="font-condensed font-bold text-2xl text-white">{enriched[0].pitcher.name}</div>
            <div className="text-xs text-nuke-muted mt-1">
              {enriched[0].teamSide === 'home'
                ? `${enriched[0].game.awayTeam.abbreviation} @ ${enriched[0].game.homeTeam.abbreviation}`
                : `${enriched[0].game.awayTeam.abbreviation} @ ${enriched[0].game.homeTeam.abbreviation}`
              } · {enriched[0].game.stadium?.name ?? 'TBD'}
            </div>
          </div>
          <div className="text-right">
            <div className="font-condensed font-black text-5xl text-nuke-red leading-none">
              {enriched[0].pitcher.hrVulnScore}
            </div>
            <div className="text-xs text-nuke-muted mt-1">Vuln Score</div>
            <div className="text-xs text-nuke-gold mt-0.5 font-mono">{enriched[0].pitcher.hr9} HR/9</div>
          </div>
        </div>
      )}

      <PitcherTable pitchers={enriched as any} />
    </div>
  )
}
