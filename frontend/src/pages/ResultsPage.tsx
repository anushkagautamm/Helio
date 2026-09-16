import { useState } from 'react'
import type { AnalyzeResponse } from '../utils/types'
import ClimateImpact from '../components/ClimateImpact'
import CompareMyQuote from '../components/CompareMyQuote'
import CompareProducts from '../components/CompareProducts'
import CostBreakdown from '../components/CostBreakdown'
import ErrorBanner from '../components/ErrorBanner'
import ExpandableSection from '../components/ExpandableSection'
import GenerationProfile from '../components/GenerationProfile'
import Icon from '../components/Icon'
import PanelOptions from '../components/PanelOptions'
import SavingsTrajectory from '../components/SavingsTrajectory'
import SiteRecord from '../components/SiteRecord'
import { formatInr, formatNumber, formatPayback, formatTariff } from '../utils/format'
import { shortPlaceName } from '../utils/place'
import { lifetimeYearsFor, projectLifetime, type TariffRise } from '../utils/projection'

interface ResultsPageProps {
  analysis: AnalyzeResponse
  downloading: boolean
  downloadError: string | null
  onDownload: () => void
  onBack: () => void
  onRestart: () => void
}

const CONFIDENCE_FACTORS = [
  'Shade from trees or nearby buildings',
  'Roof orientation and tilt',
  'Structural condition of your roof',
  'Installation quality and equipment',
  'Changes in your electricity use',
  'Future tariff changes',
  'Subsidy eligibility and rules',
]

function SectionTitle({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-10">
      <p className="text-xs font-mono uppercase tracking-wider text-dossier-ochre mb-3">{eyebrow}</p>
      <h2 className="font-serif text-3xl sm:text-4xl tracking-tight text-dossier-charcoal">{title}</h2>
      {children && <p className="mt-3 text-dossier-secondary max-w-xl">{children}</p>}
    </div>
  )
}

function Stat({ label, value, unit, tone = 'text-dossier-charcoal' }: { label: string; value: string; unit?: string; tone?: string }) {
  return (
    <div className="py-6 lg:py-0 lg:px-8 lg:first:pl-0">
      <dt className="text-sm text-dossier-secondary">{label}</dt>
      <dd className="mt-2 flex items-baseline gap-1.5">
        <span className={`font-serif text-3xl sm:text-4xl tabular ${tone}`}>{value}</span>
        {unit && <span className="text-sm text-dossier-tertiary">{unit}</span>}
      </dd>
    </div>
  )
}

function Formula({ title, rule, result }: { title: string; rule: string; result: string }) {
  return (
    <div className="py-4 grid sm:grid-cols-[10rem_1fr] gap-x-8 gap-y-1">
      <dt className="text-sm font-medium text-dossier-charcoal">{title}</dt>
      <dd>
        <p className="text-sm text-dossier-secondary">{rule}</p>
        <p className="mt-1 text-xs font-mono text-dossier-charcoal">{result}</p>
      </dd>
    </div>
  )
}

