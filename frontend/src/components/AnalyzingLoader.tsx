interface AnalyzingLoaderProps {
  hasLocation: boolean
  hasRoof: boolean
  hasElectricity: boolean
}

/**
 * Staged loading state for the single /api/analyze call. The first three
 * steps are genuinely already complete (the user supplied that data before
 * this phase started) — only the last step reflects a real pending request.
 * No fake percentages are shown since the backend doesn't report progress.
 */
export default function AnalyzingLoader({ hasLocation, hasRoof, hasElectricity }: AnalyzingLoaderProps) {
  const steps = [
    { label: 'Location identified', done: hasLocation },
    { label: 'Roof information processed', done: hasRoof },
    { label: 'Electricity usage analyzed', done: hasElectricity },
  ]

  return (
    <div className="max-w-sm mx-auto py-12 px-4 text-center" role="status" aria-live="polite">
      <h2 className="font-display text-xl font-bold text-ink mb-1">Analyzing your home…</h2>
      <p className="text-sm text-ink-muted mb-7">This usually takes just a few seconds.</p>
      <div className="text-left space-y-3 mb-2">
        {steps.map((step) => (
          <div key={step.label} className="flex items-center gap-3">
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 ${
                step.done ? 'bg-helio text-helio-contrast' : 'bg-surface2 text-ink-faint'
              }`}
              aria-hidden="true"
            >
              {step.done ? '✓' : ''}
            </span>
            <span className={`text-sm ${step.done ? 'text-ink' : 'text-ink-faint'}`}>{step.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 rounded-full border-2 border-helio-light border-t-helio animate-spin shrink-0" aria-hidden="true" />
          <span className="text-sm font-medium text-ink">Calculating your solar potential…</span>
        </div>
      </div>
    </div>
  )
}
