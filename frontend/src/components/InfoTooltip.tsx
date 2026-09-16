import { useId, useState } from 'react'
import { GLOSSARY } from '../utils/glossary'

interface InfoTooltipProps {
  term: string
  children: React.ReactNode
}

/**
 * "What does this mean?" — an inline, tap-or-click-friendly explainer for a
 * technical term. Deliberately click-toggled (not hover-only) so it works on
 * touch devices, per accessibility guidance.
 */
export default function InfoTooltip({ term, children }: InfoTooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <span className="relative inline-block align-middle normal-case tracking-normal">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        aria-label={`What does ${term} mean?`}
        className="inline-flex items-center justify-center w-3.5 h-3.5 ml-1 border border-dossier-border text-[9px] font-mono font-semibold leading-none text-dossier-tertiary hover:border-dossier-charcoal hover:text-dossier-charcoal transition-colors"
      >
        i
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} aria-hidden="true" />
          <span
            id={id}
            role="tooltip"
            className="absolute z-40 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 border border-dossier-border bg-dossier-surface shadow-float p-3.5 text-left"
          >
            <span className="block text-[11px] font-mono uppercase tracking-wider text-dossier-ochre mb-1.5">{term}</span>
            <span className="block text-xs font-sans text-dossier-secondary leading-relaxed">{children}</span>
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
