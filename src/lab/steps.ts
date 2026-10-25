import type { ScopeState } from '../scope/model'
import type { PartId } from '../scope/Microscope3D'
import type { ChoiceQ } from '../ui/kit'
import type { Lock } from '../scope/lock'

export interface ObserveStep {
  id: string
  title: string
  body: string
  tip?: string
  highlight: PartId[]
  // The controls this step unlocks; everything else is locked.
  lock: (s: ScopeState) => Lock
  // Done when the microscope reaches this state. Steps with a question are done when it is answered.
  done?: (s: ScopeState, seen: Set<string>) => boolean
  question?: ChoiceQ
  // Something the student must do before the question appears.
  before?: (s: ScopeState, seen: Set<string>) => boolean
  beforeText?: string
}

