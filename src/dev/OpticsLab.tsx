// Developer page for tuning the optics: #/dev/optics?obj=40&z=15000&x=0&y=0
import { useReducer } from 'react'
import { OpticalView } from '../scope/OpticalView'
import { initialScope, scopeReducer, focusHeight, type Objective, type SpecimenId } from '../scope/model'

export function OpticsLab() {
  const q = new URLSearchParams(location.hash.split('?')[1] ?? '')
  const obj = Number(q.get('obj') ?? 4) as Objective
  const init = {
    ...initialScope(),
    lampOn: q.get('lamp') !== '0',
    brightness: Number(q.get('b') ?? 0.7),
    iris: Number(q.get('iris') ?? 0.6),
    objective: obj,
    stageZ: focusHeight(obj) + Number(q.get('dz') ?? 0),
    stageX: Number(q.get('x') ?? 0),
    stageY: Number(q.get('y') ?? 0),
    slide: q.get('slide') === '0' ? 'none' as const : 'clipped' as const,
    broken: q.get('broken') === '1',
    oil: q.get('oil') !== '0',
    mount: { specimen: (q.get('sp') ?? 'letter-e') as SpecimenId, variant: Number(q.get('var') ?? 0), bubbles: q.get('bubbles') === '1' ? [{ x: 0.9, y: 0.6, r: 0.35 }, { x: -1.1, y: -0.4, r: 0.18 }] : [] },
  }
  const [s] = useReducer(scopeReducer, init)
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#222', padding: 24, boxSizing: 'border-box' }}>
      <OpticalView state={s} />
    </div>
  )
}
