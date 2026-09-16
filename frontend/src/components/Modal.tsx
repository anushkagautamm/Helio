import { useEffect } from 'react'
import Icon from './Icon'

interface ModalProps {
  title: string
  /** Small mono line above the title. */
  label?: string
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ title, label, onClose, children }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dossier-charcoal/30 backdrop-blur-[2px] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-dossier-surface border border-dossier-border shadow-modal max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-dossier-border-subtle">
          <div>
            {label && <span className="label-mono mb-1">{label}</span>}
            <h3 className="font-serif text-2xl text-dossier-charcoal">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 -mr-2 flex items-center justify-center text-dossier-secondary hover:text-dossier-charcoal transition-colors"
          >
            <Icon name="close" className="!text-[20px]" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
