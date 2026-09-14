import type { PanelResult } from '../utils/types'
import { formatInr, formatPayback } from '../utils/format'

export default function FinancialStory({ panel }: { panel: PanelResult }) {
  const breakdown = panel.cost_breakdown
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      <div className="card">
        <h3 className="font-display font-semibold text-ink mb-4">Your Investment</h3>
        <div className="space-y-2.5">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-ink-muted">Gross installation cost</span>
            <span className="font-semibold text-ink">{formatInr(panel.gross_cost_inr)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-ink-muted">Estimated PM Surya Ghar subsidy</span>
            <span className="font-semibold text-helio">−{formatInr(panel.subsidy_inr)}</span>
          </div>
          <div className="flex justify-between items-baseline border-t border-edge pt-2.5 mt-1">
            <span className="text-sm font-semibold text-ink">Estimated net cost</span>
            <span className="font-display text-xl font-extrabold text-ink">{formatInr(panel.net_cost_inr)}</span>
          </div>
        </div>

        {breakdown && (
          <div className="mt-4 pt-4 border-t border-edge">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">
              What's in the gross cost?
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">Panels/modules</span>
                <span className="text-ink font-medium">{formatInr(breakdown.module_cost_inr)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">Inverter &amp; other components (BOS)</span>
                <span className="text-ink font-medium">{formatInr(breakdown.inverter_bos_cost_inr)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">Installation &amp; labour (EPC)</span>
                <span className="text-ink font-medium">{formatInr(breakdown.installation_epc_cost_inr)}</span>
              </div>
            </div>
            <p className="text-[11px] text-ink-faint mt-2">
              The panel price alone is not the full installed cost — this is a planning-level split,
              not an installer quotation.
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-display font-semibold text-ink mb-4">Your Savings</h3>
        <div className="space-y-2.5">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-ink-muted">Monthly</span>
            <span className="font-semibold text-ink">{formatInr(panel.monthly_savings_inr)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-ink-muted">Yearly</span>
            <span className="font-semibold text-ink">{formatInr(panel.annual_savings_inr)}</span>
          </div>
          <div className="flex justify-between items-baseline border-t border-edge pt-2.5 mt-1">
            <span className="text-sm font-semibold text-ink">Estimated payback</span>
            <span className="font-display text-xl font-extrabold text-helio">
              {formatPayback(panel.payback_years, panel.payback_years_int, panel.payback_months_remainder)}
            </span>
          </div>
        </div>
      </div>

      <div className="card sm:col-span-2">
        <h3 className="font-display font-semibold text-ink mb-5">The Journey</h3>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
          {[
            { label: 'Today', title: 'Investment', body: formatInr(panel.net_cost_inr), icon: '💰' },
            { label: 'Subsidy', title: 'Estimated support', body: formatInr(panel.subsidy_inr), icon: '🏛️' },
            {
              label: 'Payback',
              title: 'Break-even point',
              body: formatPayback(panel.payback_years, panel.payback_years_int, panel.payback_months_remainder),
              icon: '⚖️',
            },
            { label: 'Long-term', title: 'Continued savings', body: `${formatInr(panel.annual_savings_inr)}/yr`, icon: '📈' },
          ].map((step, i, arr) => (
            <div key={step.label} className="flex-1 flex sm:flex-col items-start sm:items-center gap-3 sm:text-center relative">
              <div className="w-10 h-10 rounded-full bg-helio-light flex items-center justify-center text-lg shrink-0" aria-hidden="true">
                {step.icon}
              </div>
              <div className="flex-1 sm:mt-1">
                <p className="text-[11px] font-semibold text-sun uppercase tracking-wide">{step.label}</p>
                <p className="text-sm font-semibold text-ink">{step.title}</p>
                <p className="text-xs text-ink-muted">{step.body}</p>
              </div>
              {i < arr.length - 1 && (
                <div className="hidden sm:block absolute top-5 left-[calc(50%+2.5rem)] right-[calc(-50%+2.5rem)] h-px bg-edge" aria-hidden="true" />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-faint mt-5">
          Savings are not guaranteed — they depend on actual generation, tariff changes, and your
          usage patterns over time.
        </p>
      </div>
    </div>
  )
}
