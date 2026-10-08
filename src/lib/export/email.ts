import type { GeneratedWorkout } from '@/lib/generator/types'

const NAMES = { rozcvička: 'Rozcvička', hlavní: 'Hlavní část', zklidnění: 'Zklidnění' } as const
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function meta(w: GeneratedWorkout) {
  return [new Date(w.date).toLocaleDateString('cs-CZ'), `${w.format}${w.subtype ? ' ' + w.subtype : ''}`, `celkem ${w.totalMinutes} min`, w.groupName, w.groupSize ? `${w.groupSize} osob` : null]
    .filter(Boolean).join(' · ')
}
const altOf = (w: GeneratedWorkout, e: GeneratedWorkout['blocks'][number]['exercises'][number]) =>
  w.format === 'CrossFit' && e.altName && e.altName.toLowerCase() !== e.name.toLowerCase() ? ` (${e.altName})` : ''

export function buildEmail(w: GeneratedWorkout) {
  const subject = `EFGEN: ${w.title}`
  const blocks = w.blocks.map((b) => {
    const rows = b.exercises.map((e, i) => `
      <tr>
        <td style="vertical-align:top;padding:4px 10px 8px 0;font-weight:bold;color:#555">${i + 1}.</td>
        <td style="padding:4px 0 8px 0">
          <div style="font-size:16px;font-weight:bold">${esc(e.name)}${esc(altOf(w, e))}${e.valueText ? ` &nbsp;<span style="background:#eee;padding:1px 6px;border-radius:4px">${esc(e.valueText)}</span>` : ''}${e.note ? ` <span style="font-weight:normal;color:#555">(${esc(e.note)})</span>` : ''}</div>
          <div style="color:#222">${esc(e.description)}</div>
          ${e.userNote ? `<div style="color:#555;font-style:italic">Poznámka: ${esc(e.userNote)}</div>` : ''}
        </td>
      </tr>`).join('')
    return `
      <h2 style="font-size:18px;margin:22px 0 2px">${esc(b.label ? `Hlavní část: ${b.label}` : `${NAMES[b.key]} · ${b.minutes} min`)}</h2>
      <div style="color:#555;font-size:13px;margin-bottom:8px">${esc(b.structure)}</div>
      <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%">${rows}</table>`
  }).join('')
  const html = `<!doctype html><html lang="cs"><body style="margin:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#111">
  <div style="max-width:640px;margin:0 auto;background:#fff;padding:24px">
    <h1 style="font-size:24px;margin:0 0 4px">${esc(w.title)}</h1>
    <div style="color:#555">${esc(meta(w))}</div>
    ${w.warnings.map((m) => `<div style="background:#fff7e0;padding:8px;margin-top:10px;font-size:13px">${esc(m)}</div>`).join('')}
    ${blocks}
    ${w.note ? `<p style="margin-top:20px;border-top:1px solid #ddd;padding-top:10px"><b>Poznámka:</b> ${esc(w.note)}</p>` : ''}
    <p style="margin-top:26px;color:#888;font-size:12px">Trénink je také v příloze jako PDF. Odesláno z efgen.pro.</p>
  </div></body></html>`

  const text = [
    w.title, meta(w), '',
    ...w.blocks.flatMap((b) => [
      b.label ? `Hlavní část: ${b.label}` : `${NAMES[b.key]} (${b.minutes} min)`, b.structure,
      ...b.exercises.map((e, i) => `${i + 1}. ${e.name}${altOf(w, e)}${e.valueText ? ' ' + e.valueText : ''}${e.note ? ' (' + e.note + ')' : ''}\n   ${e.description}${e.userNote ? '\n   Poznámka: ' + e.userNote : ''}`),
      '',
    ]),
    ...(w.note ? [`Poznámka: ${w.note}`, ''] : []),
    'Trénink je také v příloze jako PDF. Odesláno z efgen.pro.',
  ].join('\n')
  return { subject, html, text }
}
