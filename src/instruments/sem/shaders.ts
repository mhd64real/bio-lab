import { NOISE } from '../../scope/glsl'

// Pass 1: secondary-electron signal of the gold-coated windpipe lining (0 dark .. 1 bright).
// Space in micrometres. Most surface cells carry a dense carpet of cilia; goblet cells between them are
// smooth domes covered in tiny microvilli. At low magnification the lining shows folds and mucus.
export const SEM_SPECIMEN = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uFov;
uniform vec2 uStage;
out vec4 outColor;
${NOISE}
float gPx;
mat2 rot(float a) { return mat2(cos(a), sin(a), -sin(a), cos(a)); }

// Nearest cell centre on a jittered 9 um grid: id, distance to centre and to the cell border.
void cells(vec2 p, out vec2 id, out vec2 c, out float border) {
  vec2 g = floor(p / 9.0);
  float d1 = 1e9, d2 = 1e9;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 gg = g + vec2(x, y);
    vec2 cc = (gg + 0.5 + (hash22(gg) - 0.5) * 0.7) * 9.0;
    float d = length(p - cc);
    if (d < d1) { d2 = d1; d1 = d; id = gg; c = cc; } else if (d < d2) d2 = d;
  }
  border = (d2 - d1) * 0.5;
}

float cilia(vec2 p, vec2 id) {
  float a = hash12(id + 3.0) * 1.2 - 0.6 + 0.6 * sin(p.x * 0.01 + p.y * 0.008);
  vec2 q = rot(-a) * p;
  float sp = 0.42;
  float v = q.y + 0.12 * sin(q.x * 1.3 + floor(q.y / sp) * 2.1);
  float j = floor(v / sp);
  float f = fract(v / sp);
  float L = 3.6 + 1.2 * hash12(vec2(j, id.x));
  float uu = q.x + hash12(vec2(j, id.y)) * L;
  float su = fract(uu / L); // 0 at the base of a cilium, 1 at its tip
  float w = 0.72 * (su > 0.9 ? sqrt(max(0.0, 1.0 - pow((su - 0.9) / 0.1, 2.0))) : 1.0);
  float x = abs(2.0 * f - 1.0);
  float inStrand = 1.0 - smoothstep(w - 0.12, w, x);
  float edge = pow(x / max(w, 0.01), 3.0);
  float strand = 0.38 + 0.3 * edge + 0.32 * su;
  float detail = mix(0.12, strand, inStrand);
  // Too fine to resolve: an even, slightly streaky velvet.
  float avg = 0.5 + 0.12 * vnoise(vec2(q.x * 0.5, q.y * 3.0)) + 0.08 * vnoise(q * 0.2);
  return mix(avg, detail, smoothstep(gPx * 2.0, gPx * 5.0, sp));
}

float goblet(vec2 p, vec2 c, float border) {
  float r = length(p - c);
  float dome = smoothstep(0.0, 3.5, border);
  // The rim of the dome tilts towards the detector, so it is brighter (edge effect).
  float s = 0.5 + 0.2 * (1.0 - dome) + 0.1 * dot(normalize(p - c + 1e-4), vec2(-0.7, 0.7)) * (1.0 - dome);
  // Microvilli: short stubby projections, irregularly spaced.
  vec2 mv = voronoi(p / 0.22);
  float villi = smoothstep(0.35, 0.15, mv.x);
  s += (0.22 * villi - 0.08) * smoothstep(gPx * 2.0, gPx * 6.0, 0.22);
  // Some goblet cells have a mucus droplet in their opening.
  s = mix(s, 0.85, smoothstep(1.6, 1.2, r) * step(0.5, hash12(floor(c))));
  return s;
}

void main() {
  vec2 v = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  gPx = uFov / min(uRes.x, uRes.y);
  vec2 p = uStage + v * uFov;

  // Folds of the lining, lit from the detector side.
  float e = 3.0;
  float h0 = fbm(p * 0.004), hx = fbm((p + vec2(e, 0.0)) * 0.004), hy = fbm((p + vec2(0.0, e)) * 0.004);
  vec2 grad = vec2(hx - h0, hy - h0) / e * 250.0;
  float relief = clamp(0.9 + 0.45 * dot(grad, vec2(-0.6, 0.8)), 0.6, 1.25);

  vec2 id, c; float border;
  cells(p, id, c, border);
  bool home = length(c) < 6.0;
  bool isGoblet = !home && hash12(id + 11.0) < 0.28;
  float s = isGoblet ? goblet(p, c, border) : cilia(p, id);
  // Narrow grooves where neighbouring goblet cells meet.
  if (isGoblet) s *= 0.6 + 0.4 * smoothstep(0.0, 0.5, border);
  s *= relief;

  // Strands and blobs of mucus on top, bright and smooth.
  float mucus = smoothstep(0.72, 0.8, fbm(p * 0.02 + 30.0));
  s = mix(s, 0.75 + 0.15 * fbm(p * 0.1), mucus * 0.85);

  // The edge of the tissue piece, then the dark carbon tab.
  float tissue = smoothstep(980.0, 940.0, length(p * vec2(1.0, 1.25)) + 60.0 * fbm(p * 0.006));
  s = mix(0.12 + 0.05 * vnoise(p * 0.05), s, tissue);
  outColor = vec4(vec3(clamp(s, 0.0, 1.5) / 1.5), 1.0);
}
`

// Pass 2: detector and display. Focus blur, brightness and contrast, noise from the scan speed,
// the high-voltage look, and the line-by-line build-up of a slow scan.
export const SEM_POST = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform sampler2D uSharp;
uniform float uSeed;
uniform float uOn;
uniform float uBlurPx;
uniform float uBright;
uniform float uContrast;
uniform float uPhotons;
uniform float uHighKv;
uniform float uScanY; // slow scan progress 0..1, or -1 for a fast scan
out vec4 outColor;
${NOISE}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  if (uOn < 0.5) { outColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  float lod = log2(max(1.0, uBlurPx));
  float sig = textureLod(uSharp, uv, lod).r * 1.5;
  if (uHighKv > 0.5) {
    // Deep-penetrating electrons: fine surface detail washes out and edges glow.
    float wide = textureLod(uSharp, uv, lod + 3.0).r * 1.5;
    sig = mix(sig, wide, 0.65) + max(0.0, sig - wide) * 1.2;
  }
  float g = uBright * 1.4 - 0.2 + (sig - 0.65) * (0.25 + uContrast * 1.8);
  float photons = uPhotons;
  float row = 1.0 - uv.y; // scanning runs from the top down
  if (uScanY >= 0.0 && row > uScanY) { photons = 12.0; g *= 0.85; }
  g += (hash12(gl_FragCoord.xy + uSeed) - 0.5) * 2.4 * sqrt(max(g, 0.02) / photons);
  if (uScanY >= 0.0) g += 0.5 * smoothstep(2.0 / uRes.y, 0.0, abs(row - uScanY));
  outColor = vec4(vec3(clamp(g, 0.0, 1.0)), 1.0);
}
`
