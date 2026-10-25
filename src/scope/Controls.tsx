import { useEffect, useRef, type ReactNode } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ChevronUp, Lock as LockIcon, Power } from 'lucide-react'
import { focusHeight, OBJECTIVES, OBJECTIVE_INFO, optics, type Objective, type ScopeState } from './model'
import type { ScopeApi } from './useScope'
import type { PartId } from './Microscope3D'
import { canObjective, canUse, UNLOCKED, type Lock } from './lock'

// Moving a specimen: a tap nudges it a small fixed step; holding waits a moment, then moves at a steady,
// gentle speed (no speeding up, which makes people overshoot). Both scale with the field of view.
// Returns the distance to move this frame. held is 0 on the first call of a press.
export const STAGE_NUDGE = 0.05 // fraction of the field of view per tap
export const stageStep = (fov: number, dt: number, held: number) => steady(fov * STAGE_NUDGE, fov * 0.5, dt, held)
// The same for any control: nudge on the first call of a press, a pause, then a steady speed (units per second).
export const steady = (nudge: number, speed: number, dt: number, held: number) => (held === 0 ? nudge : held < 0.25 ? 0 : speed * dt)
// Focus. Coarse: a fixed, brisk pace (micrometres). Fine: scaled by the lens's depth of field, so the in-focus
// zone takes about the same time to cross with every lens.
export const coarseStep = (dt: number, held: number) => steady(150, 2000, dt, held)
export const fineStep = (o: Objective, dt: number, held: number) => steady(OBJECTIVE_INFO[o].dof * 0.6, OBJECTIVE_INFO[o].dof * 4, dt, held)

function useHold(step: (dt: number, held: number) => void) {
  const raf = useRef(0)
  const stepRef = useRef(step)
  stepRef.current = step
  const stop = () => { cancelAnimationFrame(raf.current); raf.current = 0 }
  const start = () => {
    stop()
    const t0 = performance.now()
    let last = t0
    // A first small step right away, so a tap always does something.
    stepRef.current(1 / 30, 0)
    const loop = (now: number) => {
      stepRef.current(Math.min(0.05, (now - last) / 1000), (now - t0) / 1000)
      last = now
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
  }
  useEffect(() => stop, [])
  return { start, stop }
}

export function HoldButton({ step, label, children, kbd, className = '', disabled }: { step: (dt: number, held: number) => void; label: string; children: ReactNode; kbd?: string; className?: string; disabled?: boolean }) {
  const { start, stop } = useHold(step)
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      className={`ctl-btn ${className}`}
      onPointerDown={(e) => { if (disabled) return; e.currentTarget.setPointerCapture(e.pointerId); start() }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onLostPointerCapture={stop}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.preventDefault(); start() } }}
      onKeyUp={(e) => { if (e.key === 'Enter' || e.key === ' ') stop() }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
      {kbd && <span className="kbd ml-auto">{kbd}</span>}
    </button>
  )
}

export function Slider({ value, onChange, label, colour, attention, disabled }: { value: number; onChange: (v: number) => void; label: string; colour: string; attention?: boolean; disabled?: boolean }) {
  return (
    <label className={`block rounded-[var(--radius-control)] ${attention ? 'attention' : ''} ${disabled ? 'ctl-locked' : ''}`}>
      <span className="flex items-baseline justify-between text-sm font-bold text-[var(--color-muted)]">
        {label}
        <span className="tabular-nums text-[var(--color-ink)]">{Math.round(value * 100)}%</span>
      </span>
      <input
        type="range" min={0} max={100} step={1}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        disabled={disabled}
        className="ctl-range mt-1 w-full"
        style={{ ['--fill' as string]: `${value * 100}%`, ['--tint' as string]: colour }}
      />
    </label>
  )
}

export function Group({ title, children, attention, locked }: { title: string; children: ReactNode; attention?: boolean; locked?: boolean }) {
  const ref = useRef<HTMLElement>(null)
  // Bring the control the guide is pointing at into view when the pad is scrolled.
  useEffect(() => { if (attention) ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }) }, [attention])
  return (
    <section ref={ref} className={`ctl-group ${attention ? 'attention' : ''} ${locked ? 'ctl-group-locked' : ''}`}>
      <h3 className="ctl-title flex items-center gap-1.5">{title}{locked && <LockIcon size={14} className="text-[var(--color-faint)]" aria-label="Locked for this step" />}</h3>
      {children}
    </section>
  )
}

export interface ControlsProps {
  state: ScopeState
  api: ScopeApi
  highlight?: PartId[]
  holdingSlide: boolean
  lock?: Lock
}

