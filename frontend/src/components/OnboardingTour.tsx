import { useEffect, useState } from 'react'
import Icon from './Icon'

const SLIDES = [
  {
    label: 'Your home',
    title: 'Three facts about your home',
    body: 'Helio starts with its location, your roof, and how much electricity you use. Nothing is stored beyond this session.',
  },
  {
    label: 'Location',
    title: 'Check your location',
    body: 'Use your current location — the fastest option — or enter coordinates manually if that’s not available.',
  },
  {
    label: 'Roof',
    title: 'Check your roof',
    body: 'Pick a quick estimate, walk your roof with GPS, or enter the area directly if you already know it.',
  },
  {
    label: 'Energy',
    title: 'Your electricity use',
    body: 'Upload a photo of your bill and Helio will try to read it, or type your monthly units and bill amount yourself.',
  },
  {
    label: 'Recommendation',
    title: 'Three panel types, one recommendation',
    body: 'Helio sizes Polycrystalline, Mono PERC and Bifacial systems to your roof, recommends the best fit, and explains why.',
  },
  {
    label: 'Savings',
    title: 'Cost, subsidy and payback',
    body: 'See the installed cost, your estimated PM Surya Ghar subsidy, net cost, yearly savings and when the system pays for itself.',
  },
  {
    label: 'Impact',
    title: 'Your climate impact',
    body: 'Understand how much CO₂ your system could avoid each year, and over its estimated lifetime.',
  },
  {
    label: 'Report',
    title: 'Take the report with you',
    body: 'When you’re ready, download the full feasibility report as a PDF to share with family or installers.',
  },
]

export default function OnboardingTour({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const isLast = index === SLIDES.length - 1

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dossier-charcoal/30 backdrop-blur-[2px] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Helio product tour"
    >
      <div className="w-full max-w-md bg-dossier-surface border border-dossier-border shadow-modal">
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-dossier-border-subtle text-[11px] font-mono uppercase tracking-wider">
          <span className="text-dossier-tertiary">
            <span className="text-dossier-charcoal">{String(index + 1).padStart(2, '0')}</span> / {String(SLIDES.length).padStart(2, '0')}
            <span className="mx-2 text-dossier-border">|</span>
            <span className="text-dossier-ochre">{slide.label}</span>
          </span>
          <button type="button" onClick={onClose} className="text-dossier-secondary hover:text-dossier-charcoal transition-colors">
            Skip tour
          </button>
        </div>

        <div className="px-6 pt-7 pb-6">
          <h3 className="font-serif text-[28px] leading-tight text-dossier-charcoal mb-3">{slide.title}</h3>
          <p className="text-sm text-dossier-secondary leading-relaxed min-h-[4.5rem]">{slide.body}</p>

          <div className="grid gap-1 mt-6 mb-7" style={{ gridTemplateColumns: `repeat(${SLIDES.length}, 1fr)` }} role="presentation">
            {SLIDES.map((_, i) => (
              <span key={i} className={`h-0.5 transition-colors ${i <= index ? 'bg-dossier-charcoal' : 'bg-dossier-border'}`} />
            ))}
          </div>

          <div className="flex justify-between gap-3">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              Back
            </button>
            {isLast ? (
              <button type="button" className="btn-primary" onClick={onClose}>
                Start <Icon name="arrow_forward" className="!text-[14px]" />
              </button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => setIndex((i) => i + 1)}>
                Next <Icon name="arrow_forward" className="!text-[14px]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
