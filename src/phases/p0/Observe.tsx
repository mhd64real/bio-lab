import { GuidedScope } from '../../lab/GuidedScope'
import type { Mount } from '../../scope/model'
import { OBSERVE_STEPS } from './observeSteps'

export function Observe({ mount, onStep, onDone }: { mount: Mount; onStep: (i: number) => void; onDone: () => void }) {
  return <GuidedScope steps={OBSERVE_STEPS} mount={mount} onStep={onStep} onDone={onDone} />
}