export function Controls({ state, api, highlight = [], holdingSlide, lock = UNLOCKED }: ControlsProps) {
  const hl = (...ids: PartId[]) => ids.some((i) => highlight.includes(i))
  const can = (k: Parameters<typeof canUse>[1]) => canUse(lock, k)
  const fov = OBJECTIVE_INFO[state.objective].fov
  const coarse = (dir: number) => (dt: number, held: number) => { const v = coarseStep(dt, held); if (v) api.coarse(dir * v) }
  const fine = (dir: number) => (dt: number, held: number) => { const v = fineStep(state.objective, dt, held); if (v) api.fine(dir * v) }
  const move = (dx: number, dy: number) => (dt: number, held: number) => {
    const v = stageStep(fov, dt, held)
    if (v) api.stage(dx * v, dy * v)
  }
  const canMove = state.slide === 'clipped' && can('stage')
  // Focus guide: shown while focusing is allowed with a slide on the stage. The button the student needs
  // glows (raise below focus, lower above it); when only lowering is allowed, that is the one.
  const focusing = state.slide !== 'none' && !state.broken && (can('coarse') || can('fine'))
  const showGuide = focusing
  const defocus = state.stageZ - focusHeight(state.objective)
  const sharp = optics(state).blur <= 0.004
  const glow = hl('coarse') && !can('coarse') && can('coarseDown') ? 'coarseDown'
    : hl('coarse') && can('coarse') && optics(state).blur > 0.05 ? (defocus < 0 ? 'coarseUp' : 'coarseDown')
    : hl('fine') && can('fine') && !sharp ? (defocus < 0 ? 'fineUp' : 'fineDown')
    : null

  return (
    <div className="ctl-pad">
      <Group title="Light" attention={hl('power', 'brightness', 'iris', 'lamp')} locked={!can('lamp') && !can('brightness') && !can('iris')}>
        <button type="button" disabled={!can('lamp')} className={`ctl-btn w-full justify-center ${state.lampOn ? 'ctl-on' : ''} ${hl('power') ? 'attention' : ''}`} onClick={api.lamp} aria-pressed={state.lampOn}>
          <Power size={20} /> {state.lampOn ? 'Lamp on' : 'Lamp off'} <span className="kbd ml-1">L</span>
        </button>
        {(can('phase') || state.phase || lock.allow === 'all') && (
          <button type="button" disabled={!can('phase')} className={`ctl-btn mt-2 w-full justify-center ${state.phase ? 'ctl-on' : ''} ${hl('condenser') ? 'attention' : ''}`} onClick={api.phase} aria-pressed={state.phase}>
            Condenser: {state.phase ? 'Phase contrast' : 'Brightfield'}
          </button>
        )}
        <div className="mt-2 grid gap-1">
          <Slider label="Brightness" value={state.brightness} onChange={api.brightness} colour="var(--color-accent)" attention={hl('brightness')} disabled={!can('brightness')} />
          <Slider label="Iris diaphragm" value={state.iris} onChange={api.iris} colour="var(--color-accent)" attention={hl('iris')} disabled={!can('iris')} />
        </div>
      </Group>

      <Group title="Objective lens" attention={hl('nosepiece', 'objectives')} locked={!can('objective') && !can('clean')}>
        <div className="grid grid-cols-4 gap-1.5">
          {OBJECTIVES.map((o, i) => (
            <button
              key={o} type="button"
              className={`ctl-obj ${state.objective === o ? 'ctl-obj-on' : ''}`}
              style={{ ['--ring' as string]: OBJECTIVE_INFO[o].colour }}
              onClick={() => api.objective(o)}
              disabled={!canObjective(lock, o) && state.objective !== o}
              aria-pressed={state.objective === o}
            >
              <span className="ctl-ring" />
              {OBJECTIVE_INFO[o].label}
              <span className="kbd">{i + 1}</span>
            </button>
          ))}
        </div>
        {(state.lensOily || can('clean')) && (
          <button type="button" disabled={!can('clean') || !state.lensOily} className={`ctl-btn mt-2 w-full justify-center ${can('clean') && state.lensOily ? 'attention' : ''}`} onClick={api.cleanLens}>
            {state.lensOily ? 'Wipe the 100x lens with lens paper' : '100x lens is clean'}
          </button>
        )}
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          Total magnification <b className="text-[var(--color-ink)]">{10 * state.objective}x</b>
        </p>
      </Group>

      <Group title="Focus" attention={hl('coarse', 'fine')} locked={!can('coarse') && !can('fine') && !can('coarseDown')}>
        <div className="ctl-focus grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.6rem] gap-2">
          <div className="grid gap-2">
            <span className="ctl-sub" style={{ color: 'var(--color-primary)' }}>Coarse</span>
            <HoldButton step={coarse(1)} label="Coarse focus, raise stage" kbd="PgUp" className={`ctl-coarse ${glow === 'coarseUp' ? 'attention' : ''}`} disabled={!can('coarse')}><ChevronUp size={20} />Up</HoldButton>
            <HoldButton step={coarse(-1)} label="Coarse focus, lower stage" kbd="PgDn" className={`ctl-coarse ${glow === 'coarseDown' ? 'attention' : ''}`} disabled={!can('coarse') && !can('coarseDown')}><ChevronDown size={20} />Down</HoldButton>
          </div>
          <div className="grid gap-2">
            <span className="ctl-sub" style={{ color: '#2f9c82' }}>Fine</span>
            <HoldButton step={fine(1)} label="Fine focus, raise stage" kbd="]" className={`ctl-fine ${glow === 'fineUp' ? 'attention' : ''}`} disabled={!can('fine')}><ChevronUp size={20} />Up</HoldButton>
            <HoldButton step={fine(-1)} label="Fine focus, lower stage" kbd="[" className={`ctl-fine ${glow === 'fineDown' ? 'attention' : ''}`} disabled={!can('fine')}><ChevronDown size={20} />Down</HoldButton>
          </div>
          {showGuide && <FocusGauge state={state} />}
        </div>
        {showGuide && <FocusHint state={state} />}
      </Group>

      <Group title="Slide" attention={hl('stage', 'clips', 'stageKnobs')} locked={!can('place') && !can('clip') && !can('stage') && !can('remove')}>
        {state.slide === 'none' && (
          <button type="button" className={`ctl-btn w-full justify-center ${hl('stage') ? 'attention' : ''}`} disabled={!holdingSlide || !can('place')} onClick={api.stageTap}>
            {holdingSlide ? 'Place slide on stage' : 'No slide to place'}
          </button>
        )}
        {state.slide === 'loose' && (
          <button type="button" disabled={!can('clip')} className={`ctl-btn w-full justify-center ${hl('clips') ? 'attention' : ''}`} onClick={api.clip}>Clip the slide in</button>
        )}
        {state.slide === 'clipped' && (
          <div className={`ctl-dpad rounded-[var(--radius-control)] ${hl('stageKnobs') ? 'attention' : ''}`}>
            <span />
            <HoldButton step={move(0, 1)} label="Move slide away from you" disabled={!canMove}><ArrowUp size={20} /></HoldButton>
            <span />
            <HoldButton step={move(-1, 0)} label="Move slide left" disabled={!canMove}><ArrowLeft size={20} /></HoldButton>
            <span className="grid place-items-center text-xs font-bold text-[var(--color-faint)]">move<br />slide</span>
            <HoldButton step={move(1, 0)} label="Move slide right" disabled={!canMove}><ArrowRight size={20} /></HoldButton>
            <span />
            <HoldButton step={move(0, -1)} label="Move slide towards you" disabled={!canMove}><ArrowDown size={20} /></HoldButton>
            <span />
          </div>
        )}
        {state.slide === 'clipped' && (can('oil') || state.oil) && (
          <button type="button" disabled={!can('oil') || state.oil} className={`ctl-btn mt-2 w-full justify-center ${can('oil') && !state.oil ? 'attention' : ''}`} onClick={api.oil}>
            {state.oil ? 'Immersion oil added' : 'Add a drop of immersion oil'}
          </button>
        )}
        {state.slide !== 'none' && can('remove') && (
          <button type="button" className={`ctl-btn mt-2 w-full justify-center ${lock.allow !== 'all' ? 'attention' : ''}`} onClick={api.remove}>
            Take the slide off
          </button>
        )}
      </Group>
    </div>
  )
}

