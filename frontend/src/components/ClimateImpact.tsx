import type { PanelResult } from '../utils/types'
import { formatNumber } from '../utils/format'

function ImpactStat({
  label,
  value,
  unit,
  note,
  accent,
}: {
  label: string
  value: string
  unit?: string
  note?: string
  accent?: boolean
}) {
  return (
    <div>
      {/* Fixed label height keeps the figures on one baseline when labels wrap */}
      <dt className="text-sm text-stone-400 min-h-[2.75rem] lg:min-h-0">{label}</dt>
      <dd className="mt-1 lg:mt-2 flex items-baseline gap-1.5">
        <span className={`font-serif text-3xl sm:text-4xl tabular ${accent ? 'text-dossier-leaf' : 'text-white'}`}>{value}</span>
        {unit && <span className="text-sm text-stone-400">{unit}</span>}
      </dd>
      {note && <p className="mt-1 text-xs text-stone-500">{note}</p>}
    </div>
  )
}

/** The ecological side of the estimate — a dark band so it reads as its own chapter. */
export default function ClimateImpact({ panel, lifetimeYears }: { panel: PanelResult; lifetimeYears: number }) {
  const offset = panel.consumption_offset_percent
  const emissionFactor = panel.annual_generation_kwh > 0 ? panel.co2_avoided_kg_per_year / panel.annual_generation_kwh : 0

  return (
    <div className="bg-dossier-charcoal text-white px-6 py-12 sm:px-12 sm:py-14">
      <p className="text-xs font-mono uppercase tracking-wider text-dossier-leaf mb-3">Sustainability</p>
      <h2 className="font-serif text-3xl sm:text-4xl tracking-tight">Your climate impact</h2>
      <p className="mt-3 text-stone-400 max-w-xl">
        Every unit you generate on your own roof is a unit that doesn't have to come from the grid.
      </p>

      <dl className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
        <ImpactStat label="Clean electricity a year" value={formatNumber(panel.annual_generation_kwh)} unit="kWh" />
        <ImpactStat label="CO₂ avoided a year" value={formatNumber(panel.co2_avoided_kg_per_year / 1000, 1)} unit="tonnes" accent />
        <ImpactStat
          label={`CO₂ avoided over ${lifetimeYears} years`}
          value={formatNumber(panel.lifetime_co2_avoided_kg / 1000, 0)}
          unit="tonnes"
          accent
        />
        <ImpactStat
          label="Your electricity use covered"
          value={offset === null ? '—' : offset >= 100 ? 'Fully' : `${Math.round(offset)}%`}
          note={offset !== null && offset >= 100 ? `generates ${(offset / 100).toFixed(1)}× what you use` : undefined}
        />
      </dl>

      <p className="mt-12 pt-6 border-t border-stone-800 text-xs text-stone-400 leading-relaxed max-w-3xl">
        Based on {emissionFactor.toFixed(2)} kg of CO₂ avoided for every kWh generated instead of drawn from the grid,
        with output held flat across {lifetimeYears} years. A planning figure, not a certified carbon accounting.
        {offset === null && ' Add your monthly usage to see how much of your electricity this would cover.'}
      </p>
    </div>
  )
}
