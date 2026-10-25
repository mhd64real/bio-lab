import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import { LabStation } from '../../scope/LabStation'
import { useScope } from '../../scope/useScope'
import { initialScope } from '../../scope/model'
import { PART_INFO, type PartId } from '../../scope/Microscope3D'
import { Button } from '../../ui/kit'
import { play } from '../../lib/sound'

const REQUIRED: PartId[] = ['eyepiece', 'arm', 'nosepiece', 'objectives', 'stage', 'clips', 'stageKnobs', 'iris', 'lamp', 'coarse', 'fine', 'base']

export function PartsTour({ onDone }: { onDone: () => void }) {
  const { state, api } = useScope(initialScope)
  const [found, setFound] = useState<Set<PartId>>(new Set())
  const [current, setCurrent] = useState<PartId | null>(null)
  const [labels, setLabels] = useState(false)

  const learn = (p: PartId) => {
    setCurrent(p)
    if (!found.has(p)) {
      if (REQUIRED.includes(p)) play('ok')
      setFound(new Set(found).add(p))
    }
  }
  const count = REQUIRED.filter((p) => found.has(p)).length
  const all = count === REQUIRED.length

  const guide = (
    <div className="card">
      <span className="eyebrow">Meet the microscope</span>
      <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">Find every part</h2>
      <p className="mb-3 leading-relaxed">Tap each part on the 3D microscope to learn what it does. You can also tap a name in the list to see where it is.</p>
      {current && (
        <div className="mb-3 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-3">
          <div className="font-display text-lg font-bold leading-tight">{PART_INFO[current].name}</div>
          <p className="mt-1 leading-snug">{PART_INFO[current].job}</p>
        </div>
      )}
      <div className="mb-2 flex items-center justify-between text-sm font-bold text-[var(--color-muted)]">
        <span>Found {count} of {REQUIRED.length}</span>
      </div>
      <ul className="grid grid-cols-2 gap-1.5">
        {REQUIRED.map((p) => (
          <li key={p}>
            <button type="button" onClick={() => learn(p)} className={`flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-sm font-bold leading-tight ${current === p ? 'bg-[var(--color-accent-soft)]' : 'hover:bg-[var(--color-sunk)]'}`}>
              {found.has(p) ? <CheckCircle2 size={16} className="flex-none text-[var(--color-ok)]" /> : <Circle size={16} className="flex-none text-[var(--color-faint)]" />}
              {PART_INFO[p].name}
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex justify-end">
        <Button onClick={onDone} disabled={!all}>{all ? 'Next: prepare a slide' : `Find ${REQUIRED.length - count} more`}</Button>
      </div>
    </div>
  )

  return (
    <LabStation
      state={state}
      api={api}
      guide={guide}
      highlight={current ? [current] : []}
      labels={labels}
      onToggleLabels={() => setLabels(!labels)}
      onPart={learn}
    />
  )
}