// Keyboard: arrows move the slide, PageUp/PageDown coarse, [ ] fine, 1 2 3 objectives, L lamp.
export function useScopeKeys(state: ScopeState, api: ScopeApi, enabled = true) {
  const held = useRef(new Map<string, number>())
  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => {
    if (!enabled) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const fov = OBJECTIVE_INFO[stateRef.current.objective].fov
      held.current.forEach((t0, key) => {
        const h = (now - t0) / 1000
        const v = stageStep(fov, dt, Math.max(h, 1e-6))
        if (key === 'ArrowLeft') api.stage(-v, 0)
        if (key === 'ArrowRight') api.stage(v, 0)
        if (key === 'ArrowUp') api.stage(0, v)
        if (key === 'ArrowDown') api.stage(0, -v)
        const hh = Math.max(h, 1e-6)
        if (key === 'PageUp') api.coarse(coarseStep(dt, hh))
        if (key === 'PageDown') api.coarse(-coarseStep(dt, hh))
        if (key === ']') api.fine(fineStep(stateRef.current.objective, dt, hh))
        if (key === '[') api.fine(-fineStep(stateRef.current.objective, dt, hh))
      })
      raf = held.current.size ? requestAnimationFrame(tick) : 0
    }
    const continuous = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', '[', ']'])
    const down = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, textarea, [contenteditable]')) return
      if (continuous.has(e.key)) {
        e.preventDefault()
        if (!held.current.has(e.key)) {
          held.current.set(e.key, performance.now())
          // A key press nudges the slide straight away, like a tap on the button.
          const n = stageStep(OBJECTIVE_INFO[stateRef.current.objective].fov, 0, 0)
          if (e.key === 'ArrowLeft') api.stage(-n, 0)
          if (e.key === 'ArrowRight') api.stage(n, 0)
          if (e.key === 'ArrowUp') api.stage(0, n)
          if (e.key === 'ArrowDown') api.stage(0, -n)
          const o = stateRef.current.objective
          if (e.key === 'PageUp') api.coarse(coarseStep(0, 0))
          if (e.key === 'PageDown') api.coarse(-coarseStep(0, 0))
          if (e.key === ']') api.fine(fineStep(o, 0, 0))
          if (e.key === '[') api.fine(-fineStep(o, 0, 0))
          if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) }
        }
        return
      }
      if (e.repeat) return
      if (e.key === '1') api.objective(4)
      if (e.key === '2') api.objective(10)
      if (e.key === '3') api.objective(40)
      if (e.key === '4') api.objective(100)
      if (e.key === 'l' || e.key === 'L') api.lamp()
    }
    const up = (e: KeyboardEvent) => { held.current.delete(e.key) }
    const blur = () => held.current.clear()
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      cancelAnimationFrame(raf)
      held.current.clear()
    }
  }, [api, enabled])
}

