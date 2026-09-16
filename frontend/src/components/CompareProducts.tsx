import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AnalyzeResponse, PanelResult, ProductEstimateResponse, ProductInfo } from '../utils/types'
import { ApiError, estimateWithProduct, listProducts } from '../services/api'
import { formatInr, formatNumber, formatPayback } from '../utils/format'
import ErrorBanner from './ErrorBanner'

function ChangeRow({
  label,
  before,
  after,
  format,
  lowerIsBetter = false,
}: {
  label: string
  before: number
  after: number
  format: (v: number) => string
  lowerIsBetter?: boolean
}) {
  const delta = after - before
  const better = lowerIsBetter ? delta < 0 : delta > 0
  return (
    <div className="py-3 grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_8rem_8rem_7rem] gap-x-4 items-baseline text-sm">
      <dt className="text-dossier-secondary">{label}</dt>
      <dd className="hidden sm:block text-right text-dossier-tertiary tabular">{format(before)}</dd>
      <dd className="text-right text-dossier-charcoal tabular">{format(after)}</dd>
      <dd className={`text-right text-xs tabular ${delta === 0 ? 'text-dossier-tertiary' : better ? 'text-dossier-forest' : 'text-dossier-ochre'}`}>
        {delta === 0 ? '—' : `${delta > 0 ? '+' : '−'}${format(Math.abs(delta))}`}
      </dd>
    </div>
  )
}

export default function CompareProducts({ analysis, baseline }: { analysis: AnalyzeResponse; baseline: PanelResult }) {
  const [products, setProducts] = useState<ProductInfo[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [manufacturer, setManufacturer] = useState<string>('')
  const [productId, setProductId] = useState<string>('')
  const [estimate, setEstimate] = useState<ProductEstimateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Kept as a named function so the error banner can offer a real retry —
  // the catalogue lives on the backend, which may be waking up.
  const loadProducts = useCallback(() => {
    setLoadingProducts(true)
    setLoadError(null)
    listProducts()
      .then(setProducts)
      .catch((err) =>
        setLoadError(err instanceof ApiError ? err.message : 'Could not load the manufacturer list right now.'),
      )
      .finally(() => setLoadingProducts(false))
  }, [])

  useEffect(loadProducts, [loadProducts])

  const manufacturers = useMemo(() => [...new Set(products.map((p) => p.manufacturer))], [products])
  const modelsForManufacturer = useMemo(() => products.filter((p) => p.manufacturer === manufacturer), [products, manufacturer])
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
    <div className="max-w-3xl">
      <p className="text-dossier-secondary">See how a real manufacturer's panel would change your numbers.</p>

      {loadError && (
        <div className="mt-5">
          <ErrorBanner message={loadError} onRetry={loadProducts} />
        </div>
      )}

      <div className="mt-6 grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
        <label className="block">
          <span className="block text-sm text-dossier-secondary mb-1.5">Manufacturer</span>
          <select
            className="input-field"
            disabled={loadingProducts || !!loadError}
            value={manufacturer}
            onChange={(e) => {
              setManufacturer(e.target.value)
              setProductId('')
              setEstimate(null)
            }}
          >
            <option value="">{loadingProducts ? 'Loading…' : loadError ? 'Unavailable' : 'Choose…'}</option>
            {manufacturers.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-sm text-dossier-secondary mb-1.5">Model</span>
          <select
            className="input-field"
            value={productId}
            disabled={!manufacturer}
            onChange={(e) => {
              setProductId(e.target.value)
              setEstimate(null)
            }}
          >
            <option value="">Choose…</option>
            {modelsForManufacturer.map((p) => (
              <option key={p.id} value={p.id}>
                {p.model} ({p.watt_min}–{p.watt_max} W)
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-secondary h-11" onClick={handleUseThisModel} disabled={!selectedProduct || loading}>
          {loading ? 'Calculating…' : 'Compare'}
        </button>
      </div>

      {loadingProducts && (
        <p className="mt-3 text-sm text-dossier-tertiary">
          Loading manufacturers… this can take up to a minute if the server has been idle.
        </p>
      )}

      {selectedProduct && (
        <p className="mt-4 text-sm text-dossier-tertiary">
          {selectedProduct.technology} · {selectedProduct.watt_min}–{selectedProduct.watt_max} W
          {selectedProduct.efficiency_percent != null && ` · ${selectedProduct.efficiency_percent}% efficient`}
          {selectedProduct.warranty_years != null && ` · ${selectedProduct.warranty_years}-year warranty`}
          {' · '}
          {selectedProduct.price_available
            ? `₹${selectedProduct.price_per_watt_min}–₹${selectedProduct.price_per_watt_max}/W indicative`
            : 'price not public'}
          {selectedProduct.almm_listed && ' · ALMM-listed'}
        </p>
      )}

      {error && (
        <div className="mt-5">
          <ErrorBanner message={error} onRetry={handleUseThisModel} />
        </div>
      )}

      {estimate && (
        <div className="mt-8 animate-fade-in">
          {estimate.result ? (
            <>
              <div className="hidden sm:grid grid-cols-[1fr_8rem_8rem_7rem] gap-x-4 pb-2 border-b border-dossier-border text-xs text-dossier-tertiary">
                <span />
                <span className="text-right">{baseline.panel_name}</span>
                <span className="text-right">{estimate.product.manufacturer} {estimate.product.model}</span>
                <span className="text-right">Change</span>
              </div>
              <dl className="divide-y divide-dossier-border-subtle">
                <ChangeRow label="Panels" before={baseline.panel_count} after={estimate.result.panel_count} format={(v) => formatNumber(v)} />
                <ChangeRow
                  label="System size"
                  before={baseline.system_capacity_kw}
                  after={estimate.result.system_capacity_kw}
                  format={(v) => `${formatNumber(v, 1)} kW`}
                />
                <ChangeRow
                  label="Yearly generation"
                  before={baseline.annual_generation_kwh}
                  after={estimate.result.annual_generation_kwh}
                  format={(v) => `${formatNumber(v)} kWh`}
                />
                <ChangeRow label="Installed cost" before={baseline.gross_cost_inr} after={estimate.result.gross_cost_inr} format={formatInr} lowerIsBetter />
                <ChangeRow label="Yearly savings" before={baseline.annual_savings_inr} after={estimate.result.annual_savings_inr} format={formatInr} />
                <div className="py-3 flex items-baseline justify-between gap-4 text-sm">
                  <dt className="text-dossier-secondary">Payback</dt>
                  <dd className="text-dossier-charcoal">
                    {formatPayback(estimate.result.payback_years, estimate.result.payback_years_int, estimate.result.payback_months_remainder)}
                    <span className="text-dossier-tertiary">
                      {' '}
                      (was {formatPayback(baseline.payback_years, baseline.payback_years_int, baseline.payback_months_remainder)})
                    </span>
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-dossier-tertiary">
                Uses ₹{estimate.price_used_per_watt}/W, the midpoint of the published price range. Source:{' '}
                {estimate.product.source_name}, checked {estimate.product.source_date}.
              </p>
            </>
          ) : (
            <div className="text-sm">
              <p className="text-dossier-charcoal">{estimate.unavailable_reason}</p>
              {estimate.panel_count_if_known != null && (
                <p className="text-dossier-secondary mt-2">
                  By wattage alone, your roof could fit about {estimate.panel_count_if_known} panels (
                  {formatNumber(estimate.system_capacity_kw_if_known ?? 0, 1)} kW) of this model.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
