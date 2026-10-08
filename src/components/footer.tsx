import Link from 'next/link'

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line px-4 py-6 text-sm text-muted">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <span>© EFGEN · efgen.pro</span>
        <Link href="/zasady-ochrany-soukromi" className="underline underline-offset-2 hover:text-ink">Zásady ochrany soukromí</Link>
      </div>
    </footer>
  )
}
