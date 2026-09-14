/** Suspense fallback for lazy-loaded sections (map, chart) — mirrors AnalyzingLoader's spinner. */
export default function SectionLoader({
  heightClass = 'h-64',
  label = 'Loading…',
}: {
  heightClass?: string
  label?: string
}) {
  return (
    <div
      className={`${heightClass} w-full rounded-2xl border border-edge bg-surface2 flex items-center justify-center gap-2.5`}
      role="status"
      aria-live="polite"
    >
      <span className="w-5 h-5 rounded-full border-2 border-helio-light border-t-helio animate-spin shrink-0" aria-hidden="true" />
      <span className="text-sm text-ink-muted">{label}</span>
    </div>
  )
}
