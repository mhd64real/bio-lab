// Transmission electron microscope. The specimen is an ultra-thin, stained section of fixed, dead cells
// on a copper grid; it has to go through an airlock into the vacuum of the column.
// Units: stage in micrometres, defocus in nanometres.

export const MAGS = [500, 2000, 5000, 15000, 44000, 100000] as const
export type Holder = 'out' | 'loaded' | 'airlock' | 'in'

export interface TemState {
  holder: Holder
  airlock: number // 0..1 pumping progress
  ht: boolean // 120 kV high tension
  beam: boolean
  brightness: number // 0..1, how strongly the beam is concentrated
  mag: number // index into MAGS
  defocus: number // nm away from focus
  x: number
  y: number
  falseColour: boolean
  damage: number // accumulated electron dose on the current area
  burnAt: { x: number; y: number } | null
  interlock: number // last time the airlock interlock refused, for the message
  specimen: 'centrosome' | 'cilia' | 'nucleus' | 'leaf'
}

export type TemAction =
  | { type: 'load' }
  | { type: 'toAirlock' }
  | { type: 'pump' }
  | { type: 'insert' }
  | { type: 'withdraw' }
  | { type: 'ht' }
  | { type: 'beam' }
  | { type: 'brightness'; value: number }
  | { type: 'mag'; to: number }
  | { type: 'focus'; dz: number }
  | { type: 'stage'; dx: number; dy: number }
  | { type: 'falseColour' }
  | { type: 'newArea' }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

// Field of view on the camera, micrometres.
export const temFov = (s: TemState) => 60000 / MAGS[s.mag]

export function initialTem(): TemState {
  return { holder: 'out', airlock: 0, ht: false, beam: false, brightness: 0.35, mag: 0, defocus: 1800, x: 34, y: 22, falseColour: false, damage: 0, burnAt: null, interlock: -1e9, specimen: 'centrosome' }
}

export function temReducer(s: TemState, a: TemAction): TemState {
  switch (a.type) {
    case 'load': return s.holder === 'out' ? { ...s, holder: 'loaded' } : s
    case 'toAirlock': return s.holder === 'loaded' ? { ...s, holder: 'airlock', airlock: 0 } : s
    case 'pump': return s.holder === 'airlock' && s.airlock === 0 ? { ...s, airlock: 0.001 } : s
    case 'insert':
      if (s.holder !== 'airlock') return s
      // The interlock will not open the column until the airlock is at high vacuum.
      if (s.airlock < 1) return { ...s, interlock: performance.now() }
      return { ...s, holder: 'in' }
    case 'withdraw': return s.holder === 'in' || s.holder === 'airlock' ? { ...s, holder: 'loaded', airlock: 0, beam: false } : s
    case 'ht': return { ...s, ht: !s.ht, beam: s.ht ? false : s.beam }
    case 'beam': return s.ht ? { ...s, beam: !s.beam } : s
    case 'brightness': return { ...s, brightness: clamp(a.value, 0, 1) }
    case 'mag': return { ...s, mag: clamp(a.to, 0, MAGS.length - 1) }
    case 'focus': return { ...s, defocus: clamp(s.defocus + a.dz, -6000, 6000) }
    case 'stage': return s.holder === 'in' ? { ...s, x: clamp(s.x + a.dx, -60, 60), y: clamp(s.y + a.dy, -60, 60) } : s
    case 'falseColour': return { ...s, falseColour: !s.falseColour }
    // Stepping to an untouched area of the section nearby (a different cell sectioned the same way).
    case 'newArea': return { ...s, damage: 0, burnAt: null }
  }
}

// Dose rate grows with brightness and, strongly, with magnification (the same beam on a smaller area).
const doseRate = (s: TemState) => (s.beam && s.holder === 'in' ? Math.pow(s.brightness, 3) * Math.pow(MAGS[s.mag] / 15000, 1.5) : 0)

export function temTick(s: TemState, dt: number): TemState {
  let n = s
  if (s.holder === 'airlock' && s.airlock > 0 && s.airlock < 1) n = { ...n, airlock: Math.min(1, s.airlock + dt / 5) }
  const r = doseRate(s)
  if (r > 0.05 && !s.burnAt) {
    const damage = s.damage + r * dt
    n = { ...n, damage, burnAt: damage > 4 ? { x: s.x, y: s.y } : null }
  }
  return n
}

export const imageBrightness = (s: TemState) => (s.beam && s.ht ? 0.25 + 1.1 * s.brightness * Math.pow(15000 / MAGS[s.mag], 0.12) : 0)
// Blur from defocus, micrometres on the specimen.
export const defocusBlur = (s: TemState) => Math.abs(s.defocus) * 1.2e-4
export const focusOk = (s: TemState) => defocusBlur(s) < temFov(s) * 0.004

export function describeTem(s: TemState): { tone: 'ok' | 'warn' | 'bad'; text: string } {
  if (performance.now() - s.interlock < 2500) return { tone: 'bad', text: 'Interlock: the column stays closed until the airlock is pumped to vacuum.' }
  if (!s.ht) return { tone: 'bad', text: 'The screen is dark. The high tension (120 000 volts) is off, so no electrons are accelerated.' }
  if (!s.beam) return { tone: 'bad', text: 'No beam. Switch the electron beam on.' }
  if (s.holder !== 'in') return { tone: 'warn', text: 'A bright, empty screen: the beam is on, but there is no specimen in its path.' }
  if (s.burnAt) return { tone: 'bad', text: 'The beam has burned a hole in the section.' }
  if (s.brightness < 0.15) return { tone: 'warn', text: 'Dark and grainy: too few electrons reach the camera. Turn the brightness up.' }
  if (!focusOk(s)) return { tone: 'warn', text: 'Blurry, with bright halos around edges. Adjust the focus.' }
  if (s.mag >= 4 && s.brightness > 0.8) return { tone: 'warn', text: 'Very bright at high magnification: the beam is heating and damaging the section.' }
  return { tone: 'ok', text: s.falseColour ? 'Colour added by computer, like the textbook images. The real image is black and white.' : 'A sharp image of an ultra-thin section. It is black and white because electrons have no colour.' }
}

export const scaleBar = (s: TemState) => {
  const f = temFov(s) * 1000 // nm
  const nice = [50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000]
  const len = nice.find((n) => n > f * 0.18) ?? 50000
  return { frac: len / f, label: len >= 1000 ? `${len / 1000} um` : `${len} nm` }
}

// A nuclear pore on the nucleus in the middle of the 'nucleus' section (slot HOME_PORE of PORE_SLOT um,
// placed exactly; see nucleusSection and nucWob in shaders.ts).
export const NUCLEUS = (() => {
  const ax = [4.6, 3.6], Rm = (ax[0] + ax[1]) / 2
  const th = (7.5 * 0.85) / Rm - Math.PI
  const w = 1 + 0.03 * Math.sin(3 * th + 1) + 0.02 * Math.sin(5 * th + 2)
  return { pore: { x: ax[0] * w * Math.cos(th), y: ax[1] * w * Math.sin(th) }, nucleolus: { x: 1.2, y: 0.8 } }
})()

// In the 'leaf' section, the middle cell's first chloroplast and first mitochondrion (see leafTissue).
export const LEAF = { chloroplast: { x: 0, y: 9.6 - 1.6 }, mito: { x: Math.cos(1.05) * (9.6 - 0.75), y: Math.sin(1.05) * (9.6 - 0.75) } }
