// src/components/model/model-history-chart.tsx
'use client'

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { format } from 'date-fns'

interface DataPoint {
  date: Date
  brierScore: number
  roi: number
}

interface Props {
  data: DataPoint[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 text-xs">
      <div className="text-nuke-muted mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-nuke-muted2">{p.name}:</span>
          <span className="text-white font-mono">{p.value?.toFixed(3)}</span>
        </div>
      ))}
    </div>
  )
}

export function ModelHistoryChart({ data }: Props) {
  const chartData = [...data]
    .reverse()
    .map((d) => ({
      date: format(new Date(d.date), 'MM/dd'),
      brier: +d.brierScore.toFixed(4),
      roi: +(d.roi * 100).toFixed(2),
    }))

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2f45" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#607090', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fill: '#607090', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="brier"
            name="Brier Score"
            stroke="#3b9eff"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#3b9eff' }}
          />
          <Line
            type="monotone"
            dataKey="roi"
            name="ROI %"
            stroke="#22c97e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#22c97e' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
