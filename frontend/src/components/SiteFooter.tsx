export default function SiteFooter() {
  return (
    <footer className="border-t border-dossier-border/70">
      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-dossier-tertiary">
        <p>Helio · Rooftop solar feasibility estimates for Indian homes.</p>
        <div className="flex gap-6">
          <a className="hover:text-dossier-charcoal transition-colors" href="https://pmsuryaghar.gov.in" target="_blank" rel="noreferrer">
            PM Surya Ghar portal
          </a>
          <a className="hover:text-dossier-charcoal transition-colors" href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer">
            NASA POWER data
          </a>
        </div>
      </div>
    </footer>
  )
}
