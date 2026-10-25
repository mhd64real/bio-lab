import { createContext, useContext, useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { CheckCircle2, Clock, Lightbulb, RotateCcw } from 'lucide-react'
import { Button } from '../ui/kit'
import { play } from '../lib/sound'
import type { Bubble, Mount } from '../scope/model'

export interface PrepStep {
  id: string
  title: string
  body: string
  tip?: string
  // What to act on, shown under the scene (e.g. "Tap the onion").
  action: string
  // tap: one press. timer: press, then wait `seconds` on a fast clock. repeat: press `times`.
  // hold: press and hold; the time held is the outcome. drag: drag the slider to the end.
  // lower: lower the coverslip with the slider (speed decides air bubbles).
  kind: 'tap' | 'timer' | 'repeat' | 'hold' | 'drag' | 'lower'
  seconds?: number
  times?: number
}

export interface PrepOutcome {
  flags: Set<string>
  bubbles: Bubble[]
  held: Record<string, number>
}

export interface SceneProps {
  flags: Set<string>
  active: string | null
  // Progress of the current step, 0 to 1 (timer, drag, hold, repeat, lower).
  progress: number
  angle: number
  bubbles: Bubble[]
}

export interface PrepDef {
  name: string
  steps: PrepStep[]
  Scene: ComponentType<SceneProps>
  mount(o: PrepOutcome): Mount
  verdict(o: PrepOutcome): ReactNode | null
}

// Scenes mark their clickable objects with <Hot id="stepId">; only the current step's object responds.
interface HotCtx { active: string | null; act(): void; holdStart(): void; holdEnd(): void; kind: PrepStep['kind'] | null }
const Ctx = createContext<HotCtx>({ active: null, act() {}, holdStart() {}, holdEnd() {}, kind: null })

export function Hot({ id, children, ring }: { id: string | string[]; children: ReactNode; ring?: { cx: number; cy: number; r: number } }) {
  const c = useContext(Ctx)
  const on = c.active !== null && (Array.isArray(id) ? id.includes(c.active) : id === c.active)
  const hold = on && c.kind === 'hold'
  const tappable = on && (c.kind === 'tap' || c.kind === 'timer' || c.kind === 'repeat')
  return (
    <g
      className={on ? 'hot-on' : undefined}
      style={{ cursor: tappable || hold ? 'pointer' : undefined }}
      onClick={tappable ? c.act : undefined}
      onPointerDown={hold ? (e) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); c.holdStart() } : undefined}
      onPointerUp={hold ? c.holdEnd : undefined}
      onPointerCancel={hold ? c.holdEnd : undefined}
    >
      {on && ring && <circle cx={ring.cx} cy={ring.cy} r={ring.r} className="hot-ring" />}
      {children}
    </g>
  )
}

function makeBubbles(speed: number): Bubble[] {
  const n = speed > 140 ? 4 + Math.floor(Math.random() * 3) : speed > 60 ? 1 + Math.floor(Math.random() * 2) : 0
  return Array.from({ length: n }, () => ({ x: (Math.random() - 0.5) * 3.2, y: (Math.random() - 0.5) * 3.2, r: 0.1 + Math.random() * 0.35 }))
}

const FAST_CLOCK = 2.6 // real seconds a timed wait takes on screen, however long it is in the lab

