import { getSession } from '@/lib/auth'
import { renderWorkoutPdf } from '@/lib/export/workout-pdf'
import { workoutSchema } from '@/lib/export/workout-schema'
import type { GeneratedWorkout } from '@/lib/generator/types'

export const runtime = 'nodejs'

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'trenink'

export async function POST(req: Request) {
  if (!(await getSession())) return new Response('Nepřihlášen.', { status: 401 })
  const parsed = workoutSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return new Response('Neplatný trénink.', { status: 400 })
  const w = parsed.data as GeneratedWorkout
  const pdf = await renderWorkoutPdf(w)
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="efgen-${slug(w.title)}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}
