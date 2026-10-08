'use client'
import { useRef, useState } from 'react'
import { emailWorkoutAction } from '@/lib/export-actions'
import type { GeneratedWorkout } from '@/lib/generator/types'
import { WorkoutImageCard } from '@/components/workout-image-card'
import { Alert, btn2Cls } from '@/components/ui'

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'trenink'

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function ExportBar({ workout: w }: { workout: GeneratedWorkout }) {
  const [busy, setBusy] = useState<'pdf' | 'img' | 'mail' | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const card = useRef<HTMLDivElement>(null)

  async function pdf() {
    setBusy('pdf'); setMsg(null)
    try {
      const r = await fetch('/api/export/pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(w) })
      if (!r.ok) throw new Error()
      download(await r.blob(), `efgen-${slug(w.title)}.pdf`)
    } catch { setMsg({ kind: 'error', text: 'PDF se nepodařilo vytvořit. Zkuste to znovu.' }) }
    setBusy(null)
  }

  async function image() {
    if (!card.current) return
    setBusy('img'); setMsg(null)
    try {
      const { toBlob } = await import('html-to-image')
      const blob = await toBlob(card.current, { pixelRatio: 2, backgroundColor: '#ffffff', cacheBust: true })
      if (!blob) throw new Error()
      const file = new File([blob], `efgen-${slug(w.title)}.png`, { type: 'image/png' })
      // Na telefonu nabídneme systémové sdílení (Uložit obrázek do galerie), jinak soubor stáhneme.
      const touch = window.matchMedia('(pointer: coarse)').matches
      if (touch && navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: w.title }) } catch (e) { if ((e as Error).name !== 'AbortError') download(blob, file.name) }
      } else download(blob, file.name)
    } catch { setMsg({ kind: 'error', text: 'Obrázek se nepodařilo vytvořit. Zkuste to znovu.' }) }
    setBusy(null)
  }

  async function mail() {
    setBusy('mail'); setMsg(null)
    try {
      const r = await emailWorkoutAction(w)
      setMsg(r.ok ? { kind: 'ok', text: r.message } : { kind: 'error', text: r.error })
    } catch { setMsg({ kind: 'error', text: 'E-mail se nepodařilo odeslat. Zkuste to znovu.' }) }
    setBusy(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={pdf} disabled={!!busy} className={btn2Cls}>{busy === 'pdf' ? 'Připravuji PDF…' : 'Stáhnout PDF'}</button>
        <button type="button" onClick={image} disabled={!!busy} className={btn2Cls}>{busy === 'img' ? 'Připravuji obrázek…' : 'Uložit obrázek'}</button>
        <button type="button" onClick={mail} disabled={!!busy} className={btn2Cls}>{busy === 'mail' ? 'Odesílám…' : 'Poslat e-mailem'}</button>
      </div>
      {msg && <Alert kind={msg.kind}>{msg.text}</Alert>}
      {/* Skrytý podklad pro obrázek, vykreslí se mimo obrazovku. */}
      <div aria-hidden style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none' }}>
        <div ref={card}><WorkoutImageCard w={w} /></div>
      </div>
    </div>
  )
}
