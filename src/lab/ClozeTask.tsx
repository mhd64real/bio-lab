import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '../ui/kit'
import { play } from '../lib/sound'

// Fill the blanks from a word bank. The text marks each blank as [answer]. Tapping a word fills the
// selected blank (or the first empty one); tapping a filled blank empties it. Wrong blanks turn red on
// checking. Reports whether every blank was right on the first check (the score).
export function ClozeTask({ title, intro, text, extra = [], onDone, doneLabel = 'Next' }: { title: string; intro: string; text: string; extra?: string[]; onDone: (firstTry: boolean) => void; doneLabel?: string }) {
  const parts = text.split(/\[([^\]]+)\]/)
  const answers = parts.filter((_, i) => i % 2 === 1)
  const [bank] = useState(() => [...answers, ...extra].map((w, i) => ({ w, k: i })).sort((a, b) => ((a.k * 7919) % 13) - ((b.k * 7919) % 13)))
  const [fill, setFill] = useState<(number | null)[]>(() => answers.map(() => null))
  const [sel, setSel] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [firstTry, setFirstTry] = useState<boolean | null>(null)
  const used = new Set(fill.filter((f) => f !== null))
  const word = (k: number | null) => (k === null ? '' : bank.find((b) => b.k === k)!.w)
  const ok = (i: number) => word(fill[i]) === answers[i]
  const all = answers.every((_, i) => ok(i))
  const complete = fill.every((f) => f !== null)
  const place = (k: number) => {
    const target = sel !== null && fill[sel] === null ? sel : fill.findIndex((f) => f === null)
    if (target < 0) return
    const next = [...fill]; next[target] = k
    setFill(next); setSel(null); setChecked(false); play('click')
  }
  let b = -1
  return (
    <div className="mx-auto grid max-w-3xl gap-4 p-4">
      <div className="card">
        <span className="eyebrow">Get It?</span>
        <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">{title}</h2>
        <p className="mb-4 leading-relaxed">{intro}</p>
        <p className="mb-4 text-lg leading-[2.4]">
          {parts.map((p, i) => {
            if (i % 2 === 0) return <span key={i}>{p}</span>
            const idx = ++b
            const tone = checked ? (ok(idx) ? 'border-[var(--color-ok)] bg-[var(--color-ok-soft)]' : 'border-[var(--color-danger)] bg-[var(--color-danger-soft)]') : sel === idx ? 'border-[var(--color-primary)] bg-[var(--color-accent-soft)]' : 'border-[var(--color-line)] bg-[var(--color-sunk)]'
            return (
              <button key={i} type="button" aria-label={fill[idx] === null ? `Blank ${idx + 1}` : `Blank ${idx + 1}: ${word(fill[idx])}`}
                onClick={() => { if (fill[idx] !== null) { const next = [...fill]; next[idx] = null; setFill(next); setChecked(false); setSel(idx) } else setSel(idx) }}
                className={`mx-0.5 inline-block min-w-[6.5rem] rounded-lg border-2 border-dashed px-2 py-0.5 text-center font-extrabold leading-snug ${tone}`}>
                {word(fill[idx]) || ' '}
              </button>
            )
          })}
        </p>
        <div className="flex flex-wrap gap-2 rounded-xl bg-[var(--color-sunk)] p-3">
          {bank.map(({ w, k }) => (
            <button key={k} type="button" disabled={used.has(k)} onClick={() => place(k)}
              className={`rounded-full border-2 px-3 py-1.5 font-extrabold ${used.has(k) ? 'border-transparent bg-transparent text-[var(--color-faint)] line-through' : 'border-[var(--color-line)] bg-white'}`}>
              {w}
            </button>
          ))}
        </div>
        {checked && !all && <p className="mt-3 rounded-xl bg-[var(--color-danger-soft)] p-3 font-bold">Tap the red blanks to empty them, then try other words.</p>}
        {checked && all && <p className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--color-ok-soft)] p-3 font-bold"><CheckCircle2 size={18} className="text-[var(--color-ok)]" /> All correct.</p>}
        <div className="mt-4 flex justify-end">
          {checked && all
            ? <Button onClick={() => onDone(firstTry ?? false)}>{doneLabel}</Button>
            : <Button disabled={!complete} onClick={() => { setChecked(true); if (firstTry === null) setFirstTry(all); play(all ? 'ok' : 'click') }}>Check answers</Button>}
        </div>
      </div>
    </div>
  )
}
