// src/app/weather/page.tsx
import { db } from '@/lib/db'
import { WeatherCenter } from '@/components/weather/weather-center'
import { CloudSun } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const revalidate = 1800

export default async function WeatherPage() {
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
    },
    orderBy: { date: 'asc' },
  })

  const withWeather = games.filter((g) => g.weather && g.stadium)

  const avgBoost = withWeather.length
    ? withWeather.reduce((s, g) => s + (g.weather?.hrBoost ?? 0), 0) / withWeather.length
    : 0

  const bestGame = [...withWeather].sort((a, b) => (b.weather?.hrBoost ?? 0) - (a.weather?.hrBoost ?? 0))[0]
  const worstGame = [...withWeather].sort((a, b) => (a.weather?.hrBoost ?? 0) - (b.weather?.hrBoost ?? 0))[0]

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CloudSun className="text-nuke-blue" size={24} />
          <div>
            <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
              Weather <span className="text-nuke-red">Center</span>
            </h1>
            <p className="text-xs text-nuke-muted mt-1">
              Real-time weather &amp; HR boost for every stadium · Updated every 30 minutes
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Games Today', value: games.length, color: 'text-white' },
            { label: 'Avg HR Boost', value: `${avgBoost >= 0 ? '+' : ''}${avgBoost.toFixed(1)}%`, color: avgBoost >= 0 ? 'text-nuke-green' : 'text-red-400' },
            { label: 'Best Boost', value: bestGame ? `${(bestGame.weather?.hrBoost ?? 0) >= 0 ? '+' : ''}${(bestGame.weather?.hrBoost ?? 0).toFixed(1)}%` : '—', color: 'text-nuke-green' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-center">
              <div className={`font-mono text-base font-medium ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-nuke-muted uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Best/Worst callout */}
      {bestGame && worstGame && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-nuke-green/5 border border-nuke-green/20 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-nuke-green font-bold uppercase tracking-wide">💨 Best Weather For HRs</div>
              <div className="font-condensed font-bold text-lg text-white mt-1">
                {bestGame.awayTeam.abbreviation} @ {bestGame.homeTeam.abbreviation}
              </div>
              <div className="text-xs text-nuke-muted">{bestGame.stadium?.name} · {bestGame.weather?.windSpeed.toFixed(0)}mph {bestGame.weather?.windDirectionLabel}</div>
            </div>
            <div className="font-mono text-2xl font-bold text-nuke-green">
              +{(bestGame.weather?.hrBoost ?? 0).toFixed(1)}%
            </div>
          </div>
          <div className="bg-nuke-red/5 border border-nuke-red/20 rounded-lg px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] text-red-400 font-bold uppercase tracking-wide">❄️ Toughest Weather</div>
              <div className="font-condensed font-bold text-lg text-white mt-1">
                {worstGame.awayTeam.abbreviation} @ {worstGame.homeTeam.abbreviation}
              </div>
              <div className="text-xs text-nuke-muted">{worstGame.stadium?.name} · {worstGame.weather?.windSpeed.toFixed(0)}mph {worstGame.weather?.windDirectionLabel}</div>
            </div>
            <div className="font-mono text-2xl font-bold text-red-400">
              {(worstGame.weather?.hrBoost ?? 0).toFixed(1)}%
            </div>
          </div>
        </div>
      )}

      <WeatherCenter games={games as any} />
    </div>
  )
}
