import { useState } from 'react'
import type { PanelResult } from '../utils/types'
import { formatInr, formatNumber, formatPayback } from '../utils/format'
import { PANEL_INFO } from '../utils/panelInfo'
import Modal from './Modal'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-edge/70 last:border-0">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="text-sm font-semibold text-ink">{value}</span>
    </div>
  )
}

export default function PanelComparisonCards({
  panels,
  recommendedId,
  selectedId,
  onSelect,
  onJumpToCompareProducts,
}: {
  panels: PanelResult[]
  recommendedId: string
  selectedId: string
  onSelect: (panelId: string) => void
  onJumpToCompareProducts?: () => void
}) {
  const [infoPanelId, setInfoPanelId] = useState<string | null>(null)
  const selected = panels.find((p) => p.panel_id === selectedId) ?? panels[0]
  const infoPanel = panels.find((p) => p.panel_id === infoPanelId)
  const info = infoPanelId ? PANEL_INFO[infoPanelId] : null

  function handleCardKeyDown(e: React.KeyboardEvent, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect(id)
    }
  }

  function buildReasonFor(panel: PanelResult): string {
    const others = panels.filter((p) => p.panel_id !== panel.panel_id)
    if (others.length === 0) return `${panel.panel_name} is the only option that fits your roof.`

    const cheaper = others.filter((o) => o.gross_cost_inr < panel.gross_cost_inr)
    const costlier = others.filter((o) => o.gross_cost_inr > panel.gross_cost_inr)
    const higherGen = others.filter((o) => o.annual_generation_kwh > panel.annual_generation_kwh)

    const genDeltaVsCheapest =
      cheaper.length > 0
        ? panel.annual_generation_kwh - Math.max(...cheaper.map((o) => o.annual_generation_kwh))
        : 0
    const costDeltaVsCheapest =
      cheaper.length > 0 ? panel.gross_cost_inr - Math.max(...cheaper.map((o) => o.gross_cost_inr)) : 0

    if (costlier.length === others.length) {
      // Cheapest of the options.
      const genLossVsBest = Math.max(...others.map((o) => o.annual_generation_kwh)) - panel.annual_generation_kwh
      return (
        `${panel.panel_name} is the lowest upfront cost of the ${panels.length} options for your ${panel.panel_count}-panel system — ` +
        `about ${formatNumber(genLossVsBest)} kWh/year less generation than the highest-output option, ` +
        `in exchange for the lowest gross cost (${formatInr(panel.gross_cost_inr)}).`
      )
    }

    if (higherGen.length === 0 && cheaper.length > 0) {
      // Highest generation of the options.
      return (
        `${panel.panel_name} generates the most electricity of the ${panels.length} options for your ${panel.panel_count}-panel system — ` +
        `about ${formatNumber(genDeltaVsCheapest)} kWh/year more than the cheapest option, for ${formatInr(costDeltaVsCheapest)} more upfront.`
      )
    }

    return (
      `${panel.panel_name} balances cost and generation for your ${panel.panel_count}-panel system — ` +
      `${formatInr(panel.gross_cost_inr)} gross cost generating ${formatNumber(panel.annual_generation_kwh)} kWh/year, ` +
      `with an estimated payback of ${formatPayback(panel.payback_years, panel.payback_years_int, panel.payback_months_remainder)}.`
    )
  }

  return (
    <div>
      <p className="text-xs text-ink-faint mb-3">
        These are panel <strong className="text-ink-muted">technologies</strong>, not brands —
        Indian manufacturers such as Tata Power Solar, Waaree, Adani Solar, and Vikram Solar each
        make panels in more than one of these categories, at different price points. Want to look
        at a specific manufacturer's model?{' '}
        {onJumpToCompareProducts ? (
          <button
            type="button"
            onClick={onJumpToCompareProducts}
            className="font-semibold text-helio hover:underline"
          >
            Compare Actual Products
          </button>
        ) : (
          'See Compare Actual Products further down.'
        )}
      </p>
      <div className="grid sm:grid-cols-3 gap-4 mb-4">
        {panels.map((p) => {
          const isRecommended = p.panel_id === recommendedId
          const isSelected = p.panel_id === selectedId
          return (
            <div
              key={p.panel_id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(p.panel_id)}
              onKeyDown={(e) => handleCardKeyDown(e, p.panel_id)}
              aria-pressed={isSelected}
              className={`text-left rounded-2xl border-2 p-5 transition-all cursor-pointer ${
                isSelected ? 'border-helio bg-helio-light/40 shadow-card' : 'border-edge bg-surface hover:border-helio/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <h4 className="font-display font-bold text-ink">{p.panel_name}</h4>
                {isRecommended && (
                  <span className="pill bg-helio text-helio-contrast text-[10px] shrink-0">Recommended</span>
                )}
              </div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-ink-muted">{p.panel_watt} W panels</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setInfoPanelId(p.panel_id)
                  }}
                  className="text-[11px] font-semibold text-helio hover:underline shrink-0"
                >
                  ⓘ Learn more
                </button>
              </div>

              <Row label="Panels" value={String(p.panel_count)} />
              <Row label="System" value={`${formatNumber(p.system_capacity_kw, 2)} kW`} />
              <Row label="Cost" value={formatInr(p.gross_cost_inr)} />
              <Row label="Annual Gen." value={`${formatNumber(p.annual_generation_kwh)} kWh`} />
              <Row label="Savings/yr" value={formatInr(p.annual_savings_inr)} />
              <Row label="Payback" value={formatPayback(p.payback_years, p.payback_years_int, p.payback_months_remainder)} />
            </div>
          )
        })}
      </div>

      {selected.panel_id === recommendedId ? (
        <div className="note-box">
          <strong className="text-ink">Why Helio recommends this for your home:</strong> {buildReasonFor(selected)}
        </div>
      ) : (
        <div className="note-box flex items-center justify-between gap-3 flex-wrap">
          <span>
            You're viewing <strong className="text-ink">{selected.panel_name}</strong> — the sections
            below now reflect this option instead of Helio's recommended{' '}
            {panels.find((p) => p.panel_id === recommendedId)?.panel_name}. {buildReasonFor(selected)}
          </span>
          <button type="button" className="btn-ghost shrink-0" onClick={() => onSelect(recommendedId)}>
            Back to recommended
          </button>
        </div>
      )}

      {info && infoPanel && (
        <Modal title={infoPanel.panel_name} onClose={() => setInfoPanelId(null)}>
          <div className="space-y-4">
            <p className="text-xs text-ink-faint italic">
              This is a panel technology, not a brand — most Indian manufacturers make panels in
              this category at a range of price points.
            </p>
            <div>
              <p className="text-xs font-semibold text-helio-dark uppercase tracking-wide mb-1">What is it?</p>
              <p className="text-sm text-ink-muted leading-relaxed">{info.whatIsIt}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-helio-dark uppercase tracking-wide mb-1">Typical efficiency</p>
              <p className="text-sm text-ink-muted leading-relaxed">{info.typicalEfficiency}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-helio-dark uppercase tracking-wide mb-1">When it makes sense</p>
              <p className="text-sm text-ink-muted leading-relaxed">{info.whenItMakesSense}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-helio-dark uppercase tracking-wide mb-1">Limitations</p>
              <p className="text-sm text-ink-muted leading-relaxed">{info.limitations}</p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
