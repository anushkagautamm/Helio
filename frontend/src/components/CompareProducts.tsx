import { useEffect, useMemo, useState } from 'react'
import type { AnalyzeResponse, PanelResult, ProductEstimateResponse, ProductInfo } from '../utils/types'
import { estimateWithProduct, listProducts } from '../services/api'
import { formatInr, formatNumber, formatPayback } from '../utils/format'
import ErrorBanner from './ErrorBanner'

function DeltaRow({
  label,
  before,
  after,
  format,
}: {
  label: string
  before: number
  after: number
  format: (v: number) => string
}) {
  const delta = after - before
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge/70 last:border-0 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="flex items-baseline gap-2">
        <span className="text-ink-faint line-through text-xs">{format(before)}</span>
        <span className="font-semibold text-ink">{format(after)}</span>
        {delta !== 0 && (
          <span className={`text-xs font-medium ${delta > 0 ? 'text-sun' : 'text-helio'}`}>
            ({delta > 0 ? '+' : '−'}
            {format(Math.abs(delta))})
          </span>
        )}
      </span>
    </div>
  )
}

export default function CompareProducts({
  analysis,
  baseline,
}: {
  analysis: AnalyzeResponse
  baseline: PanelResult
}) {
  const [products, setProducts] = useState<ProductInfo[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [manufacturer, setManufacturer] = useState<string>('')
  const [productId, setProductId] = useState<string>('')
  const [estimate, setEstimate] = useState<ProductEstimateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listProducts()
      .then(setProducts)
      .catch(() => setLoadError('Could not load the product catalogue right now.'))
  }, [])

  const manufacturers = useMemo(() => {
    const seen: string[] = []
    for (const p of products) if (!seen.includes(p.manufacturer)) seen.push(p.manufacturer)
    return seen
  }, [products])

  const modelsForManufacturer = useMemo(
    () => products.filter((p) => p.manufacturer === manufacturer),
    [products, manufacturer]
  )

  const selectedProduct = products.find((p) => p.id === productId) ?? null

  async function handleUseThisModel() {
    if (!selectedProduct) return
    setLoading(true)
    setError(null)
    try {
      const result = await estimateWithProduct({
        product_id: selectedProduct.id,
        lat: analysis.location?.lat ?? 0,
        lon: analysis.location?.lon ?? 0,
        location_label: analysis.location?.display_name,
        roof_area_sqft: analysis.roof.gross_area_sqft,
        monthly_units_kwh: analysis.electricity.monthly_units_kwh,
        monthly_bill_inr: analysis.electricity.monthly_bill_inr,
        baseline_panel_id: baseline.panel_id,
      })
      setEstimate(result)
    } catch {
      setError('Could not recalculate with this product right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        Want to see how a specific manufacturer's actual product changes the numbers? Pick a
        manufacturer and model below. This is optional — Helio's main recommendation above already
        stands on its own.
      </p>

      {loadError && <ErrorBanner message={loadError} />}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide block mb-1">
            Manufacturer
          </label>
          <select
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink"
            value={manufacturer}
            onChange={(e) => {
              setManufacturer(e.target.value)
              setProductId('')
              setEstimate(null)
            }}
          >
            <option value="">Select a manufacturer…</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide block mb-1">
            Model
          </label>
          <select
            className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink disabled:opacity-50"
            value={productId}
            disabled={!manufacturer}
            onChange={(e) => {
              setProductId(e.target.value)
              setEstimate(null)
            }}
          >
            <option value="">Select a model…</option>
            {modelsForManufacturer.map((p) => (
              <option key={p.id} value={p.id}>
                {p.model} ({p.watt_min}–{p.watt_max} W)
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedProduct && (
        <div className="rounded-xl border border-edge bg-surface2 p-4 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-display font-semibold text-ink">
              {selectedProduct.manufacturer} {selectedProduct.model}
            </h4>
            {selectedProduct.almm_listed && (
              <span className="pill bg-helio-light text-helio-dark text-[10px]">ALMM-listed</span>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-1.5 text-sm text-ink-muted">
            <p>Technology: <span className="text-ink font-medium">{selectedProduct.technology}</span></p>
            <p>
              Wattage: <span className="text-ink font-medium">{selectedProduct.watt_min}–{selectedProduct.watt_max} W</span>
            </p>
            {selectedProduct.efficiency_percent != null && (
              <p>Efficiency: <span className="text-ink font-medium">{selectedProduct.efficiency_percent}%</span></p>
            )}
            {selectedProduct.warranty_years != null && (
              <p>Warranty: <span className="text-ink font-medium">{selectedProduct.warranty_years} years</span></p>
            )}
            <p>
              Price:{' '}
              <span className="text-ink font-medium">
                {selectedProduct.price_available
                  ? `₹${selectedProduct.price_per_watt_min}–₹${selectedProduct.price_per_watt_max}/W (indicative)`
                  : 'Not publicly available'}
              </span>
            </p>
          </div>
          <p className="text-[11px] text-ink-faint pt-2 border-t border-edge">
            Source: {selectedProduct.source_name} · Checked {selectedProduct.source_date}
          </p>
          <button type="button" className="btn-secondary w-full mt-1" onClick={handleUseThisModel} disabled={loading}>
            {loading ? 'Recalculating…' : 'Use this model in my estimate'}
          </button>
        </div>
      )}

      {error && <ErrorBanner message={error} onRetry={handleUseThisModel} />}

      {estimate && (
        <div className="rounded-xl border-2 border-helio bg-helio-light/30 p-4 space-y-3">
          <h4 className="font-display font-semibold text-ink">
            What changes with {estimate.product.manufacturer} {estimate.product.model}
          </h4>

          {estimate.result ? (
            <div>
              <DeltaRow
                label="Panel count"
                before={baseline.panel_count}
                after={estimate.result.panel_count}
                format={(v) => formatNumber(v)}
              />
              <DeltaRow
                label="System capacity"
                before={baseline.system_capacity_kw}
                after={estimate.result.system_capacity_kw}
                format={(v) => `${formatNumber(v, 2)} kW`}
              />
              <DeltaRow
                label="Annual generation"
                before={baseline.annual_generation_kwh}
                after={estimate.result.annual_generation_kwh}
                format={(v) => `${formatNumber(v)} kWh`}
              />
              <DeltaRow
                label="Gross cost"
                before={baseline.gross_cost_inr}
                after={estimate.result.gross_cost_inr}
                format={formatInr}
              />
              <DeltaRow
                label="Annual savings"
                before={baseline.annual_savings_inr}
                after={estimate.result.annual_savings_inr}
                format={formatInr}
              />
              <div className="flex items-center justify-between py-1.5 text-sm">
                <span className="text-ink-muted">Payback period</span>
                <span className="flex items-baseline gap-2">
                  <span className="text-ink-faint line-through text-xs">
                    {formatPayback(baseline.payback_years, baseline.payback_years_int, baseline.payback_months_remainder)}
                  </span>
                  <span className="font-semibold text-ink">
                    {formatPayback(
                      estimate.result.payback_years,
                      estimate.result.payback_years_int,
                      estimate.result.payback_months_remainder
                    )}
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-ink-faint mt-2">
                Price used: ₹{estimate.price_used_per_watt}/W (midpoint of the manufacturer's published
                range — indicative, not an installer quotation).
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-ink">{estimate.unavailable_reason}</p>
              {estimate.panel_count_if_known != null && (
                <p className="text-sm text-ink-muted mt-2">
                  Based on wattage alone: your roof could fit approximately{' '}
                  <strong className="text-ink">{estimate.panel_count_if_known} panels</strong> (
                  {formatNumber(estimate.system_capacity_kw_if_known ?? 0, 2)} kW) of this model.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
