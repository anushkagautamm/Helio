import { useId, useState } from 'react'

interface ExpandableSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  /** Controlled mode: when provided (with onOpenChange), the section no longer manages its own state. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  sectionId?: string
}

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
    <div id={sectionId} className="border border-edge rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={id}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-surface2 hover:bg-surface2/70 transition-colors"
      >
        <span className="text-sm font-semibold text-ink">{title}</span>
        <span className={`text-ink-muted transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} aria-hidden="true">
          ⌄
        </span>
      </button>
      {open && (
        <div id={id} className="px-4 py-4 bg-surface text-sm text-ink-muted space-y-2">
          {children}
        </div>
      )}
    </div>
  )
}
