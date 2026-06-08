// src/app/games/page.tsx
import { db } from '@/lib/db'
import { GameCenterCard } from '@/components/games/game-center-card'
import { calculateWeatherBoost } from '@/lib/ml/scoring-engine'

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function GamesPage() {
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
      weather: true,
      pitchers: { include: { pitcher: true }, where: { role: 'STARTER' } },
      lineups: { include: { player: true }, take: 9, where: { battingOrder: { lte: 9 } } },
    },
    orderBy: { date: 'asc' },
  })

  // Compute HR environment for each game
  const enrichedGames = games.map((g) => {
    const wx = g.weather
    const stadium = g.stadium

    const wxBoost = wx && stadium
      ? calculateWeatherBoost({
          windSpeed: wx.windSpeed,
          windDirection: wx.windDirection,
          temperature: wx.temperature,
          humidity: wx.humidity,
          altitude: stadium.altitude,
          roofOpen: wx.roofOpen,
        })
      : 0

    const parkBoost = stadium ? (stadium.hrFactor - 1.0) * 20 : 0

    // HR Environment: blend park + weather + baseline
    const hrEnv = Math.round(Math.min(100, Math.max(0,
      50 + parkBoost * 2 + wxBoost * 2
    )))

    // Projected HRs: MLB avg ~2.1/game, adjusted by environment
    const projHRs = +(2.1 * (hrEnv / 50)).toFixed(1)

    return {
      ...g,
      hrEnvironment: hrEnv,
      projectedHRs: projHRs,
    }
  })

  const sorted = [...enrichedGames].sort((a, b) => b.hrEnvironment - a.hrEnvironment)
  const avgEnv = enrichedGames.length
    ? Math.round(enrichedGames.reduce((s, g) => s + g.hrEnvironment, 0) / enrichedGames.length)
    : 50

  const topGame = sorted[0]
  const worstGame = sorted[sorted.length - 1]

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
            Game <span className="text-nuke-red">Center</span>
          </h1>
          <p className="text-xs text-nuke-muted mt-1">
            HR environment ratings · {games.length} games today
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Games', value: games.length, color: 'text-white' },
            { label: 'Avg HR Env', value: avgEnv, color: avgEnv >= 60 ? 'text-nuke-green' : 'text-nuke-muted2' },
            { label: 'Best Park', value: topGame ? `${topGame.homeTeam.abbreviation} @ ${topGame.stadium?.name?.split(' ')[0] ?? '—'}` : '—', color: 'text-nuke-gold' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-center">
              <div className={`font-mono text-base font-medium ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-nuke-muted uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Best + Worst callouts */}
      {topGame && worstGame && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-nuke-green/5 border border-nuke-green/20 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-nuke-green font-bold uppercase tracking-wide">🔥 Best HR Game Today</div>
              <div className="font-condensed font-bold text-lg text-white mt-1">
                {topGame.awayTeam.abbreviation} @ {topGame.homeTeam.abbreviation}
              </div>
              <div className="text-xs text-nuke-muted">{topGame.stadium?.name}</div>
            </div>
            <div className="font-condensed font-black text-4xl text-nuke-green">{topGame.hrEnvironment}</div>
          </div>
          <div className="bg-nuke-muted/5 border border-border rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-nuke-muted font-bold uppercase tracking-wide">❄️ Toughest HR Game</div>
              <div className="font-condensed font-bold text-lg text-white mt-1">
                {worstGame.awayTeam.abbreviation} @ {worstGame.homeTeam.abbreviation}
              </div>
              <div className="text-xs text-nuke-muted">{worstGame.stadium?.name}</div>
            </div>
            <div className="font-condensed font-black text-4xl text-nuke-muted">{worstGame.hrEnvironment}</div>
          </div>
        </div>
      )}

      {/* Grid of game cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {enrichedGames.map((game, i) => (
          <GameCenterCard key={game.id} game={game as any} delay={i * 0.04} />
        ))}
        {games.length === 0 && (
          <div className="col-span-full text-center py-16 text-nuke-muted">
            No games scheduled today. Check back tomorrow.
          </div>
        )}
      </div>
    </div>
  )
}
