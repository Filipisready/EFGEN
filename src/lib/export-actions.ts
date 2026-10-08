'use server'
import { Resend } from 'resend'
import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderWorkoutPdf } from '@/lib/export/workout-pdf'
import { buildEmail } from '@/lib/export/email'
import { workoutSchema } from '@/lib/export/workout-schema'
import type { GeneratedWorkout } from '@/lib/generator/types'

export type EmailResult = { ok: true; message: string } | { ok: false; error: string }

const LIMIT = Math.max(1, Number(process.env.EMAIL_DAILY_LIMIT) || 5)
/** Odesílatel z prostředí. Odstraní okolní uvozovky a mezery (Vercel bere hodnoty doslova). */
const mailFrom = () => (process.env.MAIL_FROM ?? '').trim().replace(/^["']|["']$/g, '').trim() || 'EFGEN <trenink@efgen.pro>'
/** Číslovka + správný tvar slova „e-mail“ (1 e-mail, 2 až 4 e-maily, jinak e-mailů). */
const emailu = (n: number) => `${n} ${n === 1 ? 'e-mail' : n >= 2 && n <= 4 ? 'e-maily' : 'e-mailů'}`
const DAY_MS = 24 * 60 * 60 * 1000
const fmt = (d: Date) => d.toLocaleString('cs-CZ', { timeZone: 'Europe/Prague', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'trenink'

/**
 * Odešle trénink na e-mail přihlášeného, ověřeného uživatele (PRD FR-52 až FR-54).
 * Cílová adresa se nikdy nebere z formuláře. Limit: EMAIL_DAILY_LIMIT e-mailů za 24 hodin.
 */
export async function emailWorkoutAction(raw: unknown): Promise<EmailResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Nejste přihlášeni.' }
  if (!session.user.email_confirmed_at) return { ok: false, error: 'Nejdřív ověřte svůj e-mail.' }
  const parsed = workoutSchema.safeParse(raw)
  if (!parsed.success) return { ok: false, error: 'Trénink se nepodařilo zpracovat.' }
  const w = parsed.data as GeneratedWorkout
  if (!process.env.RESEND_API_KEY) return { ok: false, error: 'Odesílání e-mailů není nastavené.' }

  const db = createAdminClient()
  const uid = session.profile.id
  const since = new Date(Date.now() - DAY_MS).toISOString()
  const recent = async () => db.from('email_log').select('id,sent_at').eq('user_id', uid).eq('kind', 'workout').gte('sent_at', since).order('sent_at')

  const before = await recent()
  if (before.error) return { ok: false, error: 'Odeslání se nepovedlo. Zkuste to později.' }
  const limitMsg = (rows: { sent_at: string }[]) =>
    `Dnes jste už poslali ${emailu(LIMIT)}. Další můžete poslat po ${fmt(new Date(new Date(rows[0].sent_at).getTime() + DAY_MS))}.`
  if (before.data.length >= LIMIT) return { ok: false, error: limitMsg(before.data) }

  // Nejdřív rezervujeme místo v limitu, aby souběžné požadavky limit nepřekročily.
  const ins = await db.from('email_log').insert({ user_id: uid, kind: 'workout' }).select('id').single()
  if (ins.error) return { ok: false, error: 'Odeslání se nepovedlo. Zkuste to později.' }
  const after = await recent()
  if (!after.error && after.data.length > LIMIT) {
    await db.from('email_log').delete().eq('id', ins.data.id)
    return { ok: false, error: limitMsg(after.data) }
  }

  let stage: 'pdf' | 'send' = 'pdf'
  try {
    const pdf = await renderWorkoutPdf(w)
    stage = 'send'
    const { subject, html, text } = buildEmail(w)
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: mailFrom(),
      to: session.profile.email,
      subject, html, text,
      attachments: [{ filename: `efgen-${slug(w.title)}.pdf`, content: pdf }],
    })
    if (error) throw new Error(`${error.name ?? 'resend'}: ${error.message}`)
  } catch (e) {
    console.error(`[email] selhalo (${stage}):`, e)
    await db.from('email_log').delete().eq('id', ins.data.id) // neúspěšné odeslání se do limitu nepočítá
    const detail = e instanceof Error ? e.message.slice(0, 200) : 'neznámá chyba'
    return {
      ok: false,
      error: stage === 'pdf'
        ? `Nepodařilo se vytvořit PDF pro přílohu (${detail}).`
        : `E-mail se nepodařilo odeslat (${detail}).`,
    }
  }
  const left = Math.max(0, LIMIT - (after.data?.length ?? LIMIT))
  return {
    ok: true,
    message: left > 0
      ? `Odesláno na ${session.profile.email}. Dnes můžete poslat ještě ${emailu(left)}.`
      : `Odesláno na ${session.profile.email}. Dnešní limit je vyčerpaný, další e-mail půjde poslat za 24 hodin od prvního odeslání.`,
  }
}
