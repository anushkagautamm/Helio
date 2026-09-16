import Icon from '../components/Icon'
import RoofSketch from '../components/RoofSketch'

interface LandingPageProps {
  onStart: () => void
  onTakeTour: () => void
}

const STEPS = [
  { title: 'Locate your home', body: 'Use your current location or enter coordinates.' },
  { title: 'Size your roof', body: 'Pick a typical size, walk it with GPS, or type the area.' },
  { title: 'Add your usage', body: 'Upload a bill photo or enter units — optional.' },
  { title: 'Get your report', body: 'Cost, subsidy, savings, payback and CO₂, with the working shown.' },
]

export default function LandingPage({ onStart, onTakeTour }: LandingPageProps) {
  return (
    <div>
      <div className="grid lg:grid-cols-12 gap-10 items-center">
        <section className="lg:col-span-7 sm:pt-6">
          <p className="text-xs font-mono uppercase tracking-wider text-dossier-ochre mb-5">Rooftop solar for Indian homes</p>
          <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.04] tracking-tight text-dossier-charcoal">
            Is rooftop solar <span className="italic text-dossier-forest">worth it</span> for your home?
          </h1>
          <p className="mt-7 text-lg text-dossier-secondary leading-relaxed max-w-xl">
            See what your roof can generate, what it costs after the PM Surya Ghar subsidy, and how quickly it pays for
            itself.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
            <button type="button" onClick={onStart} className="btn-primary !px-7 !py-4">
              Check my roof <Icon name="arrow_forward" className="!text-[16px]" />
            </button>
            <button
              type="button"
              onClick={onTakeTour}
              className="text-sm text-dossier-secondary hover:text-dossier-charcoal underline underline-offset-4 decoration-dossier-border hover:decoration-dossier-charcoal transition-colors"
            >
              Take a quick tour
            </button>
          </div>
          <p className="mt-8 text-sm text-dossier-tertiary">No account · Nothing stored · Uses NASA solar data</p>
        </section>

        <RoofSketch className="hidden lg:block lg:col-span-5 w-full max-w-lg justify-self-end" />
      </div>

      <section className="mt-28 sm:mt-36 border-t border-dossier-border pt-10">
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-10">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <span className="font-serif text-3xl text-dossier-tertiary">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 text-base font-medium text-dossier-charcoal">{step.title}</h3>
              <p className="mt-1.5 text-sm text-dossier-secondary leading-relaxed">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
