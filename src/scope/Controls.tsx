import { useEffect, useRef, type ReactNode } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ChevronUp, Lock as LockIcon, Power } from 'lucide-react'
import { OBJECTIVES, OBJECTIVE_INFO, type ScopeState } from './model'
import type { ScopeApi } from './useScope'
import type { PartId } from './Microscope3D'
import { canObjective, canUse, UNLOCKED, type Lock } from './lock'

// Speeds ramp up the longer a control is held, so a short tap makes a small move.
const ramp = (held: number, full: number) => Math.min(1, held / full) ** 2

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

function HoldButton({ step, label, children, kbd, className = '', disabled }: { step: (dt: number, held: number) => void; label: string; children: ReactNode; kbd?: string; className?: string; disabled?: boolean }) {
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

function Slider({ value, onChange, label, colour, attention, disabled }: { value: number; onChange: (v: number) => void; label: string; colour: string; attention?: boolean; disabled?: boolean }) {
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

function Group({ title, children, attention, locked }: { title: string; children: ReactNode; attention?: boolean; locked?: boolean }) {
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
  const coarse = (dir: number) => (dt: number, held: number) => api.coarse(dir * (500 + 2600 * ramp(held, 1.6)) * dt)
  const fine = (dir: number) => (dt: number, held: number) => api.fine(dir * (2.5 + 110 * ramp(held, 3)) * dt)
  const move = (dx: number, dy: number) => (dt: number, held: number) => {
    const v = fov * (0.25 + 0.9 * ramp(held, 1.5)) * dt
    api.stage(dx * v, dy * v)
  }
  const canMove = state.slide === 'clipped' && can('stage')

  return (
    <div className="ctl-pad">
      <Group title="Light" attention={hl('power', 'brightness', 'iris', 'lamp')} locked={!can('lamp') && !can('brightness') && !can('iris')}>
        <button type="button" disabled={!can('lamp')} className={`ctl-btn w-full justify-center ${state.lampOn ? 'ctl-on' : ''} ${hl('power') ? 'attention' : ''}`} onClick={api.lamp} aria-pressed={state.lampOn}>
          <Power size={20} /> {state.lampOn ? 'Lamp on' : 'Lamp off'} <span className="kbd ml-1">L</span>
        </button>
        <div className="mt-2 grid gap-1">
          <Slider label="Brightness" value={state.brightness} onChange={api.brightness} colour="var(--color-accent)" attention={hl('brightness')} disabled={!can('brightness')} />
          <Slider label="Iris diaphragm" value={state.iris} onChange={api.iris} colour="var(--color-accent)" attention={hl('iris')} disabled={!can('iris')} />
        </div>
      </Group>

      <Group title="Objective lens" attention={hl('nosepiece', 'objectives')} locked={!can('objective')}>
        <div className="grid grid-cols-3 gap-2">
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
        <p className="mt-2 text-center text-sm text-[var(--color-muted)]">
          Total magnification <b className="text-[var(--color-ink)]">{10 * state.objective}x</b>
        </p>
      </Group>

      <Group title="Focus" attention={hl('coarse', 'fine')} locked={!can('coarse') && !can('fine')}>
        <div className="grid grid-cols-2 gap-2">
          <div className={`grid gap-2 rounded-[var(--radius-control)] ${hl('coarse') ? 'attention' : ''}`}>
            <span className="ctl-sub" style={{ color: 'var(--color-primary)' }}>Coarse</span>
            <HoldButton step={coarse(1)} label="Coarse focus, raise stage" kbd="PgUp" className="ctl-coarse" disabled={!can('coarse')}><ChevronUp size={20} />Up</HoldButton>
            <HoldButton step={coarse(-1)} label="Coarse focus, lower stage" kbd="PgDn" className="ctl-coarse" disabled={!can('coarse')}><ChevronDown size={20} />Down</HoldButton>
          </div>
          <div className={`grid gap-2 rounded-[var(--radius-control)] ${hl('fine') ? 'attention' : ''}`}>
            <span className="ctl-sub" style={{ color: '#2f9c82' }}>Fine</span>
            <HoldButton step={fine(1)} label="Fine focus, raise stage" kbd="]" className="ctl-fine" disabled={!can('fine')}><ChevronUp size={20} />Up</HoldButton>
            <HoldButton step={fine(-1)} label="Fine focus, lower stage" kbd="[" className="ctl-fine" disabled={!can('fine')}><ChevronDown size={20} />Down</HoldButton>
          </div>
        </div>
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
        {state.slide !== 'none' && can('remove') && (
          <button type="button" className="mt-2 w-full rounded-[var(--radius-control)] py-2 text-sm font-bold text-[var(--color-muted)] hover:bg-[var(--color-sunk)]" onClick={api.remove}>
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
        const v = fov * (0.25 + 0.9 * ramp(h, 1.5)) * dt
        if (key === 'ArrowLeft') api.stage(-v, 0)
        if (key === 'ArrowRight') api.stage(v, 0)
        if (key === 'ArrowUp') api.stage(0, v)
        if (key === 'ArrowDown') api.stage(0, -v)
        if (key === 'PageUp') api.coarse((500 + 2600 * ramp(h, 1.6)) * dt)
        if (key === 'PageDown') api.coarse(-(500 + 2600 * ramp(h, 1.6)) * dt)
        if (key === ']') api.fine((2.5 + 110 * ramp(h, 3)) * dt)
        if (key === '[') api.fine(-(2.5 + 110 * ramp(h, 3)) * dt)
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
          if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) }
        }
        return
      }
      if (e.repeat) return
      if (e.key === '1') api.objective(4)
      if (e.key === '2') api.objective(10)
      if (e.key === '3') api.objective(40)
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