export function PrepRunner({ def, onDone }: { def: PrepDef; onDone: (mount: Mount) => void }) {
  const [index, setIndex] = useState(0)
  const [flags, setFlags] = useState<Set<string>>(() => new Set())
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [held, setHeld] = useState<Record<string, number>>({})
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(false)
  const [holding, setHolding] = useState<number | null>(null)
  const [angle, setAngle] = useState(45)
  const [finished, setFinished] = useState(false)
  const samples = useRef<{ from: number; t: number }[]>([])
  const raf = useRef(0)
  const advancing = useRef(false)
  const step = def.steps[index]

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const complete = () => {
    if (advancing.current) return
    advancing.current = true
    setFlags((f) => new Set(f).add(step.id))
    play('ok')
    window.setTimeout(() => {
      advancing.current = false
      setProgress(0); setRunning(false); setHolding(null); setAngle(45); samples.current = []
      if (index + 1 >= def.steps.length) setFinished(true)
      else setIndex(index + 1)
    }, 700)
  }

  const act = () => {
    if (finished || flags.has(step.id) || running) return
    if (step.kind === 'tap') { play('drop'); setProgress(1); complete() }
    else if (step.kind === 'timer') {
      play('drop')
      setRunning(true)
      setFlags((f) => new Set(f).add(`${step.id}:started`))
      const t0 = performance.now()
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / 1000 / FAST_CLOCK)
        setProgress(p)
        if (p < 1) raf.current = requestAnimationFrame(tick)
        else complete()
      }
      raf.current = requestAnimationFrame(tick)
    } else if (step.kind === 'repeat') {
      play('click')
      const n = Math.round(progress * (step.times ?? 3)) + 1
      setProgress(n / (step.times ?? 3))
      if (n >= (step.times ?? 3)) complete()
    }
  }

  const holdStart = () => {
    if (step.kind !== 'hold' || flags.has(step.id) || holding !== null) return
    const t0 = performance.now()
    setHolding(0)
    const tick = (now: number) => { const e = (now - t0) / 1000; setHolding(e); setProgress(Math.min(1, e / 10)); raf.current = requestAnimationFrame(tick) }
    raf.current = requestAnimationFrame(tick)
  }
  const holdEnd = () => {
    if (step.kind !== 'hold' || holding === null) return
    cancelAnimationFrame(raf.current)
    setHeld((h) => ({ ...h, [step.id]: holding }))
    complete()
  }

  const drag = (v: number) => {
    setProgress(v / 100)
    if (v >= 100) complete()
  }

  const lower = (a: number) => {
    const now = performance.now()
    samples.current.push({ from: angle, t: now })
    samples.current = samples.current.filter((s) => now - s.t < 200)
    setAngle(a)
    setProgress(1 - a / 45)
    if (a <= 0) {
      const first = samples.current[0]
      const span = Math.max(0.1, (now - first.t) / 1000 + 0.016)
      setBubbles(makeBubbles((first.from - a) / span))
      play('drop')
      complete()
    }
  }

  const redo = () => {
    cancelAnimationFrame(raf.current)
    setIndex(0); setFlags(new Set()); setBubbles([]); setHeld({}); setFinished(false); setProgress(0); setRunning(false); setHolding(null); setAngle(45)
  }

  const outcome: PrepOutcome = { flags, bubbles, held }
  const verdict = finished ? def.verdict(outcome) : null
  const doneNow = flags.has(step.id)

  return (
    <div className="station prep">
      <aside className="station-guide">
        <div className="card station-guide-card">
          <div className="mb-2 flex items-center justify-between">
            <span className="eyebrow">{def.name}</span>
            <span className="text-sm font-bold text-[var(--color-muted)]">{finished ? 'Done' : `Step ${index + 1} of ${def.steps.length}`}</span>
          </div>
          <div className="mb-3 h-2 overflow-hidden rounded-full bg-[var(--color-sunk)]">
            <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${((finished ? def.steps.length : index) / def.steps.length) * 100}%` }} />
          </div>
          {!finished ? (
            <>
              <h2 className="mb-2 font-display text-2xl font-bold leading-tight">{step.title}</h2>
              <p className="leading-relaxed">{step.body}</p>
              {step.tip && (
                <p className="mt-3 flex gap-2 rounded-xl bg-[var(--color-accent-soft)] p-3 text-[0.95rem] leading-snug">
                  <Lightbulb size={18} className="mt-0.5 flex-none text-[#9a6400]" /> {step.tip}
                </p>
              )}
              {doneNow && <p className="mt-4 flex items-center gap-2 font-extrabold text-[var(--color-ok)]"><CheckCircle2 size={20} /> Done</p>}
            </>
          ) : (
            <>
              <h2 className="mb-2 font-display text-2xl font-bold leading-tight">Your slide is ready</h2>
              {verdict ?? <p className="flex gap-2 leading-relaxed"><CheckCircle2 className="mt-0.5 flex-none text-[var(--color-ok)]" /> A good slide. Nothing went wrong.</p>}
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={redo}><RotateCcw size={18} /> Make it again</Button>
                <Button onClick={() => onDone(def.mount(outcome))}>Take it to the microscope</Button>
              </div>
            </>
          )}
        </div>
      </aside>

      <section className="prep-bench card" aria-label="Lab bench">
        <Ctx.Provider value={{ active: finished || doneNow ? null : step.id, act, holdStart, holdEnd, kind: finished ? null : step.kind }}>
          <div className="min-h-0">
            <def.Scene flags={flags} active={finished ? null : step.id} progress={finished ? 1 : progress} angle={angle} bubbles={bubbles} />
          </div>
        </Ctx.Provider>
        {!finished && (
          <div className="prep-action">
            {step.kind === 'timer' && running ? (
              <span className="flex items-center gap-2 font-display text-2xl font-bold tabular-nums">
                <Clock className="text-[var(--color-primary)]" /> {fmt(progress * (step.seconds ?? 60))} <span className="text-base text-[var(--color-muted)]">of {fmt(step.seconds ?? 60)}</span>
              </span>
            ) : step.kind === 'drag' || step.kind === 'lower' ? (
              <div className="prep-lower w-full">
                <span className="text-sm font-extrabold text-[var(--color-muted)]">{step.kind === 'lower' ? 'Down' : 'Start'}</span>
                {step.kind === 'lower' ? (
                  <input type="range" min={0} max={45} step={1} value={angle} onChange={(e) => lower(Number(e.target.value))} aria-label={step.action}
                    className="ctl-range prep-range attention" style={{ ['--fill' as string]: `${(angle / 45) * 100}%`, ['--tint' as string]: 'var(--color-primary)' }} />
                ) : (
                  <input type="range" min={0} max={100} step={1} value={Math.round(progress * 100)} onChange={(e) => drag(Number(e.target.value))} aria-label={step.action} disabled={doneNow}
                    className="ctl-range prep-range attention" style={{ ['--fill' as string]: `${progress * 100}%`, ['--tint' as string]: 'var(--color-primary)' }} />
                )}
                <span className="text-sm font-extrabold text-[var(--color-muted)]">{step.kind === 'lower' ? 'Raised' : 'End'}</span>
              </div>
            ) : (
              <span className="flex flex-wrap items-center justify-center gap-3">
                {!(step.kind === 'hold' && holding !== null) && <span className="text-lg font-extrabold">{step.action}</span>}
                {step.kind === 'repeat' && <span className="rounded-full bg-[var(--color-sunk)] px-3 py-1 font-bold tabular-nums">{Math.round(progress * (step.times ?? 3))} of {step.times ?? 3}</span>}
                {step.kind !== 'hold' && (
                  <button type="button" className="btn btn-ghost" onClick={act} disabled={doneNow || running}>Do it</button>
                )}
                {step.kind === 'hold' && holding !== null && (
                  <span className="font-display text-2xl font-bold tabular-nums">{holding.toFixed(1)} s <span className="text-base text-[var(--color-muted)]">let go to stop</span></span>
                )}
                {/* The hold button stays mounted while held, so letting go is always detected. */}
                {step.kind === 'hold' && (
                  <button type="button" className="btn btn-ghost" onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); holdStart() }} onPointerUp={holdEnd} onPointerCancel={holdEnd}
                    onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); holdStart() } }} onKeyUp={(e) => { if (e.key === ' ' || e.key === 'Enter') holdEnd() }}>
                    Press and hold
                  </button>
                )}
              </span>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function fmt(sec: number) {
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
