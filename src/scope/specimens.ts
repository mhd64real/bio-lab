// Specimens are GLSL functions returning the transmittance of the slide at a point (mm).
// Each specimen may also provide a texture painted on a 2D canvas once.

export interface SpecimenDef {
  id: string
  // Body of `vec3 specimen(vec2 s)`; may call helpers in `helpers` and sample uTex.
  helpers: string
  body: string
  texture?: () => HTMLCanvasElement
  // Size of the texture square in mm, centred on the slide origin.
  textureSize?: number
}

const LETTER_TEX_MM = 4

let letterCanvas: HTMLCanvasElement | null = null
let letterData: ImageData | null = null

function letterTexture() {
  if (letterCanvas) return letterCanvas
  const n = 2048
  const c = document.createElement('canvas')
  c.width = c.height = n
  const g = c.getContext('2d')!
  g.fillStyle = '#000'
  g.fillRect(0, 0, n, n)
  // Newsprint body text: x-height about 1.5 mm, so the "e" fills about 40% of a 4 mm square.
  const px = n / LETTER_TEX_MM
  g.fillStyle = '#fff'
  g.textAlign = 'center'
  g.textBaseline = 'alphabetic'
  g.font = `600 ${3.1 * px}px Georgia, "Times New Roman", Times, serif`
  g.filter = `blur(${0.012 * px}px)`
  const base = n / 2 + 0.78 * px
  const eW = g.measureText('e').width
  g.fillText('e', n / 2, base)
  g.textAlign = 'right'
  g.fillText('h', n / 2 - eW / 2 - 0.05 * px, base)
  g.textAlign = 'left'
  g.fillText('l', n / 2 + eW / 2 + 0.05 * px, base)
  letterCanvas = c
  return c
}

// Ink coverage (0..1) of the newsprint at a slide position in mm, read from the same texture the shader uses.
export function letterInk(x: number, y: number) {
  const c = letterTexture()
  letterData ??= c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
  const u = x / LETTER_TEX_MM + 0.5, v = 0.5 - y / LETTER_TEX_MM
  if (u < 0 || v < 0 || u >= 1 || v >= 1) return 0
  const i = (Math.floor(v * c.height) * c.width + Math.floor(u * c.width)) * 4
  return letterData.data[i] / 255
}

export const LETTER_E: SpecimenDef = {
  id: 'letter-e',
  textureSize: LETTER_TEX_MM,
  texture: letterTexture,
  helpers: /* glsl */ `
// Paper fibres as individual curved ribbons, 20 to 40 um wide and up to 1 mm long.
// Each 0.3 mm cell may hold one fibre; neighbours within two cells are checked so none are cut off.
// Returns (body, wall, lumen) summed over the fibres covering this point.
vec3 fiberLayer(vec2 s, float seed) {
  const float cell = 0.3;
  vec2 g = floor(s / cell);
  vec3 acc = vec3(0.0);
  float aa = max(0.0015, gPx * 1.2);
  for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) {
    vec2 c = g + vec2(i, j);
    vec2 h1 = hash22(c + seed);
    vec2 h2 = hash22(c * 1.7 + seed + 11.0);
    vec2 h3 = hash22(c * 2.3 + seed + 37.0);
    if (h3.y < 0.2) continue;
    vec2 d = s - (c + h1) * cell;
    float ang = h2.x * 6.2831;
    vec2 dir = vec2(cos(ang), sin(ang));
    float u = dot(d, dir);
    float L = mix(0.2, 0.5, h2.y);
    if (abs(u) > L) continue;
    float v = dot(d, vec2(-dir.y, dir.x)) - (h3.x - 0.5) * 2.0 * u * u;
    float w = mix(0.010, 0.020, h1.x) * (0.8 + 0.4 * vnoise(vec2(u * 9.0, h1.y * 50.0)));
    w *= smoothstep(L, L * 0.8, abs(u));
    float av = abs(v);
    if (av > w + aa) continue;
    float body = smoothstep(w + aa * 0.5, w - aa * 0.5, av);
    float wall = body * smoothstep(w - 0.0045 - aa, w - 0.0015, av);
    float lumen = body * (1.0 - smoothstep(0.0, 0.0012 + aa, av)) * step(0.45, h1.y);
    acc += vec3(body, wall, lumen);
  }
  return acc;
}
`,
  body: /* glsl */ `
  // Ragged scissor-cut square of newspaper, about 3.4 mm across.
  float edge = max(abs(s.x), abs(s.y)) + 0.05 * (fbm(s * 9.0) - 0.5) + 0.02 * (fbm(s * 60.0) - 0.5);
  float paper = 1.0 - smoothstep(1.68, 1.70, edge);
  // Water and glass around the paper: nearly clear, with a few specks.
  vec3 water = vec3(0.985) - 0.3 * smoothstep(0.86, 0.95, fbm(s * 30.0)) * vec3(1.0);
  vec3 fl = fiberLayer(s, 1.0) + fiberLayer(s, 7.0) + fiberLayer(s, 19.0) + fiberLayer(s, 31.0) + fiberLayer(s, 43.0);
  vec2 fb = fl.xy;
  float mottle = fbm(s * 5.0);
  float t = 0.92 + 0.08 * mottle;
  // Overlapping fibres absorb more; walls and collapsed lumens show as darker lines.
  // Walls and lumens are finer than a pixel at low power, so they fade into the general tone there.
  float fine = smoothstep(0.0045, 0.0012, gPx);
  t *= exp(-0.16 * fl.x) * (1.0 - 0.22 * fine * min(fl.y, 1.5)) * (1.0 - 0.18 * fine * min(fl.z, 1.0));
  // Fines: small fibre fragments and filler between the long fibres.
  vec2 vf = voronoi(s * 90.0);
  t *= 1.0 - 0.12 * smoothstep(0.25, 0.05, vf.x) * step(0.6, hash12(floor(s * 90.0)));
  t *= 0.88 + 0.12 * fbm(s * 40.0);
  vec3 paperT = t * vec3(1.0, 0.95, 0.86);
  // Ink soaks into the fibres, so the letter edge is irregular at high power.
  // The ink edge wanders and wicks a little way along the fibres.
  vec2 si = s + 0.028 * (vec2(fbm(s * 22.0), fbm(s * 22.0 + 5.2)) - 0.5);
  vec2 uv = si / uTexSize + 0.5;
  float cov = (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) ? 0.0 : texture(uTex, vec2(uv.x, 1.0 - uv.y)).r;
  float near = smoothstep(0.0, 0.25, cov) * (1.0 - smoothstep(0.75, 1.0, cov));
  float ink = smoothstep(0.45, 0.55, cov + near * (0.5 * min(fl.x, 1.0) * fbm(s * 60.0) + 0.25 * (fbm(s * 120.0) - 0.5)));
  vec3 inkT = vec3(0.035, 0.04, 0.055) * (0.55 + 0.9 * fbm(s * 90.0)) * (1.0 - 0.3 * min(fl.x, 1.0));
  paperT = mix(paperT, inkT, ink);
  return mix(water, paperT, paper);
`,
}

export const EMPTY: SpecimenDef = {
  id: 'empty',
  helpers: '',
  body: 'return vec3(0.99);',
}

export const SPECIMENS: Record<string, SpecimenDef> = {
  'letter-e': LETTER_E,
}
