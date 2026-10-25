import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Lock as LockIcon } from 'lucide-react'
import { Eye, Tags } from 'lucide-react'
import { OpticalView } from './OpticalView'
import { StageView } from './StageView'
import { Microscope3D, type PartId } from './Microscope3D'
import { Controls, useScopeKeys } from './Controls'
import { describeView, OBJECTIVE_INFO, type ScopeState } from './model'
import type { ScopeApi } from './useScope'
import { canObjective, canUse, UNLOCKED, type Allow, type Lock } from './lock'

export interface LabStationProps {
  state: ScopeState
  api: ScopeApi
  guide: ReactNode
  highlight?: PartId[]
  labels?: boolean
  onToggleLabels?: () => void
  onPart?: (p: PartId) => void
  holdingSlide?: boolean
  showView?: boolean
  lock?: Lock
  lockedMessage?: string
  // Show the stage from the side instead of the eyepiece (lining up the specimen by eye).
  stageView?: boolean
  // A centre cross over the eyepiece view.
  reticle?: boolean
}

// Wraps the microscope so locked controls do nothing, wherever they are touched: buttons, 3D model or keyboard.
function useGuardedApi(api: ScopeApi, lock: Lock, deny: () => void): ScopeApi {
  return useMemo(() => {
    const g = <A extends unknown[]>(k: Allow, f: (...a: A) => void) => (...a: A) => (canUse(lock, k) ? f(...a) : deny())
    return {
      ...api,
      lamp: g('lamp', api.lamp),
      brightness: g('brightness', api.brightness),
      iris: g('iris', api.iris),
      // 'coarseDown' allows lowering the stage only, which can never hit the lens.
      coarse: (dz) => (canUse(lock, 'coarse') || (canUse(lock, 'coarseDown') && dz < 0) ? api.coarse(dz) : deny()),
      fine: g('fine', api.fine),
      stage: g('stage', api.stage),
      stageTap: g('place', api.stageTap),
      clip: g('clip', api.clip),
      remove: g('remove', api.remove),
      oil: g('oil', api.oil),
      phase: g('phase', api.phase),
      cleanLens: g('clean', api.cleanLens),
      objective: (o) => (canObjective(lock, o) ? api.objective(o) : deny()),
    }
  }, [api, lock, deny])
}

// The eyepiece, with an optional centre cross to aim at.
function OptView({ state, reticle }: { state: ScopeState; reticle: boolean }) {
  return (
    <div className="relative h-full">
      <OpticalView state={state} />
      {reticle && (
        <svg viewBox="-50 -50 100 100" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
          <circle r={4.5} fill="none" stroke="#f2a516" strokeWidth={0.6} strokeDasharray="1.6 1.2" />
          <path d="M-9 0 H-5.5 M5.5 0 H9 M0 -9 V-5.5 M0 5.5 V9" stroke="#f2a516" strokeWidth={0.7} strokeLinecap="round" />
        </svg>
      )}
    </div>
  )
}

export function LabStation({ state, api: rawApi, guide, highlight = [], labels = false, onToggleLabels, onPart, holdingSlide = false, showView = true, lock = UNLOCKED, lockedMessage = 'Not yet. Follow the current step.', stageView = false, reticle = false }: LabStationProps) {
  const [toast, setToast] = useState(false)
  const toastTimer = useRef(0)
  const deny = useMemo(() => () => {
    if (!lockedMessage) return
    setToast(true)
    clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(false), 1800)
  }, [lockedMessage])
  useEffect(() => () => clearTimeout(toastTimer.current), [])
  // Steps build a new lock object each render; keep one per distinct value so held keys are not dropped.
  const lockKey = JSON.stringify(lock)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableLock = useMemo(() => lock, [lockKey])
  const api = useGuardedApi(rawApi, stableLock, deny)
  useScopeKeys(state, api)
  const view = describeView(state)
  const wheelAcc = useRef(0)
  const tone = view.tone === 'ok' ? 'var(--color-ok)' : view.tone === 'warn' ? 'var(--color-accent)' : 'var(--color-danger)'

  return (
    <div className="station relative">
      {toast && <div className="lock-toast flex items-center gap-2" role="status"><LockIcon size={16} /> {lockedMessage}</div>}
      <aside className="station-guide">
        <div className="station-guide-card">{guide}</div>
        <div className="station-controls">
          <Controls state={state} api={api} highlight={highlight} holdingSlide={holdingSlide} lock={stableLock} />
        </div>
      </aside>

      <section className="station-view" aria-label="Eyepiece">
        <div
          className="relative min-h-0"
          onWheel={(e) => {
            // Scroll on the eyepiece to fine focus, hold Shift for coarse.
            wheelAcc.current += e.deltaY
            const d = -wheelAcc.current
            wheelAcc.current = 0
            if (e.shiftKey) api.coarse(d * 6)
            else api.fine(d * 0.05)
          }}
        >
          {!showView ? <div className="grid h-full place-items-center text-[var(--color-muted)]">The eyepiece view opens in the next part.</div>
            : stageView ? <StageView state={state} api={api} /> : <OptView state={state} reticle={reticle} />}
        </div>
        {showView && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2">
            <Eye size={18} style={{ color: tone }} />
            <span className="min-w-0 flex-1 font-bold leading-snug">{stageView ? 'Lining up by eye: move the slide until the specimen is over the light hole.' : view.text}</span>
            <span className="rounded-full bg-[var(--color-sunk)] px-2.5 py-1 text-sm font-extrabold tabular-nums">
              {10 * state.objective}x
            </span>
            <span className="rounded-full bg-[var(--color-sunk)] px-2.5 py-1 text-sm font-bold tabular-nums text-[var(--color-muted)]">
              field {OBJECTIVE_INFO[state.objective].fov} mm
            </span>
          </div>
        )}
      </section>

      <section className="station-side" aria-label="Microscope">
        <div className="station-scope">
          <Suspense fallback={null}>
            <Microscope3D state={state} on={api} highlight={highlight} labels={labels} onPart={onPart} />
          </Suspense>
          {onToggleLabels && (
            <button type="button" className="icon-btn absolute left-2 top-2" aria-pressed={labels} onClick={onToggleLabels}>
              <Tags size={18} /> Labels
            </button>
          )}
          <p className="pointer-events-none absolute bottom-2 left-0 right-0 text-center text-xs font-bold text-[var(--color-faint)]">
            Drag knobs to turn them. Drag empty space to look around.
          </p>
        </div>
      </section>
    </div>
  )
}
