import { describeView, inFocus, optics, type ScopeState } from '../../scope/model'
import { letterInk } from '../../scope/specimens'
import type { PartId } from '../../scope/Microscope3D'
import type { ChoiceQ } from '../../ui/kit'

export interface ObserveStep {
  id: string
  title: string
  body: string
  tip?: string
  highlight: PartId[]
  // Done when the microscope reaches this state. Steps with a question are done when it is answered.
  done?: (s: ScopeState, seen: Set<string>) => boolean
  question?: ChoiceQ
  // Something the student must do before the question appears.
  before?: (s: ScopeState, seen: Set<string>) => boolean
  beforeText?: string
}

const centred = (s: ScopeState, r: number) => Math.hypot(s.stageX, s.stageY) <= r

export const OBSERVE_STEPS: ObserveStep[] = [
  {
    id: 'lamp',
    title: 'Switch on the lamp',
    body: 'Press the power switch on the base, or the Lamp button. Light shines up from the base, through the slide, into the lenses.',
    highlight: ['power'],
    done: (s) => s.lampOn,
  },
  {
    id: 'brightness',
    title: 'Set the brightness',
    body: 'Turn the brightness dial to about two thirds (60 to 80%). Too bright hides detail and tires your eyes.',
    highlight: ['brightness'],
    done: (s) => s.brightness >= 0.55 && s.brightness <= 0.85,
  },
  {
    id: 'lowest',
    title: 'Start on the lowest power',
    body: 'Turn the revolving nosepiece until the 4x objective (red ring) clicks into place over the stage. You always start with the lowest power because it shows the widest view and is easiest to focus.',
    highlight: ['nosepiece', 'objectives'],
    done: (s) => s.objective === 4,
  },
  {
    id: 'place',
    title: 'Place the slide on the stage',
    body: 'Tap the stage to put your slide down, with the coverslip facing up.',
    highlight: ['stage'],
    done: (s) => s.slide !== 'none',
  },
  {
    id: 'clip',
    title: 'Clip it in',
    body: 'Tap the stage clips so they hold the slide still.',
    highlight: ['clips'],
    done: (s) => s.slide === 'clipped',
  },
  {
    id: 'centre',
    title: 'Line up the specimen',
    body: 'Look at the microscope from the side. Use the stage controls to move the slide until the paper square sits right over the light hole in the stage.',
    tip: 'You cannot see anything in the eyepiece yet. The slide is far below focus, so the view is only a smooth blur of light.',
    highlight: ['stageKnobs'],
    done: (s) => centred(s, 0.7),
  },
  {
    id: 'coarse',
    title: 'Find it with coarse focus',
    body: 'Turn the coarse focus knob to raise the stage. Watch the eyepiece: a blurry letter will appear. Stop when you can see its shape.',
    tip: 'Coarse focus moves the stage a long way, fast. That is fine with the 4x objective because it sits far above the slide.',
    highlight: ['coarse'],
    done: (s) => s.objective === 4 && optics(s).blur < 0.05,
  },
  {
    id: 'fine4',
    title: 'Sharpen with fine focus',
    body: 'Now use the fine focus knob to make the edges of the letter crisp.',
    highlight: ['fine'],
    done: (s) => s.objective === 4 && inFocus(s),
  },
  {
    id: 'iris',
    title: 'Adjust the iris diaphragm',
    body: 'Slide the iris diaphragm lever. Closing it makes the image darker but adds contrast. Opening it fully washes the image out. Find the setting where the letter and the paper fibres both look clear.',
    highlight: ['iris'],
    done: (s, seen) => seen.has('irisMoved') && describeView(s).tone === 'ok',
  },
  {
    id: 'orientation',
    title: 'Look closely at the letter',
    body: 'Compare the letter in the eyepiece with the letter on your slide.',
    highlight: [],
    question: {
      q: 'On the slide, the e reads normally. What do you see in the eyepiece?',
      options: ['Exactly the same e', 'An e that is upside down and backwards', 'An e that is only bigger', 'A mirror image, but the right way up'],
      correct: 1,
      explain: 'Right. The lenses turn the image through 180 degrees, so it looks upside down and back to front.',
    },
  },
  {
    id: 'direction',
    title: 'Move the slide',
    body: 'Hold the "move slide right" control for a moment while you watch the eyepiece.',
    highlight: ['stageKnobs'],
    before: (_, seen) => seen.has('movedRight'),
    beforeText: 'Move the slide to the right first.',
    question: {
      q: 'You moved the slide to the right. Which way did the letter move in the eyepiece?',
      options: ['Right', 'Left', 'Up', 'It did not move'],
      correct: 1,
      explain: 'Yes. Because the image is turned around, everything moves the opposite way. Move the slide left to bring something on the left into view.',
    },
  },
  {
    id: 'centre2',
    title: 'Centre the letter',
    body: 'Move the slide so the letter is in the middle of the view. Anything off-centre will disappear when you zoom in, because higher power shows a smaller area.',
    highlight: ['stageKnobs'],
    done: (s) => centred(s, 0.25),
  },
  {
    id: 'ten',
    title: 'Switch to 10x',
    body: 'Turn the nosepiece to the 10x objective (yellow ring). Microscopes are parfocal: the image stays almost in focus when you change lens.',
    highlight: ['nosepiece', 'objectives'],
    done: (s) => s.objective === 10,
  },
  {
    id: 'fine10',
    title: 'Fine focus only',
    body: 'From now on, use only the fine focus knob. The view is smaller and the letter is bigger: total magnification is 10 x 10 = 100x.',
    highlight: ['fine'],
    done: (s) => s.objective === 10 && inFocus(s),
  },
  {
    id: 'centre3',
    title: 'Pick a spot on the edge of the ink',
    body: 'Move the slide so the edge of the ink (where black meets paper) is in the centre of the view. That is where the most detail is.',
    highlight: ['stageKnobs'],
    done: (s) => s.objective === 10 && inkEdgeCentred(s),
  },
  {
    id: 'forty',
    title: 'Switch to 40x',
    body: 'Turn the nosepiece to the 40x objective (blue ring). This lens is long: at focus it sits only about half a millimetre above the slide.',
    highlight: ['nosepiece', 'objectives'],
    done: (s) => s.objective === 40,
  },
  {
    id: 'fine40',
    title: 'Fine focus, then fix the light',
    body: 'Sharpen with the fine focus knob. At 400x less light reaches your eye, so turn the brightness up or open the iris until the view is clear. Look for the paper fibres and the way the ink soaks into them.',
    tip: 'Never use coarse focus with the 40x lens. One quick turn would push the slide into the lens and crack it.',
    highlight: ['fine', 'brightness', 'iris'],
    done: (s) => s.objective === 40 && inFocus(s) && describeView(s).tone === 'ok',
  },
  {
    id: 'fibres',
    title: 'What is paper made of?',
    body: 'Look at the paper next to the ink at 400x.',
    highlight: [],
    question: {
      q: 'What does the paper look like at 400x?',
      options: ['A smooth white sheet', 'A tangle of long, flat fibres', 'Rows of tiny squares', 'Round cells with a dark centre'],
      correct: 1,
      explain: 'Exactly. Paper is a mat of plant fibres, mostly cellulose from wood. Cellulose is the same material that makes plant cell walls, which you will meet in Phase 3.',
    },
  },
  {
    id: 'putaway',
    title: 'Put the microscope away',
    body: 'Leave it ready for the next person: turn back to 4x, lower the stage with coarse focus, take the slide off and switch off the lamp.',
    highlight: ['nosepiece', 'coarse', 'stage', 'power'],
    done: (s) => s.objective === 4 && s.stageZ < 12000 && s.slide === 'none' && !s.lampOn,
  },
]

// The ink edge is centred when the middle of the view has both ink and bare paper within 0.15 mm.
function inkEdgeCentred(s: ScopeState) {
  const cx = -s.stageX, cy = -s.stageY
  let ink = 0, paper = 0
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const c = letterInk(cx + Math.cos(a) * 0.15, cy + Math.sin(a) * 0.15)
    if (c > 0.6) ink++
    else if (c < 0.3) paper++
  }
  return ink >= 2 && paper >= 2
}
