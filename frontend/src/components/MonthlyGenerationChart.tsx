import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { PanelResult } from '../utils/types'
import { MONTH_LABELS } from '../utils/format'

export default function MonthlyGenerationChart({ panel, isFallback }: { panel: PanelResult; isFallback: boolean }) {
  const series = panel.monthly_generation_series_kwh
  const data = MONTH_LABELS.map((label, i) => ({
    month: label,
    kWh: series[i] ?? panel.monthly_generation_kwh,
  }))

  return (
    <div className="card">
      <div className="flex items-baseline justify-between mb-1 flex-wrap gap-2">
        <h3 className="font-display text-sm font-semibold text-ink">Estimated Monthly Generation</h3>
        <span className="text-xs text-ink-faint">kWh per month</span>
      </div>
      <p className="text-xs text-ink-muted mb-4">
        {isFallback
          ? 'Based on a flat fallback irradiance assumption (real seasonal shape unavailable).'
          : "Based on NASA POWER's long-term monthly averages for your location — a real seasonal shape, not a flat average."}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--c-border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgb(var(--c-text-muted))' }} axisLine={{ stroke: 'rgb(var(--c-border))' }} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: 'rgb(var(--c-text-muted))' }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            formatter={(v: number) => [`${v.toFixed(0)} kWh`, 'Generation']}
            contentStyle={{ background: 'rgb(var(--c-surface))', border: '1px solid rgb(var(--c-border))', borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="kWh" fill="rgb(var(--c-green))" radius={[5, 5, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
