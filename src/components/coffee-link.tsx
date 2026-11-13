import { COFFEE_URL } from '@/lib/site'

/** Decentní ikona kávy s odkazem na dobrovolný příspěvek (Buy me a coffee). Bez odkazu se nezobrazí. */
export function CoffeeLink({ className = '' }: { className?: string }) {
  if (!COFFEE_URL) return null
  return (
    <a
      href={COFFEE_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Podpořit autora kávou"
      aria-label="Podpořit autora kávou (otevře se v novém okně)"
      className={`inline-flex size-10 items-center justify-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-ink ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-5" aria-hidden="true">
        <path d="M4 9h12v5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V9Z" />
        <path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16" />
        <path d="M7.5 3.5c0 1 1 1.2 1 2.2M11 3.5c0 1 1 1.2 1 2.2" />
      </svg>
    </a>
  )
}
