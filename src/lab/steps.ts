import type { Mount, ScopeState } from '../scope/model'
import type { PartId } from '../scope/Microscope3D'
import type { ChoiceQ } from '../ui/kit'
import type { Lock } from '../scope/lock'

// One action in an ordered list (e.g. putting the microscope away). Only the first unfinished action is unlocked.
export interface Task {
  text: string
  done: (s: ScopeState) => boolean
  lock: Lock
  highlight: PartId[]
}

export interface ObserveStep {
  id: string
  title: string
  body: string
  tip?: string
  highlight: PartId[]
  // The controls this step unlocks; everything else is locked.
  lock: (s: ScopeState) => Lock
  // Ordered actions shown as a checklist; when set, lock, highlight and done come from it.
  tasks?: Task[]
  // The done condition must stay true this many seconds (e.g. keeping a swimming cell in view).
  hold?: number
  // Done when the microscope reaches this state. Steps with a question are done when it is answered.
  done?: (s: ScopeState, seen: Set<string>) => boolean
  question?: ChoiceQ
  // Something the student must do before the question appears.
  before?: (s: ScopeState, seen: Set<string>) => boolean
  beforeText?: string
  // A bench action done in the guide card while the slide stays on the stage. It records the flag 'acted';
  // `mount` (optional) changes what is under the coverslip.
  act?: { label: string; mount?: (m: Mount) => Mount }
  // 'stage': show the stage seen from the side instead of the eyepiece (lining up before focusing).
  view?: 'stage'
  // Once the specimen is within this many mm of the centre and the student stops moving, it slides into place.
  snap?: number
  // A centre mark in the eyepiece to aim at.
  reticle?: boolean
}

