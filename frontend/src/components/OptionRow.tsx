import Icon, { type IconName } from './Icon'

interface OptionRowProps {
  icon: IconName
  title: string
  description: string
  onClick: () => void
  /** Pass a boolean to make the row an expander; omit for a plain action row. */
  expanded?: boolean
  disabled?: boolean
  trailing?: React.ReactNode
  children?: React.ReactNode
}

/** One choice in a wizard step — stack several inside a hairline-divided list. */
export default function OptionRow({ icon, title, description, onClick, expanded, disabled, trailing, children }: OptionRowProps) {
  const expandable = expanded !== undefined

  return (
    <div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-expanded={expandable ? expanded : undefined}
        className="group w-full py-5 flex items-center gap-4 text-left disabled:cursor-wait"
      >
        <span
          className={`w-10 h-10 shrink-0 flex items-center justify-center border transition-colors ${
            expanded
              ? 'border-dossier-charcoal bg-dossier-charcoal text-white'
              : 'border-dossier-border text-dossier-secondary group-hover:border-dossier-charcoal group-hover:text-dossier-charcoal'
          }`}
        >
          <Icon name={icon} className="!text-[20px]" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-base font-medium text-dossier-charcoal">{title}</span>
          <span className="block text-sm text-dossier-secondary mt-0.5">{description}</span>
        </span>
        {trailing ?? (
          <Icon
            name={expandable ? 'expand_more' : 'arrow_forward'}
            className={`!text-[20px] shrink-0 text-dossier-tertiary group-hover:text-dossier-charcoal transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>
      {expanded && children && <div className="pb-6 sm:pl-14 animate-fade-in">{children}</div>}
    </div>
  )
}
