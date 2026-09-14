import { useRef, useState } from 'react'
import type { AnalyzeResponse, QuoteComparisonResponse, QuoteInfo } from '../utils/types'
import { compareQuote, extractQuoteImage } from '../services/api'
import ErrorBanner from './ErrorBanner'

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

function textField(value: string | null | undefined): string {
  return value ?? ''
}

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
      setFailMessage("We couldn't read this document automatically. Enter the details manually below instead.")
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

  function updateField<K extends keyof QuoteInfo>(field: K, value: QuoteInfo[K]) {
    setQuote((q) => ({ ...q, [field]: value }))
  }

  async function handleCompare() {
    setStage('comparing')
    try {
      const result = await compareQuote({ quote, analysis })
      setComparison(result)
      setStage('compared')
    } catch {
      setFailMessage('Could not compare the quote right now. Please try again.')
      setStage('reviewing')
    }
  }

  if (stage === 'idle') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          Already have a quote from an installer? Upload it or enter the details manually, and
          Helio will show how it compares to its own calculated estimate for your home.
        </p>
        <div
          className={`card border-2 border-dashed text-center transition-colors ${
            dragOver ? 'border-helio bg-helio-light/40' : 'border-edge'
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <span className="text-3xl block mb-2" aria-hidden="true">📋</span>
          <p className="font-display font-semibold text-ink mb-1">Upload your solar quote</p>
          <p className="text-sm text-ink-muted mb-4">
            Drag &amp; drop a photo or scan here, or browse. Optional — you can also enter the
            details by hand.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <div className="flex flex-wrap justify-center gap-2.5">
            <button type="button" className="btn-secondary" onClick={() => fileInputRef.current?.click()}>
              Browse Files
            </button>
            <button type="button" className="btn-ghost" onClick={startManualEntry}>
              Enter details manually
            </button>
          </div>
          <p className="text-[11px] text-ink-faint mt-3">
            Processed only in memory for this request — never stored on our server.
          </p>
        </div>
      </div>
    )
  }

  if (stage === 'processing') {
    return (
      <div className="flex items-center gap-2 text-sm text-ink-muted">
        <span className="w-4 h-4 border-2 border-helio-light border-t-helio rounded-full animate-spin shrink-0" />
        Reading your quote…
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {failMessage && <ErrorBanner title="Heads up" message={failMessage} />}

      {stage === 'failed' && (
        <button type="button" className="btn-secondary" onClick={startManualEntry}>
          Enter details manually instead
        </button>
      )}

      {(stage === 'reviewing' || stage === 'comparing') && (
        <div className="rounded-2xl border border-helio/30 bg-helio-light/40 p-5">
          <p className="text-xs font-semibold text-helio-dark uppercase tracking-wide mb-3">
            Check and complete these details before comparing
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="label-text">Installer name</label>
              <input
                className="input-field"
                value={textField(quote.installer_name)}
                onChange={(e) => updateField('installer_name', e.target.value || null)}
              />
            </div>
            <div>
              <label className="label-text">Panel manufacturer</label>
              <input
                className="input-field"
                value={textField(quote.panel_manufacturer)}
                onChange={(e) => updateField('panel_manufacturer', e.target.value || null)}
              />
            </div>
            <div>
              <label className="label-text">Panel model</label>
              <input
                className="input-field"
                value={textField(quote.panel_model)}
                onChange={(e) => updateField('panel_model', e.target.value || null)}
              />
            </div>
            <div>
              <label className="label-text">Panel wattage (W)</label>
              <input
                type="number"
                className="input-field"
                value={quote.panel_watt ?? ''}
                onChange={(e) => updateField('panel_watt', numOrNull(e.target.value))}
              />
            </div>
            <div>
              <label className="label-text">Number of panels</label>
              <input
                type="number"
                className="input-field"
                value={quote.panel_count ?? ''}
                onChange={(e) => updateField('panel_count', numOrNull(e.target.value))}
              />
            </div>
            <div>
              <label className="label-text">System capacity (kW)</label>
              <input
                type="number"
                className="input-field"
                value={quote.system_capacity_kw ?? ''}
                onChange={(e) => updateField('system_capacity_kw', numOrNull(e.target.value))}
              />
            </div>
            <div>
              <label className="label-text">Inverter brand</label>
              <input
                className="input-field"
                value={textField(quote.inverter_brand)}
                onChange={(e) => updateField('inverter_brand', e.target.value || null)}
              />
            </div>
            <div>
              <label className="label-text">Total price (₹)</label>
              <input
                type="number"
                className="input-field"
                value={quote.total_price_inr ?? ''}
                onChange={(e) => updateField('total_price_inr', numOrNull(e.target.value))}
              />
            </div>
            <div>
              <label className="label-text">Installation charges (₹)</label>
              <input
                type="number"
                className="input-field"
                value={quote.installation_charges_inr ?? ''}
                onChange={(e) => updateField('installation_charges_inr', numOrNull(e.target.value))}
              />
            </div>
            <div>
              <label className="label-text">Subsidy assumed (₹)</label>
              <input
                type="number"
                className="input-field"
                value={quote.subsidy_assumed_inr ?? ''}
                onChange={(e) => updateField('subsidy_assumed_inr', numOrNull(e.target.value))}
              />
            </div>
            <div>
              <label className="label-text">Mounting structure</label>
              <input
                className="input-field"
                value={textField(quote.mounting_structure)}
                onChange={(e) => updateField('mounting_structure', e.target.value || null)}
              />
            </div>
            <div>
              <label className="label-text">Warranty</label>
              <input
                className="input-field"
                value={textField(quote.warranty_info)}
                onChange={(e) => updateField('warranty_info', e.target.value || null)}
              />
            </div>
          </div>

          <button
            type="button"
            className="btn-primary w-full mt-4"
            onClick={handleCompare}
            disabled={stage === 'comparing'}
          >
            {stage === 'comparing' ? 'Comparing…' : 'Compare to Helio’s estimate'}
          </button>
        </div>
      )}

      {stage === 'compared' && comparison && (
        <div className="space-y-3">
          <div className="note-box">{comparison.summary}</div>
          {comparison.items.map((item, i) => (
            <div key={i} className="rounded-xl border border-edge bg-surface p-4">
              <p className="text-sm font-semibold text-ink mb-1.5">{item.label}</p>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-ink-muted">Helio's estimate: <span className="text-ink font-medium">{item.helio_value}</span></span>
                <span className="text-ink-muted">Your quote: <span className="text-ink font-medium">{item.quote_value}</span></span>
              </div>
              <p className="text-xs text-ink-muted">{item.note}</p>
            </div>
          ))}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setStage('reviewing')
              setComparison(null)
            }}
          >
            ← Edit details and compare again
          </button>
        </div>
      )}
    </div>
  )
}
