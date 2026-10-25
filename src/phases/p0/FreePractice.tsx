import { useEffect } from 'react'
import { LabStation } from '../../scope/LabStation'
import { useScope } from '../../scope/useScope'
import { initialScope, type Mount } from '../../scope/model'
import { Button } from '../../ui/kit'

const MOUNT: Mount = { specimen: 'letter-e', bubbles: [] }

// Unlocked after the orientation: every control works, nothing is checked.
export function FreePractice({ onBack }: { onBack: () => void }) {
  const { state, api, hold } = useScope(initialScope)
  useEffect(() => { hold(MOUNT) }, [hold])
  const guide = (
    <div className="card">
      <span className="eyebrow">Free practice</span>
      <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">Everything is unlocked</h2>
      <p className="mb-3 leading-relaxed">Use the microscope however you like. Nothing is marked here, and mistakes have real results, so the slide can still crack.</p>
      <ul className="mb-4 grid gap-1.5 pl-5 text-[0.95rem] leading-snug [list-style:disc]">
        <li>Start on 4x, find the letter with coarse focus.</li>
        <li>Fine focus only at 10x and 40x.</li>
        <li>Close the iris a little if the image looks washed out.</li>
      </ul>
      {state.broken && <Button variant="soft" onClick={api.replace} className="mb-3 w-full">Get a fresh slide</Button>}
      <Button variant="ghost" onClick={onBack}>Back</Button>
    </div>
  )
  return <LabStation state={state} api={api} guide={guide} holdingSlide={state.slide === 'none'} />
}
