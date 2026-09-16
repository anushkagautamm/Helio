/** Suspense fallback for lazy-loaded sections (e.g. the map). */
export default function SectionLoader({
  heightClass = 'h-64',
  label = 'Loading…',
}: {
  heightClass?: string
  label?: string
}) {
  return (
    <div
      className={`${heightClass} w-full border border-dossier-border bg-dossier-muted/50 flex items-center justify-center gap-2.5`}
      role="status"
      aria-live="polite"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-dossier-ochre animate-pulse" aria-hidden="true" />
      <span className="text-[11px] font-mono uppercase tracking-wider text-dossier-tertiary">{label}</span>
    </div>
  )
}
