import { useState } from 'react'
import { CheckCircle2, Tags, XCircle } from 'lucide-react'
import { Button } from '../../ui/kit'
import { play } from '../../lib/sound'
import { AnimalCell, PlantCell, ProkaryoteCell, STRUCTURES, type CellKind } from './CellDiagrams'

const FIND: Record<CellKind, { id: string; prompt: string }[]> = {
  animal: [
    { id: 'nucleus', prompt: 'Tap the nucleus: the large structure that holds most of the DNA.' },
    { id: 'membrane', prompt: 'Tap the cell membrane: the flexible outer boundary.' },
    { id: 'mito', prompt: 'Tap a mitochondrion: it releases energy for the cell.' },
    { id: 'centriole', prompt: 'Tap a centriole: found in animal cells, not in plant cells.' },
    { id: 'lysosome', prompt: 'Tap a lysosome: the cell\'s clean-up crew.' },
  ],
  plant: [
    { id: 'wall', prompt: 'Tap the cell wall: the rigid layer you saw around every onion cell.' },
    { id: 'vacuole', prompt: 'Tap the central vacuole: a large storage sac.' },
    { id: 'chloroplast', prompt: 'Tap a chloroplast: it captures light energy. Your onion cells had none.' },
    { id: 'nucleus', prompt: 'Tap the nucleus.' },
  ],
  prokaryote: [
    { id: 'dna', prompt: 'Tap the DNA. There is no nucleus: the DNA lies free in the cytoplasm.' },
    { id: 'ribosomes', prompt: 'Tap the ribosomes: tiny structures that make proteins.' },
    { id: 'wall', prompt: 'Tap the cell wall. In bacteria it is made of peptidoglycan, not cellulose.' },
    { id: 'capsule', prompt: 'Tap the capsule: a sticky outer coat.' },
    { id: 'flagella', prompt: 'Tap the flagella: whip-like tails used for moving.' },
  ],
}

const ORDER: CellKind[] = ['animal', 'plant', 'prokaryote']
const TITLE: Record<CellKind, string> = { animal: 'Animal cell', plant: 'Plant cell', prokaryote: 'Prokaryotic cell' }

// Which cell types each structure appears in, as drawn in Figure 17.
export const GRID: { name: string; in: CellKind[] }[] = [
  { name: 'Nucleus', in: ['animal', 'plant'] },
  { name: 'Cell membrane', in: ['animal', 'plant', 'prokaryote'] },
  { name: 'Cytoplasm', in: ['animal', 'plant', 'prokaryote'] },
  { name: 'Ribosomes', in: ['animal', 'plant', 'prokaryote'] },
  { name: 'Mitochondria', in: ['animal', 'plant'] },
  { name: 'Chloroplasts', in: ['plant'] },
  { name: 'Central vacuole', in: ['plant'] },
  { name: 'Cell wall', in: ['plant', 'prokaryote'] },
  { name: 'Centrioles', in: ['animal'] },
  { name: 'Capsule', in: ['prokaryote'] },
]

function Explore({ onDone }: { onDone: () => void }) {
  const [cell, setCell] = useState(0)
  const [task, setTask] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [wrong, setWrong] = useState<string | null>(null)
  const [labels, setLabels] = useState(false)
  const kind = ORDER[cell]
  const tasks = FIND[kind]
  const doneCell = task >= tasks.length
  const pick = (id: string) => {
    setPicked(id)
    if (doneCell) return
    if (id === tasks[task].id) { play('ok'); setWrong(null); setTask(task + 1) }
    else { play('click'); setWrong(id) }
  }
  const Diagram = kind === 'animal' ? AnimalCell : kind === 'plant' ? PlantCell : ProkaryoteCell
  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-4 lg:grid-cols-[340px_1fr]">
      <div className="card self-start">
        <span className="eyebrow">Figure 17, Visualizing cells</span>
        <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">{TITLE[kind]} ({cell + 1} of 3)</h2>
        {!doneCell ? (
          <>
            <p className="mb-2 text-sm font-bold text-[var(--color-muted)]">Task {task + 1} of {tasks.length}</p>
            <p className="rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-3 text-lg font-bold leading-snug">{tasks[task].prompt}</p>
            {wrong && <p className="mt-3 flex gap-2 rounded-xl bg-[var(--color-danger-soft)] p-3 leading-snug"><XCircle size={18} className="mt-0.5 flex-none text-[var(--color-danger)]" /> That is the {STRUCTURES[kind][wrong].toLowerCase()}. Try again.</p>}
          </>
        ) : (
          <>
            <p className="mb-3 flex gap-2 leading-relaxed"><CheckCircle2 className="mt-0.5 flex-none text-[var(--color-ok)]" /> All found. Tap any part to see its name, or turn on the labels.</p>
            {picked && <p className="mb-3 font-bold">{STRUCTURES[kind][picked]}</p>}
            <Button onClick={() => { if (cell + 1 < ORDER.length) { setCell(cell + 1); setTask(0); setPicked(null); setWrong(null) } else onDone() }}>
              {cell + 1 < ORDER.length ? `Next: ${TITLE[ORDER[cell + 1]].toLowerCase()}` : 'Next: sort the structures'}
            </Button>
          </>
        )}
      </div>
      <div className="card relative">
        {doneCell && <button type="button" className="icon-btn absolute right-3 top-3" aria-pressed={labels} onClick={() => setLabels(!labels)}><Tags size={18} /> Labels</button>}
        <Diagram picked={picked} onPick={pick} showAll={labels && doneCell} />
      </div>
    </div>
  )
}

