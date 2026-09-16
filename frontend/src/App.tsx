import { useEffect, useState } from 'react'
import AnalyzingLoader from './components/AnalyzingLoader'
import ErrorBanner from './components/ErrorBanner'
import OnboardingTour from './components/OnboardingTour'
import SiteFooter from './components/SiteFooter'
import SiteHeader, { type Phase } from './components/SiteHeader'
import LandingPage from './pages/LandingPage'
import LocationPage from './pages/LocationPage'
import RoofAreaPage from './pages/RoofAreaPage'
import ElectricityBillPage from './pages/ElectricityBillPage'
import ResultsPage from './pages/ResultsPage'
import { analyze, ApiError, downloadPdfReport } from './services/api'
import type { AnalyzeResponse, LocationResult } from './utils/types'

const TOUR_SEEN_KEY = 'helio-tour-seen'

export default function App() {
  const [phase, setPhase] = useState<Phase>('landing')
  const [wizardStep, setWizardStep] = useState(0)

  const [location, setLocation] = useState<LocationResult | null>(null)
  const [roofAreaSqft, setRoofAreaSqft] = useState<number | null>(null)
  const [unitsKwh, setUnitsKwh] = useState('')
  const [billInr, setBillInr] = useState('')

  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_SEEN_KEY)) setShowTour(true)
    } catch {
      // localStorage unavailable — skip auto-show, tour is still reachable from the header
    }
  }, [])

  // Each step replaces the page content — start it from the top rather than
  // wherever the Continue button happened to be.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [phase, wizardStep])

  function closeTour() {
    setShowTour(false)
    try {
      localStorage.setItem(TOUR_SEEN_KEY, '1')
    } catch {
      // ignore — tour will just reappear via auto-show logic if it can't persist
    }
  }

  async function runAnalysis() {
    if (!location || !roofAreaSqft) return
    setPhase('analyzing')
    setAnalysisError(null)
    try {
      const result = await analyze({
        lat: location.lat,
        lon: location.lon,
        location_label: location.display_name,
        roof_area_sqft: roofAreaSqft,
        monthly_units_kwh: unitsKwh ? Number(unitsKwh) : null,
        monthly_bill_inr: billInr ? Number(billInr) : null,
      })
      setAnalysis(result)
      setDownloadError(null)
      setPhase('results')
    } catch (err) {
      setAnalysisError(
        err instanceof ApiError ? err.message : 'Something went wrong while analysing your roof. Please try again.',
      )
      setPhase('wizard')
      setWizardStep(2)
    }
  }

  async function handleDownload() {
    if (!analysis) return
    setDownloading(true)
    setDownloadError(null)
    try {
      const blob = await downloadPdfReport(analysis)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'helio-solar-report.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      setDownloadError('Could not generate the PDF report right now. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  function restart() {
    setPhase('landing')
    setWizardStep(0)
    setLocation(null)
    setRoofAreaSqft(null)
    setUnitsKwh('')
    setBillInr('')
    setAnalysis(null)
    setAnalysisError(null)
    setDownloadError(null)
  }

  return (
    <div className="min-h-screen flex flex-col bg-dossier-bg text-dossier-charcoal">
      <SiteHeader
        phase={phase}
        wizardStep={wizardStep}
        downloading={downloading}
        onHome={restart}
        onStepSelect={setWizardStep}
        onTour={() => setShowTour(true)}
        onDownload={handleDownload}
      />

      <main className="flex-grow w-full max-w-6xl mx-auto px-6 py-14 sm:py-20">
        {phase === 'landing' && <LandingPage onStart={() => setPhase('wizard')} onTakeTour={() => setShowTour(true)} />}

        {phase === 'wizard' && (
          <div className="max-w-2xl mx-auto">
            {analysisError && (
              <div className="mb-10">
                <ErrorBanner title="The analysis didn't complete" message={analysisError} onRetry={runAnalysis} />
              </div>
            )}
            {wizardStep === 0 && (
              <LocationPage selected={location} onSelect={setLocation} onNext={() => setWizardStep(1)} onBack={restart} />
            )}
            {wizardStep === 1 && (
              <RoofAreaPage
                value={roofAreaSqft}
                onSelect={setRoofAreaSqft}
                onNext={() => setWizardStep(2)}
                onBack={() => setWizardStep(0)}
              />
            )}
            {wizardStep === 2 && (
              <ElectricityBillPage
                unitsKwh={unitsKwh}
                billInr={billInr}
                onUnitsChange={setUnitsKwh}
                onBillChange={setBillInr}
                onNext={runAnalysis}
                onBack={() => setWizardStep(1)}
                canAnalyze={!!location && !!roofAreaSqft}
              />
            )}
          </div>
        )}

        {phase === 'analyzing' && (
          <AnalyzingLoader hasLocation={!!location} hasRoof={!!roofAreaSqft} hasElectricity={!!(unitsKwh || billInr)} />
        )}

        {phase === 'results' && analysis && (
          <ResultsPage
            analysis={analysis}
            downloading={downloading}
            downloadError={downloadError}
            onDownload={handleDownload}
            onBack={() => {
              setPhase('wizard')
              setWizardStep(2)
            }}
            onRestart={restart}
          />
        )}
      </main>

      <SiteFooter />

      {showTour && <OnboardingTour onClose={closeTour} />}
    </div>
  )
}
