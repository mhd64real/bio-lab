// Generic guided instrument station: a state machine, a live view, a control panel and a photo of the
// instrument with tappable parts. Each guided step unlocks only the controls it needs (by action key).
import { useEffect, useMemo, useReducer, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Circle, CircleDot, Eye, Lightbulb, Lock as LockIcon } from 'lucide-react'
import { Button, Choice, type ChoiceQ } from '../ui/kit'
import { play } from '../lib/sound'
import { art } from '../lab/artKit'

export type Tone = 'ok' | 'warn' | 'bad'
export interface Action { type: string }

export interface PartDef<A extends Action> {
  id: string
  name: string
  job: string
  x: number // hotspot centre, percent of the photo width
  y: number // percent of the photo height
  act?: A // tapping the part performs this action (when unlocked)
}

export interface CtlProps<S, A extends Action> {
  state: S
  act: (a: A) => void
  can: (key: string) => boolean
  hl: (...keys: string[]) => boolean
}

export interface Trouble<A extends Action> {
  title: string
  body: string
  lock: string[]
  highlight: string[]
  fix?: { label: string; action: A; ready: boolean }
}

export interface Instrument<S, A extends Action> {
  name: string
  photo: string
  init(): S
  reduce(s: S, a: A): S
  // Time-based changes (pumping, bleaching). Return the same object when nothing changes.
  tick?(s: S, dt: number): S
  keyOf(a: A): string
  describe(s: S): { tone: Tone; text: string }
  readout(s: S): string[]
  // Things the student did, for steps that depend on an action rather than a state.
  flags?(prev: S, next: S): string[]
  trouble?(s: S): Trouble<A> | null
  View: ComponentType<{ state: S }>
  Controls: ComponentType<CtlProps<S, A>>
  parts: PartDef<A>[]
}

export interface Task<S> { text: string; done: (s: S) => boolean; lock: string[]; highlight: string[] }

export interface Step<S> {
  id: string
  title: string
  body: string
  tip?: string
  highlight: string[]
  lock: (s: S) => string[] | 'all'
  done?: (s: S, seen: Set<string>) => boolean
  question?: ChoiceQ
  before?: (s: S, seen: Set<string>) => boolean
  beforeText?: string
  tasks?: Task<S>[]
}

export const firstTask = <S,>(tasks: Task<S>[], s: S) => tasks.find((t) => !t.done(s)) ?? null

export function checklist<S>(id: string, title: string, body: string, tasks: Task<S>[]): Step<S> {
  return { id, title, body, tasks, highlight: [], lock: (s) => firstTask(tasks, s)?.lock ?? [], done: (s) => tasks.every((t) => t.done(s)) }
}

export function ask<S>(id: string, title: string, body: string, question: ChoiceQ, lock: string[] = []): Step<S> {
  return { id, title, body, question, highlight: [], lock: () => lock }
}

function PhotoPanel<S, A extends Action>({ inst, highlight, can, act, onPart, labels }: { inst: Instrument<S, A>; highlight: string[]; can: (k: string) => boolean; act: (a: A) => void; onPart?: (id: string) => void; labels: boolean }) {
  const [picked, setPicked] = useState<string | null>(null)
  const info = inst.parts.find((p) => p.id === (picked ?? highlight.find((h) => inst.parts.some((p) => p.id === h))))
  return (
    <div className="glow-room grid min-h-0 content-start gap-2 overflow-auto">
    {/* Not clipped, so the pulsing hotspots near the photo's edges stay whole; the photo itself is rounded. */}
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white">
      <div className="relative w-full" style={{ aspectRatio: '720 / 538' }}>
        <img src={art(inst.photo)} alt={inst.name} className="absolute inset-0 h-full w-full rounded-[var(--radius-card)] object-contain" draggable={false} />
        {inst.parts.map((p) => {
          const lit = highlight.includes(p.id)
          const usable = !!p.act && can(inst.keyOf(p.act))
          return (
            <button
              key={p.id}
              type="button"
              aria-label={p.name}
              className={`hotspot ${lit ? 'hotspot-lit' : ''}`}
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
              onClick={() => { setPicked(p.id); onPart?.(p.id); if (p.act && usable) act(p.act) }}
            >
              {(labels || lit) && <span className="hotspot-label">{p.name}</span>}
            </button>
          )
        })}
      </div>
    </div>
    <div className="card">
      {info ? (
        <>
          <div className="font-display text-lg font-bold leading-tight">{info.name}</div>
          <p className="mt-1 leading-snug text-[var(--color-muted)]">{info.job}</p>
        </>
      ) : <p className="leading-snug text-[var(--color-muted)]">Tap a circle on the photo to learn what that part of the {inst.name.toLowerCase()} does.</p>}
    </div>
    </div>
  )
}

