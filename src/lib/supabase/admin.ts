import 'server-only'
import { createClient } from '@supabase/supabase-js'

/** Klient s plnými právy (service role). Jen na serveru, nikdy v kódu běžícím v prohlížeči. */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
