# EFGEN (efgen.pro)

Webová aplikace pro sestavování skupinových tréninků (Tabata, TRX, CrossFit). Specifikace: `docs/PRD_efgen_pro_v2.2.docx`.

Stack: Next.js (TypeScript) · Supabase (PostgreSQL + Auth) · Vercel · Resend.

## Lokální spuštění
1. `cp .env.example .env.local` a vyplňte klíče ze Supabase a Resend.
2. V Supabase (SQL Editor) spusťte `supabase/migrations/0001_init.sql`.
3. `npm run dev` → http://localhost:3000
4. Import knihovny: `npx tsx --env-file=.env.local scripts/import-exercises.ts`

Pozn.: pokud `npm` hlásí chybu oprávnění k cache, použijte `npm install --cache /tmp/npmcache`.
