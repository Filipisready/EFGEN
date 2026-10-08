import type { GeneratedWorkout } from '@/lib/generator/types'

const NAMES = { rozcvička: 'Rozcvička', hlavní: 'Hlavní část', zklidnění: 'Zklidnění' } as const

/** Karta pro export do obrázku. Používá pevné barvy (vždy světlá), aby výsledek nezávisel na režimu zařízení. */
export function WorkoutImageCard({ w }: { w: GeneratedWorkout }) {
  const meta = [new Date(w.date).toLocaleDateString('cs-CZ'), `${w.format}${w.subtype ? ' ' + w.subtype : ''}`, `celkem ${w.totalMinutes} min`, w.groupName, w.groupSize ? `${w.groupSize} osob` : null].filter(Boolean).join(' · ')
  return (
    <div style={{ width: 760, background: '#fff', color: '#111', padding: 32, fontFamily: 'Arial, Helvetica, sans-serif', lineHeight: 1.35 }}>
      <div style={{ fontSize: 30, fontWeight: 700 }}>{w.title}</div>
      <div style={{ color: '#555', fontSize: 16, marginTop: 4 }}>{meta}</div>
      {w.blocks.map((b, bi) => (
        <div key={bi} style={{ marginTop: 22 }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>{b.label ? `Hlavní část: ${b.label}` : `${NAMES[b.key]} · ${b.minutes} min`}</div>
          <div style={{ color: '#555', fontSize: 14, marginBottom: 8 }}>{b.structure}</div>
          {b.exercises.map((e, i) => (
            <div key={e.id} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: '#111', color: '#fff', fontSize: 15, fontWeight: 700, textAlign: 'center', lineHeight: '28px', flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 700 }}>
                  {e.name}
                  {w.format === 'CrossFit' && e.altName && e.altName.toLowerCase() !== e.name.toLowerCase() && <span style={{ fontWeight: 400, color: '#666' }}> ({e.altName})</span>}
                  {e.valueText && <span style={{ marginLeft: 8, background: '#eee', padding: '1px 8px', borderRadius: 4, fontSize: 17 }}>{e.valueText}</span>}
                  {e.note && <span style={{ fontWeight: 400, color: '#666', fontSize: 15 }}> ({e.note})</span>}
                </div>
                <div style={{ fontSize: 16 }}>{e.description}</div>
                {e.userNote && <div style={{ fontSize: 15, color: '#555', fontStyle: 'italic' }}>Poznámka: {e.userNote}</div>}
              </div>
            </div>
          ))}
        </div>
      ))}
      {w.note && <div style={{ marginTop: 18, borderTop: '1px solid #ddd', paddingTop: 10, fontSize: 16 }}><b>Poznámka:</b> {w.note}</div>}
      <div style={{ marginTop: 22, color: '#999', fontSize: 13 }}>EFGEN · efgen.pro</div>
    </div>
  )
}
