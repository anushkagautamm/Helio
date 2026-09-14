interface StepperProps {
  steps: string[]
  currentStep: number
}

export default function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <nav aria-label="Progress" className="w-full max-w-3xl mx-auto mb-8 px-4">
      <ol className="flex items-stretch gap-1.5 sm:gap-2">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isDone = index < currentStep
          return (
            <li key={step} className="flex-1 min-w-0">
              <div
                className={`h-1.5 rounded-full mb-2 transition-colors ${
                  isDone || isActive ? 'bg-helio' : 'bg-edge'
                }`}
                aria-hidden="true"
              />
              <div className="flex items-baseline gap-1.5">
                <span
                  className={`font-display text-[11px] font-bold tabular-nums ${
                    isActive ? 'text-helio' : isDone ? 'text-ink-muted' : 'text-ink-faint'
                  }`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-semibold uppercase tracking-wide truncate ${
                    isActive ? 'text-ink' : 'text-ink-faint'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {step}
                </span>
                {isDone && <span className="text-helio text-xs" aria-label="completed">✓</span>}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
