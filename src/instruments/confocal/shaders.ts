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
out vec4 outColor;
${NOISE}

const float PI = 3.14159265;
float wrapA(float a) { return a - 2.0 * PI * floor((a + PI) / (2.0 * PI)); }
mat2 rot(float a) { return mat2(cos(a), sin(a), -sin(a), cos(a)); }
float layer(float z0) { float d = (uZ - z0) / uTh; return exp(-d * d); }
float slab(float z0, float z1) { float d = max(0.0, max(z0 - uZ, uZ - z1)) / uTh; return exp(-d * d); }

void main() {
  // Frames arrive a few times a second, like a real scanning system.
  float t = floor(uTime * 4.0) / 4.0 * uSpeed;
  vec2 v = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec2 p = v * uFov;
  float px = uFov / min(uRes.x, uRes.y);
  float sig = max(uPsf, px * 0.7);

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
