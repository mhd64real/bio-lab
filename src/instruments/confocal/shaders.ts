import { NOISE } from '../../scope/glsl'

// Pass 1: the optical section through living cells, in display colours, before detector effects.
// Space is in micrometres. Cells sit on a jittered 80 um grid; the cell at the origin is always there.
export const CONFOCAL_SPECIMEN = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uSpeed;   // 1 live, 20 for a time-lapse
uniform float uFov;
uniform float uZ;
uniform float uTh;      // optical section half-thickness, um
uniform float uPsf;     // lateral resolution (blur sigma), um
uniform vec3 uCh;       // 405, 488, 640 channels on
uniform float uSpec;    // 0 cytoskeleton cells, 1 nuclei (Hoechst + GFP nuclear pores)
out vec4 outColor;
${NOISE}

const float PI = 3.14159265;
float wrapA(float a) { return a - 2.0 * PI * floor((a + PI) / (2.0 * PI)); }
mat2 rot(float a) { return mat2(cos(a), sin(a), -sin(a), cos(a)); }
float layer(float z0) { float d = (uZ - z0) / uTh; return exp(-d * d); }
float slab(float z0, float z1) { float d = max(0.0, max(z0 - uZ, uZ - z1)) / uTh; return exp(-d * d); }


// A dense layer of living cells, seen through their nuclei. Each nucleus is an ellipsoid sitting on the glass:
// the optical section cuts it at height uZ, so its outline shrinks towards the top and bottom.
// Hoechst (blue): chromatin, brighter near the envelope, with dark nucleoli where there is little DNA, and
// faint dots of mitochondrial DNA in the cytoplasm. GFP (green): nuclear pores, a ring of dots at the
// equator that becomes a sheet of dots where the section skims the top or bottom of the envelope.
vec3 nucleiField(vec2 p, float t, float sig, float px) {
  const float SP = 24.0;
  vec3 col = vec3(0.0);
  vec2 g0 = floor(p / SP + 0.5);
  for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) {
    vec2 g = g0 + vec2(xx, yy);
    bool home = g.x == 0.0 && g.y == 0.0;
    vec2 h = hash22(g + 5.0), h2 = hash22(g * 2.7 + 1.0);
    vec2 c = g * SP + (home ? vec2(0.0) : (h - 0.5) * 9.0);
    float ang = home ? 0.3 : h.y * 6.2831;
    vec3 ax = home ? vec3(9.0, 7.0, 3.2) : vec3(6.5 + 2.5 * h.x, 5.0 + 1.8 * h2.y, 2.6 + 0.8 * h2.x);
    float zc = home ? 4.5 : 0.5 + ax.z + 0.6 * h2.y;
    vec2 q = rot(-ang) * (p - c);
    // Slightly irregular outline.
    float th = atan(q.y, q.x);
    float wob = 1.0 + 0.04 * sin(3.0 * th + h.x * 9.0) + 0.025 * sin(5.0 * th + h2.x * 7.0);
    vec2 qn = q / (ax.xy * wob);
    float r2 = dot(qn, qn);
    if (r2 > 1.6) {
      // Cytoplasm: faint specks of mitochondrial DNA.
      vec2 mv = voronoi(p * 1.4 + g * 3.0);
      col.b += 0.05 * smoothstep(0.18, 0.05, mv.x) * step(r2, 4.5) * step(0.55, hash12(floor(p * 1.4 + g * 3.0))) * slab(0.5, 2.5);
      continue;
    }
    float dz = (uZ - zc) / ax.z;
    float e = r2 + dz * dz;            // < 1 inside the nucleus at this focus
    float edgeW = sig / min(ax.x, ax.y) * 2.0 + 0.02;
    float inside = 1.0 - smoothstep(1.0 - edgeW, 1.0 + edgeW, e);
    // Axial blur: the section is uTh thick, so a nucleus just above or below still glows faintly.
    float near = exp(-pow(max(0.0, abs(uZ - zc) - ax.z * sqrt(max(0.0, 1.0 - r2))) / uTh, 2.0));
    float fill = max(inside, 0.45 * near * step(r2, 1.0));

    // Chromatin: texture that changes as the focus moves through the nucleus.
    vec2 tq = q * 0.9 + g * 13.0 + vec2(uZ * 0.83, -uZ * 0.61) + t * 0.01;
    float chrom = 0.55 + 0.5 * fbm(tq) + 0.25 * smoothstep(0.55, 0.85, vnoise(tq * 2.3));
    chrom += 0.45 * smoothstep(0.72, 0.98, e) * inside;
    // Nucleoli: spheres inside the nucleus, dark in Hoechst.
    float dark = 0.0;
    for (int k = 0; k < 3; k++) {
      vec2 hk = hash22(vec2(float(k), 9.0) + g * 1.3);
      vec3 nc = home
        ? (k == 0 ? vec3(2.4, 1.2, 5.0) : k == 1 ? vec3(-3.4, -1.6, 3.6) : vec3(0.0, -3.5, 6.2))
        : vec3((hk - 0.5) * ax.xy * 0.9, zc + (hk.x - 0.5) * ax.z);
      float nr = home ? (k == 0 ? 1.7 : k == 1 ? 1.25 : 0.8) : 0.7 + 0.8 * hk.y;
      float zz = (uZ - nc.z) / uTh;
      float cut = sqrt(max(0.0, nr * nr - pow(max(0.0, abs(uZ - nc.z) - uTh * 0.5), 2.0)));
      dark = max(dark, (1.0 - smoothstep(cut - sig, cut + sig, length(q - nc.xy))) * step(0.01, cut) * (0.85 - 0.1 * clamp(abs(zz), 0.0, 1.0)));
    }
    float dna = fill * chrom * (1.0 - dark);
    col += uCh.x * vec3(0.30, 0.48, 1.0) * dna * (home ? 1.0 : 0.85 + 0.3 * h.x);

    // Envelope with pores (GFP). Where the section crosses the steep side wall, the pores form a thin ring
    // of dots along the outline; where it skims the flat top or bottom, they are seen face-on as a sheet.
    float rf2 = 1.0 - dz * dz;
    float Rm = 0.5 * (ax.x + ax.y);
    float lat = asin(clamp(dz, -1.0, 1.0));
    float rimD = abs(sqrt(r2) - sqrt(max(rf2, 0.0))) * Rm;
    float rimW = exp(-pow(rimD / (sig * 1.2 + 0.1), 2.0)) * step(0.0, rf2);
    vec2 rv = voronoi(vec2(th * Rm * cos(lat), lat * ax.z) / 0.62 + g * 7.0);
    float rimDots = smoothstep(0.5, 0.15, rv.x);
    float sheetW = 0.0;
    float sheetDots = 0.0;
    if (r2 < 1.0) {
      float hz = ax.z * sqrt(1.0 - r2);
      sheetW = max(exp(-pow((uZ - (zc + hz)) / uTh, 2.0)), exp(-pow((uZ - (zc - hz)) / uTh, 2.0))) * smoothstep(0.98, 0.7, r2);
      sheetDots = smoothstep(0.42, 0.12, voronoi(q / 0.62 + g * 5.0 + 40.0).x);
    }
    float fine = smoothstep(px * 2.0, px * 4.0, 0.62);
    float pores = max(rimW * mix(0.6, 0.2 + 1.3 * rimDots, fine), sheetW * mix(0.45, 0.15 + 1.1 * sheetDots, fine));
    col += uCh.y * vec3(0.18, 1.0, 0.32) * pores * (home ? 1.1 : 0.95);
  }
  return col;
}

