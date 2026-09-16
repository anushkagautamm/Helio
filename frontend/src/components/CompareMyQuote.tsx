import { useRef, useState } from 'react'
import type { AnalyzeResponse, QuoteComparisonResponse, QuoteInfo } from '../utils/types'
import { compareQuote, extractQuoteImage } from '../services/api'
import ErrorBanner from './ErrorBanner'
import Icon from './Icon'

type Stage = 'idle' | 'processing' | 'reviewing' | 'failed' | 'comparing' | 'compared'

const EMPTY_QUOTE: QuoteInfo = {
  installer_name: null,
  panel_manufacturer: null,
  panel_model: null,
  panel_watt: null,
  panel_count: null,
  system_capacity_kw: null,
  inverter_brand: null,
  total_price_inr: null,
  installation_charges_inr: null,
  subsidy_assumed_inr: null,
  mounting_structure: null,
  warranty_info: null,
}

type FieldSpec = { key: keyof QuoteInfo; label: string; numeric?: boolean }

const FIELDS: FieldSpec[] = [
  { key: 'installer_name', label: 'Installer' },
  { key: 'total_price_inr', label: 'Total price (₹)', numeric: true },
  { key: 'panel_manufacturer', label: 'Panel brand' },
  { key: 'panel_model', label: 'Panel model' },
  { key: 'panel_watt', label: 'Panel wattage (W)', numeric: true },
  { key: 'panel_count', label: 'Number of panels', numeric: true },
  { key: 'system_capacity_kw', label: 'System size (kW)', numeric: true },
  { key: 'inverter_brand', label: 'Inverter brand' },
  { key: 'installation_charges_inr', label: 'Installation charges (₹)', numeric: true },
  { key: 'subsidy_assumed_inr', label: 'Subsidy assumed (₹)', numeric: true },
  { key: 'mounting_structure', label: 'Mounting structure' },
  { key: 'warranty_info', label: 'Warranty' },
]

function numOrNull(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export default function CompareMyQuote({ analysis }: { analysis: AnalyzeResponse }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [quote, setQuote] = useState<QuoteInfo>(EMPTY_QUOTE)
  const [failMessage, setFailMessage] = useState<string | null>(null)
  const [comparison, setComparison] = useState<QuoteComparisonResponse | null>(null)
  const [dragOver, setDragOver] = useState(false)

  async function handleFile(file: File) {
    setStage('processing')
    setFailMessage(null)
    try {
      const result = await extractQuoteImage(file)
      if (result.success) {
        setQuote(result.quote)
        setStage('reviewing')
      } else {
        setQuote(EMPTY_QUOTE)
        setFailMessage(result.message)
        setStage('failed')
      }
    } catch {
      setFailMessage("We couldn't read this document automatically. Enter the details manually instead.")
      setStage('failed')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function startManualEntry() {
    setQuote(EMPTY_QUOTE)
    setFailMessage(null)
    setStage('reviewing')
  }

  function updateField(field: keyof QuoteInfo, raw: string, numeric?: boolean) {
    setQuote((q) => ({ ...q, [field]: numeric ? numOrNull(raw) : raw || null }))
  }

  async function handleCompare() {
    setStage('comparing')
    try {
      setComparison(await compareQuote({ quote, analysis }))
      setStage('compared')
    } catch {
      setFailMessage('Could not compare the quote right now. Please try again.')
      setStage('reviewing')
    }
  }

  return (
    <div className="max-w-3xl">
      <p className="text-dossier-secondary">Got a quotation? See how it stacks up against this estimate.</p>

      {stage === 'idle' && (
        <div
          className={`mt-6 border border-dashed p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors ${
            dragOver ? 'border-dossier-charcoal bg-dossier-muted/60' : 'border-dossier-border'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <span className="w-10 h-10 shrink-0 flex items-center justify-center border border-dossier-border text-dossier-secondary">
            <Icon name="upload_file" className="!text-[20px]" />
          </span>
          <div className="flex-1">
            <p className="text-base font-medium text-dossier-charcoal">Upload a photo of the quote</p>
            <p className="text-sm text-dossier-secondary mt-0.5">Read in memory only — never stored.</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />
          <div className="flex items-center gap-5">
            <button type="button" className="text-sm text-dossier-secondary hover:text-dossier-charcoal" onClick={startManualEntry}>
              Type it in
            </button>
            <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
              Choose file
            </button>
          </div>
        </div>
      )}

      {stage === 'processing' && (
        <p className="mt-6 text-sm text-dossier-secondary">Reading your quote… this can take up to a minute — the server sleeps when idle and a large photo takes longer to read.</p>
      )}

      {failMessage && (
        <div className="mt-6 space-y-4">
          <ErrorBanner message={failMessage} />
          {stage === 'failed' && (
            <button type="button" className="btn-secondary" onClick={startManualEntry}>
              Enter details manually
            </button>
          )}
        </div>
      )}

      {(stage === 'reviewing' || stage === 'comparing') && (
        <div className="mt-6 animate-fade-in">
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-4">
            {FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="block text-sm text-dossier-secondary mb-1.5">{field.label}</span>
                <input
                  type={field.numeric ? 'number' : 'text'}
                  inputMode={field.numeric ? 'decimal' : undefined}
                  className="input-field tabular"
                  value={quote[field.key] ?? ''}
                  onChange={(e) => updateField(field.key, e.target.value, field.numeric)}
                />
              </label>
            ))}
          </div>
          <button type="button" className="btn-primary mt-6" onClick={handleCompare} disabled={stage === 'comparing'}>
            {stage === 'comparing' ? 'Comparing…' : 'Compare with this estimate'}
          </button>
        </div>
      )}

      {stage === 'compared' && comparison && (
        <div className="mt-6 animate-fade-in">
          <p className="text-dossier-charcoal leading-relaxed">{comparison.summary}</p>
          <div className="mt-6 hidden sm:grid grid-cols-[1fr_9rem_9rem] gap-x-4 pb-2 border-b border-dossier-border text-xs text-dossier-tertiary">
            <span />
            <span className="text-right">Helio estimate</span>
            <span className="text-right">Your quote</span>
          </div>
          <dl className="divide-y divide-dossier-border-subtle border-t sm:border-t-0 border-dossier-border mt-6 sm:mt-0">
            {comparison.items.map((item, i) => (
              <div key={i} className="py-3.5">
                <div className="grid grid-cols-2 sm:grid-cols-[1fr_9rem_9rem] gap-x-4 gap-y-1 items-baseline text-sm">
                  <dt className="col-span-2 sm:col-span-1 text-dossier-charcoal">{item.label}</dt>
                  <dd className="text-dossier-secondary sm:text-right">
                    <span className="sm:hidden text-dossier-tertiary">Helio </span>
                    {item.helio_value}
                  </dd>
                  <dd className="text-dossier-charcoal text-right">
                    <span className="sm:hidden text-dossier-tertiary">Quote </span>
                    {item.quote_value}
                  </dd>
                </div>
                <p className="mt-1 text-xs text-dossier-tertiary">{item.note}</p>
              </div>
            ))}
          </dl>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-1.5 text-sm text-dossier-secondary hover:text-dossier-charcoal"
            onClick={() => {
              setStage('reviewing')
              setComparison(null)
            }}
          >
            <Icon name="arrow_back" className="!text-[16px]" /> Edit details
          </button>
        </div>
      )}
    </div>
  )
}
