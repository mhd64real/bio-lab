import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../ui/kit'
import { play } from '../lib/sound'

// Put steps in order: tap them one by one to build the flowchart; tap a placed step to send it back.
// Steps in the wrong place turn red on checking. Reports whether the order was right on the first check.
export function OrderTask({ eyebrow, title, intro, steps, onDone, doneLabel = 'Next' }: { eyebrow: string; title: string; intro: ReactNode; steps: string[]; onDone: (firstTry: boolean) => void; doneLabel?: string }) {
  const shuffled = useMemo(() => steps.map((_, i) => i).sort((a, b) => ((a * 7919 + 5) % 13) - ((b * 7919 + 5) % 13)), [steps])
  const [placed, setPlaced] = useState<number[]>([])
  const [checked, setChecked] = useState(false)
  const [first, setFirst] = useState<boolean | null>(null)
  const all = placed.length === steps.length && placed.every((s, i) => s === i)
  return (
    <div className="mx-auto grid max-w-5xl gap-4 p-4">
      <div className="card">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">{title}</h2>
        <div className="mb-4 leading-relaxed">{intro}</div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid content-start gap-1.5">
            <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-muted)]">Steps</span>
            {shuffled.filter((i) => !placed.includes(i)).map((i) => (
              <button key={i} type="button" onClick={() => { setPlaced([...placed, i]); setChecked(false); play('click') }}
                className="rounded-xl border-2 border-[var(--color-line)] bg-white px-3 py-2 text-left font-semibold leading-snug hover:border-[var(--color-accent)]">{steps[i]}</button>
            ))}
            {placed.length === steps.length && <p className="text-sm font-bold text-[var(--color-muted)]">All steps placed.</p>}
          </div>
          <div className="grid content-start gap-1">
            <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-muted)]">Your flowchart</span>
            {steps.map((_, k) => {
              const s = placed[k]
              const right = s === k
              return (
                <div key={k} className="grid gap-1">
                  {s === undefined
                    ? <div className="rounded-xl border-2 border-dashed border-[var(--color-line)] px-3 py-2 text-[var(--color-faint)]">{k + 1}.</div>
                    : (
                      <button type="button" onClick={() => { setPlaced(placed.filter((x) => x !== s)); setChecked(false) }}
                        className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left font-semibold leading-snug ${checked ? (right ? 'border-[var(--color-ok)] bg-[var(--color-ok-soft)]' : 'border-[var(--color-danger)] bg-[var(--color-danger-soft)]') : 'border-[var(--color-primary)] bg-white'}`}>
                        <span className="font-extrabold">{k + 1}.</span><span className="flex-1">{steps[s]}</span>
                        {checked && (right ? <CheckCircle2 size={18} className="text-[var(--color-ok)]" /> : <XCircle size={18} className="text-[var(--color-danger)]" />)}
                      </button>
                    )}
                  {k < steps.length - 1 && <ArrowDown size={16} className="mx-auto text-[var(--color-faint)]" />}
                </div>
              )
            })}
          </div>
        </div>
        {checked && !all && <p className="mt-3 rounded-xl bg-[var(--color-danger-soft)] p-3 font-bold">Tap the red steps to take them out, then place them again.</p>}
        <div className="mt-4 flex justify-end">
          {checked && all
            ? <Button onClick={() => onDone(first ?? false)}>{doneLabel}</Button>
            : <Button disabled={placed.length < steps.length} onClick={() => { setChecked(true); if (first === null) setFirst(all); play(all ? 'ok' : 'click') }}>Check order</Button>}
        </div>
      </div>
    </div>
  )
}
