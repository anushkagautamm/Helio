import { useRef, useState } from 'react'
import type { OCRConfidence, OCRResponse } from '../utils/types'
import { ocrBillImage } from '../services/api'
import ErrorBanner from './ErrorBanner'

interface BillUploadProps {
  unitsKwh: string
  billInr: string
  onUnitsChange: (value: string) => void
  onBillChange: (value: string) => void
}

const CONFIDENCE_META: Record<OCRConfidence, { label: string; className: string }> = {
  high: { label: 'High confidence', className: 'bg-helio-light text-helio-dark' },
  medium: { label: 'Medium confidence', className: 'bg-sun/20 text-sun' },
  low: { label: 'Low confidence', className: 'bg-sun/20 text-sun' },
  none: { label: 'Not found', className: 'bg-surface2 text-ink-faint' },
}

function ConfidenceBadge({ confidence }: { confidence: OCRConfidence }) {
  const meta = CONFIDENCE_META[confidence]
  return <span className={`pill text-[10px] ${meta.className}`}>{meta.label}</span>
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
  const hasValidTariffInputs = unitsKwh !== '' && billInr !== '' && units > 0 && bill > 0
  const effectiveTariff = hasValidTariffInputs ? bill / units : null

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
      setFailMessage("We couldn't read this bill automatically. Enter your usage and bill amount manually below — it only takes a few seconds.")
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
    <div className="space-y-5">
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
        <span className="text-3xl block mb-2" aria-hidden="true">🧾</span>
        <p className="font-display font-semibold text-ink mb-1">Upload your electricity bill</p>
        <p className="text-sm text-ink-muted mb-4">
          Drag &amp; drop a photo here, or browse. We'll try to read the details automatically —
          this is optional and always editable.
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
        <button
          type="button"
          className="btn-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={stage === 'processing'}
        >
          {stage === 'processing' ? 'Reading bill…' : 'Browse Files'}
        </button>
        <p className="text-[11px] text-ink-faint mt-3">
          Processed only in memory for this request — never stored on our server.
        </p>
      </div>

      {stage === 'processing' && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <span className="w-4 h-4 border-2 border-helio-light border-t-helio rounded-full animate-spin shrink-0" />
          Reading your bill…
        </div>
      )}

      {stage === 'failed' && failMessage && (
        <ErrorBanner title="Couldn't read the bill automatically" message={failMessage} />
      )}

      {stage === 'reviewing' && ocrResult && (
        <div className="rounded-2xl border border-helio/30 bg-helio-light/40 p-5">
          <p className="text-xs font-semibold text-helio-dark uppercase tracking-wide mb-3">
            We found these details
          </p>

          <div className="space-y-3 mb-4">
            <div className="bg-surface rounded-xl p-3.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[11px] text-ink-muted uppercase tracking-wide">Monthly consumption</p>
                <ConfidenceBadge confidence={ocrResult.units_confidence} />
              </div>
              <p className="font-display text-lg font-bold text-ink">
                {ocrResult.units_kwh != null ? `${ocrResult.units_kwh} kWh` : 'Not found'}
              </p>
              {ocrResult.units_note && <p className="text-xs text-ink-muted mt-1">{ocrResult.units_note}</p>}
              {ocrResult.current_meter_reading != null && ocrResult.previous_meter_reading != null && (
                <p className="text-[11px] text-ink-faint mt-1">
                  Current reading {ocrResult.current_meter_reading} − previous reading{' '}
                  {ocrResult.previous_meter_reading}
                </p>
              )}
            </div>

            <div className="bg-surface rounded-xl p-3.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-[11px] text-ink-muted uppercase tracking-wide">Bill amount</p>
                <ConfidenceBadge confidence={ocrResult.amount_confidence} />
              </div>
              <p className="font-display text-lg font-bold text-ink">
                {ocrResult.bill_amount_inr != null ? `₹${ocrResult.bill_amount_inr.toLocaleString('en-IN')}` : 'Not found'}
              </p>
              {ocrResult.amount_source === 'amount_in_words' && (
                <p className="text-xs text-ink-muted mt-1">Read from the spelled-out amount on the bill.</p>
              )}
            </div>

            {ocrResult.billing_period && (
              <div className="bg-surface rounded-xl p-3.5">
                <p className="text-[11px] text-ink-muted uppercase tracking-wide">Billing period</p>
                <p className="text-sm font-semibold text-ink">{ocrResult.billing_period}</p>
              </div>
            )}
            {ocrResult.detected_tariff_inr_per_kwh && (
              <div className="bg-surface rounded-xl p-3.5">
                <p className="text-[11px] text-ink-muted uppercase tracking-wide">Printed tariff</p>
                <p className="text-sm font-semibold text-ink">₹{ocrResult.detected_tariff_inr_per_kwh}/kWh</p>
              </div>
            )}
          </div>

          {ocrResult.units_kwh == null && (
            <p className="note-box mb-4">
              We couldn't reliably determine your electricity consumption from this bill — please
              enter it manually below rather than relying on a guess.
            </p>
          )}

          <p className="text-xs text-ink-muted mb-4">Does this look correct?</p>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" className="btn-primary" onClick={() => dismissReview(false)}>
              ✓ Looks correct
            </button>
            <button type="button" className="btn-secondary" onClick={() => dismissReview(true)}>
              Edit details
            </button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label-text" htmlFor="units-input">Monthly electricity usage</label>
          <div className="relative">
            <input
              ref={unitsInputRef}
              id="units-input"
              type="number"
              min={0}
              className="input-field pr-16"
              placeholder="e.g. 250"
              value={unitsKwh}
              onChange={(e) => onUnitsChange(e.target.value)}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-ink-faint">units/kWh</span>
          </div>
        </div>
        <div>
          <label className="label-text" htmlFor="bill-input">Monthly bill</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-faint">₹</span>
            <input
              id="bill-input"
              type="number"
              min={0}
              className="input-field pl-8"
              placeholder="e.g. 1800"
              value={billInr}
              onChange={(e) => onBillChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {effectiveTariff !== null ? (
        <div className="rounded-xl border border-helio/30 bg-helio-light/50 px-4 py-3.5">
          <p className="text-xs font-semibold text-helio-dark uppercase tracking-wide mb-1">
            Your effective electricity tariff
          </p>
          <p className="font-display text-2xl font-bold text-ink">₹{effectiveTariff.toFixed(2)} / kWh</p>
          <p className="text-xs text-ink-muted mt-1">Calculated from your bill ÷ electricity usage.</p>
        </div>
      ) : (
        <p className="note-box">
          Both fields are optional but improve accuracy. Without both, we'll use a default
          assumption of <strong className="text-ink">₹7/kWh</strong>, clearly labelled in your
          results.
        </p>
      )}
    </div>
  )
}
