import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Denní „probuzení“ databáze. Bezplatné projekty Supabase se po týdnu bez aktivity uspí a web přestane fungovat.
 * Volá ho plánovač Vercelu (vercel.json). Pokud je nastavená proměnná CRON_SECRET, Vercel ji posílá v hlavičce
 * a bez ní se požadavek odmítne.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) return new Response('Nepovoleno.', { status: 401 })
  const { error } = await createAdminClient().from('app_settings').select('key').limit(1)
  if (error) {
    console.error('[keepalive] dotaz na databázi selhal:', error.message)
    return Response.json({ ok: false }, { status: 500 })
  }
  return Response.json({ ok: true, at: new Date().toISOString() })
}