function Sort({ onDone }: { onDone: () => void }) {
  const [ticks, setTicks] = useState<Record<string, Set<CellKind>>>(() => Object.fromEntries(GRID.map((r) => [r.name, new Set<CellKind>()])))
  const [checked, setChecked] = useState(false)
  const rowOk = (r: (typeof GRID)[number]) => r.in.length === ticks[r.name].size && r.in.every((k) => ticks[r.name].has(k))
  const allOk = GRID.every(rowOk)
  const toggle = (name: string, k: CellKind) => {
    const next = new Set(ticks[name])
    if (next.has(k)) next.delete(k); else next.add(k)
    setTicks({ ...ticks, [name]: next })
    setChecked(false)
  }
  return (
    <div className="mx-auto grid max-w-3xl gap-4 p-4">
      <div className="card">
        <span className="eyebrow">Compare the three cells</span>
        <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">Which cells have which structures?</h2>
        <p className="mb-4 leading-relaxed">Tick every type of cell that has each structure, using Figure 17 and what you saw in the microscope. Then check your answers.</p>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-1.5">
            <thead><tr className="text-left text-sm text-[var(--color-muted)]"><th className="pb-1">Structure</th>{ORDER.map((k) => <th key={k} className="pb-1 text-center">{TITLE[k].replace(' cell', '')}</th>)}<th /></tr></thead>
            <tbody>
              {GRID.map((r) => {
                const ok = rowOk(r)
                return (
                  <tr key={r.name} className={checked ? (ok ? 'bg-[var(--color-ok-soft)]' : 'bg-[var(--color-danger-soft)]') : ''}>
                    <td className="rounded-l-xl px-2 py-1.5 font-bold">{r.name}</td>
                    {ORDER.map((k) => (
                      <td key={k} className="text-center">
                        <button type="button" aria-pressed={ticks[r.name].has(k)} aria-label={`${r.name} in ${TITLE[k]}`} onClick={() => toggle(r.name, k)} className={`tick ${ticks[r.name].has(k) ? 'tick-on' : ''}`}>
                          {ticks[r.name].has(k) && <CheckCircle2 size={20} />}
                        </button>
                      </td>
                    ))}
                    <td className="w-8 rounded-r-xl text-center">{checked && (ok ? <CheckCircle2 size={18} className="text-[var(--color-ok)]" /> : <XCircle size={18} className="text-[var(--color-danger)]" />)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {checked && !allOk && <p className="mt-3 rounded-xl bg-[var(--color-danger-soft)] p-3 font-bold">Fix the red rows and check again.</p>}
        {checked && allOk && <p className="mt-3 rounded-xl bg-[var(--color-ok-soft)] p-3 font-bold">All correct. Notice that all three have a membrane, cytoplasm and ribosomes, but only the eukaryotic cells have a nucleus and mitochondria.</p>}
        <div className="mt-4 flex justify-end gap-2">
          {!(checked && allOk) ? <Button onClick={() => { setChecked(true); play(allOk ? 'ok' : 'click') }}>Check answers</Button> : <Button onClick={onDone}>Next: quick check</Button>}
        </div>
      </div>
    </div>
  )
}

export function Compare({ onDone }: { onDone: () => void }) {
  const [stage, setStage] = useState<'explore' | 'sort'>('explore')
  return stage === 'explore' ? <Explore onDone={() => setStage('sort')} /> : <Sort onDone={onDone} />
}
