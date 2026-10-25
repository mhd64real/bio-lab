// Which controls the student may use right now. Guided steps unlock only what the step needs.
import type { Objective } from './model'

export type Allow = 'lamp' | 'brightness' | 'iris' | 'objective' | 'coarse' | 'fine' | 'stage' | 'place' | 'clip' | 'remove' | 'oil' | 'clean' | 'coarseDown'

export interface Lock {
  allow: Allow[] | 'all'
  // When 'objective' is allowed, which lenses may be turned in. Omitted means any.
  objectives?: Objective[]
}

export const UNLOCKED: Lock = { allow: 'all' }
export const LOCKED: Lock = { allow: [] }

export function canUse(lock: Lock, k: Allow) {
  return lock.allow === 'all' || lock.allow.includes(k)
}

export function canObjective(lock: Lock, o: Objective) {
  return canUse(lock, 'objective') && (!lock.objectives || lock.objectives.includes(o))
}
