// Reusable guided steps for a microscope station that starts with the lamp on and the 4x lens in place.
import { describeView, inFocus, initialScope, optics, type Objective, type ScopeState } from '../scope/model'
import type { ObserveStep } from './steps'
import type { ChoiceQ } from '../ui/kit'

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
  centre: (body = 'Use the stage controls to move the slide until the specimen sits over the light hole.'): ObserveStep => ({
    id: 'centre', title: 'Line up the specimen', body,
    highlight: ['stageKnobs'], lock: () => ({ allow: ['stage'] }), done: (s) => centred(s, 0.7),
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
  putAway: (last: boolean, oil = false): ObserveStep => ({
    id: 'putaway', title: 'Put the microscope away',
    body: oil
      ? 'Lower the stage, take the slide off, wipe the oil off the 100x lens with lens paper, turn back to 4x and switch off the lamp.'
      : last ? 'Turn back to 4x, lower the stage, take the slide off and switch off the lamp.' : 'Turn back to 4x, lower the stage and take the slide off, ready for the next slide.',
    highlight: oil ? ['coarse', 'stage', 'objectives', 'power'] : ['nosepiece', 'coarse', 'stage'],
    lock: (s) => {
      if (oil) {
        if (s.stageZ >= 12000) return { allow: ['coarseDown'] }
        if (s.slide !== 'none') return { allow: ['remove'] }
        if (s.lensOily) return { allow: ['clean'] }
        if (s.objective !== 4) return { allow: ['objective'], objectives: [4] }
        return { allow: ['lamp'] }
      }
      if (s.objective !== 4) return { allow: ['objective'], objectives: [4] }
      if (s.stageZ >= 12000) return { allow: ['coarse'] }
      if (s.slide !== 'none') return { allow: ['remove'] }
      return { allow: last ? ['lamp'] : [] }
    },
    done: (s) => s.objective === 4 && s.stageZ < 12000 && s.slide === 'none' && !s.lensOily && (!last || !s.lampOn),
  }),
}
