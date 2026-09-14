import type { PanelResult } from '../utils/types'
import { formatNumber, formatTonnes } from '../utils/format'

export default function SustainabilitySection({ panel, lifetimeYears }: { panel: PanelResult; lifetimeYears: number }) {
  return (
    <div className="card">
      <h3 className="font-display font-semibold text-ink mb-1">Your Climate Impact</h3>
      <p className="text-sm text-ink-muted mb-5">Every year your system could:</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        <div className="rounded-xl bg-surface2 p-4">
          <p className="text-2xl mb-1" aria-hidden="true">⚡</p>
          <p className="font-display text-xl font-bold text-ink">{formatNumber(panel.annual_generation_kwh)} kWh</p>
          <p className="text-xs text-ink-muted">Generate clean electricity</p>
        </div>
        <div className="rounded-xl bg-surface2 p-4">
          <p className="text-2xl mb-1" aria-hidden="true">🌱</p>
          <p className="font-display text-xl font-bold text-helio">{formatTonnes(panel.co2_avoided_kg_per_year)}</p>
          <p className="text-xs text-ink-muted">
            CO₂ avoided ({formatNumber(panel.co2_avoided_kg_per_year / 12)} kg/month)
          </p>
        </div>
        <div className="rounded-xl bg-surface2 p-4">
          <p className="text-2xl mb-1" aria-hidden="true">☀️</p>
          <p className="font-display text-xl font-bold text-ink">
            {panel.consumption_offset_percent !== null ? `${Math.min(panel.consumption_offset_percent, 100).toFixed(0)}%+` : '—'}
          </p>
          <p className="text-xs text-ink-muted">
            {panel.consumption_offset_percent !== null
              ? 'Of your household electricity demand offset'
              : 'Add your electricity usage to see this'}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-helio/25 bg-helio-light/40 p-4">
        <p className="text-xs font-semibold text-helio-dark uppercase tracking-wide mb-1">
          Potential Lifetime Impact ({lifetimeYears}-year estimated lifetime)
        </p>
        <p className="font-display text-2xl font-extrabold text-ink">
          {formatTonnes(panel.lifetime_co2_avoided_kg, 1)} <span className="text-sm font-normal text-ink-muted">of CO₂ avoided</span>
        </p>
        <p className="text-xs text-ink-muted mt-1">
          Assumes flat annual generation over {lifetimeYears} years — a simple planning figure,
          not a degradation model.
        </p>
      </div>
    </div>
  )
}
