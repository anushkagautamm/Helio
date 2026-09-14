import { useId, useState } from 'react'
import { GLOSSARY } from '../utils/glossary'

interface InfoTooltipProps {
  term: string
  children: React.ReactNode
}

/**
 * "ⓘ What does this mean?" — an inline, tap-or-click-friendly explainer for a
 * technical term. Deliberately click-toggled (not hover-only) so it works on
 * touch devices, per accessibility guidance.
 */
export default function InfoTooltip({ term, children }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        aria-label={`What does ${term} mean?`}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-surface2 text-ink-muted text-[10px] font-bold hover:bg-helio-light hover:text-helio-dark transition-colors align-middle ml-1"
      >
        i
      </button>
      {open && (
        <>
          <span
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <span
            id={id}
            role="tooltip"
            className="absolute z-40 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 rounded-xl border border-edge bg-surface shadow-card p-3.5 text-left"
          >
            <span className="block text-xs font-semibold text-ink mb-1">What is {term}?</span>
            <span className="block text-xs text-ink-muted leading-relaxed">{children}</span>
          </span>
        </>
      )}
    </span>
  )
}

/** Convenience wrapper for terms already defined in the shared glossary. */
export function GlossaryTerm({ term, label }: { term: keyof typeof GLOSSARY; label: string }) {
  return <InfoTooltip term={label}>{GLOSSARY[term]}</InfoTooltip>
}
