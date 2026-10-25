import { useEffect, useState } from 'react'
import { LabStation } from '../scope/LabStation'
import { useScope } from '../scope/useScope'
import { initialScope, type Mount } from '../scope/model'
import { Button } from '../ui/kit'

export interface PracticeSlide { name: string; mount: Mount }

// Unlocked after a phase: every control works, nothing is checked.
export function FreePractice({ slides, onBack }: { slides: PracticeSlide[]; onBack: () => void }) {
  const { state, api, hold } = useScope(initialScope)
  const [chosen, setChosen] = useState(0)
  useEffect(() => { hold(slides[chosen].mount) }, [hold, slides, chosen])
  const guide = (
    <div className="card">
      <span className="eyebrow">Free practice</span>
      <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">Everything is unlocked</h2>
      <p className="mb-3 leading-relaxed">Use the microscope however you like. Nothing is marked here, and mistakes have real results, so slides can still crack.</p>
      {slides.length > 1 && (
        <div className="mb-3">
          <p className="mb-1.5 text-sm font-extrabold text-[var(--color-muted)]">Slide to place {state.slide !== 'none' && '(take the current one off first)'}</p>
          <div className="grid gap-1.5">
            {slides.map((s, i) => (
              <button key={s.name} type="button" disabled={state.slide !== 'none'} onClick={() => setChosen(i)} className={`choice ${chosen === i ? 'choice-right' : ''}`}>{s.name}</button>
            ))}
          </div>
        </div>
      )}
      {state.broken && <Button variant="soft" onClick={api.replace} className="mb-3 w-full">Get a fresh slide</Button>}
      <Button variant="ghost" onClick={onBack}>Back</Button>
    </div>
  )
  return <LabStation state={state} api={api} guide={guide} holdingSlide={state.slide === 'none'} />
}
