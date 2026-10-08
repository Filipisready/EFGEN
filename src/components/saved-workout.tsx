'use client'
import { useState } from 'react'
import type { GeneratedWorkout } from '@/lib/generator/types'
import { WorkoutEditor } from '@/components/workout-editor'
import { ExportBar } from '@/components/export-bar'
import { SaveBar } from '@/components/save-bar'

/** Uložený trénink v editoru: úpravy, uložení změn a export. */
export function SavedWorkout({ id, initial }: { id: string; initial: GeneratedWorkout }) {
  const [w, setW] = useState(initial)
  const [unsaved, setUnsaved] = useState(false)
  return (
    <div className="space-y-3">
      <WorkoutEditor workout={w} onChange={(n) => { setW(n); setUnsaved(true) }} />
      <SaveBar workout={w} savedId={id} unsaved={unsaved} onSaved={() => setUnsaved(false)} />
      <ExportBar workout={w} />
    </div>
  )
}
