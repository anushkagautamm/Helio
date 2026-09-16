/** Opener for each wizard step: small step label, serif question, one-line lede. */
export default function PageHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-10">
      <p className="text-xs font-mono uppercase tracking-wider text-dossier-ochre mb-3">{eyebrow}</p>
      <h1 className="font-serif text-4xl sm:text-5xl leading-[1.08] tracking-tight text-dossier-charcoal">{title}</h1>
      {children && <p className="mt-4 text-base text-dossier-secondary leading-relaxed max-w-xl">{children}</p>}
    </div>
  )
}
