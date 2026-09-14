import { useState } from 'react'

const SLIDES = [
  {
    icon: '🏠',
    title: 'Your Home',
    body: "Helio starts with three things about your home: its location, your roof, and how much electricity you use. Nothing is stored beyond this session.",
  },
  {
    icon: '📍',
    title: 'Check Your Location',
    body: 'Use your current location — the fastest option — or enter coordinates manually if that’s not available.',
  },
  {
    icon: '📐',
    title: 'Check Your Roof',
    body: 'Pick a quick estimate, walk your roof with GPS, or enter exact dimensions if you already know them.',
  },
  {
    icon: '⚡',
    title: 'Your Energy',
    body: 'Upload a photo of your bill and Helio will try to read it automatically, or enter your usage and bill amount yourself.',
  },
  {
    icon: '☀️',
    title: 'Your Solar Recommendation',
    body: 'Helio compares three panel types sized to your roof and recommends the one that best fits your situation — and explains why.',
  },
  {
    icon: '💰',
    title: 'Your Savings',
    body: 'See estimated installation cost, your PM Surya Ghar subsidy, net cost, monthly and yearly savings, and payback period.',
  },
  {
    icon: '🌱',
    title: 'Your Climate Impact',
    body: 'Understand how much CO₂ your system could avoid each year — and over its estimated lifetime.',
  },
  {
    icon: '📄',
    title: 'Your Report',
    body: "When you're ready, download a complete, professional solar feasibility report as a PDF.",
  },
]

export default function OnboardingTour({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]
  const isLast = index === SLIDES.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Helio product tour">
      <div className="w-full max-w-md surface shadow-card p-6 sm:p-7 animate-fade-up">
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
            {index + 1} of {SLIDES.length}
          </span>
          <button type="button" onClick={onClose} className="text-xs text-ink-muted hover:text-ink underline">
            Skip tour
          </button>
        </div>

        <div className="text-4xl mb-4" aria-hidden="true">{slide.icon}</div>
        <h3 className="font-display text-xl font-bold text-ink mb-2">{slide.title}</h3>
        <p className="text-sm text-ink-muted leading-relaxed mb-6">{slide.body}</p>

        <div className="flex items-center gap-1.5 mb-6" role="presentation">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-helio' : 'w-1.5 bg-edge'}`}
            />
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
              Let's start →
            </button>
          ) : (
            <button type="button" className="btn-primary" onClick={() => setIndex((i) => i + 1)}>
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
