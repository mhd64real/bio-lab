// Scanning electron microscope. The specimen (gold-coated, dried windpipe lining on a stub) sits in a
// vacuum chamber; a fine electron beam scans its surface and a detector counts electrons knocked out of it.
// Units: stage in micrometres, focus error in micrometres of working distance.

export const SEM_MAGS = [100, 500, 2000, 5000, 15000] as const
export type Chamber = 'vacuum' | 'venting' | 'vented' | 'pumping'
export type Scan = 'fast' | 'slow'

export interface SemState {
  chamber: Chamber
  progress: number // venting or pumping, 0..1
  door: boolean // open
  stub: boolean // stub mounted on the stage
  kv: 5 | 20
  beam: boolean
  scan: Scan
  scanStarted: number // time the current slow frame started (seconds)
  mag: number
  focus: number // working-distance error, um
  x: number
  y: number
  brightness: number
  contrast: number
}

export type SemAction =
  | { type: 'vent' }
  | { type: 'door' }
  | { type: 'stub' }
  | { type: 'pump' }
  | { type: 'kv'; to: 5 | 20 }
  | { type: 'beam' }
  | { type: 'scan'; to: Scan; now: number }
  | { type: 'mag'; to: number }
  | { type: 'focus'; dz: number }
  | { type: 'stage'; dx: number; dy: number }
  | { type: 'brightness'; value: number }
  | { type: 'contrast'; value: number }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
export const semFov = (s: SemState) => 120000 / SEM_MAGS[s.mag]

export function initialSem(): SemState {
  return { chamber: 'vacuum', progress: 0, door: false, stub: false, kv: 20, beam: false, scan: 'fast', scanStarted: 0, mag: 0, focus: 900, x: 160, y: -120, brightness: 0.35, contrast: 0.3 }
}

export function semReducer(s: SemState, a: SemAction): SemState {
  switch (a.type) {
    case 'vent': return s.chamber === 'vacuum' ? { ...s, chamber: 'venting', progress: 0, beam: false } : s
    case 'door': return s.chamber === 'vented' ? { ...s, door: !s.door } : s
    case 'stub': return s.door ? { ...s, stub: !s.stub } : s
    case 'pump': return s.chamber === 'vented' && !s.door ? { ...s, chamber: 'pumping', progress: 0 } : s
    case 'kv': return { ...s, kv: a.to }
    case 'beam': return s.chamber === 'vacuum' ? { ...s, beam: !s.beam } : s
    case 'scan': return { ...s, scan: a.to, scanStarted: a.now }
    case 'mag': return { ...s, mag: clamp(a.to, 0, SEM_MAGS.length - 1), scanStarted: s.scan === 'slow' ? performance.now() / 1000 : s.scanStarted }
    case 'focus': return { ...s, focus: clamp(s.focus + a.dz, -2000, 2000) }
    case 'stage': return s.stub && s.chamber === 'vacuum' ? { ...s, x: clamp(s.x + a.dx, -600, 600), y: clamp(s.y + a.dy, -600, 600) } : s
    case 'brightness': return { ...s, brightness: clamp(a.value, 0, 1) }
    case 'contrast': return { ...s, contrast: clamp(a.value, 0, 1) }
  }
}

export function semTick(s: SemState, dt: number): SemState {
  if (s.chamber === 'venting') return s.progress + dt / 4 >= 1 ? { ...s, chamber: 'vented', progress: 1 } : { ...s, progress: s.progress + dt / 4 }
  if (s.chamber === 'pumping') return s.progress + dt / 6 >= 1 ? { ...s, chamber: 'vacuum', progress: 1 } : { ...s, progress: s.progress + dt / 6 }
  return s
}

// Defocus blur on the specimen, um. Depth of field is large in an SEM, but not unlimited.
export const semBlur = (s: SemState) => Math.abs(s.focus) * 0.004
export const semFocusOk = (s: SemState) => semBlur(s) < semFov(s) * 0.006
export const semReady = (s: SemState) => s.chamber === 'vacuum' && s.stub && s.beam

// Signal mapping: grey level = offset + gain * signal. Good when both shadows and highlights keep detail.
export const levelsOk = (s: SemState) => s.brightness > 0.25 && s.brightness < 0.65 && s.contrast > 0.35 && s.contrast < 0.8

export function describeSem(s: SemState): { tone: 'ok' | 'warn' | 'bad'; text: string } {
  if (s.chamber !== 'vacuum') return { tone: 'bad', text: s.chamber === 'vented' ? 'The chamber is open to air. Electrons cannot travel through air.' : s.chamber === 'venting' ? 'Letting air into the chamber...' : 'Pumping the air out of the chamber...' }
  if (!s.stub) return { tone: 'warn', text: 'There is no specimen in the chamber.' }
  if (!s.beam) return { tone: 'bad', text: 'Black screen: the electron beam is off.' }
  if (s.kv === 20) return { tone: 'warn', text: 'At 20 kV the electrons go deep into the soft tissue: the surface looks flat and glows at the edges. Use 5 kV for biological samples.' }
  if (!semFocusOk(s)) return { tone: 'warn', text: 'Blurry. Adjust the focus.' }
  if (!levelsOk(s)) return { tone: 'warn', text: s.contrast <= 0.35 ? 'Flat and grey. Turn the contrast up.' : s.brightness >= 0.65 ? 'Too bright: the edges are burnt out white.' : s.brightness <= 0.25 ? 'Too dark.' : 'Too much contrast: shadows are pure black.' }
  if (s.scan === 'fast' && s.mag >= 3) return { tone: 'warn', text: 'Grainy: a fast scan collects few electrons per point. A slow scan gives a clean picture.' }
  return { tone: 'ok', text: 'A 3D-looking picture of the surface. Grey, because it is made of electron counts, not light.' }
}
