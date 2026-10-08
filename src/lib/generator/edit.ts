import { recompute } from './recompute'
import type { GeneratedWorkout, TemplateParams, WorkoutExercise } from './types'

/** Čisté funkce pro ruční úpravy tréninku (PRD FR-33 až FR-36). Každá vrací nový, přepočtený trénink. */

const withBlock = (w: GeneratedWorkout, bi: number, fn: (ex: WorkoutExercise[]) => WorkoutExercise[]) =>
  recompute({ ...w, blocks: w.blocks.map((b, i) => (i === bi ? { ...b, exercises: fn(b.exercises) } : b)) })

export const moveExercise = (w: GeneratedWorkout, bi: number, ei: number, dir: -1 | 1) =>
  withBlock(w, bi, (ex) => {
    const j = ei + dir
    if (j < 0 || j >= ex.length) return ex
    const next = [...ex]
    ;[next[ei], next[j]] = [next[j], next[ei]]
    return next
  })

export const removeExercise = (w: GeneratedWorkout, bi: number, ei: number) =>
  withBlock(w, bi, (ex) => ex.filter((_, i) => i !== ei))

export const replaceExercise = (w: GeneratedWorkout, bi: number, ei: number, repl: WorkoutExercise) =>
  withBlock(w, bi, (ex) => ex.map((e, i) => (i === ei ? { ...repl, userNote: e.userNote } : e)))

export const addExercise = (w: GeneratedWorkout, bi: number, add: WorkoutExercise) =>
  withBlock(w, bi, (ex) => (ex.some((e) => e.id === add.id) ? ex : [...ex, add]))

export const setExerciseNote = (w: GeneratedWorkout, bi: number, ei: number, note: string) =>
  withBlock(w, bi, (ex) => ex.map((e, i) => (i === ei ? { ...e, userNote: note.trim() ? note : undefined } : e)))

/** Délku bloku lze měnit u rozcvičky, zklidnění a částí CrossFitu. U Tabaty a TRX vyplývá z parametrů a počtu cviků. */
export const setBlockMinutes = (w: GeneratedWorkout, bi: number, minutes: number) =>
  recompute({ ...w, blocks: w.blocks.map((b, i) => (i === bi && minutes >= 0 ? { ...b, minutes } : b)) })

export const setParams = (w: GeneratedWorkout, p: TemplateParams) => {
  const params = { ...w.params }
  for (const [k, v] of Object.entries(p)) if (typeof v === 'number' && v >= 0) (params as Record<string, number>)[k] = v
  return recompute({ ...w, params })
}
