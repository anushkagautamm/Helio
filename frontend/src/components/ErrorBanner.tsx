import Icon from './Icon'

interface ErrorBannerProps {
  title?: string
  message: string
  onRetry?: () => void
  actions?: { label: string; onClick: () => void }[]
}

export default function ErrorBanner({ title, message, onRetry, actions }: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="p-4 bg-dossier-ochre-light border border-dossier-border border-l-2 border-l-dossier-ochre flex items-start gap-3.5 text-xs leading-relaxed"
    >
      <Icon name="warning" className="!text-[18px] text-dossier-ochre shrink-0 mt-px" />
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-medium text-dossier-charcoal mb-0.5">{title}</p>}
        <p className="text-dossier-secondary">{message}</p>
        {(onRetry || actions) && (
          <div className="flex flex-wrap gap-4 mt-2.5">
            {onRetry && (
              <button type="button" onClick={onRetry} className="btn-link text-dossier-charcoal">
                Try again
              </button>
            )}
            {actions?.map((a) => (
              <button key={a.label} type="button" onClick={a.onClick} className="btn-link text-dossier-charcoal">
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
