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
  // Height (um) of the second plane t1 above the main plane. Omit for single-plane specimens.
  layerZ?: number
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
  t0 = mix(water, paperT, paper);
`,
}

// Onion inner epidermis stained with iodine (Lugol's solution).
// Cells about 260 x 62 um in staggered rows. The nucleus sits on a second plane 3 um above the walls.
export const ONION: SpecimenDef = {
  id: 'onion',
  layerZ: 3,
  helpers: /* glsl */ `
// Row boundary r: wavy, at an irregular height.
float onRow(float r, float x) {
  return (r + 0.3 * (hash12(vec2(r, 2.7)) - 0.5)) * 64.0 + 6.0 * (vnoise(vec2(x * 0.006, r * 3.1)) - 0.5);
}
// End wall k of a row: oblique or pointed, so cells look like long tapered hexagons.
float onB(float k, float row, float yc, float hgt) {
  vec2 h = hash22(vec2(k, row + 1.3));
  float base = (k + 0.4 * (hash12(vec2(k, row + 7.0)) - 0.5)) * 270.0 + 90.0 * (hash12(vec2(row, k * 0.37)) - 0.5);
  float ends = h.y < 0.5 ? (h.x - 0.5) * 1.6 * yc : (h.x - 0.5) * 2.2 * (abs(yc) - 0.25 * hgt);
  return base + ends;
}
float onionCell(vec2 q, out vec2 id, out vec2 local, out vec2 size) {
  float row = floor(q.y / 64.0);
  float lo = onRow(row, q.x), hi = onRow(row + 1.0, q.x);
  if (q.y < lo) { row -= 1.0; hi = lo; lo = onRow(row, q.x); }
  else if (q.y > hi) { row += 1.0; lo = hi; hi = onRow(row + 1.0, q.x); }
  float hgt = hi - lo;
  float yc = q.y - 0.5 * (lo + hi);
  float x = q.x + hash12(vec2(row, 3.1)) * 400.0;
  float k = floor(x / 270.0);
  float b0 = onB(k, row, yc, hgt), b1 = onB(k + 1.0, row, yc, hgt);
  if (x < b0) { k -= 1.0; b1 = b0; b0 = onB(k, row, yc, hgt); }
  else if (x > b1) { k += 1.0; b0 = b1; b1 = onB(k + 1.0, row, yc, hgt); }
  float dEnd = min(x - b0, b1 - x) * 0.85;
  float dRow = min(q.y - lo, hi - q.y);
  id = vec2(row, k);
  local = vec2(x - 0.5 * (b0 + b1), yc);
  size = vec2(b1 - b0, hgt);
  return min(dEnd, dRow);
}
`,
  body: /* glsl */ `
  float ca = cos(0.26), sa = sin(0.26);
  vec2 q = mat2(ca, sa, -sa, ca) * s * 1000.0;
  q.y += 40.0 * sin(q.x * 0.0011) + 60.0 * (fbm(s * 0.6) - 0.5);
  q += 2.5 * (vec2(vnoise(q * 0.03), vnoise(q * 0.03 + 7.0)) - 0.5);
  vec2 id, local, size;
  float d = onionCell(q, id, local, size);
  float aa = max(0.6, gPx * 1000.0 * 1.2);
  // The peeled piece of tissue, with a torn edge.
  float edge = length(s * vec2(1.0, 1.25)) + 0.25 * (fbm(s * 2.0) - 0.5) + 0.05 * (fbm(s * 14.0) - 0.5);
  float peel = 1.0 - smoothstep(2.15, 2.2, edge);
  vec3 iodine = vec3(0.99, 0.93, 0.72);
  vec3 bg = mix(vec3(0.985), iodine, 0.5);
  float wall = 1.0 - smoothstep(1.1, 1.1 + aa, d);
  float halo = smoothstep(1.1, 2.5, d) * (1.0 - smoothstep(2.5, 5.0 + aa, d));
  // A thin layer of granular cytoplasm lines the walls around the big central vacuole.
  float cyto = (1.0 - smoothstep(2.5, 9.0, d)) * (0.5 + 0.5 * fbm(q * 0.35));
  float gran = smoothstep(0.64, 0.82, vnoise(q * 0.9)) * (1.0 - smoothstep(2.0, 11.0, d));
  vec3 cellT = iodine * (0.96 + 0.04 * fbm(q * 0.01));
  cellT *= 1.0 - 0.1 * cyto - 0.25 * gran;
  cellT += 0.04 * halo;
  cellT = mix(cellT, cellT * vec3(0.55, 0.45, 0.3), wall);
  // A fold where the peel doubled over: two layers of cells, darker.
  float fold = smoothstep(0.03, 0.0, abs(dot(s - vec2(-0.9, 0.7), normalize(vec2(1.0, 0.35))) ) - 0.08);
  cellT *= 1.0 - 0.18 * fold;
  t0 = mix(bg, cellT, peel);
  vec2 h = hash22(id + 5.0);
  vec2 nc = vec2((h.x - 0.5) * max(0.0, size.x - 60.0) * 0.8, (h.y - 0.5) * (size.y - 30.0));
  vec2 nl = local - nc;
  float nr = length(nl / vec2(13.0, 9.5));
  float nuc = 1.0 - smoothstep(1.0 - aa / 11.0, 1.0, nr);
  vec2 no = vec2(4.0 * (h.x - 0.5), 1.5 * (h.y - 0.5));
  float nucleolus = 1.0 - smoothstep(0.17, 0.25, length((nl - no) / vec2(13.0, 9.5)));
  vec3 nT = mix(vec3(1.0), vec3(0.78, 0.6, 0.33) * (0.88 + 0.14 * fbm(nl * 0.6 + h * 9.0)), nuc);
  nT = mix(nT, vec3(0.5, 0.36, 0.18), nucleolus * nuc);
  nT *= 1.0 - 0.2 * nuc * smoothstep(0.75, 1.0, nr);
  t1 = mix(vec3(1.0), nT, peel * step(0.1, hash12(id + 9.0)));