export function useInstrument<S, A extends Action>(inst: Instrument<S, A>, init?: () => S) {
  const reducer = (s: S, a: A | { type: '__tick'; dt: number }) => ('dt' in a && a.type === '__tick' ? (inst.tick ? inst.tick(s, a.dt) : s) : inst.reduce(s, a as A))
  const [state, dispatch] = useReducer(reducer, undefined, init ?? inst.init)
  useEffect(() => {
    if (!inst.tick) return
    let last = performance.now()
    const id = window.setInterval(() => { const now = performance.now(); dispatch({ type: '__tick', dt: (now - last) / 1000 }); last = now }, 100)
    return () => clearInterval(id)
  }, [inst])
  return { state, dispatch: dispatch as (a: A) => void }
}

export interface StationProps<S, A extends Action> {
  inst: Instrument<S, A>
  state: S
  dispatch: (a: A) => void
  guide: ReactNode
  highlight: string[]
  lock: string[] | 'all'
  onPart?: (id: string) => void
  labels?: boolean
}

export function InstrumentStation<S, A extends Action>({ inst, state, dispatch, guide, highlight, lock, onPart, labels = false }: StationProps<S, A>) {
  const [toast, setToast] = useState(false)
  const timer = useRef(0)
  const lockKey = JSON.stringify(lock)
  const can = useMemo(() => (k: string) => lock === 'all' || lock.includes(k), [lockKey]) // eslint-disable-line react-hooks/exhaustive-deps
  const act = (a: A) => {
    if (!can(inst.keyOf(a))) {
      setToast(true)
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setToast(false), 1800)
      return
    }
    play('click')
    dispatch(a)
  }
  useEffect(() => () => clearTimeout(timer.current), [])
  const view = inst.describe(state)
  const tone = view.tone === 'ok' ? 'var(--color-ok)' : view.tone === 'warn' ? 'var(--color-accent)' : 'var(--color-danger)'
  const hl = (...keys: string[]) => keys.some((k) => highlight.includes(k))
  const View = inst.View
  const Controls = inst.Controls
  return (
    <div className="station relative">
      {toast && <div className="lock-toast flex items-center gap-2" role="status"><LockIcon size={16} /> Not yet. Follow the current step.</div>}
      <aside className="station-guide">
        <div className="station-guide-card glow-room">{guide}</div>
        <div className="station-controls glow-room"><Controls state={state} act={act} can={can} hl={hl} /></div>
      </aside>
      <section className="station-view" aria-label={inst.name}>
        <div className="min-h-0"><View state={state} /></div>
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2">
          <Eye size={18} style={{ color: tone }} />
          <span className="min-w-0 flex-1 font-bold leading-snug">{view.text}</span>
          {inst.readout(state).map((r) => <span key={r} className="rounded-full bg-[var(--color-sunk)] px-2.5 py-1 text-sm font-extrabold tabular-nums">{r}</span>)}
        </div>
      </section>
      <section className="station-side" aria-label="Instrument">
        <PhotoPanel inst={inst} highlight={highlight} can={can} act={act} onPart={onPart} labels={labels} />
      </section>
    </div>
  )
}

export interface GuidedProps<S, A extends Action> {
  inst: Instrument<S, A>
  steps: Step<S>[]
  label: string
  init?: () => S
  onDone: () => void
}