void main() {
  // Frames arrive a few times a second, like a real scanning system.
  float t = floor(uTime * 4.0) / 4.0 * uSpeed;
  vec2 v = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec2 p = v * uFov;
  float px = uFov / min(uRes.x, uRes.y);
  float sig = max(uPsf, px * 0.7);
  if (uSpec > 0.5) { outColor = vec4(nucleiField(p, t, sig, px), 1.0); return; }

  const float SP = 80.0;
  vec2 g = floor(p / SP + 0.5);
  bool home = g.x == 0.0 && g.y == 0.0;
  vec2 h = hash22(g + 7.0);
  vec2 h2 = hash22(g * 3.1 + 2.0);
  if (!home && h.x < 0.22) { outColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  vec2 c = g * SP + (home ? vec2(0.0) : (h - 0.5) * 14.0);
  float ang = home ? 0.35 : h.y * 6.2831;
  float R = home ? 30.0 : 24.0 + 7.0 * h.x;
  vec2 q = rot(-ang) * (p - c);
  float th = atan(q.y, q.x);
  float rr = length(q);
  float ph = h2.x * 6.2831;
  // Spread-out cell with a slowly ruffling edge (lamellipodia).
  float ruff = 0.035 * sin(th * 9.0 + t * 0.15 + ph) + 0.02 * sin(th * 17.0 - t * 0.22);
  float rad = R * (1.0 + 0.22 * sin(3.0 * th + ph) + 0.12 * sin(5.0 * th + 2.0 * ph) + ruff);
  float d = rad - rr; // um inside the edge
  float inside = smoothstep(-sig, sig, d);

  // Nucleus (Hoechst), with chromatin texture and darker nucleoli.
  vec2 nq = q - vec2(-7.0, -1.0);
  float nr = length(nq / vec2(9.5, 7.0));
  float nuc = (1.0 - smoothstep(1.0 - px / 7.0 - 0.04, 1.0, nr)) * (0.65 + 0.45 * fbm(nq * 0.55 + g * 9.0));
  nuc *= 1.0 - 0.55 * (1.0 - smoothstep(1.0, 2.2, length(nq - vec2(2.0, 1.0)))) - 0.45 * (1.0 - smoothstep(0.8, 1.8, length(nq - vec2(-3.0, -2.0))));

  // Microtubules radiate from the centrosome beside the nucleus and grow and shrink (dynamic instability):
  // growth about 0.25 um/s, shrinkage about 0.6 um/s, each one on its own cycle.
  vec2 cs = vec2(4.0, 0.5);
  vec2 mq = q - cs;
  float mr = length(mq);
  float mth = atan(mq.y, mq.x);
  float mt = 0.0;
  for (int i = 0; i < 64; i++) {
    float fi = float(i);
    vec2 hi = hash22(vec2(fi, 3.0) + g * 1.7);
    float a = fi * (2.0 * PI / 64.0) + (hi.x - 0.5) * 0.35;
    float k = (hi.y - 0.5) * 0.07;
    float wob = 0.09 * sin(mr * 0.18 + hi.x * 20.0) + 0.04 * sin(mr * 0.55 + hi.y * 13.0);
    float dth = wrapA(mth - (a + k * mr + wob));
    // Length limit: roughly the distance to the cell edge in that direction.
    float ea = a + ang * 0.0;
    float edge = R * (1.0 + 0.22 * sin(3.0 * ea + ph) + 0.12 * sin(5.0 * ea + 2.0 * ph)) - 1.5;
    float Lmax = max(4.0, edge - 2.0 + 3.0 * hi.y);
    float span = 6.0;
    float period = span / 0.25 + span / 0.6;
    float phase = fract(t / period + hi.x * 7.3);
    float grow = 0.7;
    float L = Lmax - span + span * (phase < grow ? phase / grow : (1.0 - phase) / (1.0 - grow));
    float dist = mr * abs(dth);
    float along = smoothstep(L + sig, L - sig, mr) * smoothstep(0.2, 1.2, mr);
    mt += exp(-dist * dist / (2.0 * sig * sig)) * along * (0.55 + 0.6 * hi.y);
  }
  mt = mt * inside + 2.5 * exp(-mr * mr / 2.0); // the bright centrosome
  mt = 1.0 - exp(-0.7 * mt);

  // Microfilaments: a bright cortex just inside the edge, ruffling, plus straight stress fibres.
  float cortex = exp(-pow(d - 0.7, 2.0) / (2.0 * (0.35 + sig * sig))) * (0.55 + 0.45 * vnoise(vec2(th * 8.0, t * 0.4 + h.x * 30.0)));
  float fib = 0.0;
  for (int j = 0; j < 7; j++) {
    float fj = float(j);
    vec2 hj = hash22(vec2(fj, 11.0) + g * 2.3);
    float fa = 0.4 + (hj.x - 0.5) * 0.7;
    vec2 n = vec2(-sin(fa), cos(fa));
    float off = (hj.y - 0.5) * R * 1.3;
    float dd = abs(dot(q, n) - off);
    fib += exp(-dd * dd / (2.0 * sig * sig)) * (0.4 + 0.6 * hj.x) * smoothstep(0.0, 4.0, d) * (1.0 - 0.6 * (1.0 - smoothstep(0.8, 1.2, nr)));
  }
  float actin = (cortex * step(0.0, d) + 0.8 * fib) * inside;

  // Depth: stress fibres at the base, microtubules just above, the nucleus a thick slab higher up.
  vec3 col = vec3(0.0);
  col += uCh.x * vec3(0.30, 0.48, 1.0) * nuc * slab(1.5, 5.5);
  col += uCh.y * vec3(0.18, 1.0, 0.32) * mt * (0.6 * layer(0.9) + 0.4 * layer(1.6) * smoothstep(1.4, 0.8, nr));
  col += uCh.z * vec3(1.0, 0.18, 0.72) * actin * layer(0.3);
  outColor = vec4(col, 1.0);
}
`

// Pass 2: detector. Haze from an open pinhole, shot noise, gain, saturation, the range indicator.
export const CONFOCAL_POST = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform sampler2D uSharp;
uniform float uSeed;
uniform float uOn;
uniform float uBright;
uniform float uPhotons;
uniform float uHaze;
uniform float uSoft;   // extra blur in pixels (missing immersion oil, wide pinhole)
uniform float uRange;
out vec4 outColor;
${NOISE}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  if (uOn < 0.5) { outColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  float lod = log2(max(1.0, uSoft));
  vec3 s = textureLod(uSharp, uv, lod).rgb;
  vec3 haze = textureLod(uSharp, uv, 5.5).rgb;
  vec3 sig = (s + uHaze * haze * 2.2) * uBright;
  // Shot noise: relative noise falls as the number of photons rises.
  vec3 n = vec3(hash12(gl_FragCoord.xy + uSeed), hash12(gl_FragCoord.xy * 1.3 + uSeed), hash12(gl_FragCoord.xy * 0.7 + uSeed)) - 0.5;
  sig += n * 1.7 * sqrt(max(sig, vec3(0.0)) / max(uPhotons, 1.0));
  sig += (hash12(gl_FragCoord.xy * 2.1 + uSeed) - 0.5) * 0.02;
  vec3 c = clamp(sig, 0.0, 1.0);
  if (uRange > 0.5) {
    float m = max(sig.r, max(sig.g, sig.b));
    float l = dot(c, vec3(0.33));
    c = m >= 1.0 ? vec3(1.0, 0.1, 0.1) : m < 0.004 ? vec3(0.1, 0.2, 1.0) : vec3(l * 1.6);
  }
  outColor = vec4(c, 1.0);
}
`
