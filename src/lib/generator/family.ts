/**
 * „Rodina“ cviku: stejný pohyb bez ohledu na pomůcku (např. Good morning s osou a s činkou).
 * Generátor nikdy nezařadí do jednoho tréninku dva cviky ze stejné rodiny.
 * Rodina se odvozuje z anglického názvu (pokud je) bez slov označujících pomůcku, jinak z českého názvu.
 */
const EN_EQUIP = new Set([
  'barbell', 'dumbbell', 'dumbbells', 'kettlebell', 'plate', 'plates', 'band', 'banded', 'trx', 'bosu', 'step', 'stability', 'ball',
  'slider', 'landmine', 'trap', 'bar', 'vest', 'weighted', 'sandbag', 'med', 'ring', 'rings', 'parallel', 'rack', 'ghd', 'with', 'on', 'the', 'a', 'of',
  'biceps', // „biceps curl“ a „curl“ jsou týž cvik
])
/** Příliš obecné klíče: různé pohyby by se spojily, proto se u nich použije český název bez pomůcky. */
const GENERIC = new Set(['press'])
const CZ_EQUIP = '(činkou|činkami|činka|osou|osy|kettlebellem|kettlebellu|kotoučem|kotouče|kotouč|bosu|stepu|step|stepper|míči|míčem|klouzáky|klouzácích|klouzákem|gumou|vestou|medicinbalem|pytlem|bradlech|kruzích|bedně|bedny|lavici|hrazdě|hrazdy|trx)'

export function familyKey(e: { name: string; alt_name?: string | null }): string {
  if (e.alt_name) {
    const t = e.alt_name.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w && !EN_EQUIP.has(w))
    if (t.length && !GENERIC.has(t.join(' '))) return t.join(' ')
  }
  let s = e.name.toLowerCase().replace(/^trx\s+/, '')
  s = s.replace(new RegExp(`\\b(s|se|na|ze|v|o|k)\\s+${CZ_EQUIP}\\b`, 'g'), ' ')
  return s.replace(/\s+/g, ' ').trim()
}
