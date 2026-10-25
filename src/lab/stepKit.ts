// Reusable guided steps for a microscope station that starts with the lamp on and the 4x lens in place.
import { describeView, inFocus, initialScope, optics, type Objective, type ScopeState } from '../scope/model'
import type { ObserveStep, Task } from './steps'
import type { ChoiceQ } from '../ui/kit'

// The first unfinished task of a checklist, or null when all are done.
export const currentTask = (tasks: Task[], s: ScopeState) => tasks.find((t) => !t.done(s)) ?? null

export function checklistStep(id: string, title: string, body: string, tasks: Task[]): ObserveStep {
  return {
    id, title, body, tasks,
    highlight: [],
    lock: (s) => currentTask(tasks, s)?.lock ?? { allow: [] },
    done: (s) => tasks.every((t) => t.done(s)),
  }
}

const T = {
  lens4: (): Task => ({ text: 'Turn the nosepiece back to 4x', done: (s) => s.objective === 4, lock: { allow: ['objective'], objectives: [4] }, highlight: ['nosepiece', 'objectives'] }),
  lower: (down = false): Task => ({ text: 'Lower the stage with coarse focus', done: (s) => s.stageZ < 12000, lock: { allow: [down ? 'coarseDown' : 'coarse'] }, highlight: ['coarse'] }),
  remove: (): Task => ({ text: 'Take the slide off', done: (s) => s.slide === 'none', lock: { allow: ['remove'] }, highlight: ['stage'] }),
  wipe: (): Task => ({ text: 'Wipe the oil off the 100x lens', done: (s) => !s.lensOily, lock: { allow: ['clean'] }, highlight: ['objectives'] }),
  lampOff: (): Task => ({ text: 'Switch off the lamp', done: (s) => !s.lampOn, lock: { allow: ['lamp'] }, highlight: ['power'] }),
}
export const tasks = T

const centred = (s: ScopeState, r: number) => Math.hypot(s.stageX, s.stageY) <= r

// Ready to use: lamp on, sensible light, 4x in place, stage lowered.
export const readyScope = (): ScopeState => ({ ...initialScope(), lampOn: true, brightness: 0.7, iris: 0.6, objective: 4 })

export const kit = {
  place: (what: string): ObserveStep => ({
    id: 'place', title: 'Place the slide', body: `Tap the stage to put your ${what} slide down.`,
    highlight: ['stage'], lock: () => ({ allow: ['place'] }), done: (s) => s.slide !== 'none',
  }),
  clip: (): ObserveStep => ({
    id: 'clip', title: 'Clip it in', body: 'Tap the stage clips to hold the slide still.',
    highlight: ['clips'], lock: () => ({ allow: ['clip'] }), done: (s) => s.slide === 'clipped',
  }),
  centre: (body = 'Look at the stage from the side. Drag the slide, or use the stage controls, until the specimen sits over the light hole. The ring turns green when it is in place.'): ObserveStep => ({
    id: 'centre', title: 'Line up the specimen', body,
    highlight: ['stageKnobs'], lock: () => ({ allow: ['stage'] }), done: (s) => centred(s, 0.7), view: 'stage', snap: 1.4,
  }),
  coarse: (body = 'Raise the stage with the coarse focus knob until the specimen appears in the eyepiece.'): ObserveStep => ({
    id: 'coarse', title: 'Find it with coarse focus', body,
    highlight: ['coarse'], lock: () => ({ allow: ['coarse'] }), done: (s) => s.objective === 4 && optics(s).blur < 0.05,
  }),
  fine: (o: Objective, body = 'Sharpen the image with the fine focus knob.', light = false): ObserveStep => ({
    id: `fine${o}`, title: light ? 'Fine focus, then fix the light' : 'Sharpen with fine focus', body,
    highlight: light ? ['fine', 'brightness', 'iris'] : ['fine'],
    lock: () => ({ allow: light ? ['fine', 'brightness', 'iris'] : ['fine'] }),
    done: (s) => s.objective === o && inFocus(s) && (!light || describeView(s).tone === 'ok'),
  }),
  lens: (o: Objective, body: string): ObserveStep => ({
    id: `lens${o}`, title: `Switch to ${o}x`, body,
    highlight: ['nosepiece', 'objectives'], lock: () => ({ allow: ['objective'], objectives: [o] }), done: (s) => s.objective === o,
  }),
  ask: (id: string, title: string, body: string, question: ChoiceQ, unlockFocus = true): ObserveStep => ({
    id, title, body, question, highlight: [],
    // While answering, the student may refocus and look around, but not change lenses.
    lock: () => ({ allow: unlockFocus ? ['fine', 'stage'] : [] }),
  }),
  planes: (body: string): ObserveStep => ({
    id: 'planes', title: 'Focus through the cell', body,
    highlight: ['fine'], lock: () => ({ allow: ['fine'] }),
    done: (_, seen) => seen.has('plane0') && seen.has('plane1'),
  }),
  oil: (): ObserveStep => ({
    id: 'oil', title: 'Add a drop of immersion oil',
    body: 'Swing the 40x lens aside and put one drop of immersion oil right on the smear, over the light. Oil bends light the same way glass does, so no light is lost in the gap under the 100x lens.',
    highlight: ['stage'], lock: () => ({ allow: ['oil'] }), done: (s) => s.oil,
  }),
  putAway: (last: boolean, oil = false): ObserveStep => checklistStep(
    'putaway', 'Put the microscope away',
    oil ? 'Oil comes off first: never swing another lens through the oil.' : last ? 'Leave it ready for the next person.' : 'Get it ready for the next slide.',
    oil
      ? [T.lower(true), T.remove(), T.wipe(), T.lens4(), T.lampOff()]
      : [T.lens4(), T.lower(), T.remove(), ...(last ? [T.lampOff()] : [])],
  ),
}
