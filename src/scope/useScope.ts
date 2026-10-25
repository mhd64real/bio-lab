import { useEffect, useMemo, useReducer, useRef } from 'react'
import { play } from '../lib/sound'
import { scopeReducer, type Mount, type ScopeState } from './model'
import type { ScopeHandlers } from './Microscope3D'

export interface ScopeApi extends ScopeHandlers {
  place(mount: Mount): void
  remove(): void
  replace(): void
}

export function useScope(init: () => ScopeState) {
  const [state, dispatch] = useReducer(scopeReducer, undefined, init)
  const prev = useRef(state)
  const mountRef = useRef<Mount | null>(state.mount)

  // Dev builds expose the state for the walkthrough script in tools/walk.mjs.
  if (import.meta.env.DEV) (window as unknown as { __scope: ScopeState }).__scope = state

  useEffect(() => {
    const p = prev.current
    prev.current = state
    if (p.lampOn !== state.lampOn) play('switch')
    if (p.objective !== state.objective) play('click')
    if (!p.broken && state.broken) play('crack')
    if (p.slide !== 'clipped' && state.slide === 'clipped') play('clip')
    if (p.slide === 'none' && state.slide !== 'none') play('slide')
    if (p.stageZ !== state.stageZ || p.stageX !== state.stageX || p.stageY !== state.stageY) play('tick')
  }, [state])

  const api = useMemo<ScopeApi>(() => ({
    coarse: (dz) => dispatch({ type: 'coarse', dz }),
    fine: (dz) => dispatch({ type: 'fine', dz }),
    objective: (to) => dispatch({ type: 'objective', to }),
    lamp: () => dispatch({ type: 'lamp' }),
    brightness: (value) => dispatch({ type: 'brightness', value }),
    iris: (value) => dispatch({ type: 'iris', value }),
    stage: (dx, dy) => dispatch({ type: 'stage', dx, dy }),
    stageTap: () => { if (mountRef.current) dispatch({ type: 'placeSlide', mount: mountRef.current }) },
    clip: () => dispatch({ type: 'clip' }),
    place: (mount) => { mountRef.current = mount; dispatch({ type: 'placeSlide', mount }) },
    remove: () => dispatch({ type: 'removeSlide' }),
    replace: () => dispatch({ type: 'replaceSlide' }),
  }), [])

  // The slide the student is holding, ready to place on the stage.
  const hold = (mount: Mount) => { mountRef.current = mount }

  return { state, api, hold }
}
