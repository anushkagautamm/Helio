import { useEffect, useState } from 'react'
import Stepper from './components/Stepper'
import AnalyzingLoader from './components/AnalyzingLoader'
import ErrorBanner from './components/ErrorBanner'
import ThemeToggle from './components/ThemeToggle'
import Logo from './components/Logo'
import OnboardingTour from './components/OnboardingTour'
import LandingPage from './pages/LandingPage'
import LocationPage from './pages/LocationPage'
import RoofAreaPage from './pages/RoofAreaPage'
import ElectricityBillPage from './pages/ElectricityBillPage'
import ResultsPage from './pages/ResultsPage'
import { analyze, ApiError } from './services/api'
import { useTheme } from './utils/useTheme'
import type { AnalyzeResponse, LocationResult } from './utils/types'

const STEPS = ['Location', 'Roof', 'Energy', 'Results']
const TOUR_SEEN_KEY = 'helio-tour-seen'

type Phase = 'landing' | 'wizard' | 'analyzing' | 'results'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [phase, setPhase] = useState<Phase>('landing')
  const [wizardStep, setWizardStep] = useState(0)

  const [location, setLocation] = useState<LocationResult | null>(null)
  const [roofAreaSqft, setRoofAreaSqft] = useState<number | null>(null)
  const [unitsKwh, setUnitsKwh] = useState('')
  const [billInr, setBillInr] = useState('')

  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_SEEN_KEY)) setShowTour(true)
    } catch {
      // localStorage unavailable — skip auto-show, tour is still reachable via the Help button
    }
  }, [])

  function closeTour() {
    setShowTour(false)
    try {
      localStorage.setItem(TOUR_SEEN_KEY, '1')
    } catch {
      // ignore — tour will just reappear via auto-show logic if it can't persist
    }
  }

  function startTour() {
    setShowTour(true)
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
      setPhase('results')
    } catch (err) {
      setAnalysisError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong while analyzing your roof. Please try again.',
      )
      setPhase('wizard')
      setWizardStep(2)
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
  }

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-edge bg-surface/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={restart}
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            aria-label="Helio home"
          >
            <Logo className="h-9 sm:h-10" />
            <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider hidden sm:inline pl-1.5 border-l border-edge/70 leading-tight self-center">
              Rooftop<br />Solar Advisor
            </span>
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={startTour}
            className="text-xs font-semibold text-ink-muted hover:text-helio transition-colors mr-1"
            title="Take the tour again"
          >
            ⓘ Help
          </button>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>
      </header>

      <main className="py-8">
        {phase === 'landing' && <LandingPage onStart={() => setPhase('wizard')} onTakeTour={startTour} />}

        {phase === 'wizard' && (
          <>
            <Stepper steps={STEPS} currentStep={wizardStep} />
            {analysisError && (
              <div className="max-w-2xl mx-auto px-4 mb-4">
                <ErrorBanner message={analysisError} />
              </div>
            )}
            {wizardStep === 0 && (
              <LocationPage
                selected={location}
                onSelect={setLocation}
                onNext={() => setWizardStep(1)}
                onBack={restart}
              />
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
              />
            )}
          </>
        )}

        {phase === 'analyzing' && (
          <>
            <Stepper steps={STEPS} currentStep={3} />
            <AnalyzingLoader
              hasLocation={!!location}
              hasRoof={!!roofAreaSqft}
              hasElectricity={!!(unitsKwh || billInr)}
            />
          </>
        )}

        {phase === 'results' && analysis && (
          <>
            <Stepper steps={STEPS} currentStep={3} />
            <ResultsPage analysis={analysis} onBack={() => { setPhase('wizard'); setWizardStep(2) }} onRestart={restart} />
          </>
        )}
      </main>

      {showTour && <OnboardingTour onClose={closeTour} />}
    </div>
  )
}
