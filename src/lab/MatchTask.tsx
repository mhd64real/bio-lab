import { useMemo, useState, type ReactNode } from 'react'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '../ui/kit'
import { play } from '../lib/sound'

export interface MatchPair { left: string; right: string }

// Pair each item on the left with one on the right: tap a left item, then its partner. Tapping a paired item
// again unpairs it. Wrong pairs turn red on checking. Reports how many pairs were right on the first check.
export function MatchTask({ eyebrow, title, intro, pairs, leftLabel, rightLabel, onDone, doneLabel = 'Next', after }: {
  eyebrow: string; title: string; intro: ReactNode; pairs: MatchPair[]; leftLabel: string; rightLabel: string
  onDone: (rightFirst: number) => void; doneLabel?: string; after?: ReactNode
}) {
  // Right-hand items in a fixed shuffled order.
  const order = useMemo(() => pairs.map((_, i) => i).sort((a, b) => ((a * 7919 + 3) % 17) - ((b * 7919 + 3) % 17)), [pairs])
  const [link, setLink] = useState<Record<number, number>>({}) // left index -> right index
  const [sel, setSel] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const [first, setFirst] = useState<number | null>(null)
  const owner = (r: number) => Number(Object.keys(link).find((l) => link[Number(l)] === r) ?? -1)
  const ok = (l: number) => link[l] === l
  const complete = pairs.every((_, l) => link[l] !== undefined)
  const all = pairs.every((_, l) => ok(l))
  const tapLeft = (l: number) => {
    if (link[l] !== undefined) { const n = { ...link }; delete n[l]; setLink(n); setChecked(false); return }
    setSel(sel === l ? null : l)
  }
  const tapRight = (r: number) => {
    const o = owner(r)
    if (o >= 0) { const n = { ...link }; delete n[o]; setLink(n); setChecked(false); return }
    if (sel === null) return
    setLink({ ...link, [sel]: r }); setSel(null); setChecked(false); play('click')
  }
  const tag = (l: number) => <span className="grid h-6 w-6 flex-none place-items-center rounded-full bg-[var(--color-primary)] text-xs font-extrabold text-white">{l + 1}</span>
  return (
    <div className="mx-auto grid max-w-5xl gap-4 p-4">
      <div className="card">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">{title}</h2>
        <div className="mb-4 leading-relaxed">{intro}</div>
        <div className="grid gap-4 md:grid-cols-[minmax(200px,0.7fr)_1.3fr]">
          <div className="grid content-start gap-1.5">
            <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-muted)]">{leftLabel}</span>
            {pairs.map((p, l) => (
              <button key={p.left} type="button" onClick={() => tapLeft(l)}
                className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left font-bold ${checked && link[l] !== undefined ? (ok(l) ? 'border-[var(--color-ok)] bg-[var(--color-ok-soft)]' : 'border-[var(--color-danger)] bg-[var(--color-danger-soft)]') : sel === l ? 'attention border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : link[l] !== undefined ? 'border-[var(--color-primary)] bg-white' : 'border-[var(--color-line)] bg-white'}`}>
                {link[l] !== undefined ? tag(l) : <span className="h-6 w-6 flex-none rounded-full border-2 border-dashed border-[var(--color-line)]" />}
                <span className="flex-1">{p.left}</span>
                {checked && link[l] !== undefined && (ok(l) ? <CheckCircle2 size={18} className="text-[var(--color-ok)]" /> : <XCircle size={18} className="text-[var(--color-danger)]" />)}
              </button>
            ))}
          </div>
          <div className="grid content-start gap-1.5">
            <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-muted)]">{rightLabel}</span>
            {order.map((r) => {
              const o = owner(r)
              return (
                <button key={r} type="button" onClick={() => tapRight(r)} disabled={o < 0 && sel === null}
                  className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 text-left text-[0.95rem] font-semibold leading-snug disabled:cursor-default ${o >= 0 ? 'border-[var(--color-primary)] bg-[var(--color-sunk)]' : sel !== null ? 'border-[var(--color-accent)] bg-white' : 'border-[var(--color-line)] bg-white'}`}>
                  {o >= 0 ? tag(o) : <span className="h-6 w-6 flex-none" />}
                  <span className="flex-1">{pairs[r].right}</span>
                </button>
              )
            })}
          </div>
        </div>
        <p className="mt-3 text-sm font-bold text-[var(--color-muted)]">{sel !== null ? `Now tap the match for "${pairs[sel].left}".` : 'Tap an item on the left, then its match on the right. Tap a matched item to undo it.'}</p>
        {checked && !all && <p className="mt-3 rounded-xl bg-[var(--color-danger-soft)] p-3 font-bold">Tap the red items to undo them, then match them again.</p>}
        {checked && all && after}
        <div className="mt-4 flex justify-end">
          {checked && all
            ? <Button onClick={() => onDone(first ?? 0)}>{doneLabel}</Button>
            : <Button disabled={!complete} onClick={() => { setChecked(true); if (first === null) setFirst(pairs.filter((_, l) => ok(l)).length); play(all ? 'ok' : 'click') }}>Check answers</Button>}
        </div>
      </div>
    </div>
  )
}
