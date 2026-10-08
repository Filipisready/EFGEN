import path from 'node:path'
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { GeneratedWorkout } from '@/lib/generator/types'
import { altLabel } from '@/lib/generator/display'

const dir = path.join(process.cwd(), 'assets', 'fonts')
let registered = false
function registerFonts() {
  if (registered) return
  Font.register({
    family: 'Roboto',
    fonts: [
      { src: path.join(dir, 'Roboto_400Regular.ttf') },
      { src: path.join(dir, 'Roboto_700Bold.ttf'), fontWeight: 700 },
      { src: path.join(dir, 'Roboto_400Regular_Italic.ttf'), fontStyle: 'italic' },
    ],
  })
  Font.registerHyphenationCallback((w) => [w]) // bez dělení slov
  registered = true
}

const NAMES = { rozcvička: 'Rozcvička', hlavní: 'Hlavní část', zklidnění: 'Zklidnění' } as const
const c = { ink: '#111111', mute: '#555555', line: '#d4d4d4', badge: '#eeeeee' }

const s = StyleSheet.create({
  page: { fontFamily: 'Roboto', fontSize: 11, color: c.ink, paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40, lineHeight: 1.35 },
  title: { fontSize: 22, fontWeight: 700, marginBottom: 8, lineHeight: 1.2 },
  meta: { fontSize: 11, color: c.mute },
  header: { borderBottomWidth: 1, borderBottomColor: c.line, paddingBottom: 10, marginBottom: 6 },
  warn: { backgroundColor: '#fff7e0', padding: 6, marginTop: 8, fontSize: 10 },
  block: { marginTop: 14 },
  blockTitle: { fontSize: 15, fontWeight: 700 },
  structure: { fontSize: 10, color: c.mute, marginTop: 1, marginBottom: 6 },
  row: { flexDirection: 'row', marginBottom: 7 },
  num: { width: 18, height: 18, borderRadius: 9, backgroundColor: c.ink, color: '#fff', fontSize: 10, fontWeight: 700, textAlign: 'center', paddingTop: 3, marginRight: 8 },
  body: { flex: 1 },
  name: { fontSize: 12.5, fontWeight: 700 },
  alt: { fontWeight: 400, color: c.mute },
  badge: { backgroundColor: c.badge, fontSize: 11, fontWeight: 700 },
  desc: { marginTop: 1 },
  note: { fontStyle: 'italic', color: c.mute, marginTop: 1 },
  footer: { position: 'absolute', bottom: 22, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', fontSize: 9, color: c.mute },
  wnote: { marginTop: 14, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 8 },
})

export function WorkoutPdf({ w }: { w: GeneratedWorkout }) {
  const date = new Date(w.date).toLocaleDateString('cs-CZ')
  const meta = [date, `${w.format}${w.subtype ? ' ' + w.subtype : ''}`, `celkem ${w.totalMinutes} min`, w.groupName, w.groupSize ? `${w.groupSize} osob` : null].filter(Boolean).join(' · ')
  const summary = w.blocks.map((b) => `${b.label ?? NAMES[b.key]}${b.label ? '' : ' ' + b.minutes + ' min'}`).join(' · ')
  return (
    <Document title={w.title} author="EFGEN" creator="efgen.pro">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <Text style={s.title}>{w.title}</Text>
          <Text style={s.meta}>{meta}</Text>
          <Text style={[s.meta, { marginTop: 2 }]}>{summary}</Text>
        </View>
        {w.warnings.map((m) => <Text key={m} style={s.warn}>{m}</Text>)}
        {w.blocks.map((b, bi) => {
          const row = (e: GeneratedWorkout['blocks'][number]['exercises'][number], i: number) => (
            <View key={e.id} style={s.row} wrap={false}>
              <Text style={s.num}>{i + 1}</Text>
              <View style={s.body}>
                <Text style={s.name}>
                  {e.name}
                  {altLabel(w.format, e.name, e.altName) ? <Text style={s.alt}> ({altLabel(w.format, e.name, e.altName)})</Text> : null}
                  {e.valueText ? <Text style={s.badge}>{'  '}{e.valueText}{'  '}</Text> : null}
                  {e.note ? <Text style={s.alt}> ({e.note})</Text> : null}
                </Text>
                <Text style={s.desc}>{e.description}</Text>
                {e.userNote ? <Text style={s.note}>Poznámka: {e.userNote}</Text> : null}
              </View>
            </View>
          )
          return (
            <View key={bi} style={s.block}>
              {/* Nadpis bloku drží pohromadě s prvním cvikem, aby nezůstal osamocený na konci strany. */}
              <View wrap={false}>
                <Text style={s.blockTitle}>{b.label ? `Hlavní část: ${b.label}` : `${NAMES[b.key]} · ${b.minutes} min`}</Text>
                <Text style={s.structure}>{b.structure}</Text>
                {b.exercises[0] ? row(b.exercises[0], 0) : null}
              </View>
              {b.exercises.slice(1).map((e, i) => row(e, i + 1))}
            </View>
          )
        })}
        {w.note ? <View style={s.wnote} wrap={false}><Text><Text style={{ fontWeight: 700 }}>Poznámka: </Text>{w.note}</Text></View> : null}
        <View style={s.footer} fixed>
          <Text>EFGEN · efgen.pro</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function renderWorkoutPdf(w: GeneratedWorkout): Promise<Buffer> {
  registerFonts()
  return renderToBuffer(<WorkoutPdf w={w} />)
}
