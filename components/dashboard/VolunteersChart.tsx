'use client'

// oxlint-disable-next-line react-doctor/prefer-dynamic-import -- VolunteersChart is dynamically imported on the dashboard page
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function VolunteersChart({ data }: { data: any[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-foreground/40 font-display">
        No records yet. Allocate volunteers to see statistics.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#11111115" />
        <XAxis dataKey="name" stroke="#111111" fontSize={11} tickLine={false} axisLine={false} fontFamily="Fredoka" />
        <YAxis stroke="#111111" fontSize={11} tickLine={false} axisLine={false} fontFamily="Fredoka" />
        <Tooltip
          cursor={{ fill: 'rgba(188,166,255,0.15)' }}
          contentStyle={{ border: '2px solid #111111', borderRadius: 10, fontFamily: 'Fredoka' }}
        />
        <Bar dataKey="volunteers" fill="#BCA6FF" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
