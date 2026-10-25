import { useEffect, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { CheckCircle2, Clock, Droplet, Droplets, Flame, FlaskConical, Hand, Lightbulb, Pipette, RotateCcw, Scissors, Square, Trash2, Wand2, type LucideIcon } from 'lucide-react'
import { Button } from '../ui/kit'
import { play } from '../lib/sound'
import type { Bubble, Mount } from '../scope/model'

export type ToolId =
  | 'knife' | 'forceps' | 'water' | 'iodine' | 'methylene' | 'swab' | 'bin' | 'loop' | 'flame'
  | 'crystal' | 'gramIodine' | 'alcohol' | 'safranin' | 'rinse' | 'blot' | 'coverslip'

export const TOOLS: Record<ToolId, { name: string; icon: LucideIcon; colour: string }> = {
  knife: { name: 'Knife', icon: Scissors, colour: '#5a6779' },
  forceps: { name: 'Forceps', icon: Hand, colour: '#5a6779' },
  water: { name: 'Water dropper', icon: Pipette, colour: '#3a9fe0' },
  iodine: { name: 'Iodine stain', icon: Pipette, colour: '#c58a12' },
  methylene: { name: 'Methylene blue', icon: Pipette, colour: '#2f5fc4' },
  swab: { name: 'Cotton swab', icon: Wand2, colour: '#8a96a8' },
  bin: { name: 'Disinfectant', icon: Trash2, colour: '#d93f45' },
  loop: { name: 'Inoculating loop', icon: Wand2, colour: '#b07a2a' },
  flame: { name: 'Burner flame', icon: Flame, colour: '#e8590c' },
  crystal: { name: 'Crystal violet', icon: Pipette, colour: '#6b2fb3' },
  gramIodine: { name: "Gram's iodine", icon: Pipette, colour: '#8a5a12' },
  alcohol: { name: 'Alcohol (decolouriser)', icon: FlaskConical, colour: '#7c8a9e' },
  safranin: { name: 'Safranin', icon: Pipette, colour: '#d6336c' },
  rinse: { name: 'Water rinse', icon: Droplets, colour: '#3a9fe0' },
  blot: { name: 'Blotting paper', icon: Square, colour: '#8a96a8' },
  coverslip: { name: 'Coverslip', icon: Droplet, colour: '#7fb0cc' },
}

export interface PrepStep {
  id: string
  title: string
  body: string
  tip?: string
  tool: ToolId
  // tap: one press. timer: press, then wait `seconds` (shown on a fast clock). repeat: press `times`.
  // hold: press and hold; the time held is the outcome. lower: lower the coverslip with the slider.
  kind: 'tap' | 'timer' | 'repeat' | 'hold' | 'lower'
  seconds?: number
  times?: number
  // For hold: the right window, in seconds.
  window?: [number, number]
}

export interface PrepOutcome {
  flags: Set<string>
  bubbles: Bubble[]
  held: Record<string, number>
}

export interface PrepDef {
  name: string
  steps: PrepStep[]
  Slide: ComponentType<{ flags: Set<string>; bubbles: Bubble[]; active: string | null }>
  mount(o: PrepOutcome): Mount
  // What went wrong, if anything, in plain words. Null when the slide is good.
  verdict(o: PrepOutcome): ReactNode | null
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
  const [count, setCount] = useState(0)
  const [clock, setClock] = useState<number | null>(null) // seconds elapsed on a timed step
  const [holding, setHolding] = useState<number | null>(null)
  const [angle, setAngle] = useState(45)
  const [finished, setFinished] = useState(false)
  const samples = useRef<{ from: number; t: number }[]>([])
  const raf = useRef(0)
  const step = def.steps[index]
  const tool = TOOLS[step.tool]

  const complete = () => {
    setFlags((f) => new Set(f).add(step.id))
    play('ok')
    window.setTimeout(() => {
      setCount(0); setClock(null); setHolding(null); setAngle(45); samples.current = []
      if (index + 1 >= def.steps.length) setFinished(true)
      else setIndex(index + 1)
    }, 650)
  }

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  const runTimer = () => {
    const total = step.seconds ?? 60
    const t0 = performance.now()
    const tick = (now: number) => {
      const e = Math.min(total, ((now - t0) / 1000 / FAST_CLOCK) * total)
      setClock(e)
      if (e < total) raf.current = requestAnimationFrame(tick)
      else complete()
    }
    raf.current = requestAnimationFrame(tick)
  }

  const press = () => {
    if (flags.has(step.id) || clock !== null) return
    if (step.kind === 'tap') { play('drop'); complete() }
    else if (step.kind === 'timer') { play('drop'); setFlags((f) => new Set(f).add(`${step.id}:started`)); runTimer() }
    else if (step.kind === 'repeat') {
      play('click')
      const n = count + 1
      setCount(n)
      if (n >= (step.times ?? 3)) complete()
    }
  }

  const holdStart = () => {
    if (step.kind !== 'hold' || flags.has(step.id)) return
    const t0 = performance.now()
    setHolding(0)
    const tick = (now: number) => { setHolding((now - t0) / 1000); raf.current = requestAnimationFrame(tick) }
    raf.current = requestAnimationFrame(tick)
  }
  const holdEnd = () => {
    if (step.kind !== 'hold' || holding === null) return
    cancelAnimationFrame(raf.current)
    setHeld((h) => ({ ...h, [step.id]: holding }))
    complete()
  }

  const lower = (a: number) => {
    const now = performance.now()
    samples.current.push({ from: angle, t: now })
    samples.current = samples.current.filter((s) => now - s.t < 200)
    setAngle(a)
    if (a <= 0) {
      const first = samples.current[0]
      const span = Math.max(0.1, (now - first.t) / 1000 + 0.016)
      setBubbles(makeBubbles((first.from - a) / span))
      complete()
    }
  }

  const redo = () => {
    setIndex(0); setFlags(new Set()); setBubbles([]); setHeld({}); setFinished(false); setCount(0); setClock(null); setHolding(null); setAngle(45)
  }

  const outcome: PrepOutcome = { flags, bubbles, held }
  const verdict = finished ? def.verdict(outcome) : null
  const Icon = tool.icon
  const busy = clock !== null || flags.has(step.id)

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
              {flags.has(step.id) && <p className="mt-4 flex items-center gap-2 font-extrabold text-[var(--color-ok)]"><CheckCircle2 size={20} /> Done</p>}
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
        <div className="grid min-h-0 place-items-center p-2">
          <def.Slide flags={flags} bubbles={bubbles} active={finished ? null : step.id} />
        </div>
        <div className="grid gap-3 border-t border-[var(--color-line)] p-3">
          {!finished && step.kind === 'lower' && (
            <div className="prep-lower">
              <span className="text-sm font-extrabold text-[var(--color-muted)]">Down</span>
              <input
                type="range" min={0} max={45} step={1} value={angle}
                onChange={(e) => lower(Number(e.target.value))}
                aria-label="Lower the coverslip"
                className="ctl-range prep-range attention"
                style={{ ['--fill' as string]: `${(angle / 45) * 100}%`, ['--tint' as string]: 'var(--color-primary)' }}
              />
              <span className="text-sm font-extrabold text-[var(--color-muted)]">Raised</span>
            </div>
          )}
          {!finished && step.kind === 'timer' && clock !== null && (
            <div className="flex items-center justify-center gap-3 font-display text-2xl font-bold tabular-nums">
              <Clock className="text-[var(--color-primary)]" />
              {fmt(clock)} <span className="text-base text-[var(--color-muted)]">of {fmt(step.seconds ?? 60)}</span>
            </div>
          )}
          {!finished && step.kind === 'hold' && (
            <div className="text-center">
              <div className="font-display text-3xl font-bold tabular-nums">{(holding ?? 0).toFixed(1)} s</div>
              <div className="text-sm font-bold text-[var(--color-muted)]">Press and hold the {tool.name.toLowerCase()}, let go to stop.</div>
            </div>
          )}
          {!finished && step.kind === 'repeat' && (
            <div className="text-center font-display text-xl font-bold">{count} of {step.times ?? 3}</div>
          )}
          <div className="prep-tray">
            {!finished && step.kind !== 'lower' && (
              <button
                type="button"
                className={`prep-tool ${busy ? '' : 'attention'}`}
                style={{ ['--tool' as string]: tool.colour }}
                disabled={busy && step.kind !== 'hold'}
                onClick={step.kind === 'hold' ? undefined : press}
                onPointerDown={step.kind === 'hold' ? (e) => { e.currentTarget.setPointerCapture(e.pointerId); holdStart() } : undefined}
                onPointerUp={step.kind === 'hold' ? holdEnd : undefined}
                onPointerCancel={step.kind === 'hold' ? holdEnd : undefined}
                onKeyDown={step.kind === 'hold' ? (e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); holdStart() } } : undefined}
                onKeyUp={step.kind === 'hold' ? (e) => { if (e.key === ' ' || e.key === 'Enter') holdEnd() } : undefined}
              >
                <Icon size={28} />
                <span>{toolVerb(step)}</span>
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function fmt(sec: number) {
  const s = Math.floor(sec)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function toolVerb(step: PrepStep) {
  const name = TOOLS[step.tool].name
  if (step.kind === 'hold') return `Hold: ${name}`
  if (step.kind === 'repeat') return `${name} (pass ${step.times ?? 3} times)`
  return `Use: ${name}`
}
