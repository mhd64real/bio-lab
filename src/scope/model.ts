// Light microscope state and the optics derived from it.
// Units: stage height in micrometres, slide position in millimetres.

export type Objective = 4 | 10 | 40 | 100

export const OBJECTIVES: Objective[] = [4, 10, 40, 100]
export const EYEPIECE = 10

// Real objective data (approximate, for a student microscope with a 18 mm field number eyepiece).
export const OBJECTIVE_INFO: Record<Objective, {
  label: string
  colour: string // standard objective colour ring
  fov: number // field of view diameter, mm
  dof: number // depth of field, um
  workingDistance: number // gap between lens and slide at focus, um
  focusOffset: number // parfocal error, um
  lightLoss: number // relative brightness at the eyepiece
}> = {
  4: { label: '4x', colour: 'var(--color-obj4)', fov: 4.5, dof: 55, workingDistance: 17000, focusOffset: 0, lightLoss: 1 },
  10: { label: '10x', colour: 'var(--color-obj10)', fov: 1.8, dof: 8.5, workingDistance: 7000, focusOffset: 6, lightLoss: 0.86 },
  40: { label: '40x', colour: 'var(--color-obj40)', fov: 0.45, dof: 1, workingDistance: 520, focusOffset: -2.5, lightLoss: 0.58 },
  // Oil immersion: only works with a drop of oil between the lens and the slide.
  100: { label: '100x', colour: 'var(--color-obj100)', fov: 0.18, dof: 0.45, workingDistance: 130, focusOffset: 1.5, lightLoss: 0.4 },
}

export const STAGE_MIN = 0
export const STAGE_MAX = 20000
// Stage height at which a slide on the stage sits exactly in focus for the 4x objective.
export const FOCUS_BASE = 15000
export const STAGE_X_RANGE = 12
export const STAGE_Y_RANGE = 8

export type SlideState = 'none' | 'loose' | 'clipped'

export interface Bubble { x: number; y: number; r: number }

export type SpecimenId = 'letter-e' | 'onion' | 'cheek' | 'yogurt' | 'pond' | 'elodea' | 'pepper' | 'potato'

export interface Mount {
  specimen: SpecimenId
  bubbles: Bubble[]
  // Specimen-specific outcome of the preparation, e.g. 1 for an over-decolorised Gram stain.
  variant?: number
}

export interface ScopeState {
  lampOn: boolean
  brightness: number // 0..1 dial
  iris: number // 0 closed .. 1 fully open
  objective: Objective
  stageZ: number
  stageX: number // slide displacement to the student's right, mm
  stageY: number // slide displacement away from the student, mm
  slide: SlideState
  broken: boolean
  crackAt: { x: number; y: number } // slide position (mm) that hit the lens
  phase: boolean // condenser set to phase contrast
  oil: boolean // immersion oil on the slide
  lensOily: boolean // the 100x lens has been in oil and needs wiping
  mount: Mount | null
  // Event log for the guide, newest last. Kept short.
  events: ScopeEvent[]
}

export type ScopeEvent =
  | { t: 'crash'; objective: Objective }
  | { t: 'objective'; from: Objective; to: Objective }
  | { t: 'coarse' ; objective: Objective }
  | { t: 'fine'; objective: Objective }
  | { t: 'stage' }

export function initialScope(): ScopeState {
  return {
    lampOn: false,
    brightness: 0.25,
    iris: 1,
    objective: 10,
    stageZ: 6000,
    stageX: 0,
    stageY: 0,
    slide: 'none',
    broken: false,
    crackAt: { x: 0, y: 0 },
    phase: false,
    oil: false,
    lensOily: false,
    mount: null,
    events: [],
  }
}

export type ScopeAction =
  | { type: 'lamp'; on?: boolean }
  | { type: 'brightness'; value: number }
  | { type: 'iris'; value: number }
  | { type: 'objective'; to: Objective }
  | { type: 'coarse'; dz: number }
  | { type: 'fine'; dz: number }
  | { type: 'stage'; dx: number; dy: number }
  | { type: 'placeSlide'; mount: Mount }
  | { type: 'clip' }
  | { type: 'removeSlide' }
  | { type: 'replaceSlide' }
  | { type: 'oil' }
  | { type: 'phase' }
  | { type: 'cleanLens' }
  | { type: 'reset' }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function focusHeight(o: Objective) {
  return FOCUS_BASE + OBJECTIVE_INFO[o].focusOffset
}

