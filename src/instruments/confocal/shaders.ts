import { NOISE } from '../../scope/glsl'

// Pass 1: the optical section through living cells, in display colours, before detector effects.
// Space is in micrometres. Cells sit on a jittered 80 um grid; the cell at the origin is always there.
export const CONFOCAL_SPECIMEN = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uSpeed;   // 1 live, 20 (or 120 for the traffic cells) for a time-lapse
uniform float uFov;
uniform float uZ;
uniform float uTh;      // optical section half-thickness, um
uniform float uPsf;     // lateral resolution (blur sigma), um
uniform vec3 uCh;       // 405, 488, 640 channels on
uniform float uSpec;    // 0 cytoskeleton cells, 1 nuclei (Hoechst + GFP nuclear pores), 2 mitochondria, 3 protein traffic, 4 lysosomes
uniform float uMin;     // traffic: minutes since the release to 32 °C; lyso: minutes of watching
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

// Living cells stained with MitoTracker Green (mitochondria) and Hoechst (nucleus). Mitochondria are
// tubes 0.4 um wide and 1 to 6 um long, crowded around the nucleus, sliding back and forth along
// microtubules. In the middle cell, one long mitochondrion (MITO in model.ts) pinches in two and fuses again.
float capsule(vec2 p, vec2 a, vec2 b) { vec2 ab = b - a; float h = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0); return length(p - a - ab * h); }
vec3 mitoField(vec2 p, float t, float sig, float px) {
  const float SP = 80.0;
  vec2 g = floor(p / SP + 0.5);
  bool home = g.x == 0.0 && g.y == 0.0;
  vec2 h = hash22(g + 7.0), h2 = hash22(g * 3.1 + 2.0);
  if (!home && h.x < 0.2) return vec3(0.0);
  vec2 c = g * SP + (home ? vec2(0.0) : (h - 0.5) * 14.0);
  float ang = home ? 0.35 : h.y * 6.2831;
  float R = home ? 30.0 : 24.0 + 7.0 * h.x;
  vec2 q = rot(-ang) * (p - c);
  vec2 pc = p - c; // unrotated, for the marked mitochondrion
  float th = atan(q.y, q.x);
  float ph = h2.x * 6.2831;
  float rad = R * (1.0 + 0.22 * sin(3.0 * th + ph) + 0.12 * sin(5.0 * th + 2.0 * ph));
  float d = rad - length(q);
  float inside = smoothstep(-sig, sig, d);
  vec2 nc = vec2(-7.0, -1.0);
  vec2 nq = q - nc;
  float nr = length(nq / vec2(9.5, 7.0));
  float nuc = (1.0 - smoothstep(1.0 - px / 7.0 - 0.04, 1.0, nr)) * (0.65 + 0.45 * fbm(nq * 0.55 + g * 9.0));
  nuc *= 1.0 - 0.55 * (1.0 - smoothstep(1.0, 2.2, length(nq - vec2(2.0, 1.0))));

  float w = 0.2;
  float m = 0.0;
  for (int i = 0; i < 150; i++) {
    float fi = float(i);
    vec2 hi = hash22(vec2(fi, 13.0) + g * 1.7);
    vec2 hj = hash22(vec2(fi, 29.0) + g * 2.3);
    // Position: around the nucleus, denser close to it.
    float a = hi.x * 6.2831;
    float er = R * (1.0 + 0.22 * sin(3.0 * a + ph) + 0.12 * sin(5.0 * a + 2.0 * ph));
    float rr = mix(10.5, er - 3.0, pow(hi.y, 1.6));
    vec2 mc = nc + vec2(cos(a), sin(a)) * rr;
    if (length(q - mc) > 9.0) continue;
    if (home && length(rot(ang) * mc - vec2(6.0, 4.0)) < 5.0) continue; // keep the marked one easy to see
    float o = a + (hj.x - 0.5) * 1.4; // roughly radial, like the microtubules they ride on
    vec2 dir = vec2(cos(o), sin(o));
    float L = 1.0 + 5.0 * hj.y * hj.y;
    mc += dir * 1.6 * sin(t * (0.03 + 0.05 * hj.x) + hi.y * 20.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    vec2 lq = q - mc;
    float u = dot(lq, dir);
    lq -= nrm * 0.5 * sin(u * 0.9 + hj.x * 9.0 + t * 0.02) * min(1.0, L / 3.0); // gently curved
    float dd = capsule(lq, -dir * L * 0.5, dir * L * 0.5);
    m += exp(-dd * dd / (2.0 * (w * w + sig * sig))) * (0.7 + 0.4 * hj.x);
  }
  if (home) {
    // The marked mitochondrion: 6 um long; it constricts in the middle, splits, the halves drift apart, then fuse.
    float f = fract(t / 60.0 + 0.2);
    float split = smoothstep(0.35, 0.55, f) * (1.0 - smoothstep(0.85, 0.98, f));
    float gap = 1.6 * smoothstep(0.5, 0.75, f) * (1.0 - smoothstep(0.8, 0.98, f));
    vec2 dir = normalize(vec2(1.0, 0.45));
    vec2 lq = pc - vec2(6.0, 4.0);
    float u = dot(lq, dir);
    float side = sign(u);
    lq -= dir * side * gap * 0.5;
    u = dot(lq, dir);
    float dd = capsule(lq, -dir * 3.0, dir * 3.0);
    // Constriction: thinner near the middle as it splits, then a clean gap.
    float neck = 1.0 - split * exp(-u * u / 0.15);
    float wm = w * max(neck, 0.05);
    float cut = 1.0 - step(0.5, split) * (1.0 - smoothstep(0.0, 0.25, abs(u) - gap * 0.0));
    m += exp(-dd * dd / (2.0 * (wm * wm + sig * sig))) * 1.1 * max(cut, 1.0 - split) * smoothstep(0.0, 0.08, neck);
  }
  m = (1.0 - exp(-0.8 * m)) * inside;
  vec3 col = vec3(0.0);
  col += uCh.x * vec3(0.30, 0.48, 1.0) * nuc * slab(2.0, 5.0);
  col += uCh.y * vec3(0.18, 1.0, 0.32) * m * (0.65 * layer(1.2) + 0.35 * layer(2.2));
  return col;
}

// Cells making a GFP-tagged membrane protein (green) and a far-red Golgi marker (magenta), with Hoechst.
// uMin: minutes since the release from 40 °C to 32 °C (0 = still held in the ER). The protein starts in the
// ER network (which wraps the nucleus as the nuclear envelope), gathers in the Golgi ribbon beside the
// nucleus, then reaches the plasma membrane; small transport carriers dart between them. Same split as
// cargoSplit in model.ts. Only about half the cells took up the genes.
float sq(float x) { return x * x; }
vec3 cargo(float m) {
  if (m <= 0.0) return vec3(1.0, 0.0, 0.0);
  float k1 = 1.0 / 8.0, k2 = 1.0 / 18.0;
  float er = exp(-k1 * m);
  float go = k1 / (k2 - k1) * (exp(-k1 * m) - exp(-k2 * m));
  return vec3(er, go, max(0.0, 1.0 - er - go));
}
vec3 trafficField(vec2 p, float t, float sig, float px) {
  const float SP = 80.0;
  vec2 g = floor(p / SP + 0.5);
  bool home = g.x == 0.0 && g.y == 0.0;
  vec2 h = hash22(g + 7.0), h2 = hash22(g * 3.1 + 2.0);
  if (!home && h.x < 0.2) return vec3(0.0);
  bool expr = home || h2.y > 0.45;
  vec2 c = g * SP + (home ? vec2(0.0) : (h - 0.5) * 14.0);
  float ang = home ? 0.35 : h.y * 6.2831;
  float R = home ? 25.0 : 22.0 + 6.0 * h.x;
  vec2 q = rot(-ang) * (p - c);
  float th = atan(q.y, q.x);
  float ph = h2.x * 6.2831;
  float rad = R * (1.0 + 0.13 * sin(2.0 * th + ph) + 0.1 * sin(3.0 * th + 2.3 * ph) + 0.05 * sin(7.0 * th + ph * 3.0));
  float d = rad - length(q);
  float inside = smoothstep(-sig, sig, d);
  vec2 nc = vec2(-7.0, -1.0);
  vec2 nq = q - nc;
  float nr = length(nq / vec2(9.5, 7.0));
  float nucIn = 1.0 - smoothstep(1.0 - px / 7.0 - 0.04, 1.0, nr);
  float nuc = nucIn * (0.65 + 0.45 * fbm(nq * 0.55 + g * 9.0));
  nuc *= 1.0 - 0.55 * (1.0 - smoothstep(1.0, 2.2, length(nq - vec2(2.0, 1.0))));
  vec3 col = vec3(0.0);
  col += uCh.x * vec3(0.30, 0.48, 1.0) * nuc * slab(2.0, 5.0);
  if (!expr) return col;

  vec3 sp = cargo(home ? uMin : max(0.0, uMin + (h2.x - 0.5) * 6.0 * step(0.001, uMin)));
  float lvl = home ? 1.0 : 0.6 + 0.6 * h.x; // how much protein each cell makes

  // ER: a fine network of tubes, denser and sheet-like near the nucleus, continuous with the nuclear envelope.
  vec2 wq = q + 1.6 * vec2(fbm(q * 0.12 + g), fbm(q * 0.12 + g + 7.0));
  float tw = 0.018 + 0.022 * vnoise(wq * 0.6);
  vec2 v1 = voronoi(wq / 1.4 + g * 5.0), v2 = voronoi(wq / 2.6 + g * 3.0 + 17.0);
  float e1 = (v1.y - v1.x) * 0.7, e2 = (v2.y - v2.x) * 1.3;
  float net = mix(exp(-e1 * e1 / (tw + sig * sig)), exp(-e2 * e2 / (tw + sig * sig)), smoothstep(5.0, 16.0, length(nq)));
  net *= 0.45 + 0.55 * vnoise(wq * 0.7 + 3.0);
  net *= step(0.22, vnoise(wq * 0.35 + 11.0)) * 0.7 + 0.3;
  float nearN = 1.0 - smoothstep(1.0, 1.9, nr);
  float sheet = nearN * (0.35 + 0.35 * fbm(q * 0.7 + g));
  float env = exp(-sq((nr - 1.0) * 8.0));
  float er = (max(net, sheet) * (1.0 - nucIn) + 1.2 * env) * smoothstep(0.0, 6.0, d) * inside;

  // Golgi ribbon: compact bright stacks hugging the nucleus on the side towards the cell centre.
  vec2 gq = nq / vec2(9.5, 7.0);
  float ga = atan(gq.y, gq.x);
  float gband = exp(-sq((nr - 1.28 - 0.05 * sin(ga * 5.0)) / 0.2)) * exp(-sq(ga / 0.85));
  float stacks = smoothstep(0.3, 0.6, vnoise(q * 1.1 + g * 3.0));
  float golgi = gband * (0.3 + 0.7 * stacks);

  // Plasma membrane: the outline of the cell, plus a faint film over its flat underside.
  float pmRim = exp(-sq(d - 0.4) / (0.15 + sig * sig)) * step(-1.0, d);
  float pmBase = 0.18 * inside * (0.8 + 0.2 * vnoise(q * 0.5));

  // Transport carriers: dots darting from the ER to the Golgi and from the Golgi to the cell edge.
  vec2 gc = nc + vec2(9.5, 7.0) * 1.3 * vec2(1.0, 0.0);
  float car = 0.0;
  float f1 = clamp(sp.x * 4.0, 0.0, 1.0) * step(0.001, sp.y + sp.z);
  float f2 = clamp(sp.y * 3.0, 0.0, 1.0);
  for (int i = 0; i < 28; i++) {
    float fi = float(i);
    vec2 hi = hash22(vec2(fi, 17.0) + g);
    bool outw = i >= 14;
    float amp = outw ? f2 : f1;
    if (amp < 0.01) continue;
    float a = hi.x * 6.2831;
    float er_ = R * (1.0 + 0.13 * sin(2.0 * a + ph) + 0.1 * sin(3.0 * a + 2.3 * ph) + 0.05 * sin(7.0 * a + ph * 3.0));
    vec2 far = nc + vec2(cos(a), sin(a)) * mix(12.0, er_ - 1.0, outw ? 1.0 : 0.3 + 0.6 * hi.y);
    float f = fract(t / (10.0 + 8.0 * hi.y) + hi.y * 7.0);
    vec2 pos = outw ? mix(gc, far, f) : mix(far, gc, f);
    float l = length(q - pos);
    car += exp(-l * l / (2.0 * (0.12 + sig * sig))) * amp * smoothstep(0.0, 0.1, f) * smoothstep(1.0, 0.85, f);
  }

  float green = lvl * (1.25 * sp.x * er * slab(0.6, 2.6) + 4.5 * sp.y * golgi * slab(1.5, 3.5)
    + sp.z * (1.3 * pmRim * slab(0.2, 3.5) + pmBase * layer(0.3)) + 0.8 * car * slab(0.6, 3.0));
  float marker = lvl * (0.95 * golgi + 0.05 * er) * slab(1.5, 3.5);
  col += uCh.y * vec3(0.18, 1.0, 0.32) * 0.6 * green;
  col += uCh.z * vec3(1.0, 0.18, 0.72) * 0.75 * marker;
  return col;
}

// Macrophages that have swallowed GFP bacteria (green), with LysoTracker in their lysosomes (magenta) and
// Hoechst. uMin: minutes of watching. Lysosomes dart about along microtubules; one by one they gather on each
// bacterium's sac and fuse with it, so magenta builds up around the green (white where they overlap); then
// the enzymes digest the bacterium and its green fades.
vec3 lysoField(vec2 p, float t, float sig, float px) {
  const float SP = 50.0;
  vec2 g = floor(p / SP + 0.5);
  bool home = g.x == 0.0 && g.y == 0.0;
  vec2 h = hash22(g + 31.0), h2 = hash22(g * 2.3 + 5.0);
  if (!home && h.x < 0.25) return vec3(0.0);
  vec2 c = g * SP + (home ? vec2(0.0) : (h - 0.5) * 12.0);
  float ang = home ? 0.0 : h.y * 6.2831;
  float R = home ? 14.0 : 11.0 + 4.0 * h.x;
  vec2 q = rot(-ang) * (p - c);
  float th = atan(q.y, q.x);
  float ph = h2.x * 6.2831;
  float rad = R * (1.0 + 0.12 * sin(2.0 * th + ph) + 0.08 * sin(5.0 * th + 2.0 * ph) + 0.03 * sin(11.0 * th + t * 0.05));
  float d = rad - length(q);
  if (d < -2.0) return vec3(0.0);
  vec2 nc = vec2(-3.0, -1.0);
  vec2 nq = q - nc;
  float nr = length(nq / vec2(5.5, 4.2)) - 0.12 * smoothstep(0.0, 1.0, -nq.x / 5.5) * exp(-sq(nq.y / 2.0)); // kidney dent
  float nuc = (1.0 - smoothstep(1.0 - px / 5.0 - 0.04, 1.0, nr)) * (0.65 + 0.45 * fbm(nq * 0.7 + g * 9.0));
  vec3 col = uCh.x * vec3(0.30, 0.48, 1.0) * nuc * slab(1.5, 5.0);
  if (d < 0.0) return col;

  float green = 0.0, mag = 0.0;
  // Three swallowed bacteria, each in its own sac; the later ones were eaten a few minutes later.
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 hb = hash22(vec2(fi, 3.0) + g);
    vec2 bc = home ? (i == 0 ? vec2(5.0, 2.0) : i == 1 ? vec2(2.0, -6.5) : vec2(-6.5, 6.0)) : vec2(cos(fi * 2.1 + h.x * 6.0), sin(fi * 2.1 + h.x * 6.0)) * (R * 0.55);
    float off = fi * 3.0 + (home ? 0.0 : (hb.x - 0.5) * 6.0);
    float fuse = smoothstep(2.0 + off, 13.0 + off, uMin);
    float left = 1.0 - smoothstep(9.0 + off, 34.0 + off, uMin); // bacterium not yet digested
    float a = hb.y * 6.2831;
    vec2 dir = vec2(cos(a), sin(a));
    vec2 bq = q - bc;
    float L = 1.0 * (0.55 + 0.45 * left);
    float rod = capsule(bq, -dir * L, dir * L);
    float bact = exp(-rod * rod / (2.0 * (0.12 + sig * sig))) * (1.0 - smoothstep(0.35, 0.5, rod));
    bact *= mix(0.5 + 0.5 * vnoise(bq * 3.0 + fi), 1.0, left); // breaking into pieces as it goes
    green += 1.6 * bact * left;
    // The sac fills with lysosome contents: a rim at first, then the whole sac.
    float sac = capsule(bq, -dir * 1.0, dir * 1.0);
    float rim = exp(-sq((sac - 0.75) / (0.28 + sig)));
    float fill = 1.0 - smoothstep(0.55, 0.95, sac);
    mag += fuse * (0.9 * rim * (1.0 - 0.5 * fuse) + 1.1 * fill * smoothstep(0.3, 1.0, fuse));
  }
  // Lysosomes: dots about 0.6 um across, wandering and darting; some are pulled to a bacterium and merge in.
  for (int j = 0; j < 70; j++) {
    float fj = float(j);
    vec2 hj = hash22(vec2(fj, 41.0) + g), hk = hash22(vec2(fj, 43.0) + g);
    float a = hj.x * 6.2831;
    float er = R * (1.0 + 0.12 * sin(2.0 * a + ph) + 0.08 * sin(5.0 * a + 2.0 * ph));
    vec2 base = vec2(cos(a), sin(a)) * mix(6.5, er - 1.5, sqrt(hj.y));
    vec2 wob = 1.2 * vec2(sin(t * (0.05 + 0.08 * hk.x) + hk.y * 30.0), cos(t * (0.04 + 0.07 * hk.y) + hk.x * 20.0));
    float run = smoothstep(0.85, 1.0, fract(t / (25.0 + 30.0 * hk.x) + hk.y));
    vec2 pos = base + wob + vec2(cos(a + 1.5), sin(a + 1.5)) * 3.0 * run;
    float merge = 0.0;
    if (j % 4 != 3) {
      int bi = j % 3;
      vec2 bc = home ? (bi == 0 ? vec2(5.0, 2.0) : bi == 1 ? vec2(2.0, -6.5) : vec2(-6.5, 6.0)) : vec2(cos(float(bi) * 2.1 + h.x * 6.0), sin(float(bi) * 2.1 + h.x * 6.0)) * (R * 0.55);
      float off = float(bi) * 3.0 + (home ? 0.0 : (hash22(vec2(float(bi), 3.0) + g).x - 0.5) * 6.0);
      float o = hk.x * 0.6;
      float pull = smoothstep(o, o + 0.35, smoothstep(2.0 + off, 13.0 + off, uMin));
      pos = mix(pos, bc + vec2(cos(fj), sin(fj)) * 1.0, pull);
      merge = smoothstep(0.7, 1.0, pull);
    }
    float l = length(q - pos);
    mag += (1.0 - merge) * exp(-l * l / (2.0 * (0.07 + sig * sig))) * (0.8 + 0.4 * hk.y);
  }
  float inside = smoothstep(-sig, sig, d);
  // Faint natural glow of the cell itself (autofluorescence) shows its outline in the green channel.
  float glow = 0.08 * (0.7 + 0.3 * vnoise(q * 0.6));
  col += uCh.y * vec3(0.18, 1.0, 0.32) * (0.65 * green + glow) * inside * slab(0.6, 3.5);
  col += uCh.z * vec3(1.0, 0.18, 0.72) * 0.7 * mag * inside * slab(0.6, 3.5);
  return col;
}

void main() {
  // Frames arrive a few times a second, like a real scanning system.
  float t = floor(uTime * 4.0) / 4.0 * uSpeed;
  vec2 v = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  vec2 p = v * uFov;
  float px = uFov / min(uRes.x, uRes.y);
  float sig = max(uPsf, px * 0.7);
  if (uSpec > 3.5) { outColor = vec4(lysoField(p, t, sig, px), 1.0); return; }
  if (uSpec > 2.5) { outColor = vec4(trafficField(p, t, sig, px), 1.0); return; }
  if (uSpec > 1.5) { outColor = vec4(mitoField(p, t, sig, px), 1.0); return; }
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
