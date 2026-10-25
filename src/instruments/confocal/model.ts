// Laser scanning confocal microscope (inverted). Two kinds of living sample:
// 'cyto': Hoechst (405 nm, nucleus), Tubulin Tracker Green (488 nm, microtubules), SiR-actin (640 nm, microfilaments).
// 'nuclei': Hoechst (405 nm, DNA) in cells that make a green fluorescent (GFP) nuclear pore protein (488 nm).
// Units: focus z and stage in micrometres above the coverglass.

export type Laser = 405 | 488 | 640
export const LASERS: Laser[] = [405, 488, 640]
export type ConfocalSpecimen = 'cyto' | 'nuclei' | 'mito'
type LaserInfo = { name: string; target: string; colour: string }
export const LASER_INFO: Record<ConfocalSpecimen, Partial<Record<Laser, LaserInfo>>> = {
  cyto: {
    405: { name: '405 nm', target: 'Hoechst: nucleus (DNA)', colour: '#6d5cf6' },
    488: { name: '488 nm', target: 'Tubulin dye: microtubules', colour: '#22b455' },
    640: { name: '640 nm', target: 'SiR-actin: microfilaments', colour: '#e0479e' },
  },
  nuclei: {
    405: { name: '405 nm', target: 'Hoechst: DNA', colour: '#6d5cf6' },
    488: { name: '488 nm', target: 'GFP: nuclear pore protein', colour: '#22b455' },
  },
  mito: {
    405: { name: '405 nm', target: 'Hoechst: nucleus (DNA)', colour: '#6d5cf6' },
    488: { name: '488 nm', target: 'MitoTracker Green: mitochondria', colour: '#22b455' },
  },
}
// The mitochondrion that divides and fuses again, in the middle of the 'mito' dish (um), and its cycle
// in specimen time units (seconds when live; 20 times faster in time-lapse). See mitoField in shaders.ts.
export const MITO = { x: 6, y: 4, period: 60 }
// Geometry of the nucleus in the middle of the 'nuclei' dish: an ellipsoid, micrometres.
export const NUC = { zc: 4.5, c: 3.2 }

export type CObjective = 10 | 63

export interface ConfocalState {
  power: boolean
  lasers: Record<Laser, boolean>
  laserPower: number // 0..1
  gain: number // 0..1
  pinhole: number // Airy units, 0.5..5
  objective: CObjective
  oil: boolean
  dish: boolean
  z: number
  scanning: boolean
  zoom: 1 | 2 | 4
  timelapse: boolean
  range: boolean
  dose: number // accumulated light dose on this field of view (bleaches the dyes)
  specimen: ConfocalSpecimen
  timelapseSince: number // seconds (performance clock) when the time-lapse was last switched on
}

export type ConfocalAction =
  | { type: 'power' }
  | { type: 'laser'; laser: Laser }
  | { type: 'laserPower'; value: number }
  | { type: 'gain'; value: number }
  | { type: 'pinhole'; value: number }
  | { type: 'objective'; to: CObjective }
  | { type: 'oil' }
  | { type: 'dish' }
  | { type: 'focus'; dz: number }
  | { type: 'scan' }
  | { type: 'zoom'; to: 1 | 2 | 4 }
  | { type: 'timelapse' }
  | { type: 'range' }
  | { type: 'newField' }
  | { type: 'clean' }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export function initialConfocal(): ConfocalState {
  return {
    power: false,
    lasers: { 405: false, 488: false, 640: false },
    laserPower: 0.02,
    gain: 0.5,
    pinhole: 5,
    objective: 10,
    oil: false,
    dish: false,
    z: -30,
    scanning: false,
    zoom: 1,
    timelapse: false,
    range: false,
    dose: 0,
    specimen: 'cyto',
    timelapseSince: 0,
  }
}

export function confocalReducer(s: ConfocalState, a: ConfocalAction): ConfocalState {
  switch (a.type) {
    case 'power': {
      const on = !s.power
      return { ...s, power: on, scanning: on ? s.scanning : false, lasers: on ? s.lasers : { 405: false, 488: false, 640: false } }
    }
    case 'laser': return s.power ? { ...s, lasers: { ...s.lasers, [a.laser]: !s.lasers[a.laser] } } : s
    case 'laserPower': return { ...s, laserPower: clamp(a.value, 0, 1) }
    case 'gain': return { ...s, gain: clamp(a.value, 0, 1) }
    case 'pinhole': return { ...s, pinhole: clamp(a.value, 0.5, 5) }
    // The oil stays on the lens when switching back to the dry 10x, so it must be cleaned first.
    case 'objective': return a.to === s.objective ? s : { ...s, objective: a.to }
    case 'oil': return s.objective === 63 && !s.dish ? { ...s, oil: true } : s
    case 'dish': return { ...s, dish: !s.dish, scanning: s.dish ? false : s.scanning, z: s.dish ? -30 : s.z }
    case 'focus': return s.dish ? { ...s, z: clamp(s.z + a.dz, -40, 20) } : s
    case 'scan': return s.power && s.dish ? { ...s, scanning: !s.scanning } : s
    case 'zoom': return { ...s, zoom: a.to }
    case 'timelapse': return { ...s, timelapse: !s.timelapse, timelapseSince: performance.now() / 1000 }
    case 'range': return { ...s, range: !s.range }
    case 'newField': return { ...s, dose: 0 }
    case 'clean': return { ...s, oil: false }
  }
}

