import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { TopBar, Button } from '../../ui/kit'
import { progress, useProgress } from '../../lib/storage'
import { Quiz } from '../../lab/Quiz'
import { Cards } from '../../lab/Cards'
import { SortTask } from '../../lab/SortTask'
import { ClozeTask } from '../../lab/ClozeTask'
import { MatchTask } from '../../lab/MatchTask'
import { OrderTask } from '../../lab/OrderTask'
import { ClaimTask } from '../../lab/ClaimTask'
import { ResultCard } from '../../ResultCard'
import {
  CLAIM, COMPARE_ROWS, ER_CLOZE, FACTORY_PAIRS, P8_CARDS, P8_CHECK, PROTEIN_ROUTE, REASONS, TABLE1, TABLE_PAIRS, TYPE_CATEGORIES, TYPE_ROWS,
} from './content'

const SECTIONS = ['intro', 'table', 'yourTable', 'factory', 'route', 'types', 'map', 'getit', 'er', 'compare', 'check', 'done'] as const
type Section = (typeof SECTIONS)[number]
const NAMES: Record<Section, string> = {
  intro: 'Organelles at work', table: 'Build Table 1', yourTable: 'Your Table 1', factory: 'The cell factory', route: 'A protein’s route',
  types: 'Sort by cell type', map: 'Your concept map', getit: 'Get It?', er: 'The ER', compare: 'Plant and animal cells', check: 'Check Your Progress', done: 'Result card',
}
const COUNTED = SECTIONS.indexOf('done')
type Scores = Partial<Record<'table' | 'factory' | 'route' | 'types' | 'getit' | 'er' | 'compare', number>>
const MAX: Required<Scores> = { table: TABLE_PAIRS.length, factory: FACTORY_PAIRS.length, route: 1, types: TYPE_ROWS.length, getit: REASONS.length, er: 1, compare: COMPARE_ROWS.length }

