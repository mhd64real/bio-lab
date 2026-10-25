import { useState } from 'react'
import { ArrowLeft, Factory, Layers, Microscope } from 'lucide-react'
import { Button, Choice } from '../../ui/kit'

const CARDS = [
  {
    icon: Factory,
    title: 'A cell works like a factory',
    body: [
      'In a factory there are separate areas for different jobs: offices, assembly lines, loading docks. Eukaryotic cells also have separate areas for different tasks.',
      'These areas are organelles: structures that each carry out a job. Many are wrapped in their own membrane, so different chemical processes can happen at the same time in different parts of the cell.',
      'Organelles carry out the essential processes of the cell: making proteins, transforming energy, digesting food, transporting and storing materials, getting rid of wastes, and cell division.',
    ],
    q: {
      q: 'Why do membrane-bound organelles help a eukaryotic cell?',
      options: ['They make the cell heavier', 'Different chemical processes can take place at the same time in different parts of the cell', 'They stop the cell from dividing', 'They let the cell live without a membrane'],
      correct: 1,
      explain: 'Right. Like rooms in a factory, each organelle keeps its own job separate.',
    },
  },
  {
    icon: Layers,
    title: 'Cytoplasm',
    body: [
      'The environment inside the plasma membrane is a semifluid material called cytoplasm.',
      'In a prokaryotic cell, all the chemical processes, such as breaking down sugar to release energy, take place directly in the cytoplasm.',
      'Eukaryotic cells carry out these processes inside membrane-bound organelles in their cytoplasm.',
    ],
    q: {
      q: 'Where does a prokaryotic cell carry out its chemical processes?',
      options: ['Inside its nucleus', 'Inside membrane-bound organelles', 'Directly in its cytoplasm', 'Outside the cell'],
      correct: 2,
      explain: 'Yes. Prokaryotic cells have no membrane-bound organelles, so everything happens in the cytoplasm.',
    },
  },
  {
    icon: Microscope,
    title: 'Three kinds of cells',
    body: [
      'In this phase you will prepare three slides and look at them yourself:',
      'A plant cell, from the skin of an onion. An animal cell, from the inside of your cheek. And prokaryotic cells: the bacteria that turn milk into yogurt.',
      'Then you will compare all three with diagrams of each kind of cell.',
    ],
  },
]

export function Intro({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const [solved, setSolved] = useState<Set<number>>(new Set())
  const card = CARDS[i]
  const Icon = card.icon
  const ok = !card.q || solved.has(i)
  return (
    <div className="mx-auto grid max-w-3xl gap-4 p-4">
      <div className="flex gap-2">{CARDS.map((_, k) => <span key={k} className={`h-2 flex-1 rounded-full ${k <= i ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-line)]'}`} />)}</div>
      <div className="card">
        <span className="eyebrow">Cell structures, page 55</span>
        <h2 className="mb-3 mt-1 flex items-center gap-3 font-display text-3xl font-bold leading-tight"><Icon className="text-[var(--color-primary)]" size={30} /> {card.title}</h2>
        {card.body.map((p) => <p key={p} className="mb-3 text-lg leading-relaxed">{p}</p>)}
        {card.q && <div className="mt-4 rounded-2xl bg-[var(--color-sunk)] p-4"><Choice key={i} item={card.q} untilCorrect onDone={() => setSolved(new Set(solved).add(i))} /></div>}
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}><ArrowLeft size={18} /> Back</Button>
        <Button onClick={() => (i + 1 < CARDS.length ? setI(i + 1) : onDone())} disabled={!ok}>{i + 1 < CARDS.length ? 'Next' : 'Start: onion cells'}</Button>
      </div>
    </div>
  )
}
