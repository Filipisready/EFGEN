import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { btnCls } from '@/components/ui'

const FEATURES = [
  { t: 'Tabata, TRX a CrossFit', d: 'Hotová časová struktura pro každý formát. U CrossFitu zkombinujete třeba AMRAP 20 min a EMOM 10 min.' },
  { t: 'Cviky podle vašeho vybavení', d: 'Zaškrtnete pomůcky, prostředí a úroveň skupiny. Aplikace vybere jen to, co dává smysl.' },
  { t: 'Upravte, uložte, pošlete', d: 'Vyměňte cvik, přidejte poznámku a trénink si stáhněte jako PDF, obrázek nebo pošlete e-mailem.' },
]

export default async function Home() {
  const s = await getSession()
  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-8 pt-6 sm:pt-14">
      <section className="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold">Pro trenéry skupinových lekcí</p>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">Skupinový trénink na míru. Za pár sekund.</h1>
          <p className="max-w-xl text-lg text-muted">Zadejte úroveň, vybavení a časy. EFGEN sestaví rozcvičku, hlavní část i zklidnění a vy si ho doladíte.</p>
          <div className="flex flex-wrap gap-3">
            <Link href={s ? '/app/novy' : '/registrace'} className={btnCls}>{s ? 'Nový trénink' : 'Vyzkoušet zdarma'}</Link>
          </div>
        </div>

        {/* Ukázka výstupu, ať je hned vidět, co aplikace vyrobí. */}
        <div aria-hidden="true" className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Ukázka</p>
          <p className="mt-1 text-xl font-bold">CrossFit AMRAP + EMOM</p>
          <p className="text-sm text-muted tnum">celkem 40 min · 14 osob</p>
          <div className="mt-4 space-y-3">
            {[['Thruster s činkami', '10×'], ['Švih s kettlebellem', '15×'], ['Přeskok bedny', '10×']].map(([n, v], i) => (
              <div key={n} className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-bg tnum">{i + 1}</span>
                <span className="flex-1 font-semibold">{n}</span>
                <span className="rounded-md bg-surface-2 px-2 py-0.5 text-sm font-bold tnum">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-accent-ink tnum">AMRAP 20 min · co nejvíc kol</div>
        </div>
      </section>

      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.t} className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="text-lg font-bold">{f.t}</h2>
            <p className="mt-1.5 text-muted">{f.d}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
