import HeroIllustration from '../components/HeroIllustration'
import TrustBadges from '../components/TrustBadges'

interface LandingPageProps {
  onStart: () => void
  onTakeTour: () => void
}

export default function LandingPage({ onStart, onTakeTour }: LandingPageProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div className="grid lg:grid-cols-2 gap-10 lg:gap-6 items-center">
        <div className="animate-fade-up">
          <span className="pill bg-helio-light text-helio-dark border border-helio/20 mb-5">
            Rooftop Solar, Made Transparent
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-ink leading-[1.08] mb-5">
            Is rooftop solar <span className="text-helio">worth it</span> for your home?
          </h1>
          <p className="text-ink-muted text-lg mb-8 max-w-lg leading-relaxed">
            Understand your roof, solar potential, savings and environmental impact — in one
            guided assessment using transparent assumptions and open data.
          </p>
          <div className="flex flex-wrap items-center gap-4 mb-10">
            <button onClick={onStart} className="btn-primary text-base px-7 py-3.5">
              Check My Solar Potential →
            </button>
            <button onClick={onTakeTour} className="btn-ghost text-base">
              Take a Tour
            </button>
          </div>
          <TrustBadges />
        </div>

        <div className="relative h-64 sm:h-80 lg:h-[26rem] order-first lg:order-last">
          <HeroIllustration />
        </div>
      </div>

      <div id="how-it-works" className="mt-20 sm:mt-28">
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink text-center mb-3">
          How Helio Works
        </h2>
        <p className="text-ink-muted text-center max-w-xl mx-auto mb-10">
          Four quick steps, each building on transparent open data and formulas you can inspect.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { n: '01', t: 'Location', d: 'Use your current location, or enter coordinates manually.' },
            { n: '02', t: 'Roof', d: 'Pick a quick estimate, walk your roof with GPS, or enter your exact size.' },
            { n: '03', t: 'Energy', d: "Upload a bill photo and we'll try to read it, or enter your usage yourself." },
            { n: '04', t: 'Results', d: 'Get a full feasibility report: sizing, cost, subsidy, savings, impact.' },
          ].map((step) => (
            <div key={step.n} className="card">
              <span className="font-display text-2xl font-extrabold text-sun">{step.n}</span>
              <h3 className="font-display font-bold text-ink mt-1 mb-1.5">{step.t}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{step.d}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-ink-faint text-center mt-16 mb-4 max-w-2xl mx-auto leading-relaxed">
        Helio provides planning-level estimates only and is not an official government portal.
        Always verify subsidy eligibility and consult a certified installer before deciding.
      </p>
    </div>
  )
}
