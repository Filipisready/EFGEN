import Link from 'next/link'
import { btnCls } from '@/components/ui'

export const metadata = { title: 'Stránka nenalezena · EFGEN' }

export default function NotFound() {
  return (
    <main id="obsah" className="mx-auto flex min-h-[55vh] w-full max-w-md flex-col items-start justify-center gap-4 px-4">
      <p className="tnum text-6xl font-extrabold tracking-tight">404</p>
      <h1 className="text-2xl font-bold">Tuhle stránku jsme nenašli.</h1>
      <p className="text-muted">Odkaz může být zastaralý nebo stránka už neexistuje.</p>
      <Link href="/" className={btnCls}>Zpět na úvod</Link>
    </main>
  )
}
