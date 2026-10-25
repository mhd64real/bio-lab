// Swimmers in the pond-water slide. Positions in mm, the same formula as the GLSL, so the guide can
// tell when one is in the middle of the view. Each loops slowly: p = c + R (cos a, 0.6 sin 1.3a), a = w t + phase.
export interface Swimmer { kind: 'para' | 'eug'; c: [number, number]; R: number; w: number; ph: number }

export const SWIMMERS: Swimmer[] = [
  { kind: 'para', c: [0.15, -0.05], R: 0.12, w: 0.12, ph: 0 },
  { kind: 'para', c: [-0.95, 0.6], R: 0.25, w: 0.09, ph: 1 },
  { kind: 'para', c: [1.1, -0.8], R: 0.3, w: 0.07, ph: 2 },
  { kind: 'para', c: [-0.4, -1.25], R: 0.2, w: 0.1, ph: 4 },
  { kind: 'eug', c: [-0.42, 0.3], R: 0.05, w: 0.08, ph: 0.5 },
  { kind: 'eug', c: [0.8, 0.95], R: 0.08, w: 0.06, ph: 3 },
]

export function swimmerAt(s: Swimmer, t: number): [number, number] {
  const a = s.w * t + s.ph
  return [s.c[0] + s.R * Math.cos(a), s.c[1] + s.R * 0.6 * Math.sin(1.3 * a)]
}

// Distance (mm) from the centre of the view to the nearest swimmer of a kind.
export function nearestSwimmer(kind: Swimmer['kind'], stageX: number, stageY: number, t: number) {
  let best = Infinity
  for (const s of SWIMMERS) {
    if (s.kind !== kind) continue
    const [x, y] = swimmerAt(s, t)
    best = Math.min(best, Math.hypot(x + stageX, y + stageY))
  }
  return best
}

const f = (v: number) => v.toFixed(4)
// GLSL constant arrays generated from the same data.
export const SWIMMERS_GLSL = `
const int NS = ${SWIMMERS.length};
const vec4 SW_A[NS] = vec4[](${SWIMMERS.map((s) => `vec4(${f(s.c[0])}, ${f(s.c[1])}, ${f(s.R)}, ${f(s.w)})`).join(', ')});
const vec2 SW_B[NS] = vec2[](${SWIMMERS.map((s) => `vec2(${f(s.ph)}, ${s.kind === 'para' ? '0.0' : '1.0'})`).join(', ')});
`

// Dev server only: lets tools/walk3.mjs steer the stage after a swimmer.
if (import.meta.env.DEV) {
  void import('./clock').then(({ specimenTime }) => {
    (window as unknown as { __swim: (k: string) => [number, number][] }).__swim = (k) => SWIMMERS.filter((s) => s.kind === k).map((s) => swimmerAt(s, specimenTime()))
  })
}
