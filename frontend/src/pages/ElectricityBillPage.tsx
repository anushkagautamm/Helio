import BillUpload from '../components/BillUpload'

interface ElectricityBillPageProps {
  unitsKwh: string
  billInr: string
  onUnitsChange: (value: string) => void
  onBillChange: (value: string) => void
  onNext: () => void
  onBack: () => void
}

export default function ElectricityBillPage({
  unitsKwh,
  billInr,
  onUnitsChange,
  onBillChange,
  onNext,
  onBack,
}: ElectricityBillPageProps) {
  return (
    <div className="max-w-2xl mx-auto px-4">
      <h2 className="font-display text-2xl font-bold text-ink mb-1">Tell us about your electricity usage</h2>
      <p className="text-ink-muted mb-6 text-sm">
        This helps us calculate your effective tariff and how much solar could save you. Both
        fields are optional — you can continue without them.
      </p>

      <BillUpload
        unitsKwh={unitsKwh}
        billInr={billInr}
        onUnitsChange={onUnitsChange}
        onBillChange={onBillChange}
      />

      <div className="flex justify-between mt-7">
        <button className="btn-secondary" onClick={onBack}>
          Back
        </button>
        <button className="btn-primary" onClick={onNext}>
          Analyze My Roof →
        </button>
      </div>
    </div>
  )
}
