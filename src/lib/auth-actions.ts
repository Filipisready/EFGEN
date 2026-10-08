'use server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { safeNext } from '@/lib/auth'

export type FormState = { error?: string; ok?: string }

const email = z.string().trim().toLowerCase().email('Zadejte platný e-mail.')
const password = z.string().min(8, 'Heslo musí mít alespoň 8 znaků.').max(72, 'Heslo je příliš dlouhé.')

async function origin() {
  const h = await headers()
  return h.get('origin') ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

function czError(message: string, code?: string) {
  const m = message.toLowerCase()
  if (code === 'over_email_send_rate_limit' || m.includes('email rate limit')) return 'Bylo odesláno příliš mnoho e-mailů. Zkuste to za hodinu.'
  if (code === 'email_address_invalid' || m.includes('email address') && m.includes('invalid')) return 'Tato e-mailová adresa není platná nebo ji nelze použít.'
  if (code === 'signup_disabled') return 'Registrace je dočasně vypnutá.'
  if (code === 'weak_password' || m.includes('password should')) return 'Heslo je příliš slabé. Použijte alespoň 8 znaků včetně písmen a číslic.'
  if (code === 'unexpected_failure' || m.includes('error sending') || m.includes('smtp')) return 'Nepodařilo se odeslat ověřovací e-mail. Zkuste to prosím později.'
  if (m.includes('invalid login')) return 'Nesprávný e-mail nebo heslo.'
  if (m.includes('email not confirmed')) return 'E-mail ještě není ověřený. Zkontrolujte schránku.'
  if (m.includes('rate limit') || m.includes('too many')) return 'Příliš mnoho pokusů. Zkuste to za chvíli.'
  if (m.includes('same password') || m.includes('different from the old')) return 'Nové heslo musí být jiné než staré.'
  return `Něco se nepovedlo. Zkuste to prosím znovu.${code ? ` (kód: ${code})` : ''}`
}

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ email, password: z.string().min(1, 'Zadejte heslo.') })
    .safeParse({ email: fd.get('email'), password: fd.get('password') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: czError(error.message) }
  redirect(safeNext(fd.get('next')))
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = z.object({ email, password }).safeParse({ email: fd.get('email'), password: fd.get('password') })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  if (fd.get('consent') !== 'on') return { error: 'Pro registraci je nutný souhlas se zásadami ochrany soukromí.' }
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    ...parsed.data,
    options: { emailRedirectTo: `${await origin()}/auth/potvrzeni?next=/app` },
  })
  if (error) {
    console.error('[register] signUp selhalo:', error.status, error.code, error.message)
    return { error: czError(error.message, error.code) }
  }
  // Stejná odpověď i pro již registrovaný e-mail (nevyzrazujeme, kdo účet má).
  return { ok: 'Hotovo. Poslali jsme vám e-mail s odkazem pro ověření adresy. Po jeho potvrzení se můžete přihlásit.' }
}

export async function forgotPassword(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = email.safeParse(fd.get('email'))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await origin()}/auth/potvrzeni?next=/nove-heslo`,
  })
  return { ok: 'Pokud je tento e-mail registrovaný, poslali jsme na něj odkaz pro nastavení nového hesla.' }
}

export async function setNewPassword(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = password.safeParse(fd.get('password'))
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  if (fd.get('password') !== fd.get('password2')) return { error: 'Hesla se neshodují.' }
  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data })
  if (error) return { error: czError(error.message) }
  redirect('/app')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
