import Logo from './Logo'
import Icon from './Icon'

export type Phase = 'landing' | 'wizard' | 'analyzing' | 'results'

const STEPS = ['Location', 'Roof', 'Energy']

interface SiteHeaderProps {
  phase: Phase
  wizardStep: number
  downloading: boolean
  onHome: () => void
  onStepSelect: (step: number) => void
  onTour: () => void
  onDownload: () => void
}

export default function SiteHeader({
  phase,
  wizardStep,
  downloading,
  onHome,
  onStepSelect,
  onTour,
  onDownload,
}: SiteHeaderProps) {
  const inFlow = phase === 'wizard' || phase === 'analyzing'
  const current = phase === 'analyzing' ? STEPS.length : wizardStep

  return (
    <header className="sticky top-0 z-40 bg-dossier-bg/90 backdrop-blur-md border-b border-dossier-border/70">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <button type="button" onClick={onHome} className="shrink-0 hover:opacity-75 transition-opacity" aria-label="Helio — back to start">
          <Logo className="h-7" />
        </button>

        {inFlow && (
          <nav aria-label="Progress" className="flex-1 flex justify-center">
            <ol className="hidden sm:flex items-center gap-8 text-sm">
              {STEPS.map((step, i) => {
                const isDone = i < current
                const isActive = i === current
                return (
                  <li key={step}>
                    <button
                      type="button"
                      onClick={() => onStepSelect(i)}
                      disabled={!isDone || phase !== 'wizard'}
                      aria-current={isActive ? 'step' : undefined}
                      className={`flex items-center gap-2 py-5 border-b transition-colors ${
                        isActive
                          ? 'text-dossier-charcoal border-dossier-charcoal'
                          : isDone
                            ? 'text-dossier-secondary border-transparent hover:text-dossier-charcoal'
                            : 'text-dossier-tertiary border-transparent'
                      }`}
                    >
                      <span className="font-mono text-xs">{isDone ? <Icon name="check" className="!text-[14px] text-dossier-sage align-[-3px]" /> : `0${i + 1}`}</span>
                      {step}
                    </button>
                  </li>
                )
              })}
            </ol>
            <span className="sm:hidden text-xs font-mono text-dossier-tertiary">
              STEP {Math.min(current + 1, STEPS.length)} OF {STEPS.length}
            </span>
          </nav>
        )}

        <div className="flex items-center gap-6 shrink-0">
          {phase === 'results' ? (
            <>
              <button type="button" onClick={onHome} className="hidden sm:inline text-sm text-dossier-secondary hover:text-dossier-charcoal transition-colors">
                Start over
              </button>
              <button type="button" onClick={onDownload} disabled={downloading} className="btn-primary !px-4 !py-2.5">
                <Icon name="description" className="!text-[15px]" />
                {downloading ? 'Preparing…' : 'Download PDF'}
              </button>
            </>
          ) : (
            <button type="button" onClick={onTour} className="text-sm text-dossier-secondary hover:text-dossier-charcoal transition-colors">
              How it works
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
