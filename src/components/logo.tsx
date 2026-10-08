import Link from 'next/link'

/** Značka EFGEN: limetkový čtverec se zaobleným „E“ a textové logo. */
export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <rect width="64" height="64" rx="16" fill="var(--accent)" />
      <path d="M21 17h24M21 32h18M21 47h24M21 17v30" fill="none" stroke="var(--accent-ink)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Logo({ href = '/', size = 32 }: { href?: string; size?: number }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 rounded-lg" aria-label="EFGEN, úvodní stránka">
      <LogoMark size={size} />
      <span className="text-xl font-extrabold tracking-tight">EFGEN</span>
    </Link>
  )
}
