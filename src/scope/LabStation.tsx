import { Suspense, useRef, type ReactNode } from 'react'
import { Eye, Tags } from 'lucide-react'
import { OpticalView } from './OpticalView'
import { Microscope3D, type PartId } from './Microscope3D'
import { Controls, useScopeKeys } from './Controls'
import { describeView, OBJECTIVE_INFO, type ScopeState } from './model'
import type { ScopeApi } from './useScope'

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
}

export function LabStation({ state, api, guide, highlight = [], labels = false, onToggleLabels, onPart, holdingSlide = false, showView = true }: LabStationProps) {
  useScopeKeys(state, api)
  const view = describeView(state)
  const wheelAcc = useRef(0)
  const tone = view.tone === 'ok' ? 'var(--color-ok)' : view.tone === 'warn' ? 'var(--color-accent)' : 'var(--color-danger)'

  return (
    <div className="station">
      <aside className="station-guide">
        <div className="station-guide-card">{guide}</div>
        <div className="station-controls">
          <Controls state={state} api={api} highlight={highlight} holdingSlide={holdingSlide} />
        </div>
      </aside>

      <section className="station-view" aria-label="Eyepiece">
        <div
          className="min-h-0"
          onWheel={(e) => {
            // Scroll on the eyepiece to fine focus, hold Shift for coarse.
            wheelAcc.current += e.deltaY
            const d = -wheelAcc.current
            wheelAcc.current = 0
            if (e.shiftKey) api.coarse(d * 6)
            else api.fine(d * 0.05)
          }}
        >
          {showView ? <OpticalView state={state} /> : <div className="grid h-full place-items-center text-[var(--color-muted)]">The eyepiece view opens in the next part.</div>}
        </div>
        {showView && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2">
            <Eye size={18} style={{ color: tone }} />
            <span className="min-w-0 flex-1 font-bold leading-snug">{view.text}</span>
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
