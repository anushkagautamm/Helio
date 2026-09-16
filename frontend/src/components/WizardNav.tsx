import Icon from './Icon'

export default function WizardNav({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
}: {
  onBack: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
}) {
  return (
    <div className="mt-12 flex items-center justify-between gap-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-dossier-secondary hover:text-dossier-charcoal transition-colors">
        <Icon name="arrow_back" className="!text-[16px]" /> Back
      </button>
      <button type="button" className="btn-primary" onClick={onNext} disabled={nextDisabled}>
        {nextLabel} <Icon name="arrow_forward" className="!text-[16px]" />
      </button>
    </div>
  )
}