// How far the slide is from focus: a vertical gauge with the in-focus band in the middle and the lens at the
// top. The scale is logarithmic, so both a centimetre and a micrometre away are readable.
function FocusGauge({ state }: { state: ScopeState }) {
  const info = OBJECTIVE_INFO[state.objective]
  const d = state.stageZ - focusHeight(state.objective)
  const range = Math.log10(1 + 12000 / info.dof)
  const pos = Math.sign(d) * Math.min(1, Math.log10(1 + Math.abs(d) / info.dof) / range)
  const top = 50 - pos * 32 // stays between the Lens and Slide labels
  const sharp = optics(state).blur <= 0.004
  return (
    <div className="relative w-full rounded-[var(--radius-control)] bg-[var(--color-sunk)]" aria-label="Focus guide" role="img">
      <span className="absolute left-0 right-0 top-1 text-center text-[0.65rem] font-extrabold uppercase text-[var(--color-muted)]">Lens</span>
      <div className="absolute left-1/2 top-5 h-1.5 w-6 -translate-x-1/2 rounded-sm bg-[#64748b]" />
      <div className="absolute left-1 right-1 rounded bg-[var(--color-ok-soft)]" style={{ top: 'calc(50% - 9px)', height: 18, border: '2px solid var(--color-ok)' }} />
      <div className="absolute left-1/2 h-2 w-8 -translate-x-1/2 rounded-sm border-2 border-[#7fb0cc] bg-[#d6ecf7] transition-[top] duration-100" style={{ top: `calc(${top}% - 4px)`, boxShadow: sharp ? '0 0 0 3px rgba(34,180,85,0.45)' : undefined }} />
      <span className="absolute bottom-1 left-0 right-0 text-center text-[0.65rem] font-extrabold uppercase text-[var(--color-muted)]">Slide</span>
    </div>
  )
}

function FocusHint({ state }: { state: ScopeState }) {
  const o = optics(state)
  const d = state.stageZ - focusHeight(state.objective)
  const text = o.blur <= 0.004 ? 'In focus.'
    : d < 0 ? (o.blur > 0.05 ? 'The slide is below focus: raise the stage (Up).' : 'Almost: raise the stage a little (Up).')
    : (o.blur > 0.05 ? 'Past focus: lower the stage (Down).' : 'Just past focus: lower the stage a little (Down).')
  return <p className={`mt-2 text-center text-sm font-extrabold ${o.blur <= 0.004 ? 'text-[var(--color-ok)]' : 'text-[var(--color-muted)]'}`}>{text}</p>
}
