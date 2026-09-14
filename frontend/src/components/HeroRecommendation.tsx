import { useState } from 'react'
import type { PanelResult, Recommendation } from '../utils/types'
import { formatInr, formatNumber, formatPayback } from '../utils/format'
import { GlossaryTerm } from './InfoTooltip'

const RATING_META: Record<Recommendation['rating'], { emoji: string; barClass: string }> = {
  'Highly Suitable': { emoji: '☀️', barClass: 'bg-helio' },
  Suitable: { emoji: '🌤️', barClass: 'bg-helio/80' },
  'Potentially Suitable': { emoji: '⛅', barClass: 'bg-sun' },
  'Needs Further Assessment': { emoji: '🔍', barClass: 'bg-ink-faint' },
}

export default function HeroRecommendation({
  recommendation,
  panel,
  roofAreaSqft,
  usableAreaSqm,
  irradiance,
}: {
  recommendation: Recommendation
  panel: PanelResult
  roofAreaSqft: number
  usableAreaSqm: number
  irradiance: number
}) {
  const meta = RATING_META[recommendation.rating]
  const [showCalc, setShowCalc] = useState(false)

  return (
    <section className="card overflow-hidden !p-0" aria-labelledby="recommendation-heading">
      <div className={`${meta.barClass} px-6 py-6 sm:px-8 sm:py-8`}>
        <p className="text-xs font-semibold uppercase tracking-wider text-white/80 mb-2">
          Your Home's Solar Potential
        </p>
        <h2 id="recommendation-heading" className="font-display text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <span aria-hidden="true">{meta.emoji}</span>
          {recommendation.rating.toUpperCase()}
        </h2>
        <p className="text-white/90 mt-2 max-w-2xl leading-relaxed">{recommendation.headline}</p>
      </div>

      <div className="grid grid-cols-3 divide-x divide-edge">
        <div className="px-4 sm:px-6 py-5 text-center">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1">
            System Size <GlossaryTerm term="kW" label="kW" />
          </p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-ink">{formatNumber(panel.system_capacity_kw, 1)} kW</p>
        </div>
        <div className="px-4 sm:px-6 py-5 text-center">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1">Annual Savings</p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-helio">{formatInr(panel.annual_savings_inr)}</p>
        </div>
        <div className="px-4 sm:px-6 py-5 text-center">
          <p className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide mb-1">
            Payback <GlossaryTerm term="payback" label="payback period" />
          </p>
          <p className="font-display text-2xl sm:text-3xl font-bold text-ink">
            {formatPayback(panel.payback_years, panel.payback_years_int, panel.payback_months_remainder)}
          </p>
        </div>
      </div>

      <div className="border-t border-edge px-6 py-4 sm:px-8">
        <button
          type="button"
          onClick={() => setShowCalc((v) => !v)}
          className="text-xs font-semibold text-helio hover:underline"
        >
          {showCalc ? '▾' : '▸'} Why is my system {formatNumber(panel.system_capacity_kw, 1)} kW? How is this calculated?
        </button>
        {showCalc && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <span className="pill bg-surface2 text-ink">{formatNumber(roofAreaSqft)} sq ft roof</span>
            <span aria-hidden="true">→</span>
            <span className="pill bg-surface2 text-ink">{formatNumber(usableAreaSqm, 1)} m² usable</span>
            <span aria-hidden="true">→</span>
            <span className="pill bg-surface2 text-ink">{panel.panel_count} panels</span>
            <span aria-hidden="true">→</span>
            <span className="pill bg-helio-light text-helio-dark">{formatNumber(panel.system_capacity_kw, 2)} kW</span>
            <span className="w-full text-[11px] text-ink-faint mt-1">
              Usable roof area ÷ 1.6 m² per panel → panel count, × {panel.panel_watt} W per panel ÷ 1000 → system
              capacity. At {irradiance} kWh/m²/day of sunlight, that's {formatNumber(panel.monthly_generation_kwh)} kWh
              estimated per month.
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-edge px-6 py-5 sm:px-8">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2.5">Why Helio says this</p>
        <ul className="space-y-1.5">
          {recommendation.reasons.map((reason, i) => (
            <li key={i} className="text-sm text-ink flex gap-2">
              <span className="text-helio shrink-0" aria-hidden="true">✓</span>
              <span>{reason}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs text-ink-faint mt-3 leading-relaxed">
          Final suitability depends on roof shading, structural condition, installation
          orientation, DISCOM rules and a physical site inspection.
        </p>
      </div>
    </section>
  )
}
