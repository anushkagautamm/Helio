import { useRef, useState } from 'react'
import type { OCRConfidence, OCRResponse } from '../utils/types'
import { ocrBillImage } from '../services/api'
import ErrorBanner from './ErrorBanner'
import Icon from './Icon'

interface BillUploadProps {
  unitsKwh: string
  billInr: string
  onUnitsChange: (value: string) => void
  onBillChange: (value: string) => void
}

const CONFIDENCE_LABEL: Record<OCRConfidence, { label: string; className: string }> = {
  high: { label: 'High confidence', className: 'text-dossier-sage' },
  medium: { label: 'Medium confidence', className: 'text-dossier-ochre' },
  low: { label: 'Low confidence', className: 'text-dossier-ochre' },
  none: { label: 'Not found', className: 'text-dossier-tertiary' },
}

type Stage = 'idle' | 'processing' | 'reviewing' | 'failed'

export default function BillUpload({ unitsKwh, billInr, onUnitsChange, onBillChange }: BillUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const unitsInputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [ocrResult, setOcrResult] = useState<OCRResponse | null>(null)
  const [failMessage, setFailMessage] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const units = Number(unitsKwh)
  const bill = Number(billInr)
  const effectiveTariff = unitsKwh !== '' && billInr !== '' && units > 0 && bill > 0 ? bill / units : null

  async function handleFile(file: File) {
    setStage('processing')
    setFailMessage(null)
    setOcrResult(null)
    try {
      const result = await ocrBillImage(file)
      if (result.success) {
        if (result.units_kwh != null) onUnitsChange(String(result.units_kwh))
        if (result.bill_amount_inr != null) onBillChange(String(result.bill_amount_inr))
        setOcrResult(result)
        setStage('reviewing')
      } else {
        setFailMessage(result.message)
        setStage('failed')
      }
    } catch {
      setFailMessage("We couldn't read this bill automatically. Enter your usage and bill amount below — it only takes a few seconds.")
      setStage('failed')
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function dismissReview(focusFields: boolean) {
    setStage('idle')
    if (focusFields) unitsInputRef.current?.focus()
  }

  return (
    <div>
      {/* Upload */}
      <div
        className={`border border-dashed p-5 flex items-center gap-4 transition-colors ${
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
        <div className="flex-1 min-w-0">
          <p className="text-base font-medium text-dossier-charcoal">Upload a bill photo</p>
          <p className="text-sm text-dossier-secondary mt-0.5">We'll try to read the units and amount for you.</p>
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
        <button
          type="button"
          className="btn-secondary shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={stage === 'processing'}
        >
          {stage === 'processing' ? 'Reading…' : 'Choose file'}
        </button>
      </div>

      {stage === 'failed' && failMessage && (
        <div className="mt-4">
          <ErrorBanner message={failMessage} />
        </div>
      )}

      {stage === 'reviewing' && ocrResult && (
        <div className="mt-4 border border-dossier-border bg-dossier-surface p-5 animate-fade-in">
          <p className="text-sm font-medium text-dossier-charcoal">Here's what we found — does it look right?</p>
          <dl className="mt-4 divide-y divide-dossier-border-subtle text-sm">
            <div className="py-2.5 flex items-baseline justify-between gap-4">
              <dt className="text-dossier-secondary">
                Monthly usage{' '}
                <span className={`text-xs ${CONFIDENCE_LABEL[ocrResult.units_confidence].className}`}>
                  · {CONFIDENCE_LABEL[ocrResult.units_confidence].label}
                </span>
              </dt>
              <dd className="text-dossier-charcoal tabular">{ocrResult.units_kwh != null ? `${ocrResult.units_kwh} kWh` : '—'}</dd>
            </div>
            <div className="py-2.5 flex items-baseline justify-between gap-4">
              <dt className="text-dossier-secondary">
                Bill amount{' '}
                <span className={`text-xs ${CONFIDENCE_LABEL[ocrResult.amount_confidence].className}`}>
                  · {CONFIDENCE_LABEL[ocrResult.amount_confidence].label}
                </span>
              </dt>
              <dd className="text-dossier-charcoal tabular">
                {ocrResult.bill_amount_inr != null ? `₹${ocrResult.bill_amount_inr.toLocaleString('en-IN')}` : '—'}
              </dd>
            </div>
            {ocrResult.billing_period && (
              <div className="py-2.5 flex items-baseline justify-between gap-4">
                <dt className="text-dossier-secondary">Billing period</dt>
                <dd className="text-dossier-charcoal text-right">{ocrResult.billing_period}</dd>
              </div>
            )}
          </dl>
          {(ocrResult.units_note || ocrResult.units_kwh == null) && (
            <p className="mt-3 text-xs text-dossier-tertiary">
              {ocrResult.units_kwh == null
                ? "We couldn't reliably read your usage — please enter it below."
                : ocrResult.units_note}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={() => dismissReview(false)}>
              Looks right
            </button>
            <button type="button" className="btn-secondary" onClick={() => dismissReview(true)}>
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Manual entry */}
      <p className="mt-10 mb-4 text-sm text-dossier-tertiary">Or enter it yourself</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm text-dossier-secondary mb-1.5">Units per month</span>
          <div className="relative">
            <input
              ref={unitsInputRef}
              id="units-input"
              type="number"
              min={0}
              inputMode="decimal"
              className="input-field tabular pr-14"
              placeholder="250"
              value={unitsKwh}
              onChange={(e) => onUnitsChange(e.target.value)}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-dossier-tertiary">kWh</span>
          </div>
        </label>
        <label className="block">
          <span className="block text-sm text-dossier-secondary mb-1.5">Bill per month</span>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-dossier-tertiary">₹</span>
            <input
              id="bill-input"
              type="number"
              min={0}
              inputMode="decimal"
              className="input-field tabular pl-8"
              placeholder="1800"
              value={billInr}
              onChange={(e) => onBillChange(e.target.value)}
            />
          </div>
        </label>
      </div>

      <div className="mt-6 pt-5 border-t border-dossier-border-subtle flex items-baseline justify-between gap-4">
        <span className="text-sm text-dossier-secondary">
          {effectiveTariff !== null ? 'Your price per unit' : 'Without these we assume'}
        </span>
        <span className="font-serif text-2xl text-dossier-charcoal tabular">
          ₹{(effectiveTariff ?? 7).toFixed(2)}
          <span className="font-sans text-sm text-dossier-tertiary"> / kWh</span>
        </span>
      </div>
    </div>
  )
}
