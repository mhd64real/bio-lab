import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react'
import { LabStation } from '../scope/LabStation'
import { useScope } from '../scope/useScope'
import { blurAt, initialScope, OBJECTIVE_INFO, focusHeight, type Mount, type ScopeState } from '../scope/model'
import { SPECIMENS } from '../scope/specimens'
import { Button, Choice } from '../ui/kit'
import { play } from '../lib/sound'
import type { ObserveStep } from './steps'
import { currentTask } from './stepKit'
import { Circle, CircleDot } from 'lucide-react'

export interface GuidedScopeProps {
  steps: ObserveStep[]
  mount: Mount
  label?: string
  initial?: () => ScopeState
  onStep?: (i: number) => void
  onDone: () => void
}

// A guided microscope station: one step at a time, only the step's controls unlocked.
// The microscope state is not saved, so a station always starts from step 1.
export function GuidedScope({ steps, mount, label = 'Observe', initial = initialScope, onStep, onDone }: GuidedScopeProps) {
  const OBSERVE_STEPS = steps
  const { state, api, hold } = useScope(initial)
  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [seen, setSeen] = useState<Set<string>>(() => new Set())
  const see = (flag: string) => setSeen((old) => (old.has(flag) ? old : new Set(old).add(flag)))
  const prev = useRef(state)
  const step = OBSERVE_STEPS[index]

  useEffect(() => { hold(mount) }, [mount, hold])

  // Remember things the student has done, for steps that depend on an action rather than a state.
  useEffect(() => {
    const p = prev.current
    // Flags are per step, so they are cleared whenever the step changes.
    if (p.iris !== state.iris) see('irisMoved')
    if (state.stageX > p.stageX + 1e-6) see('movedRight')
    if (p.stageZ !== state.stageZ) see('focusMoved')
    // Which focal planes of a layered specimen the student has brought into focus.
    const z = state.mount ? SPECIMENS[state.mount.specimen]?.layerZ : undefined
    if (z !== undefined && state.objective >= 40) {
      if (blurAt(state, 0) <= 0.004 && blurAt(state, z) > 0.006) see('plane0')
      if (blurAt(state, z) <= 0.004 && blurAt(state, 0) > 0.006) see('plane1')
    }
    prev.current = state
  }, [state])
  useEffect(() => { setSeen(new Set()) }, [index])

  // Living specimens keep moving, so the guide re-checks a few times a second even when nothing is touched.
  const [, tick] = useState(0)
  const live = !!(mount && SPECIMENS[mount.specimen]?.animated)
  useEffect(() => {
    if (!live) return
    const id = window.setInterval(() => tick((n) => n + 1), 200)
    return () => clearInterval(id)
  }, [live])
  const doneNow = step.question ? answered : !!step.done?.(state, seen)
  // Steps with a hold time must stay done that long; leaving the condition restarts the count.
  const holdStart = useRef<number | null>(null)
  const [heldDone, setHeldDone] = useState(false)
  useEffect(() => { setHeldDone(false); holdStart.current = null }, [index])
  let heldFor = 0
  if (step.hold && !heldDone) {
    if (doneNow) { holdStart.current ??= performance.now(); heldFor = (performance.now() - holdStart.current) / 1000 } else holdStart.current = null
  }
  useEffect(() => { if (step.hold && heldFor >= step.hold && !heldDone) setHeldDone(true) })
  const reached = step.hold ? heldDone : doneNow
  const ready = !step.before || step.before(state, seen)

  const wasReached = useRef(false)
  useEffect(() => {
    if (reached && !wasReached.current && !step.question) play('ok')
    wasReached.current = reached
  }, [reached, step])

  const next = () => {
    if (index + 1 >= OBSERVE_STEPS.length) { onDone(); return }
    setIndex(index + 1)
    setAnswered(false)
    onStep?.(index + 1)
  }

  const crashed = state.broken
  const safeToReplace = state.stageZ < focusHeight(state.objective)

  const guide = (
    <div className="grid gap-3">
      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <span className="eyebrow">Step {index + 1} of {OBSERVE_STEPS.length}</span>
          <span className="text-sm font-bold text-[var(--color-muted)]">{label}</span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--color-sunk)]">
          <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${((index + (reached ? 1 : 0)) / OBSERVE_STEPS.length) * 100}%` }} />
        </div>

        {crashed ? (
          <div>
            <h2 className="mb-2 flex items-center gap-2 font-display text-2xl font-bold leading-tight text-[var(--color-danger)]"><AlertTriangle /> The slide cracked</h2>
            <p className="mb-3 leading-relaxed">
              The {OBJECTIVE_INFO[state.objective].label} objective pressed into the slide. Long objectives sit very close to the slide, so raising the stage too far drives the glass into the lens.
            </p>
            <ol className="mb-3 grid gap-2 pl-5 [list-style:decimal]">
              <li className={safeToReplace ? 'text-[var(--color-ok)] line-through' : ''}>Lower the stage with the coarse focus knob.</li>
              <li>Get a fresh slide of the same specimen.</li>
            </ol>
            <Button onClick={api.replace} disabled={!safeToReplace}>Get a fresh slide</Button>
          </div>
        ) : (
          <div>
            <h2 className="mb-2 font-display text-2xl font-bold leading-tight">{step.title}</h2>
            <p className="leading-relaxed">{step.body}</p>
            {step.tasks && (
              <ol className="mt-3 grid gap-1.5">
                {step.tasks.map((t) => {
                  const now = currentTask(step.tasks!, state) === t
                  const ok = t.done(state)
                  return (
                    <li key={t.text} className={`flex items-center gap-2 rounded-xl px-2.5 py-2 font-bold leading-snug ${now ? 'border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)]' : ok ? 'text-[var(--color-ok)]' : 'text-[var(--color-faint)]'}`}>
                      {ok ? <CheckCircle2 size={18} className="flex-none" /> : now ? <CircleDot size={18} className="flex-none text-[#9a6400]" /> : <Circle size={18} className="flex-none" />}
                      {now ? <span>Now: {t.text}</span> : t.text}
                    </li>
                  )
                })}
              </ol>
            )}
            {step.tip && (
              <p className="mt-3 flex gap-2 rounded-xl bg-[var(--color-accent-soft)] p-3 text-[0.95rem] leading-snug">
                <Lightbulb size={18} className="mt-0.5 flex-none text-[#9a6400]" /> {step.tip}
              </p>
            )}
            {step.question && (
              <div className="mt-4">
                {ready ? (
                  <Choice key={step.id} item={step.question} untilCorrect onDone={() => setAnswered(true)} />
                ) : (
                  <p className="rounded-xl bg-[var(--color-sunk)] p-3 font-bold">{step.beforeText}</p>
                )}
              </div>
            )}
            {step.hold && !reached && (
              <div className="mt-3">
                <div className="mb-1 flex justify-between text-sm font-extrabold text-[var(--color-muted)]"><span>{doneNow ? 'In view' : 'Not in view'}</span><span className="tabular-nums">{heldFor.toFixed(1)} / {step.hold} s</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-sunk)]"><div className="h-full rounded-full bg-[var(--color-accent)]" style={{ width: `${Math.min(100, (heldFor / step.hold) * 100)}%` }} /></div>
              </div>
            )}
            {reached && !step.question && (
              <p className="mt-4 flex items-center gap-2 font-extrabold text-[var(--color-ok)]"><CheckCircle2 size={20} /> Done</p>
            )}
            <div className="mt-4 flex justify-end">
              <Button onClick={next} disabled={!reached}>{index + 1 >= OBSERVE_STEPS.length ? 'Finish' : 'Next step'}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <LabStation
      state={state}
      api={api}
      guide={guide}
      highlight={crashed ? ['coarse'] : step.tasks ? (currentTask(step.tasks, state)?.highlight ?? []) : step.highlight}
      lock={crashed ? { allow: ['coarse'] } : step.lock(state)}
      holdingSlide={state.slide === 'none'}
    />
  )
}
