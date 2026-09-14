import type { PanelResult, SubsidyMeta } from '../utils/types'
import { formatInr } from '../utils/format'

export default function SubsidyBreakdown({
  panel,
  subsidyMeta,
}: {
  panel: PanelResult
  subsidyMeta?: SubsidyMeta | null
}) {
  return (
    <div className="card">
      <h3 className="font-display font-semibold text-ink mb-1">PM Surya Ghar Estimated Subsidy</h3>
      <p className="text-xs text-ink-muted mb-4">
        Central subsidy is calculated from your recommended system's actual capacity —
        {' '}{panel.system_capacity_kw.toFixed(2)} kW — not a fixed amount.
      </p>

      {panel.subsidy_breakdown.length > 0 ? (
        <div className="space-y-2 mb-3">
          {panel.subsidy_breakdown.map((tier, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-surface2 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">{tier.label}</p>
                <p className="text-xs text-ink-muted">
                  {tier.kw_in_tier.toFixed(2)} kW × ₹{tier.rate_per_kw_inr.toLocaleString('en-IN')}/kW
                </p>
              </div>
              <p className="font-display font-bold text-ink">{formatInr(tier.amount_inr)}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink-muted mb-3">
          No subsidy applies — the estimated system capacity is 0 kW.
        </p>
      )}

      <div className="flex items-center justify-between border-t border-edge pt-3">
        <span className="font-display font-semibold text-ink">Estimated Subsidy</span>
        <span className="font-display text-xl font-extrabold text-helio">{formatInr(panel.subsidy_inr)}</span>
      </div>

      {subsidyMeta ? (
        <div className="note-box mt-4 space-y-1.5">
          <p>
            {subsidyMeta.is_special_category_state
              ? 'Your location is in a special-category State/UT, so a higher subsidy rate applies (₹33,000/kW for the first 2 kW, ₹19,800/kW for 2–3 kW, capped at ₹85,800).'
              : 'Standard-category rate applies: ₹30,000/kW for the first 2 kW, ₹18,000/kW for 2–3 kW, capped at ₹78,000.'}
          </p>
          <p>{subsidyMeta.note}</p>
          <p className="text-[11px] text-ink-faint">
            Source: {subsidyMeta.source_name} · Effective {subsidyMeta.effective_date} · Checked{' '}
            {subsidyMeta.accessed_date}
          </p>
        </div>
      ) : (
        <p className="note-box mt-4">
          This is an estimate only — verify eligibility and current rules on the official PM Surya
          Ghar portal before making a purchase.
        </p>
      )}
    </div>
  )
}