function TableView({ onNext }: { onNext: () => void }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-4 p-4">
      <div className="card">
        <span className="eyebrow">Table 1: Summary of Cell Structures</span>
        <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">Your Table 1</h2>
        <p className="mb-3 leading-relaxed">Every structure in the textbook’s table, with where you saw it yourself in this lab.</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-[0.95rem]">
            <thead>
              <tr className="bg-[var(--color-primary)] text-white">
                {['Cell structure', 'Function', 'Cell type', 'Where you saw it'].map((h) => <th key={h} className="px-3 py-2 font-extrabold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {TABLE1.map((r, i) => (
                <tr key={r.structure} className={i % 2 ? 'bg-[var(--color-sunk)]' : 'bg-white'}>
                  <td className="px-3 py-2 font-extrabold">{r.structure}</td>
                  <td className="px-3 py-2 leading-snug">{r.fn}</td>
                  <td className="px-3 py-2 leading-snug">{r.type}</td>
                  <td className="px-3 py-2 font-semibold leading-snug text-[var(--color-primary-strong)]">{r.seen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={onNext}>Next: the cell factory</Button></div>
      </div>
    </div>
  )
}

// Check Your Progress 6: the concept map drawn from the student's own sorting.
function ConceptMap({ onNext }: { onNext: () => void }) {
  const group = (c: string) => TYPE_ROWS.filter((r) => r.answer === c).map((r) => r.text.replace(' (rare in plants)', ''))
  const node = (title: string, items: string[], tone: string) => (
    <div className={`rounded-2xl border-2 p-3 ${tone}`}>
      <div className="mb-1.5 font-display text-lg font-bold">{title}</div>
      <div className="flex flex-wrap gap-1.5">{items.map((t) => <span key={t} className="rounded-full bg-white px-2.5 py-1 text-sm font-extrabold shadow-sm">{t}</span>)}</div>
    </div>
  )
  const line = <div className="mx-auto h-5 w-0.5 bg-[var(--color-line)]" />
  return (
    <div className="mx-auto grid max-w-4xl gap-4 p-4">
      <div className="card">
        <span className="eyebrow">Check Your Progress 6</span>
        <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">Your concept map</h2>
        <p className="mb-4 leading-relaxed">Built from your sorting. Read it from the top: what every cell has, then what each kind of cell adds.</p>
        <div className="grid gap-0">
          {node('Every cell has', group('All cells'), 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]')}
          {line}
          {node('Every eukaryotic cell also has', group('All eukaryotic cells'), 'border-[#7c5cd6] bg-[#efeafd]')}
          {line}
          <div className="grid gap-3 sm:grid-cols-2">
            {node('Plant cells add', group('Plants, not animals'), 'border-[var(--color-ok)] bg-[var(--color-ok-soft)]')}
            {node('Animal cells add', group('Animals, not plants'), 'border-[#e07a3c] bg-[#fdeee4]')}
          </div>
          {line}
          {node('Found in some cells of several kinds', group('Some cells of several kinds'), 'border-[var(--color-line)] bg-[var(--color-sunk)]')}
        </div>
        <div className="mt-4 flex justify-end"><Button onClick={onNext}>Next: Get It?</Button></div>
      </div>
    </div>
  )
}

export function Phase8() {
  const saved = useProgress().phases.p8
  const [section, setSection] = useState<Section>(() => {
    const s = saved?.section as Section | undefined
    return s && SECTIONS.includes(s) ? s : 'intro'
  })
  const data = (saved?.data ?? {}) as { scores?: Scores; finishedAt?: number }
  const go = (s: Section) => { setSection(s); progress.updatePhase('p8', { section: s }); window.scrollTo(0, 0) }
  const score = (k: keyof Scores, v: number, next: Section) => {
    const d = (progress.get().phases.p8?.data ?? {}) as typeof data
    progress.updatePhase('p8', { data: { ...d, scores: { ...d.scores, [k]: v } } })
    go(next)
  }
  const restart = () => { progress.resetPhase('p8'); go('intro') }
  const index = SECTIONS.indexOf(section)

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <TopBar
        title="Phase 8: Organelles at work"
        sub={section === 'done' ? NAMES.done : `${NAMES[section]} (${index + 1} of ${COUNTED})`}
        right={section !== 'intro' ? (
          <button type="button" className="icon-btn" onClick={() => { if (confirm('Restart Phase 8 from the beginning?')) restart() }}>
            <RotateCcw size={18} /><span className="hidden md:inline">Restart</span>
          </button>
        ) : null}
      />
      <main className="min-h-0 flex-1">
        {section === 'intro' && <Cards eyebrow="Pages 64 to 66" cards={P8_CARDS} finish="Start: build Table 1" onDone={() => go('table')} />}
        {section === 'table' && (
          <MatchTask
            eyebrow="Table 1" title="Build Table 1" leftLabel="Cell structure" rightLabel="Function"
            intro="You have now seen every structure in the lesson. Match each one to its function."
            pairs={TABLE_PAIRS} doneLabel="See your Table 1" onDone={(n) => score('table', n, 'yourTable')}
          />
        )}
        {section === 'yourTable' && <TableView onNext={() => go('factory')} />}
        {section === 'factory' && (
          <MatchTask
            eyebrow="Check Your Progress 3" title="The cell as a car factory" leftLabel="Part of the cell" rightLabel="Part of the factory"
            intro="People often compare a cell to a factory. Match each part of the cell to the part of a car production line that does the same kind of job."
            pairs={FACTORY_PAIRS} doneLabel="Next: the production line" onDone={(n) => score('factory', n, 'route')}
          />
        )}
        {section === 'route' && (
          <OrderTask
            eyebrow="Check Your Progress 3" title="The production line"
            intro="Now build the flowchart of the cell’s production line: put the making and shipping of a protein in order."
            steps={PROTEIN_ROUTE} doneLabel="Next: sort by cell type" onDone={(first) => score('route', first ? 1 : 0, 'types')}
          />
        )}
        {section === 'types' && (
          <SortTask
            eyebrow="Check Your Progress 6" title="Categorize the structures of Table 1"
            intro="Which cells have each structure? Use the Cell type column of your Table 1 if you need it."
            categories={TYPE_CATEGORIES} rows={TYPE_ROWS} doneLabel="See your concept map"
            onDone={(_, n) => score('types', n, 'map')}
          />
        )}
        {section === 'map' && <ConceptMap onNext={() => go('getit')} />}
        {section === 'getit' && (
          <ClaimTask eyebrow="Get It? Infer" title="Justify the statement" claim={`“${CLAIM}”`} reasons={REASONS} doneLabel="Next: Check Your Progress" onDone={(n) => score('getit', n, 'er')} />
        )}
        {section === 'er' && (
          <ClozeTask
            title="Check Your Progress 2: Summarize the role of the endoplasmic reticulum"
            intro="Complete the summary. Tap a blank, then tap a word. Some words are not needed."
            text={ER_CLOZE.text} extra={ER_CLOZE.extra} doneLabel="Next: plant and animal cells"
            onDone={(first) => score('er', first ? 1 : 0, 'compare')}
          />
        )}
        {section === 'compare' && (
          <SortTask
            eyebrow="Check Your Progress 4" title="Compare and contrast plant and animal cells"
            intro="Where is each structure found?"
            categories={['Plant cells only', 'Animal cells only', 'Both']} rows={COMPARE_ROWS} doneLabel="Next: the last questions"
            onDone={(_, n) => score('compare', n, 'check')}
          />
        )}
        {section === 'check' && <Quiz items={P8_CHECK} onDone={(got, total) => {
          const sc = data.scores ?? {}
          const keys = Object.keys(MAX) as (keyof Scores)[]
          const extra = keys.reduce((a, k) => a + (sc[k] ?? 0), 0)
          const extraMax = keys.reduce((a, k) => a + MAX[k], 0)
          progress.updatePhase('p8', { score: { got: got + extra, total: total + extraMax }, done: true, data: { ...data, finishedAt: Date.now() } })
          go('done')
        }} />}
        {section === 'done' && (
          <div>
            <div className="no-print mx-auto max-w-2xl px-4 pt-4">
              <div className="card text-center">
                <h1 className="mb-1 font-display text-3xl font-bold">You finished the lab</h1>
                <p className="leading-relaxed text-[var(--color-muted)]">Every structure in Lesson 4, seen with your own eyes. Type your name below, then screenshot your result card for your teacher.</p>
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <Button variant="ghost" onClick={restart}><RotateCcw size={18} /> Do Phase 8 again</Button>
                  <a href="#/" className="btn btn-primary">Back to phases</a>
                </div>
              </div>
            </div>
            <ResultCard />
          </div>
        )}
      </main>
    </div>
  )
}
