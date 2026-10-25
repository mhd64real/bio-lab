// Developer page: #/dev/inst?i=confocal&s={"power":true,...} renders an instrument fully unlocked.
import { InstrumentStation, useInstrument, type Action, type Instrument } from '../instruments/engine'
import { CONFOCAL } from '../instruments/confocal/Confocal'
import { TEM } from '../instruments/tem/Tem'

const ALL = { confocal: CONFOCAL, tem: TEM } as unknown as Record<string, Instrument<Record<string, unknown>, Action>>

export function InstrumentLab() {
  const q = new URLSearchParams(location.hash.split('?')[1] ?? '')
  const inst = ALL[q.get('i') ?? 'confocal']
  const patch = JSON.parse(q.get('s') ?? '{}')
  const { state, dispatch } = useInstrument(inst, () => ({ ...inst.init(), ...patch }))
  return (
    <div className="h-full">
      <InstrumentStation inst={inst} state={state} dispatch={dispatch} guide={<div className="card">Dev view</div>} highlight={[]} lock="all" labels />
    </div>
  )
}
