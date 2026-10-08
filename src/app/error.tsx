'use client'
import { useEffect } from 'react'
import { btnCls } from '@/components/ui'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])
  return (
    <main id="obsah" className="mx-auto flex min-h-[55vh] w-full max-w-md flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-2xl font-bold">Něco se pokazilo.</h1>
      <p className="text-muted">Omlouváme se, stránku se nepodařilo zobrazit. Zkuste to prosím znovu. Pokud potíže přetrvají, napište na sulc.filip@gmail.com.</p>
      {error.digest && <p className="text-xs text-muted">Kód chyby: {error.digest}</p>}
      <button onClick={reset} className={btnCls}>Zkusit znovu</button>
    </main>
  )
}
