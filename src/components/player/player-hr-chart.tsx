// src/components/player/player-hr-chart.tsx
'use client'

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts'
import { format } from 'date-fns'

interface GameStat {
  date: Date
  homeRuns: number
  atBats: number
  game?: { homeTeam: { abbreviation: string }; awayTeam: { abbreviation: string } }
}

export function PlayerHRChart({ games, metric = 'hr' }: { games: GameStat[]; metric?: 'hr' | 'exitVelo' }) {
  const data = [...games]
    .reverse()
    .slice(-20)
    .map((g) => ({
      date: format(new Date(g.date), 'MM/dd'),
      hr: g.homeRuns,
      ab: g.atBats,
    }))

  if (metric === 'hr') {
    return (
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2f45" />
            <XAxis dataKey="date" tick={{ fill: '#607090', fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#607090', fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: '#0d1520', border: '1px solid #1e2f45', borderRadius: '6px', fontSize: 11 }}
              labelStyle={{ color: '#607090' }}
              itemStyle={{ color: '#f04a2a' }}
            />
            <Bar dataKey="hr" name="Home Runs" fill="#f04a2a" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Exit velo placeholder (would use statcast events in prod)
  return (
    <div className="h-40 flex items-center justify-center text-nuke-muted text-xs">
      Exit velocity chart — requires Statcast event data
    </div>
  )
}

// ─── Recent game table ────────────────────────────────────────────────────────

export function PlayerRecentTable({ games }: { games: GameStat[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            {['Date', 'Opponent', 'AB', 'HR'].map((h) => (
              <th key={h} className="text-left text-[10px] font-semibold text-nuke-muted uppercase tracking-wider pb-2 pr-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {games.slice(0, 15).map((g, i) => (
            <tr key={i} className={`border-b border-[#0f1e30] last:border-0 ${g.homeRuns > 0 ? 'bg-nuke-red/5' : ''}`}>
              <td className="py-2 pr-4 font-mono text-xs text-nuke-muted2">{format(new Date(g.date), 'MM/dd')}</td>
              <td className="py-2 pr-4 text-xs text-nuke-muted2">
                {(g as any).game ? `vs ${(g as any).game.homeTeam.abbreviation}` : '—'}
              </td>
              <td className="py-2 pr-4 font-mono text-xs text-white">{g.atBats}</td>
              <td className="py-2 font-mono text-sm font-bold" style={{ color: g.homeRuns > 0 ? '#f04a2a' : '#607090' }}>
                {g.homeRuns > 0 ? `💣 ${g.homeRuns}` : '0'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
