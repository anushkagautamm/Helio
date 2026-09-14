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
      className="rounded-xl px-4 py-3.5 text-sm border"
      style={{
        background: 'rgb(var(--c-sun-light))',
        borderColor: 'rgb(var(--c-sun) / 0.35)',
      }}
    >
      <div className="flex items-start gap-2.5">
        <span aria-hidden="true" className="mt-0.5">⚠️</span>
        <div className="flex-1">
          {title && <p className="font-semibold text-ink mb-0.5">{title}</p>}
          <p className="text-ink-muted">{message}</p>
          {(onRetry || actions) && (
            <div className="flex flex-wrap gap-2 mt-2.5">
              {onRetry && (
                <button onClick={onRetry} className="btn-ghost">
                  Try again
                </button>
              )}
              {actions?.map((a) => (
                <button key={a.label} onClick={a.onClick} className="btn-ghost">
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
