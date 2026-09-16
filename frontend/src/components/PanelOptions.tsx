import { useState } from 'react'
import type { PanelResult } from '../utils/types'
import { formatInr, formatNumber, formatPayback } from '../utils/format'
import { PANEL_INFO } from '../utils/panelInfo'
import Icon from './Icon'
import Modal from './Modal'

const GRID_COLS: Record<number, string> = { 1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' }

export default function PanelOptions({
  panels,
  recommendedId,
  selectedId,
  onSelect,
}: {
  panels: PanelResult[]
  recommendedId: string
  selectedId: string
  onSelect: (panelId: string) => void
}) {
  const [infoPanelId, setInfoPanelId] = useState<string | null>(null)
  const infoPanel = panels.find((p) => p.panel_id === infoPanelId)
  const info = infoPanelId ? PANEL_INFO[infoPanelId] : null

  return (
    <div>
      <div className={`grid grid-cols-1 ${GRID_COLS[panels.length] ?? 'md:grid-cols-3'} gap-4`}>
        {panels.map((p) => {
          const isRecommended = p.panel_id === recommendedId
          const isSelected = p.panel_id === selectedId
          return (
            <div
              key={p.panel_id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => onSelect(p.panel_id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelect(p.panel_id)
                }
              }}
              className={`relative p-6 sm:p-7 border cursor-pointer transition-colors ${
                isSelected
                  ? 'border-dossier-charcoal bg-dossier-surface shadow-float'
                  : 'border-dossier-border hover:border-dossier-tertiary'
              }`}
            >
              <div className="flex items-center justify-between h-6">
                {isRecommended ? (
                  <span className="text-xs font-mono uppercase tracking-wider text-dossier-forest">Recommended</span>
                ) : (
                  <span />
                )}
                <span
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-dossier-charcoal border-dossier-charcoal text-white' : 'border-dossier-border'
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <Icon name="check" className="!text-[13px]" />}
                </span>
              </div>

              <h3 className="mt-3 font-serif text-2xl text-dossier-charcoal">{p.panel_name}</h3>
              {PANEL_INFO[p.panel_id] && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setInfoPanelId(p.panel_id)
                  }}
                  className="mt-1 text-sm text-dossier-tertiary hover:text-dossier-charcoal underline underline-offset-4 decoration-dossier-border transition-colors"
                >
                  What is this?
                </button>
              )}

              <p className="mt-8 font-serif text-3xl text-dossier-charcoal tabular">{formatInr(p.net_cost_inr)}</p>
              <p className="text-sm text-dossier-tertiary">after subsidy</p>

              <dl className="mt-6 pt-5 border-t border-dossier-border-subtle space-y-2.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-dossier-secondary">System size</dt>
                  <dd className="text-dossier-charcoal tabular">{formatNumber(p.system_capacity_kw, 1)} kW</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-dossier-secondary">Saves per year</dt>
                  <dd className="text-dossier-forest tabular">{formatInr(p.annual_savings_inr)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-dossier-secondary">Pays back in</dt>
                  <dd className="text-dossier-charcoal tabular">
                    {formatPayback(p.payback_years, p.payback_years_int, p.payback_months_remainder)}
                  </dd>
                </div>
              </dl>
            </div>
          )
        })}
      </div>

      {info && infoPanel && (
        <Modal label="Panel technology" title={infoPanel.panel_name} onClose={() => setInfoPanelId(null)}>
          <p className="text-sm text-dossier-charcoal leading-relaxed">{info.summary}</p>
          <dl className="mt-5 space-y-4">
            {[
              ['What is it?', info.whatIsIt],
              ['Typical efficiency', info.typicalEfficiency],
              ['When it makes sense', info.whenItMakesSense],
              ['Limitations', info.limitations],
            ].map(([label, body]) => (
              <div key={label}>
                <dt className="text-sm font-medium text-dossier-charcoal">{label}</dt>
                <dd className="mt-1 text-sm text-dossier-secondary leading-relaxed">{body}</dd>
              </div>
            ))}
          </dl>
        </Modal>
      )}
    </div>
  )
}
