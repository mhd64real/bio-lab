import { useState } from 'react'
import { Button, Choice, type ChoiceQ } from '../ui/kit'

// End-of-phase check: the first answer to each question counts.
export function Quiz({ items, onDone }: { items: ChoiceQ[]; onDone: (got: number, total: number) => void }) {
  const CHECK = items
  const [i, setI] = useState(0)
  const [got, setGot] = useState(0)
  const [answered, setAnswered] = useState<boolean | null>(null)
  const last = i === CHECK.length - 1
  return (
    <div className="mx-auto grid max-w-2xl gap-4 p-4">
      <div className="card">
        <div className="mb-3 flex items-center justify-between">
          <span className="eyebrow">Quick check, question {i + 1} of {CHECK.length}</span>
          <span className="text-sm font-bold text-[var(--color-muted)]">Your first answer counts</span>
        </div>
        <Choice key={i} item={CHECK[i]} onDone={(ok) => { setAnswered(ok); if (ok) setGot(got + 1) }} />
        <div className="mt-4 flex justify-end">
          <Button
            disabled={answered === null}
            onClick={() => {
              if (last) { onDone(got, CHECK.length); return }
              setI(i + 1); setAnswered(null)
            }}
          >
            {last ? 'See my result' : 'Next question'}
          </Button>
        </div>
      </div>
    </div>
  )
}
