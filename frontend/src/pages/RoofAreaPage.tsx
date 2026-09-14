import { useState } from 'react'
import GPSRoofMeasure from '../components/GPSRoofMeasure'

const PRESETS = [300, 800, 1500]

type RoofMode = 'quick' | 'custom' | 'walk'

interface RoofAreaPageProps {
  value: number | null
  onSelect: (sqft: number) => void
  onNext: () => void
  onBack: () => void
}

const CARDS: { mode: RoofMode; icon: string; title: string; description: string; bestFor: string }[] = [
  {
    mode: 'quick',
    icon: '📐',
    title: 'Quick Estimate',
    description: 'Get a fast planning estimate using typical roof sizes for Indian homes.',
    bestFor: 'A quick first look',
  },
  {
    mode: 'walk',
    icon: '🚶',
    title: 'Walk My Roof',
    description: 'Use your GPS to record the roof outline for a rough visual assessment.',
    bestFor: 'A more visual, hands-on assessment (great on mobile)',
  },
  {
    mode: 'custom',
    icon: '✏️',
    title: 'Enter My Roof',
    description: 'Provide your roof dimensions directly if you already know the area.',
    bestFor: 'Users who already know their roof size',
  },
]

export default function RoofAreaPage({ value, onSelect, onNext, onBack }: RoofAreaPageProps) {
  const [activeMode, setActiveMode] = useState<RoofMode | null>(null)
  const [customValue, setCustomValue] = useState('')

  return (
    <div className="max-w-2xl mx-auto px-4">
      <h2 className="font-display text-2xl font-bold text-ink mb-1">How large is your roof?</h2>
      <p className="text-ink-muted mb-6 text-sm">
        Pick whichever approach suits you best — you can always adjust it later.
      </p>

      <div className="space-y-3">
        {CARDS.map((card) => {
          const isActive = activeMode === card.mode
          return (
            <div key={card.mode}>
              <button
                type="button"
                onClick={() => setActiveMode(isActive ? null : card.mode)}
                aria-pressed={isActive}
                className="w-full choice-card flex items-center gap-4"
              >
                <span className="text-2xl shrink-0" aria-hidden="true">{card.icon}</span>
                <span className="flex-1">
                  <span className="font-display font-semibold text-ink block text-base">{card.title}</span>
                  <span className="text-xs text-ink-muted block">{card.description}</span>
                  <span className="text-[11px] text-helio-dark font-medium">Best for: {card.bestFor}</span>
                </span>
                <span className={`text-ink-faint transition-transform shrink-0 ${isActive ? 'rotate-180' : ''}`} aria-hidden="true">
                  ⌄
                </span>
              </button>

              {isActive && card.mode === 'quick' && (
                <div className="card mt-2">
                  <div className="grid grid-cols-3 gap-2.5">
                    {PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => onSelect(preset)}
                        aria-pressed={value === preset}
                        className={`rounded-xl border-2 px-3 py-3 text-center font-display font-semibold text-sm transition-colors ${
                          value === preset
                            ? 'border-helio bg-helio-light text-helio-dark'
                            : 'border-edge text-ink hover:border-helio/50'
                        }`}
                      >
                        {preset} sq ft
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isActive && card.mode === 'custom' && (
                <div className="card mt-2">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      className="input-field max-w-[180px]"
                      placeholder="Sq ft"
                      value={customValue}
                      onChange={(e) => setCustomValue(e.target.value)}
                      aria-label="Custom roof area in square feet"
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        const parsed = Number(customValue)
                        if (parsed > 0) onSelect(parsed)
                      }}
                    >
                      Use this value
                    </button>
                  </div>
                </div>
              )}

              {isActive && card.mode === 'walk' && (
                <GPSRoofMeasure
                  onEstimated={(sqft) => {
                    onSelect(sqft)
                    setActiveMode(null)
                  }}
                />
              )}
            </div>
          )
        })}
      </div>

      {value && (
        <div className="note-box mt-5">
          Selected roof area: <strong className="text-ink">{value.toFixed(0)} sq ft</strong>. We'll
          assume 65% of this is usable for panels after accounting for shading, vents, and
          walkways.
        </div>
      )}

      <div className="flex justify-between mt-7">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary" onClick={onNext} disabled={!value}>
          Continue
        </button>
      </div>
    </div>
  )
}
