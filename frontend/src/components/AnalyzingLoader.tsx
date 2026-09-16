import Icon from './Icon'

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
    { label: 'Location', done: hasLocation },
    { label: 'Roof size', done: hasRoof },
    { label: 'Electricity use', done: hasElectricity },
  ]

  return (
    <div className="max-w-md mx-auto text-center py-10 sm:py-20" role="status" aria-live="polite">
      <span className="inline-block w-2 h-2 rounded-full bg-dossier-ochre animate-pulse" aria-hidden="true" />
      <h1 className="mt-6 font-serif text-4xl text-dossier-charcoal tracking-tight">Analysing your roof</h1>
      <p className="mt-3 text-dossier-secondary">Fetching sunlight data and running the numbers. This takes a few seconds.</p>

      <ul className="mt-10 inline-flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
        {steps.map((step) => (
          <li key={step.label} className={`flex items-center gap-1.5 ${step.done ? 'text-dossier-charcoal' : 'text-dossier-tertiary'}`}>
            <Icon name="check" className={`!text-[16px] ${step.done ? 'text-dossier-sage' : 'text-dossier-border'}`} />
            {step.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
