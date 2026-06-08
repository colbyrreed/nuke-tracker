// src/app/park/page.tsx
import { db } from '@/lib/db'
import { ParkCard } from '@/components/park/park-card'
import { Map } from 'lucide-react'

export const revalidate = 86400 // daily — park factors don't change often

export default async function ParkPage() {
  const stadiums = await db.stadium.findMany({
    orderBy: { hrFactor: 'desc' },
    include: { teams: { select: { name: true, abbreviation: true } } },
  })

  const avgHRFactor = stadiums.length
    ? stadiums.reduce((s, st) => s + st.hrFactor, 0) / stadiums.length
    : 1.0

  const hitterParks = stadiums.filter((s) => s.hrFactor > 1.0)
  const pitcherParks = stadiums.filter((s) => s.hrFactor < 1.0)

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <div className="bg-surface border border-border rounded-lg px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Map className="text-nuke-blue" size={24} />
          <div>
            <h1 className="font-condensed font-black text-3xl text-white tracking-wide">
              Park <span className="text-nuke-red">Center</span>
            </h1>
            <p className="text-xs text-nuke-muted mt-1">
              All 30 MLB stadiums ranked by HR factor · 5-year Statcast averages
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Stadiums', value: stadiums.length, color: 'text-white' },
            { label: 'Hitter Parks', value: hitterParks.length, color: 'text-nuke-green' },
            { label: 'Pitcher Parks', value: pitcherParks.length, color: 'text-red-400' },
            { label: 'Avg HR Factor', value: avgHRFactor.toFixed(3), color: 'text-nuke-muted2' },
          ].map((s) => (
            <div key={s.label} className="bg-surface-2 border border-border rounded-lg px-3 py-2 text-center">
              <div className={`font-mono text-base font-medium ${s.color}`}>{s.value}</div>
              <div className="text-[10px] text-nuke-muted uppercase tracking-wide mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Best + worst */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-nuke-green/5 border border-nuke-green/20 rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-nuke-green uppercase tracking-wide">🔥 Most HR-Friendly</div>
            <div className="font-condensed font-bold text-lg text-white mt-1">{stadiums[0]?.name}</div>
            <div className="text-xs text-nuke-muted">{stadiums[0]?.city}</div>
          </div>
          <div className="font-mono text-2xl font-bold text-nuke-green">{stadiums[0]?.hrFactor.toFixed(3)}</div>
        </div>
        <div className="bg-nuke-red/5 border border-nuke-red/20 rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold text-red-400 uppercase tracking-wide">❄️ Most Pitcher-Friendly</div>
            <div className="font-condensed font-bold text-lg text-white mt-1">{stadiums[stadiums.length - 1]?.name}</div>
            <div className="text-xs text-nuke-muted">{stadiums[stadiums.length - 1]?.city}</div>
          </div>
          <div className="font-mono text-2xl font-bold text-red-400">{stadiums[stadiums.length - 1]?.hrFactor.toFixed(3)}</div>
        </div>
      </div>

      {/* All parks grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stadiums.map((stadium, i) => (
          <ParkCard
            key={stadium.id}
            stadium={stadium as any}
            rank={i + 1}
            delay={i * 0.02}
          />
        ))}
      </div>
    </div>
  )
}