const anyLaser = (s: ConfocalState) => LASERS.some((l) => s.lasers[l])

// Photobleaching: each second of scanning adds a dose proportional to laser power squared.
export function confocalTick(s: ConfocalState, dt: number): ConfocalState {
  if (!s.scanning || !anyLaser(s)) return s
  return { ...s, dose: s.dose + s.laserPower * s.laserPower * dt * s.zoom }
}

export const bleach = (s: ConfocalState) => Math.exp(-0.058 * s.dose)
export const gainFactor = (s: ConfocalState) => Math.pow(2, (s.gain - 0.5) * 8)
// Peak displayed brightness of the brightest structures, before clipping.
export const peak = (s: ConfocalState) => 3 * s.laserPower * gainFactor(s) * bleach(s) * (s.objective === 63 && !s.oil ? 0.3 : 1)
export const photons = (s: ConfocalState) => 400 * s.laserPower * bleach(s) * (s.objective === 63 && !s.oil ? 0.3 : 1)
// Thickness of the optical section, micrometres (half-width).
export const section = (s: ConfocalState) => (s.objective === 63 ? 0.45 + 0.75 * (s.pinhole - 0.5) : 3 + 2 * (s.pinhole - 0.5))
export const fov = (s: ConfocalState) => (s.objective === 63 ? 140 : 880) / s.zoom

// How much of the stained cell lies in the optical section at this focus (0..1).
export function inFocusAmount(s: ConfocalState) {
  const th = section(s)
  const w = (z0: number) => Math.exp(-(((s.z - z0) / th) ** 2))
  const layers: number[] = []
  if (s.specimen === 'nuclei') {
    const slab = Math.exp(-((Math.max(0, NUC.zc - NUC.c - s.z, s.z - NUC.zc - NUC.c) / th) ** 2))
    return s.lasers[405] || s.lasers[488] ? slab : 0
  }
  if (s.specimen === 'mito') {
    if (s.lasers[488]) layers.push(Math.max(w(1.2), w(2.2)))
    if (s.lasers[405]) layers.push(Math.max(w(2.5), w(4)))
    return layers.length ? Math.max(...layers) : 0
  }
  if (s.lasers[640]) layers.push(w(0.3))
  if (s.lasers[488]) layers.push(w(0.9))
  if (s.lasers[405]) layers.push(Math.max(w(2), w(3.5), w(5)))
  return layers.length ? Math.max(...layers) : 0
}

export function describeConfocal(s: ConfocalState): { tone: 'ok' | 'warn' | 'bad'; text: string } {
  if (!s.power) return { tone: 'bad', text: 'The screen is black. The system and lasers are switched off.' }
  if (!s.dish) return { tone: 'warn', text: 'There is no sample on the stage.' }
  if (!s.scanning) return { tone: 'warn', text: 'No image yet. A confocal image only exists while the laser is scanning.' }
  if (!anyLaser(s)) return { tone: 'bad', text: 'Scanning, but every laser is switched off, so nothing glows.' }
  if (s.objective === 63 && !s.oil) return { tone: 'bad', text: 'Dim and blurry. The 63x oil lens needs a drop of immersion oil.' }
  if (bleach(s) < 0.35) return { tone: 'bad', text: 'Almost no signal left. The laser has bleached the dyes in this area.' }
  const f = inFocusAmount(s)
  if (f < 0.12) return { tone: 'warn', text: 'Nearly black: no part of the cells is inside the thin slice in focus.' }
  if (f < 0.6) return { tone: 'warn', text: 'Faint: the focus is close. Keep adjusting the fine focus.' }
  if (peak(s) > 1.15) return { tone: 'warn', text: 'Too bright: many pixels are saturated (pure white). Lower the gain.' }
  if (photons(s) < 25) return { tone: 'warn', text: 'Grainy and dim: too little light. Raise the laser power a little.' }
  if (peak(s) < 0.45) return { tone: 'warn', text: 'Dim. Raise the gain.' }
  if (s.pinhole > 2) return { tone: 'warn', text: 'Hazy: the pinhole is wide open, so light from above and below the focus blurs the image.' }
  if (bleach(s) < 0.75) return { tone: 'warn', text: 'The signal is fading: the laser is slowly bleaching the dyes.' }
  return { tone: 'ok', text: 'A sharp optical section through living cells.' }
}

// Good imaging conditions, used by the guided steps.
export const confocalGood = (s: ConfocalState) => describeConfocal(s).tone === 'ok'
