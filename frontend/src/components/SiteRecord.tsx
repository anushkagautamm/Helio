import type { AnalyzeResponse, PanelResult } from '../utils/types'
import { describeSunlight, formatNumber, formatTariff } from '../utils/format'
import { GlossaryTerm } from './InfoTooltip'
import MapView from './LazyMapView'

function Fact({ label, value, note }: { label: React.ReactNode; value: string; note?: string }) {
  return (
    <div className="py-3.5 flex items-baseline justify-between gap-6">
      <dt className="text-sm text-dossier-secondary shrink-0">{label}</dt>
      <dd className="text-right">
        <span className="text-sm text-dossier-charcoal tabular">{value}</span>
        {note && <span className="block text-xs text-dossier-tertiary mt-0.5">{note}</span>}
      </dd>
    </div>
  )
}

export default function SiteRecord({ analysis, panel }: { analysis: AnalyzeResponse; panel: PanelResult }) {
  const { location, roof, solar_resource: solar, electricity } = analysis

  return (
    <div>
      {location && (
        <div className="border border-dossier-border">
          <MapView lat={location.lat} lon={location.lon} heightClass="h-48" zoom={16} label={location.display_name} quiet />
        </div>
      )}
      <dl className="mt-4 divide-y divide-dossier-border-subtle">
        <Fact
          label={
            <>
              Roof area <GlossaryTerm term="usableRoofArea" label="usable roof area" />
            </>
          }
          value={`${formatNumber(roof.gross_area_sqft)} sq ft`}
          note={`${formatNumber(roof.usable_area_sqm, 1)} m² usable`}
        />
        <Fact
          label={
            <>
              Sunlight <GlossaryTerm term="irradiance" label="solar irradiance" />
            </>
          }
          value={`${solar.irradiance_kwh_per_m2_day} kWh/m²/day`}
          note={describeSunlight(solar.irradiance_kwh_per_m2_day).replace('Your location receives ', '')}
        />
        <Fact
          label={
            <>
              Electricity price <GlossaryTerm term="tariff" label="tariff" />
            </>
          }
          value={`${formatTariff(electricity.tariff_inr_per_kwh)} / kWh`}
          note={electricity.monthly_bill_inr && electricity.monthly_units_kwh ? 'from your bill' : 'assumed'}
        />
        <Fact label="Panels" value={`${panel.panel_count} × ${panel.panel_watt} W`} note={`${formatNumber(panel.system_capacity_kw, 1)} kW system`} />
      </dl>
      {solar.is_fallback && <p className="mt-4 text-xs text-dossier-tertiary">{solar.note}</p>}
    </div>
  )
}
