import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { btnCls, btn2Cls } from '@/components/ui'

export default async function Home() {
  const s = await getSession()
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center gap-5 px-4">
      <h1 className="text-5xl font-bold tracking-tight">EFGEN</h1>
      <p className="text-lg text-neutral-600 dark:text-neutral-400">Generátor skupinových tréninků pro trenéry: Tabata, TRX a CrossFit. Aplikace je ve výstavbě.</p>
      <div className="flex flex-wrap gap-3">
        {s ? <Link href="/app" className={btnCls}>Do aplikace</Link> : (
          <>
            <Link href="/prihlaseni" className={btnCls}>Přihlásit se</Link>
            <Link href="/registrace" className={btn2Cls}>Registrace</Link>
          </>
        )}
      </div>
    </main>
  )
}