// The objective touches the slide when the stage rises past focus by more than the working distance.
function crashes(s: ScopeState, o: Objective, z: number) {
  return s.slide !== 'none' && z > focusHeight(o) + OBJECTIVE_INFO[o].workingDistance
}

function log(s: ScopeState, e: ScopeEvent): ScopeEvent[] {
  const last = s.events[s.events.length - 1]
  if (last && last.t === e.t && (e.t === 'coarse' || e.t === 'fine' || e.t === 'stage')) return s.events
  return [...s.events.slice(-19), e]
}

export function scopeReducer(s: ScopeState, a: ScopeAction): ScopeState {
  switch (a.type) {
    case 'lamp':
      return { ...s, lampOn: a.on ?? !s.lampOn }
    case 'brightness':
      return { ...s, brightness: clamp(a.value, 0, 1) }
    case 'iris':
      return { ...s, iris: clamp(a.value, 0, 1) }
    case 'objective': {
      if (a.to === s.objective) return s
      // Swinging a long objective in over a raised stage drives it into the slide.
      if (crashes(s, a.to, s.stageZ) && !s.broken) {
        return { ...s, objective: a.to, broken: true, crackAt: { x: -s.stageX, y: -s.stageY }, stageZ: focusHeight(a.to) + OBJECTIVE_INFO[a.to].workingDistance, events: log(s, { t: 'crash', objective: a.to }) }
      }
      return { ...s, objective: a.to, lensOily: s.lensOily || (a.to === 100 && s.oil), events: log(s, { t: 'objective', from: s.objective, to: a.to }) }
    }
    case 'coarse':
    case 'fine': {
      let z = clamp(s.stageZ + a.dz, STAGE_MIN, STAGE_MAX)
      let broken = s.broken
      let crackAt = s.crackAt
      let events = log(s, { t: a.type, objective: s.objective })
      const limit = focusHeight(s.objective) + OBJECTIVE_INFO[s.objective].workingDistance
      if (s.slide !== 'none' && z > limit) {
        z = limit
        if (!broken) { broken = true; crackAt = { x: -s.stageX, y: -s.stageY }; events = [...events, { t: 'crash', objective: s.objective }] }
      }
      return { ...s, stageZ: z, broken, crackAt, events }
    }
    case 'stage':
      if (s.slide !== 'clipped') return s
      return {
        ...s,
        stageX: clamp(s.stageX + a.dx, -STAGE_X_RANGE, STAGE_X_RANGE),
        stageY: clamp(s.stageY + a.dy, -STAGE_Y_RANGE, STAGE_Y_RANGE),
        events: log(s, { t: 'stage' }),
      }
    case 'placeSlide':
      if (s.slide !== 'none') return s
      // A slide is never placed perfectly centred.
      return { ...s, slide: 'loose', mount: a.mount, broken: false, stageX: 1.6, stageY: -1.1 }
    case 'clip':
      return s.slide === 'loose' ? { ...s, slide: 'clipped' } : s
    case 'removeSlide':
      return { ...s, slide: 'none', broken: false, oil: false }
    case 'oil':
      return s.slide === 'clipped' ? { ...s, oil: true } : s
    case 'phase':
      return { ...s, phase: !s.phase }
    case 'cleanLens':
      return { ...s, lensOily: false }
    case 'replaceSlide':
      // A fresh slide of the same specimen after a crash.
      return { ...s, broken: false, stageZ: Math.min(s.stageZ, 6000) }
    case 'reset':
      return initialScope()
  }
}

// ---------------------------------------------------------------------------
// Optics: what the eyepiece shows for a given state.

export interface Optics {
  light: number // overall luminance at the eyepiece, 0..~1.2
  contrast: number
  glare: number
  blur: number // defocus blur radius as a fraction of the field diameter
  defocus: number // signed, um (positive: stage too high)
  fov: number // mm
  magnification: number
}