`,
}

// Cheek cells (squamous epithelium) stained with methylene blue: flat, irregular, often folded.
export const CHEEK: SpecimenDef = {
  id: 'cheek',
  layerZ: 1,
  helpers: '',
  body: /* glsl */ `
  vec2 q = s * 1000.0;
  float aa = max(0.5, gPx * 1000.0 * 1.2);
  vec3 T = mix(vec3(0.99), vec3(0.8, 0.9, 0.98), 0.3);
  T *= 0.97 + 0.03 * fbm(s * 9.0);
  vec3 N = vec3(1.0);
  const float G = 82.0;
  vec2 g = floor(q / G);
  // The smear is patchy: clumps of cells with sparse gaps, thinning out away from the middle.
  float dens = smoothstep(1.8, 0.4, length(s * vec2(1.0, 1.3))) * smoothstep(0.25, 0.6, fbm(s * 5.0 + 3.0));
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 ci = g + vec2(i, j);
    if (hash12(ci + 3.3) > 0.12 + 0.62 * dens) continue;
    vec2 h = hash22(ci + 17.0);
    vec2 c = (ci + 0.5 + (h - 0.5) * 0.55) * G;
    vec2 d = q - c;
    float ang = atan(d.y, d.x) + 3.14159;
    float R = 33.0 + 9.0 * h.x;
    // Irregular polygon with 5 to 7 corners: find the edge this direction points at.
    float nv = 5.0 + floor(hash12(ci + 6.0) * 3.0);
    float sector = 6.28318 / nv;
    float k = floor(ang / sector);
    float a0 = k * sector, a1 = a0 + sector;
    float r0 = R * (0.78 + 0.4 * hash12(vec2(mod(k, nv), ci.x + ci.y * 13.0)));
    float r1 = R * (0.78 + 0.4 * hash12(vec2(mod(k + 1.0, nv), ci.x + ci.y * 13.0)));
    vec2 p0 = r0 * vec2(cos(a0), sin(a0)), p1 = r1 * vec2(cos(a1), sin(a1));
    vec2 dir = vec2(cos(ang), sin(ang));
    vec2 e = p1 - p0;
    float rim = (p0.x * e.y - p0.y * e.x) / (dir.x * e.y - dir.y * e.x);
    rim += 1.5 * (vnoise(vec2(ang * 6.0, h.y * 30.0)) - 0.5);
    d = -d;
    float r = length(d);
    if (r > rim + aa) continue;
    float inside = 1.0 - smoothstep(rim - aa, rim, r);
    vec3 cyt = vec3(0.72, 0.84, 0.96) * (0.92 + 0.08 * fbm(q * 0.25 + h * 50.0));
    float edgeFold = smoothstep(rim - 4.5, rim - 0.5, r);
    vec2 n = vec2(cos(h.y * 6.28), sin(h.y * 6.28));
    float crease = (1.0 - smoothstep(0.5, 0.5 + aa, abs(dot(d, n) - (h.x - 0.5) * R))) * step(0.45, h.x);
    float bac = smoothstep(0.86, 0.95, vnoise(q * 1.1 + h * 13.0)) * step(0.5, hash12(ci + 1.0));
    vec3 cellT = cyt * (1.0 - 0.2 * edgeFold - 0.22 * crease) * mix(vec3(1.0), vec3(0.45, 0.55, 0.8), bac);
    T *= mix(vec3(1.0), cellT, inside);
    vec2 nc = (hash22(ci + 8.0) - 0.5) * 9.0;
    float nr = length((d - nc) / vec2(5.4, 4.5));
    float nuc = 1.0 - smoothstep(1.0 - aa / 5.0, 1.0, nr);
    vec3 nT = vec3(0.3, 0.42, 0.74) * (0.82 + 0.28 * fbm((d - nc) * 1.3 + h * 9.0));
    N *= mix(vec3(1.0), nT, nuc * inside);
  }
  t0 = T;
  t1 = N;
