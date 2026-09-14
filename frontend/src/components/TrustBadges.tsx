const BADGES = [
  { icon: '🛰️', title: 'Open Data', body: 'NASA POWER + OpenStreetMap' },
  { icon: '⚡', title: 'No Account', body: 'Start immediately, no sign-up' },
  { icon: '🔒', title: 'Private By Design', body: "Bills aren't permanently stored" },
  { icon: '🔍', title: 'Transparent', body: 'Every number has an explainable formula' },
]

export default function TrustBadges() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {BADGES.map((b) => (
        <div key={b.title} className="card py-4 sm:py-5 text-center">
          <div className="text-2xl mb-2" aria-hidden="true">
            {b.icon}
          </div>
          <p className="font-display font-bold text-xs tracking-wide text-ink uppercase">{b.title}</p>
          <p className="text-xs text-ink-muted mt-1 leading-snug">{b.body}</p>
        </div>
      ))}
    </div>
  )
}
