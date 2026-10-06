// Import knihovny z docs/cviky_import.xlsx do databáze (list Cviky + Pomucky).
// Použití: npx tsx --env-file=.env.local scripts/import-exercises.ts
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
if (!url || !key) throw new Error('Chybí NEXT_PUBLIC_SUPABASE_URL nebo SUPABASE_SERVICE_ROLE_KEY')
const db = createClient(url, key)

const wb = XLSX.readFile('docs/cviky_import.xlsx')
const list = (v: unknown) => String(v ?? '').split(',').map((s) => s.trim()).filter(Boolean)

const equipment = XLSX.utils.sheet_to_json<Record<string, string>>(wb.Sheets['Pomucky'])
  .filter((r) => r.pomucka && r.poznamka)
  .map((r) => ({ name: r.pomucka, note: r.poznamka }))
const known = new Set(equipment.map((e) => e.name))

const exercises = XLSX.utils.sheet_to_json<Record<string, any>>(wb.Sheets['Cviky']).map((r) => {
  const eq = list(r.pomucky).filter((x) => x !== 'vlastní váha')
  for (const x of eq) if (!known.has(x)) throw new Error(`Neznámá pomůcka "${x}" u cviku ${r.nazev}`)
  return {
    name: r.nazev, alt_name: r.alternativni_nazev ?? null, muscle: r.partie, level: r.uroven,
    equipment: eq, environment: r.prostredi, formats: list(r.formaty), blocks: list(r.bloky),
    cardio_strength: Number(r.kardio_sila), movement: r.pohybovy_vzorec,
    default_value: r.vychozi_hodnota ?? null, unit: r.jednotka ?? 'opakování',
    description: r.popis, video_url: r.video_url ?? null,
  }
})

;(async () => {
  const e1 = await db.from('equipment').upsert(equipment.filter((e) => e.name !== 'vlastní váha'))
  if (e1.error) throw e1.error
  const e2 = await db.from('exercises').upsert(exercises, { onConflict: 'name' })
  if (e2.error) throw e2.error
  console.log(`Importováno: ${exercises.length} cviků, ${equipment.length - 1} pomůcek`)
})()
