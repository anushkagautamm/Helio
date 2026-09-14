import { useState } from 'react'
import type { AnalyzeResponse } from '../utils/types'
import HeroRecommendation from '../components/HeroRecommendation'
import PanelComparisonCards from '../components/PanelComparisonCards'
import SubsidyBreakdown from '../components/SubsidyBreakdown'
import FinancialStory from '../components/FinancialStory'
import SustainabilitySection from '../components/SustainabilitySection'
import MonthlyGenerationChart from '../components/LazyMonthlyGenerationChart'
import ExpandableSection from '../components/ExpandableSection'
import CompareProducts from '../components/CompareProducts'
import CompareMyQuote from '../components/CompareMyQuote'
import MapView from '../components/LazyMapView'
import ErrorBanner from '../components/ErrorBanner'
import { describeSunlight, formatInr, formatNumber, formatPayback, formatTonnes } from '../utils/format'
import { downloadPdfReport } from '../services/api'
import { GlossaryTerm } from '../components/InfoTooltip'

interface ResultsPageProps {
  analysis: AnalyzeResponse
  onBack: () => void
  onRestart: () => void
}

export default function ResultsPage({ analysis, onBack, onRestart }: ResultsPageProps) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [selectedPanelId, setSelectedPanelId] = useState(analysis.recommended_panel_id)
  const [compareProductsOpen, setCompareProductsOpen] = useState(false)

  function jumpToCompareProducts() {
    setCompareProductsOpen(true)
    document.getElementById('compare-products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const recommended =
    analysis.panel_results.find((p) => p.panel_id === analysis.recommended_panel_id) ??
    analysis.panel_results[0]

  // The panel currently being explored in the comparison cards below — used
  // for every section that shows one panel's numbers (generation, subsidy,
  // financials, sustainability). Hero/recommendation copy always describes
  // Helio's actual pick, but these sections update to whatever the user taps
  // so "what if I chose Bifacial instead" genuinely changes the numbers.
  const selected =
    analysis.panel_results.find((p) => p.panel_id === selectedPanelId) ?? recommended

  const lifetimeYears =
    selected.co2_avoided_kg_per_year > 0
      ? Math.round(selected.lifetime_co2_avoided_kg / selected.co2_avoided_kg_per_year)
      : 25

  async function handleDownload() {
    setDownloading(true)
    setDownloadError(null)
    try {
      const blob = await downloadPdfReport(analysis)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'helio-solar-report.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError('Could not generate the PDF report right now. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-16 space-y-8">
      <HeroRecommendation
        recommendation={analysis.recommendation}
        panel={recommended}
        roofAreaSqft={analysis.roof.gross_area_sqft}
        usableAreaSqm={analysis.roof.usable_area_sqm}
        irradiance={analysis.solar_resource.irradiance_kwh_per_m2_day}
      />

      {/* Location + roof + electricity + solar resource recap */}
      <section className="grid sm:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-display font-semibold text-ink mb-3">Location &amp; Roof</h3>
          {analysis.location && (
            <div className="mb-3">
              <MapView lat={analysis.location.lat} lon={analysis.location.lon} heightClass="h-40" zoom={15} />
            </div>
          )}
          <ul className="text-sm text-ink-muted space-y-1">
            <li>{analysis.location?.display_name}</li>
            <li>Gross roof area: <span className="text-ink font-medium">{formatNumber(analysis.roof.gross_area_sqft)} sq ft</span></li>
            <li>
              Usable area <GlossaryTerm term="usableRoofArea" label="usable roof area" /> ({analysis.roof.usable_fraction * 100}% assumption):{' '}
              <span className="text-ink font-medium">{formatNumber(analysis.roof.usable_area_sqm, 1)} m²</span>
            </li>
          </ul>
        </div>

        <div className="card">
          <h3 className="font-display font-semibold text-ink mb-1">
            Solar Resource <GlossaryTerm term="irradiance" label="solar irradiance" />
          </h3>
          <p className="text-sm text-ink mb-3">{describeSunlight(analysis.solar_resource.irradiance_kwh_per_m2_day)}</p>
          <p className="font-display text-3xl font-extrabold text-ink mb-1">
            {analysis.solar_resource.irradiance_kwh_per_m2_day}
            <span className="text-sm font-normal text-ink-muted ml-1">kWh/m²/day</span>
          </p>
          <p className="text-xs text-ink-muted mb-3">Average solar energy available at your location.</p>
          {analysis.solar_resource.is_fallback && (
            <p className="note-box mb-3">{analysis.solar_resource.note}</p>
          )}
          <div className="border-t border-edge pt-3 mt-1">
            <p className="text-sm text-ink-muted">
              Effective <GlossaryTerm term="tariff" label="tariff" />:{' '}
              <span className="text-ink font-medium">{formatInr(analysis.electricity.tariff_inr_per_kwh)}/kWh</span>
            </p>
            <p className="text-xs text-ink-faint mt-0.5">{analysis.electricity.tariff_source}</p>
          </div>
        </div>
      </section>

      {/* Monthly generation */}
      <section>
        <MonthlyGenerationChart panel={selected} isFallback={analysis.solar_resource.is_fallback} />
      </section>

      {/* Sustainability */}
      <section>
        <h2 className="font-display text-xl font-bold text-ink mb-4">Your Solar Impact</h2>
        <SustainabilitySection panel={selected} lifetimeYears={lifetimeYears} />
      </section>

      {/* Panel comparison */}
      <section>
        <h2 className="font-display text-xl font-bold text-ink mb-1">Panel Comparison</h2>
        <p className="text-sm text-ink-muted mb-4">Poly vs Mono PERC vs Bifacial — tap a card to compare.</p>
        <PanelComparisonCards
          panels={analysis.panel_results}
          recommendedId={analysis.recommended_panel_id}
          selectedId={selectedPanelId}
          onSelect={setSelectedPanelId}
          onJumpToCompareProducts={jumpToCompareProducts}
        />
      </section>

      {/* Compare Actual Products — optional */}
      <section>
        <ExpandableSection
          sectionId="compare-products-section"
          title="🔍 Compare Actual Products"
          open={compareProductsOpen}
          onOpenChange={setCompareProductsOpen}
        >
          <CompareProducts analysis={analysis} baseline={selected} />
        </ExpandableSection>
      </section>

      {/* Subsidy */}
      <section>
        <SubsidyBreakdown panel={selected} subsidyMeta={analysis.subsidy_meta} />
      </section>

      {/* Financial story */}
      <section>
        <h2 className="font-display text-xl font-bold text-ink mb-4">
          Your Financial Story
          {selected.panel_id !== analysis.recommended_panel_id && (
            <span className="text-sm font-normal text-ink-muted ml-2">— for {selected.panel_name}</span>
          )}
        </h2>
        <FinancialStory panel={selected} />
      </section>

      {/* Compare My Solar Quote — optional */}
      <section>
        <ExpandableSection title="📋 Already Have a Quote? Compare It">
          <CompareMyQuote analysis={analysis} />
        </ExpandableSection>
      </section>

      {/* How did Helio calculate this? */}
      <section>
        <ExpandableSection title="How was each value calculated?">
          <div className="space-y-3">
            <ExpandableSection title="Roof area → system capacity">
              <p>Gross roof area → × 65% usable fraction → ÷ 1.6 m² per panel → panel count</p>
              <p>Panel count × panel wattage ÷ 1000 → system capacity (kW)</p>
              <p className="text-ink font-medium">
                {formatNumber(analysis.roof.gross_area_sqft)} sq ft → {formatNumber(analysis.roof.usable_area_sqm, 1)} m² usable →{' '}
                {selected.panel_count} panels → {formatNumber(selected.system_capacity_kw, 2)} kW
              </p>
            </ExpandableSection>
            <ExpandableSection title="System capacity → estimated generation">
              <p>System kW × daily solar irradiance × 30 days × 75% performance factor → monthly generation</p>
              <p className="text-ink font-medium">
                {formatNumber(selected.system_capacity_kw, 2)} kW × {analysis.solar_resource.irradiance_kwh_per_m2_day} kWh/m²/day × 30 × 0.75 ={' '}
                {formatNumber(selected.monthly_generation_kwh)} kWh/month
              </p>
            </ExpandableSection>
            <ExpandableSection title="Bill ÷ usage → effective tariff">
              <p>Monthly bill amount ÷ monthly electricity units → effective tariff (₹/kWh)</p>
              <p className="text-ink font-medium">{analysis.electricity.tariff_source}</p>
            </ExpandableSection>
            <ExpandableSection title="All assumptions used">
              <ul className="space-y-1.5">
                {Object.entries(analysis.assumptions).map(([label, value]) => (
                  <li key={label}>
                    <strong className="text-ink">{label}:</strong> {value}
                  </li>
                ))}
              </ul>
            </ExpandableSection>
            {analysis.subsidy_meta && (
              <ExpandableSection title="Subsidy data source">
                <p>
                  <strong className="text-ink">Source:</strong> {analysis.subsidy_meta.source_name}
                </p>
                <p>
                  <strong className="text-ink">Effective from:</strong> {analysis.subsidy_meta.effective_date}
                  {' · '}
                  <strong className="text-ink">Checked:</strong> {analysis.subsidy_meta.accessed_date}
                </p>
                <p>{analysis.subsidy_meta.note}</p>
              </ExpandableSection>
            )}
          </div>
        </ExpandableSection>
      </section>

      {/* Trust / transparency */}
      <section>
        <h2 className="font-display text-xl font-bold text-ink mb-1">How Confident Is This Estimate?</h2>
        <div className="card">
          <p className="text-sm text-ink mb-4">
            This is a <strong>planning-level estimate</strong>, built from open data and the
            formulas shown throughout this page — not a certified engineering design.
          </p>
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
            Factors that can affect your actual results
          </p>
          <ul className="grid sm:grid-cols-2 gap-1.5 text-sm text-ink-muted">
            {[
              'Roof shading from trees or nearby buildings',
              'Roof orientation and tilt',
              'Structural condition of your roof',
              'Installation quality and equipment used',
              'Your actual electricity usage over time',
              'Future tariff changes',
              'Government subsidy eligibility and rules',
            ].map((factor) => (
              <li key={factor} className="flex gap-2">
                <span className="text-sun shrink-0" aria-hidden="true">•</span>
                {factor}
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-faint mt-4 pt-4 border-t border-edge">
            Helio is not an official government portal. Please consult a certified solar installer
            and verify PM Surya Ghar subsidy eligibility through official government channels
            before making any financial decisions.
          </p>
        </div>
      </section>

      {downloadError && <ErrorBanner message={downloadError} onRetry={handleDownload} />}

      {/* Final decision */}
      <section className="card border-2 border-helio/30 text-center py-8">
        <h2 className="font-display text-2xl font-bold text-ink mb-2">
          So… is solar worth it for you?
        </h2>
        <p className="text-ink text-lg mb-1">
          {analysis.recommendation.rating === 'Highly Suitable' || analysis.recommendation.rating === 'Suitable'
            ? `Yes — your home appears ${analysis.recommendation.rating.toLowerCase()}.`
            : analysis.recommendation.rating === 'Potentially Suitable'
            ? 'Potentially — your home could work, with some caveats.'
            : "Not yet clear — your home needs a closer look."}
        </p>
        <p className="text-sm text-ink-muted max-w-lg mx-auto mb-6">
          Recommended {recommended.panel_name} system generating{' '}
          <strong className="text-ink">{formatNumber(recommended.annual_generation_kwh)} kWh/year</strong>, saving{' '}
          <strong className="text-ink">{formatInr(recommended.annual_savings_inr)}/year</strong>, paying back in{' '}
          <strong className="text-ink">{formatPayback(recommended.payback_years, recommended.payback_years_int, recommended.payback_months_remainder)}</strong>,
          and avoiding <strong className="text-ink">{formatTonnes(recommended.co2_avoided_kg_per_year)}</strong> of CO₂ every year.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button className="btn-primary" onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Preparing PDF…' : '📄 Generate My Full Report'}
          </button>
          <button className="btn-secondary" onClick={onBack}>
            Review My Inputs
          </button>
        </div>
      </section>

      <div className="flex justify-center">
        <button className="text-xs text-ink-faint underline" onClick={onRestart}>
          Start over with a different home
        </button>
      </div>
    </div>
  )
}