export function optics(s: ScopeState): Optics {
  const info = OBJECTIVE_INFO[s.objective]
  const irisT = 0.3 + 0.7 * s.iris
  const light = s.lampOn ? Math.pow(s.brightness, 1.4) * irisT * info.lightLoss * 1.55 : 0
  // Closing the iris raises contrast and depth of field, opening it washes the image out.
  const contrast = 1.45 - 0.75 * s.iris
  const glare = s.lampOn ? Math.max(0, s.iris - 0.7) * s.brightness * 0.9 : 0
  const defocus = s.stageZ - focusHeight(s.objective)
  const blur = blurAt(s, 0)
  // Without oil, light bends away in the air gap under the 100x lens: dim and soft.
  const dry = s.objective === 100 && !s.oil
  return { light: dry ? light * 0.45 : light, contrast: dry ? contrast * 0.6 : contrast, glare, blur, defocus, fov: info.fov, magnification: EYEPIECE * s.objective }
}

// Defocus blur (fraction of field diameter) for a specimen plane sitting zOffset um above the main plane.
export function blurAt(s: ScopeState, zOffset: number) {
  const info = OBJECTIVE_INFO[s.objective]
  const dof = info.dof * (1.7 - 0.8 * s.iris)
  const defocus = s.stageZ + zOffset - focusHeight(s.objective)
  const b = Math.min(0.22, 0.0035 * Math.max(0, Math.abs(defocus) / dof - 0.35))
  return s.objective === 100 && !s.oil ? Math.max(b, 0.03) : b
}

// Plain-language reading of the image, in priority order. Used by the guide as "what you see".
export function describeView(s: ScopeState): { tone: 'bad' | 'warn' | 'ok'; text: string } {
  const o = optics(s)
  if (!s.lampOn) return { tone: 'bad', text: 'The field is black. The lamp is off.' }
  if (s.brightness < 0.08) return { tone: 'bad', text: 'Almost black. The brightness dial is turned right down.' }
  if (s.broken) return { tone: 'bad', text: 'The objective hit the slide and cracked it. Lower the stage and get a new slide.' }
  if (s.slide === 'none') return { tone: 'warn', text: 'An empty, bright circle. There is no slide on the stage.' }
  if (s.iris < 0.08) return { tone: 'bad', text: 'Very dark and grainy. The iris diaphragm is almost closed.' }
  if (s.objective === 100 && !s.oil) return { tone: 'bad', text: 'Dim and blurry everywhere. The 100x lens needs a drop of immersion oil.' }
  if (Math.abs(o.defocus) > OBJECTIVE_INFO[s.objective].dof * 40) return { tone: 'warn', text: 'Only a smooth blur of light. The slide is far out of focus.' }
  if (o.blur > 0.012) return { tone: 'warn', text: 'Blurry shapes. The slide is not in focus yet.' }
  if (o.blur > 0.004) return { tone: 'warn', text: 'Nearly sharp. A little fine focus will finish it.' }
  if (o.glare > 0.18) return { tone: 'warn', text: 'Sharp but washed out. Close the iris diaphragm a little for more contrast.' }
  if (o.light > 1.05) return { tone: 'warn', text: 'Sharp but too bright to see detail. Turn the brightness down.' }
  if (o.light < 0.2) return { tone: 'warn', text: 'Sharp but dim. Turn the brightness up or open the iris.' }
  if (s.mount && UNSTAINED.has(s.mount.specimen) && !s.phase) return { tone: 'warn', text: 'In focus, but the living cells are almost invisible: they have no colour. Phase contrast makes them visible.' }
  return { tone: 'ok', text: s.phase ? 'Phase contrast: the colourless cells now stand out, dark with bright edges.' : 'Sharp and clear.' }
}

// Colourless living specimens, nearly invisible in brightfield.
const UNSTAINED = new Set<SpecimenId>(['pond'])

export function inFocus(s: ScopeState, tolerance = 0.004) {
  return optics(s).blur <= tolerance
}
