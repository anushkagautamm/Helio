import { useId, useState } from 'react'
import Icon from './Icon'

interface ExpandableSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  /** Controlled mode: when provided (with onOpenChange), the section no longer manages its own state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  sectionId?: string
}

/** A quiet disclosure row — stack several inside a hairline-divided list. */
export default function ExpandableSection({
  title,
  children,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  sectionId,
}: ExpandableSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const id = useId()

  function toggle() {
    const next = !open
    if (isControlled) onOpenChange?.(next)
    else setInternalOpen(next)
  }

  return (
    <div id={sectionId} className="scroll-mt-24">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        className="group w-full py-6 flex items-center justify-between gap-6 text-left"
      >
        <span className="font-serif text-xl sm:text-2xl text-dossier-charcoal">{title}</span>
        <span
          className={`w-8 h-8 shrink-0 flex items-center justify-center border border-dossier-border text-dossier-secondary group-hover:border-dossier-charcoal group-hover:text-dossier-charcoal transition-all ${
            open ? 'rotate-180' : ''
          }`}
        >
          <Icon name="expand_more" className="!text-[20px]" />
        </span>
      </button>
      {open && (
        <div id={id} className="pb-10 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}
