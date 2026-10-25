import { useState } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../ui/kit'
import { play } from '../lib/sound'

export interface SortRow { text: string; answer: string }

// Each statement goes in exactly one category. Wrong rows turn red on checking; the student fixes them.
// Reports whether every row was right on the first check, and how many rows were.
export function SortTask({ title, intro, categories, rows, onDone, doneLabel = 'Next', eyebrow = 'Get It?' }: { title: string; intro: string; categories: string[]; rows: SortRow[]; onDone: (firstTry: boolean, rightFirst: number) => void; doneLabel?: string; eyebrow?: string }) {
  const [pick, setPick] = useState<Record<number, string>>({})
  const [checked, setChecked] = useState(false)
  const [firstTry, setFirstTry] = useState<boolean | null>(null)
  const [rightFirst, setRightFirst] = useState(0)
  const ok = (i: number) => pick[i] === rows[i].answer
  const all = rows.every((_, i) => ok(i))
  const complete = rows.every((_, i) => pick[i])
  return (
    <div className="mx-auto grid max-w-4xl gap-4 p-4">
      <div className="card">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">{title}</h2>
        <p className="mb-4 leading-relaxed">{intro}</p>
        <div className="grid gap-2">
          {rows.map((r, i) => (
            <div key={r.text} className={`grid items-center gap-2 rounded-xl p-2 sm:grid-cols-[1fr_auto] ${checked ? (ok(i) ? 'bg-[var(--color-ok-soft)]' : 'bg-[var(--color-danger-soft)]') : 'bg-[var(--color-sunk)]'}`}>
              <span className="flex items-center gap-2 font-bold leading-snug">
                {checked && (ok(i) ? <CheckCircle2 size={18} className="flex-none text-[var(--color-ok)]" /> : <XCircle size={18} className="flex-none text-[var(--color-danger)]" />)}
                {r.text}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((c) => (
                  <button key={c} type="button" aria-pressed={pick[i] === c} onClick={() => { setPick({ ...pick, [i]: c }); setChecked(false) }}
                    className={`rounded-full border-2 px-3 py-1.5 text-sm font-extrabold ${pick[i] === c ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white' : 'border-[var(--color-line)] bg-white'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        {checked && !all && <p className="mt-3 rounded-xl bg-[var(--color-danger-soft)] p-3 font-bold">Fix the red rows and check again.</p>}
        <div className="mt-4 flex justify-end">
          {checked && all
            ? <Button onClick={() => onDone(firstTry ?? false, rightFirst)}>{doneLabel}</Button>
            : <Button disabled={!complete} onClick={() => { setChecked(true); if (firstTry === null) { setFirstTry(all); setRightFirst(rows.filter((_, i) => ok(i)).length) } play(all ? 'ok' : 'click') }}>Check answers</Button>}
        </div>
      </div>
    </div>
  )
}
