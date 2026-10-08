'use client'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { saveWorkoutAction } from '@/lib/workout-actions'
import type { GeneratedWorkout } from '@/lib/generator/types'
import { Alert, btnCls, btn2Cls } from '@/components/ui'

/** Uložení do historie. Bez `savedId` vytvoří nový záznam, s ním přepíše uložený trénink. */
export function SaveBar({ workout, savedId, unsaved, onSaved }: { workout: GeneratedWorkout; savedId: string | null; unsaved: boolean; onSaved: (id: string) => void }) {
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    setError(null)
    start(async () => {
      const r = await saveWorkoutAction(workout, savedId ?? undefined)
      if (r.ok) onSaved(r.id); else setError(r.error)
    })
  }
  const saved = savedId && !unsaved
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={save} disabled={pending || !!saved} className={saved ? btn2Cls : btnCls}>
          {pending ? 'Ukládám…' : saved ? 'Uloženo ✓' : savedId ? 'Uložit změny' : 'Uložit do historie'}
        </button>
        {savedId && <Link href={`/app/historie/${savedId}`} className="text-sm underline">Otevřít v historii</Link>}
      </div>
      {error && <Alert>{error}</Alert>}
    </div>
  )
}
