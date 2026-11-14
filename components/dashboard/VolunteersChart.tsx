'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl glass-panel p-3 shadow-xl border border-white/40 dark:border-slate-700/50 text-xs">
        <p className="font-semibold text-slate-900 dark:text-white mb-1">{label}</p>
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Volunteers: {payload[0].value}</span>
        </div>
      </div>
    )
  }
  return null
}

export default function VolunteersChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-slate-400">
        No records yet. Allocate volunteers to see statistics.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="name"
          stroke="var(--muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="var(--muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip cursor={{ fill: 'var(--muted)' }} content={<CustomTooltip />} />
        <Bar dataKey="volunteers" fill="var(--primary)" radius={[3, 3, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  )
}