// One step at a time; only the step's controls are unlocked. Problems the instrument reports
// (a burnt section, a bleached sample) take over the guide until they are fixed.
export function GuidedInstrument<S, A extends Action>({ inst, steps, label, init, onDone }: GuidedProps<S, A>) {
  const { state, dispatch } = useInstrument(inst, init)
  const [index, setIndex] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [seen, setSeen] = useState<Set<string>>(() => new Set())
  const prev = useRef(state)
  const step = steps[index]
  if (import.meta.env.DEV) (window as unknown as { __inst: unknown }).__inst = state

  useEffect(() => {
    const f = inst.flags?.(prev.current, state) ?? []
    prev.current = state
    if (f.length) setSeen((old) => { const n = new Set(old); f.forEach((x) => n.add(x)); return n.size === old.size ? old : n })
  }, [state, inst])
  useEffect(() => { setSeen(new Set()) }, [index])
  // Some flags depend on time passing (a slow scan finishing), so they are re-checked while waiting.
  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => {
    if (!inst.flags) return
    const id = window.setInterval(() => {
      const f = inst.flags!(stateRef.current, stateRef.current)
      if (f.length) setSeen((old) => { const n = new Set(old); f.forEach((x) => n.add(x)); return n.size === old.size ? old : n })
    }, 250)
    return () => clearInterval(id)
  }, [inst, index])

  // Ticked checklist tasks stay ticked, even if a later task changes the state they checked.
  const [latched, setLatched] = useState<Set<number>>(() => new Set())
  useEffect(() => { setLatched(new Set()) }, [index])
  const taskDone = (i: number) => latched.has(i) || !!step.tasks?.[i].done(state)
  useEffect(() => {
    if (!step.tasks) return
    const now = step.tasks.map((t, i) => (latched.has(i) ? -1 : t.done(state) ? i : -1)).filter((i) => i >= 0)
    if (now.length) setLatched((old) => { const n = new Set(old); now.forEach((i) => n.add(i)); return n })
  }, [state, step, latched])
  const trouble = inst.trouble?.(state) ?? null
  const reached = step.question ? answered : step.tasks ? step.tasks.every((_, i) => taskDone(i)) : !!step.done?.(state, seen)
  const ready = !step.before || step.before(state, seen)
  const was = useRef(false)
  useEffect(() => { if (reached && !was.current && !step.question) play('ok'); was.current = reached }, [reached, step])

  const next = () => {
    if (index + 1 >= steps.length) { onDone(); return }
    setIndex(index + 1); setAnswered(false)
  }
  const currentIndex = step.tasks ? step.tasks.findIndex((_, i) => !taskDone(i)) : -1
  const current = step.tasks && currentIndex >= 0 ? step.tasks[currentIndex] : null

  const guide = (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <span className="eyebrow">Step {index + 1} of {steps.length}</span>
        <span className="text-sm font-bold text-[var(--color-muted)]">{label}</span>
      </div>
      <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--color-sunk)]">
        <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${((index + (reached ? 1 : 0)) / steps.length) * 100}%` }} />
      </div>
      {trouble ? (
        <div>
          <h2 className="mb-2 flex items-center gap-2 font-display text-2xl font-bold leading-tight text-[var(--color-danger)]"><AlertTriangle /> {trouble.title}</h2>
          <p className="mb-3 leading-relaxed">{trouble.body}</p>
          {trouble.fix && <Button onClick={() => dispatch(trouble.fix!.action)} disabled={!trouble.fix.ready}>{trouble.fix.label}</Button>}
        </div>
      ) : (
        <div>
          <h2 className="mb-2 font-display text-2xl font-bold leading-tight">{step.title}</h2>
          <p className="leading-relaxed">{step.body}</p>
          {step.tasks && (
            <ol className="mt-3 grid gap-1.5">
              {step.tasks.map((t, i) => {
                const now = current === t
                const ok = taskDone(i)
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
              {ready ? <Choice key={step.id} item={step.question} untilCorrect onDone={() => setAnswered(true)} /> : <p className="rounded-xl bg-[var(--color-sunk)] p-3 font-bold">{step.beforeText}</p>}
            </div>
          )}
          {reached && !step.question && <p className="mt-4 flex items-center gap-2 font-extrabold text-[var(--color-ok)]"><CheckCircle2 size={20} /> Done</p>}
          <div className="mt-4 flex justify-end">
            <Button onClick={next} disabled={!reached}>{index + 1 >= steps.length ? 'Finish' : 'Next step'}</Button>
          </div>
        </div>
      )}
    </div>
  )

  const highlight = trouble ? trouble.highlight : current ? current.highlight : step.highlight
  const lock = trouble ? trouble.lock : current ? current.lock : step.tasks ? [] : step.lock(state)
  return <InstrumentStation inst={inst} state={state} dispatch={dispatch} guide={guide} highlight={highlight} lock={lock} />
}