`,
}

// Gram-stained yogurt smear: Lactobacillus rods and Streptococcus chains.
// uVariant: 0 correct stain (purple, Gram positive), 1 over-decolourised (pink), -1 under-decolourised (purple haze).
export const YOGURT: SpecimenDef = {
  id: 'yogurt',
  helpers: '',
  body: /* glsl */ `
  vec2 q = s * 1000.0;
  float aa = max(0.12, gPx * 1000.0);
  float film = 0.6 * fbm(s * 8.0) + 0.4 * fbm(q * 0.02);
  vec3 T = mix(vec3(0.98, 0.95, 0.96), vec3(0.93, 0.8, 0.88), smoothstep(0.35, 0.8, film));
  if (uVariant < -0.5) T = mix(T, vec3(0.78, 0.68, 0.9), 0.5 * smoothstep(0.3, 0.7, film));
  float thick = smoothstep(0.35, 0.75, fbm(s * 1.5 + 2.0));
  vec3 dye = mix(vec3(0.2, 0.06, 0.42), vec3(0.9, 0.36, 0.56), clamp(uVariant, 0.0, 1.0));
  const float G = 7.0;
  vec2 g = floor(q / G);
  float cover = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 ci = g + vec2(i, j);
    if (hash12(ci + 21.0) > 0.22 + 0.45 * thick) continue;
    vec2 h = hash22(ci + 4.0);
    vec2 c = (ci + 0.5 + (h - 0.5) * 0.6) * G;
    float a = hash12(ci + 9.0) * 6.2831;
    vec2 dir = vec2(cos(a), sin(a));
    vec2 d = q - c;
    float u = dot(d, dir), v = dot(d, vec2(-dir.y, dir.x));
    float dist;
    if (hash12(ci + 2.0) < 0.5) {
      float L = 1.0 + 2.0 * h.x;
      dist = length(vec2(max(abs(u) - L, 0.0), v)) - 0.5;
      // Some rods are dividing pairs with a thin gap in the middle.
      if (h.y > 0.6) dist = max(dist, 0.07 - abs(u));
    } else {
      float n = 3.0 + floor(h.y * 4.0);
      float k = clamp(floor(u / 0.95 + n * 0.5), 0.0, n - 1.0);
      float cu = (k - n * 0.5 + 0.5) * 0.95;
      dist = length(vec2(u - cu, v + 0.25 * sin(cu * 0.8)) / vec2(0.56, 0.5)) * 0.5 - 0.5;
    }
    cover = max(cover, 1.0 - smoothstep(-aa * 0.5, aa * 0.5, dist));
  }
  T = mix(T, dye * (0.8 + 0.3 * vnoise(q * 2.0 + 5.0)), cover);
  // Clumps of stained milk protein.
  T *= mix(vec3(1.0), vec3(0.86, 0.72, 0.84), smoothstep(0.72, 0.85, fbm(q * 0.12)) * 0.8);
  float smear = 1.0 - smoothstep(2.2, 2.4, length(s * vec2(0.8, 1.2)) + 0.2 * (fbm(s * 3.0) - 0.5));
  t0 = mix(vec3(0.99), T, smear);
`,
}

export const EMPTY: SpecimenDef = {
  id: 'empty',
  helpers: '',
  body: 't0 = vec3(0.99);',
}

export const SPECIMENS: Record<string, SpecimenDef> = {
  'letter-e': LETTER_E,
  onion: ONION,
  cheek: CHEEK,
  yogurt: YOGURT,
}
