import { lazy, Suspense } from 'react'
import type { PanelResult } from '../utils/types'
import SectionLoader from './SectionLoader'

// recharts is only needed on the Results page — deferring it keeps it out
// of the bundle required for the landing/location/roof/bill wizard steps.
const MonthlyGenerationChartImpl = lazy(() => import('./MonthlyGenerationChart'))

export default function LazyMonthlyGenerationChart({
  panel,
  isFallback,
}: {
  panel: PanelResult
  isFallback: boolean
}) {
  return (
    <Suspense fallback={<SectionLoader heightClass="h-64" label="Loading chart…" />}>
      <MonthlyGenerationChartImpl panel={panel} isFallback={isFallback} />
    </Suspense>
  )
}
