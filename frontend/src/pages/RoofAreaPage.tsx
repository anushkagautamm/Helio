import { useState } from 'react'
import GPSRoofMeasure from '../components/GPSRoofMeasure'
import Icon from '../components/Icon'
import OptionRow from '../components/OptionRow'
import PageHeading from '../components/PageHeading'
import WizardNav from '../components/WizardNav'
import { formatNumber } from '../utils/format'

const PRESETS = [300, 800, 1500]

type RoofMode = 'quick' | 'custom' | 'walk'

interface RoofAreaPageProps {
  value: number | null
  onSelect: (sqft: number) => void
  onNext: () => void
  onBack: () => void
}

export default function RoofAreaPage({ value, onSelect, onNext, onBack }: RoofAreaPageProps) {
  const [activeMode, setActiveMode] = useState<RoofMode | null>(null)
  const [customValue, setCustomValue] = useState('')

  const toggle = (mode: RoofMode) => setActiveMode((m) => (m === mode ? null : mode))

  function applyCustom() {
    const parsed = Number(customValue)
    if (parsed > 0) onSelect(parsed)
  }

  return (
    <div>
      <PageHeading eyebrow="Step 2 of 3" title="How large is your roof?">
        A rough figure is fine — you can come back and change it.
      </PageHeading>

      <div className="border-y border-dossier-border divide-y divide-dossier-border">
        <OptionRow
          icon="square_foot"
          title="Quick estimate"
          description="Choose a typical roof size."
          onClick={() => toggle('quick')}
          expanded={activeMode === 'quick'}
        >
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => {
              const isSelected = value === preset
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onSelect(preset)}
                  aria-pressed={isSelected}
                  className={`py-4 border text-center transition-colors ${
                    isSelected
                      ? 'border-dossier-charcoal bg-dossier-charcoal text-white'
                      : 'border-dossier-border bg-dossier-surface text-dossier-charcoal hover:border-dossier-charcoal'
                  }`}
                >
                  <span className="font-serif text-2xl tabular">{formatNumber(preset)}</span>
                  <span className={`block text-xs mt-0.5 ${isSelected ? 'text-stone-400' : 'text-dossier-tertiary'}`}>sq ft</span>
                </button>
              )
            })}
          </div>
        </OptionRow>

        <OptionRow
          icon="directions_walk"
          title="Walk my roof"
          description="Record GPS points around the edge — best on a phone."
          onClick={() => toggle('walk')}
          expanded={activeMode === 'walk'}
        >
          <GPSRoofMeasure
            onEstimated={(sqft) => {
              onSelect(sqft)
              setActiveMode(null)
            }}
          />
        </OptionRow>

        <OptionRow
          icon="edit"
          title="Enter the area"
          description="If you already know it."
          onClick={() => toggle('custom')}
          expanded={activeMode === 'custom'}
        >
          <div className="flex flex-wrap gap-3">
            <div className="relative w-full sm:w-48">
              <input
                type="number"
                min={1}
                inputMode="decimal"
                aria-label="Roof area in square feet"
                className="input-field tabular pr-14"
                placeholder="1200"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyCustom()}
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-dossier-tertiary">sq ft</span>
            </div>
            <button type="button" className="btn-secondary" onClick={applyCustom}>
              Use this
            </button>
          </div>
        </OptionRow>
      </div>

      {value && (
        <p className="mt-6 flex items-center gap-2 text-sm text-dossier-secondary animate-fade-in">
          <Icon name="check" className="!text-[18px] text-dossier-sage" />
          <span>
            <span className="text-dossier-charcoal font-medium">{formatNumber(value)} sq ft</span> — we assume about 65% is
            usable for panels.
          </span>
        </p>
      )}

      <WizardNav onBack={onBack} onNext={onNext} nextDisabled={!value} />
    </div>
  )
}
