import { useState, type ReactNode } from 'react'
import { CheckCircle2, Square, SquareCheck, XCircle } from 'lucide-react'
import { Button } from '../ui/kit'
import { play } from '../lib/sound'

export interface Reason { text: string; supports: boolean; why: string }

// Justify a claim: tick every statement that supports it, and none that do not. On checking, every statement
// shows whether it was judged right, with the reason. Reports how many statements were judged right first time.
export function ClaimTask({ eyebrow, title, claim, reasons, onDone, doneLabel = 'Next' }: { eyebrow: string; title: string; claim: ReactNode; reasons: Reason[]; onDone: (rightFirst: number) => void; doneLabel?: string }) {
  const [tick, setTick] = useState<Set<number>>(() => new Set())
  const [checked, setChecked] = useState(false)
  const [first, setFirst] = useState<number | null>(null)
  const ok = (i: number) => tick.has(i) === reasons[i].supports
  const all = reasons.every((_, i) => ok(i))
  return (
    <div className="mx-auto grid max-w-3xl gap-4 p-4">
      <div className="card">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">{title}</h2>
        <blockquote className="mb-3 rounded-xl border-l-4 border-[var(--color-primary)] bg-[var(--color-sunk)] p-3 text-lg font-bold">{claim}</blockquote>
        <p className="mb-3 leading-relaxed">Tick <b>every</b> statement that helps justify it. Leave the others unticked.</p>
        <div className="grid gap-2">
          {reasons.map((r, i) => (
            <button key={r.text} type="button" onClick={() => { const n = new Set(tick); if (n.has(i)) n.delete(i); else n.add(i); setTick(n); setChecked(false) }}
              className={`grid gap-1 rounded-xl border-2 p-3 text-left ${checked ? (ok(i) ? 'border-[var(--color-ok)] bg-[var(--color-ok-soft)]' : 'border-[var(--color-danger)] bg-[var(--color-danger-soft)]') : tick.has(i) ? 'border-[var(--color-primary)] bg-white' : 'border-[var(--color-line)] bg-white'}`}>
              <span className="flex items-start gap-2 font-bold leading-snug">
                {tick.has(i) ? <SquareCheck size={20} className="mt-0.5 flex-none text-[var(--color-primary)]" /> : <Square size={20} className="mt-0.5 flex-none text-[var(--color-faint)]" />}
                <span className="flex-1">{r.text}</span>
                {checked && (ok(i) ? <CheckCircle2 size={18} className="flex-none text-[var(--color-ok)]" /> : <XCircle size={18} className="flex-none text-[var(--color-danger)]" />)}
              </span>
              {checked && ok(i) && <span className="pl-7 text-[0.95rem] leading-snug text-[var(--color-muted)]">{r.why}</span>}
            </button>
          ))}
        </div>
        {checked && !all && <p className="mt-3 rounded-xl bg-[var(--color-danger-soft)] p-3 font-bold">Think again about the red ones, then check again.</p>}
        <div className="mt-4 flex justify-end">
          {checked && all
            ? <Button onClick={() => onDone(first ?? 0)}>{doneLabel}</Button>
            : <Button disabled={tick.size === 0} onClick={() => { setChecked(true); if (first === null) setFirst(reasons.filter((_, i) => ok(i)).length); play(all ? 'ok' : 'click') }}>Check</Button>}
        </div>
      </div>
    </div>
  )
}
