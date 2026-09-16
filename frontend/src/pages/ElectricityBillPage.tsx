import BillUpload from '../components/BillUpload'
import PageHeading from '../components/PageHeading'
import WizardNav from '../components/WizardNav'

interface ElectricityBillPageProps {
  unitsKwh: string
  billInr: string
  onUnitsChange: (value: string) => void
  onBillChange: (value: string) => void
  onNext: () => void
  onBack: () => void
  canAnalyze: boolean
}

export default function ElectricityBillPage({
  unitsKwh,
  billInr,
  onUnitsChange,
  onBillChange,
  onNext,
  onBack,
  canAnalyze,
}: ElectricityBillPageProps) {
  return (
    <div>
      <PageHeading eyebrow="Step 3 of 3" title="How much electricity do you use?">
        Optional, but it makes the savings estimate much more accurate.
      </PageHeading>

      <BillUpload unitsKwh={unitsKwh} billInr={billInr} onUnitsChange={onUnitsChange} onBillChange={onBillChange} />

      <WizardNav onBack={onBack} onNext={onNext} nextLabel="See my results" nextDisabled={!canAnalyze} />
    </div>
  )
}
