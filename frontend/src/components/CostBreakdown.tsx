import type { PanelResult, SubsidyMeta } from '../utils/types'
import { formatInr, formatInrSigned, formatNumber } from '../utils/format'

export default function CostBreakdown({ panel, subsidyMeta }: { panel: PanelResult; subsidyMeta?: SubsidyMeta | null }) {
  const subsidyShare = panel.gross_cost_inr > 0 ? (panel.subsidy_inr / panel.gross_cost_inr) * 100 : 0
  const tiers = panel.subsidy_breakdown
    .map((t) => `${formatNumber(t.kw_in_tier, t.kw_in_tier % 1 ? 2 : 0)} kW × ₹${t.rate_per_kw_inr.toLocaleString('en-IN')}`)
    .join(' + ')

  return (
    <div>
      <dl className="border-t border-dossier-border">
        <div className="py-5 flex items-baseline justify-between gap-6 border-b border-dossier-border-subtle">
          <dt>
            <span className="block text-base text-dossier-charcoal">Installed cost</span>
            <span className="block text-sm text-dossier-tertiary mt-0.5">
              {panel.panel_count} × {panel.panel_watt} W panels, inverter & fitting
            </span>
          </dt>
          <dd className="text-base text-dossier-charcoal tabular whitespace-nowrap">{formatInr(panel.gross_cost_inr)}</dd>
        </div>
        <div className="py-5 flex items-baseline justify-between gap-6">
          <dt>
            <span className="block text-base text-dossier-charcoal">PM Surya Ghar subsidy</span>
            <span className="block text-sm text-dossier-tertiary mt-0.5">{tiers || 'Not applicable at this size'}</span>
          </dt>
          <dd className="text-base text-dossier-forest tabular whitespace-nowrap">{formatInrSigned(-panel.subsidy_inr)}</dd>
        </div>
      </dl>

      <div className="bg-dossier-charcoal text-white px-6 py-6 flex items-baseline justify-between gap-6">
        <span className="text-sm text-stone-400">You pay</span>
        <span className="font-serif text-4xl tabular">{formatInr(panel.net_cost_inr)}</span>
      </div>

      <p className="mt-5 text-sm text-dossier-tertiary leading-relaxed">
        The subsidy covers {subsidyShare.toFixed(0)}% of the cost
        {subsidyMeta?.is_special_category_state ? ' at the special-category state rate' : ''}. It needs ALMM-listed
        modules and DISCOM approval.
      </p>
    </div>
  )
}