export default function ResultsPage({ analysis, downloading, downloadError, onDownload, onBack, onRestart }: ResultsPageProps) {
  const [selectedPanelId, setSelectedPanelId] = useState(analysis.recommended_panel_id)
  const [tariffRise, setTariffRise] = useState<TariffRise>(0)

  const recommended =
    analysis.panel_results.find((p) => p.panel_id === analysis.recommended_panel_id) ?? analysis.panel_results[0]

  // Every figure on the page follows the panel type the user picks; the
  // closing verdict always describes Helio's actual recommendation.
  const selected = analysis.panel_results.find((p) => p.panel_id === selectedPanelId) ?? recommended
  const isAlternative = selected.panel_id !== recommended.panel_id

  const lifetimeYears = lifetimeYearsFor(selected)
  const projection = projectLifetime(selected, lifetimeYears, tariffRise)
  const { rating } = analysis.recommendation
  const kw = Number(selected.system_capacity_kw.toFixed(1))
  const breakdown = selected.cost_breakdown

  const verdict =
    rating === 'Highly Suitable' || rating === 'Suitable'
      ? 'Solar looks like a good fit for your home.'
      : rating === 'Potentially Suitable'
        ? 'Solar could work for your home, with some caveats.'
        : 'Your home needs a closer look before deciding.'

  const ratingTone =
    rating === 'Highly Suitable' || rating === 'Suitable'
      ? 'bg-dossier-forest/10 text-dossier-forest'
      : rating === 'Potentially Suitable'
        ? 'bg-dossier-ochre/10 text-dossier-ochre'
        : 'bg-dossier-muted text-dossier-secondary'

  return (
    <div className="space-y-24 sm:space-y-32">
      {/* Hero */}
      <section>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-8">
          <span className={`px-2.5 py-1 text-xs font-medium ${ratingTone}`}>{rating}</span>
          <span className="text-sm text-dossier-tertiary">
            {analysis.location ? `${shortPlaceName(analysis.location.display_name)} · ` : ''}
            {formatNumber(analysis.roof.gross_area_sqft)} sq ft roof
          </span>
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl lg:text-[56px] leading-[1.1] tracking-tight text-dossier-charcoal max-w-4xl">
          {projection.lifetimeNet > 0 ? (
            <>
              A {kw} kW system could save you{' '}
              <span className="italic text-dossier-forest whitespace-nowrap">{formatInr(projection.lifetimeNet)}</span> over{' '}
              {lifetimeYears} years.
            </>
          ) : (
            <>At these inputs, solar may not pay for itself within {lifetimeYears} years.</>
          )}
        </h1>

        <p className="mt-6 text-lg text-dossier-secondary leading-relaxed max-w-2xl">
          {isAlternative ? (
            <>
              You're viewing {selected.panel_name}. Helio recommends {recommended.panel_name} for your roof —{' '}
              <button
                type="button"
                onClick={() => setSelectedPanelId(recommended.panel_id)}
                className="text-dossier-charcoal underline underline-offset-4 decoration-dossier-border hover:decoration-dossier-charcoal"
              >
                switch back
              </button>
              .
            </>
          ) : (
            analysis.recommendation.headline
          )}
        </p>

        <dl className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-x-6 border-t border-dossier-border pt-2 lg:pt-8 lg:divide-x divide-dossier-border">
          <Stat
            label="Pays for itself in"
            value={projection.breakevenYear !== null ? projection.breakevenYear.toFixed(1) : '—'}
            unit={projection.breakevenYear !== null ? 'years' : undefined}
          />
          <Stat label="You pay after subsidy" value={formatInr(selected.net_cost_inr)} />
          <Stat label="Saves every year" value={formatInr(selected.annual_savings_inr)} tone="text-dossier-forest" />
          <Stat label="Generates a year" value={formatNumber(selected.annual_generation_kwh)} unit="kWh" />
        </dl>
      </section>

      {/* Savings + cost */}
      <section className="grid lg:grid-cols-12 gap-x-16 gap-y-20">
        <div className="lg:col-span-7 min-w-0">
          <SectionTitle eyebrow="Savings" title="How your savings add up" />
          <SavingsTrajectory projection={projection} tariffRise={tariffRise} onTariffRiseChange={setTariffRise} />
        </div>
        <div className="lg:col-span-5 min-w-0">
          <SectionTitle eyebrow="Cost" title="What you'll pay" />
          <CostBreakdown panel={selected} subsidyMeta={analysis.subsidy_meta} />
        </div>
      </section>

      {/* Panel options */}
      <section>
        <SectionTitle eyebrow="Panels" title="Compare panel types">
          Select an option to update the numbers above.
        </SectionTitle>
        <PanelOptions
          panels={analysis.panel_results}
          recommendedId={analysis.recommended_panel_id}
          selectedId={selected.panel_id}
          onSelect={setSelectedPanelId}
        />
      </section>

      {/* Site */}
      <section>
        <SectionTitle eyebrow="Your site" title="Sunlight and generation" />
        <div className="grid lg:grid-cols-12 gap-x-16 gap-y-14">
          <div className="lg:col-span-7 min-w-0">
            <GenerationProfile panel={selected} isFallback={analysis.solar_resource.is_fallback} />
          </div>
          <div className="lg:col-span-5 min-w-0">
            <SiteRecord analysis={analysis} panel={selected} />
          </div>
        </div>
      </section>

      {/* Sustainability */}
      <section>
        <ClimateImpact panel={selected} lifetimeYears={lifetimeYears} />
      </section>

      {/* Details */}
      <section>
        <SectionTitle eyebrow="Details" title="Look closer" />
        <div className="border-t border-dossier-border divide-y divide-dossier-border">
          <ExpandableSection title={`Why it's rated ${rating.toLowerCase()}`}>
            <ul className="space-y-3 max-w-3xl">
              {analysis.recommendation.reasons.map((reason, i) => (
                <li key={i} className="flex gap-3 text-dossier-secondary">
                  <Icon name="check" className="!text-[18px] text-dossier-sage shrink-0 mt-0.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-dossier-tertiary max-w-3xl">
              Final suitability depends on shading, roof condition, orientation, DISCOM rules and a site inspection.
            </p>
          </ExpandableSection>

          <ExpandableSection title="Compare a specific product">
            <CompareProducts analysis={analysis} baseline={selected} />
          </ExpandableSection>

          <ExpandableSection title="Check an installer's quote">
            <CompareMyQuote analysis={analysis} />
          </ExpandableSection>

          <ExpandableSection title="How the numbers were calculated">
            <dl className="divide-y divide-dossier-border-subtle max-w-3xl">
              <Formula
                title="System size"
                rule="Roof area × 65% usable ÷ 1.6 m² per panel, × panel wattage."
                result={`${formatNumber(analysis.roof.gross_area_sqft)} sq ft → ${formatNumber(analysis.roof.usable_area_sqm, 1)} m² → ${selected.panel_count} panels → ${formatNumber(selected.system_capacity_kw, 2)} kW`}
              />
              <Formula
                title="Generation"
                rule="System kW × daily sunlight × 30 days × 75% performance factor."
                result={`${formatNumber(selected.system_capacity_kw, 2)} × ${analysis.solar_resource.irradiance_kwh_per_m2_day} × 30 × 0.75 = ${formatNumber(selected.monthly_generation_kwh)} kWh / month`}
              />
              <Formula title="Electricity price" rule="Monthly bill ÷ monthly units." result={analysis.electricity.tariff_source} />
              <Formula
                title="Installed cost"
                rule={`System watts × ₹${formatNumber(selected.cost_per_watt_inr)} per watt.`}
                result={
                  breakdown
                    ? `Modules ${formatInr(breakdown.module_cost_inr)} · inverter & BOS ${formatInr(breakdown.inverter_bos_cost_inr)} · installation ${formatInr(breakdown.installation_epc_cost_inr)}`
                    : formatInr(selected.gross_cost_inr)
                }
              />
              <Formula
                title="Payback"
                rule="Cost after subsidy ÷ yearly savings."
                result={`${formatInr(selected.net_cost_inr)} ÷ ${formatInr(selected.annual_savings_inr)} = ${formatPayback(selected.payback_years, selected.payback_years_int, selected.payback_months_remainder)}`}
              />
              <Formula
                title="Cost per unit"
                rule={`Cost after subsidy ÷ everything generated over ${lifetimeYears} years.`}
                result={
                  projection.costPerKwh !== null
                    ? `${formatTariff(projection.costPerKwh)} / kWh, vs ${formatTariff(analysis.electricity.tariff_inr_per_kwh)} from the grid`
                    : '—'
                }
              />
              <Formula
                title="Savings chart"
                rule="Generation held flat with no degradation; the tariff rise scales what each avoided grid unit would cost."
                result={`At 0% the breakeven matches the payback period`}
              />
            </dl>

            <h4 className="mt-10 text-sm font-medium text-dossier-charcoal">Assumptions</h4>
            <dl className="mt-3 divide-y divide-dossier-border-subtle max-w-3xl">
              {Object.entries(analysis.assumptions).map(([label, value]) => (
                <div key={label} className="py-2.5 flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-8 text-sm">
                  <dt className="text-dossier-secondary">{label}</dt>
                  <dd className="text-dossier-charcoal sm:text-right">{value}</dd>
                </div>
              ))}
            </dl>

            {analysis.subsidy_meta && (
              <p className="mt-8 text-sm text-dossier-tertiary leading-relaxed max-w-3xl">
                Subsidy source: {analysis.subsidy_meta.source_name}, effective {analysis.subsidy_meta.effective_date}, checked{' '}
                {analysis.subsidy_meta.accessed_date}. {analysis.subsidy_meta.note}
              </p>
            )}
          </ExpandableSection>

          <ExpandableSection title="What could change these numbers">
            <p className="text-dossier-secondary max-w-3xl">
              This is a planning estimate built from open data and the formulas above — not a certified engineering
              design. These can move the real result:
            </p>
            <ul className="mt-5 grid sm:grid-cols-2 gap-x-10 gap-y-2.5 max-w-3xl">
              {CONFIDENCE_FACTORS.map((factor) => (
                <li key={factor} className="flex gap-3 text-sm text-dossier-charcoal">
                  <span className="mt-2 w-1 h-1 rounded-full bg-dossier-tertiary shrink-0" aria-hidden="true" />
                  {factor}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-dossier-tertiary max-w-3xl">
              Sunlight figures are NASA POWER long-term averages for your coordinates, not real-time or hyper-local data.
            </p>
          </ExpandableSection>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-dossier-border pt-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-4xl sm:text-5xl tracking-tight text-dossier-charcoal">{verdict}</h2>
          <p className="mt-5 text-dossier-secondary">
            Take the full report to your family or an installer — every figure on this page is in it.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button type="button" className="btn-primary !px-7 !py-4 w-full sm:w-auto" onClick={onDownload} disabled={downloading}>
              <Icon name="description" className="!text-[16px]" />
              {downloading ? 'Preparing PDF…' : 'Download full report'}
            </button>
            <button type="button" className="btn-secondary !px-7 !py-4 w-full sm:w-auto" onClick={onBack}>
              Edit my inputs
            </button>
          </div>
          {downloadError && (
            <div className="mt-6 text-left">
              <ErrorBanner message={downloadError} onRetry={onDownload} />
            </div>
          )}
          <button
            type="button"
            onClick={onRestart}
            className="mt-8 text-sm text-dossier-tertiary hover:text-dossier-charcoal transition-colors"
          >
            Start over with a different home
          </button>
        </div>

        <p className="mt-16 pt-8 border-t border-dossier-border-subtle text-sm text-dossier-secondary leading-relaxed max-w-3xl mx-auto text-center">
          Helio is not an official government portal. Please consult a certified solar installer and verify PM Surya Ghar
          subsidy eligibility through official government channels before making any financial decisions.
        </p>
      </section>
    </div>
  )
}
