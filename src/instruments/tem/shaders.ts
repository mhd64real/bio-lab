import { NOISE } from '../../scope/glsl'

// Pass 1: electron density of the stained ultra-thin section (1 = dark, scatters electrons; 0 = transparent).
// Space in micrometres. A copper grid (85 um pitch) holds the section; a cell at the origin has a
// centrosome beside its nucleus with two centrioles: one cut across (ring of 9 triplets), one cut lengthwise.
export const TEM_SPECIMEN = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uFov;
uniform vec2 uStage;
uniform vec3 uBurn; // x, y, on
uniform float uSpec; // 0 centrosome cell, 1 ciliated windpipe lining, 2 nucleus
out vec4 outColor;
${NOISE}

float gPx;
// Lines thinner than a pixel get fainter rather than wider, as on a real camera.
float ring(float d, float r, float w) { return (1.0 - smoothstep(w * 0.5, w * 0.5 + gPx * 1.2, abs(d - r))) * min(1.0, w / gPx + 0.08); }
float disc(float d, float r) { return 1.0 - smoothstep(r - gPx, r + gPx, d); }
mat2 rot(float a) { return mat2(cos(a), sin(a), -sin(a), cos(a)); }
// Fades detail in once it is larger than a few pixels (finer detail cannot be resolved at this magnification).
float lod(float size) { return smoothstep(gPx * 1.5, gPx * 5.0, size); }

// A microtubule seen end-on: a hollow ring 25 nm across.
float mtEnd(vec2 p, vec2 c) { float d = length(p - c); return ring(d, 0.0105, 0.005) * lod(0.025); }

float centrioleCross(vec2 p) {
  float acc = 0.0;
  for (int i = 0; i < 9; i++) {
    float a = float(i) * 6.2831853 / 9.0;
    vec2 dir = vec2(cos(a), sin(a));
    vec2 tan = vec2(-dir.y, dir.x);
    // Triplet blade: three tubules A, B, C in a row, tilted about 40 degrees to the radius.
    vec2 axis = normalize(dir * 0.76 + tan * 0.65);
    vec2 c0 = dir * 0.083;
    for (int k = -1; k <= 1; k++) acc = max(acc, mtEnd(p, c0 + axis * float(k) * 0.021));
  }
  float r = length(p);
  // Dense amorphous material around the wall and faint cartwheel spokes inside.
  float halo = 0.35 * smoothstep(0.125, 0.105, r) * smoothstep(0.055, 0.075, r) * (0.6 + 0.4 * vnoise(p * 300.0));
  float spokes = 0.25 * smoothstep(0.06, 0.02, abs(fract(atan(p.y, p.x) / 6.2831853 * 9.0) - 0.5) * r * 40.0) * step(r, 0.065) * lod(0.02);
  return max(acc, max(halo, spokes) * lod(0.04));
}

float centrioleLong(vec2 p) {
  // A cylinder 200 nm wide and 450 nm long, cut along its length: parallel tubule walls.
  vec2 q = abs(p);
  if (q.y > 0.225 || q.x > 0.12) return 0.0;
  float walls = 0.0;
  for (int k = 0; k < 3; k++) walls = max(walls, 1.0 - smoothstep(0.004, 0.004 + gPx * 1.2, abs(q.x - (0.074 + float(k) * 0.016))));
  float ends = smoothstep(0.225, 0.215, q.y);
  return (walls * 0.9 + 0.18) * ends * lod(0.03) + 0.25 * step(q.x, 0.105) * ends;
}

// A cilium cut across: a membrane around 9 doublet microtubules and 2 single ones in the middle (9 + 2).
float ciliumCross(vec2 p, float spin) {
  float r = length(p);
  if (r > 0.14) return 0.0;
  float d = 0.2 * smoothstep(0.13, 0.12, r);
  d = max(d, ring(r, 0.125, 0.008) * 0.9);
  for (int i = 0; i < 9; i++) {
    float a = float(i) * 6.2831853 / 9.0 + spin;
    vec2 dir = vec2(cos(a), sin(a));
    vec2 tn = vec2(-dir.y, dir.x);
    vec2 c = dir * 0.088;
    d = max(d, mtEnd(p, c));
    // The B tubule is incomplete: an arc fused onto the A tubule.
    vec2 cb = c + tn * 0.017 + dir * 0.003;
    float rb = length(p - cb);
    float arc = ring(rb, 0.0105, 0.005) * step(0.0, dot(p - cb, tn) + 0.004);
    d = max(d, arc * lod(0.025));
    // Dynein arms: small hooks on the A tubule.
    d = max(d, 0.6 * disc(length(p - (c - tn * 0.014 - dir * 0.004)), 0.0035) * lod(0.02));
    // Radial spoke towards the centre.
    vec2 sp = p - dir * 0.05;
    d = max(d, 0.35 * (1.0 - smoothstep(0.002, 0.002 + gPx, abs(dot(sp, tn)))) * step(abs(dot(sp, dir)), 0.022) * lod(0.02));
  }
  vec2 cp = vec2(cos(spin * 3.0), sin(spin * 3.0)) * 0.015;
  d = max(d, max(mtEnd(p, cp), mtEnd(p, -cp)));
  return d;
}

float ciliaSection(vec2 p) {
  float dens = 0.06 + 0.03 * fbm(p * 0.8);
  // Cells on a jittered 7 um grid, cut across just below their tops; the cell at the origin is centred exactly.
  vec2 g = floor(p / 7.0 + 0.5);
  float d1 = 1e9, d2 = 1e9; vec2 id = g, cc = vec2(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 gg = g + vec2(x, y);
    vec2 c = gg * 7.0 + ((gg.x == 0.0 && gg.y == 0.0) ? vec2(0.0) : (hash22(gg) - 0.5) * 3.0);
    float d = length(p - c);
    if (d < d1) { d2 = d1; d1 = d; id = gg; cc = c; } else if (d < d2) d2 = d;
  }
  float border = (d2 - d1) * 0.5;
  bool home = id.x == 0.0 && id.y == 0.0;
  bool goblet = !home && hash12(id + 11.0) < 0.28;
  float memb = (1.0 - smoothstep(0.008, 0.008 + gPx * 1.5, border)) * 0.85;
  if (goblet) {
    // Pale mucus granules packed inside.
    vec2 mv = voronoi((p - cc) / 0.9);
    dens = 0.22 - 0.1 * smoothstep(0.45, 0.2, mv.x) + 0.25 * (1.0 - smoothstep(0.0, 0.05, mv.y - mv.x));
  } else {
    // Cilia packed in a hexagonal array; too small to see one by one at low magnification.
    vec2 q = p - cc;
    float sp = 0.33;
    vec2 b = vec2(sp * 0.5, sp * 0.8660254);
    float j = floor(q.y / b.y + 0.5);
    float i = floor((q.x - j * b.x) / sp + 0.5);
    float best = 1e9; vec2 bc = vec2(0.0); vec2 bk = vec2(0.0);
    for (int dj = -1; dj <= 1; dj++) for (int di = -1; di <= 1; di++) {
      vec2 k = vec2(i + float(di), j + float(dj));
      vec2 c = vec2(k.x * sp + k.y * b.x, k.y * b.y);
      float d = length(q - c);
      if (d < best) { best = d; bc = c; bk = k; }
    }
    float spin = hash12(bk + id * 13.0) * 6.2831;
    float cil = ciliumCross(q - bc, spin) * smoothstep(0.0, 0.5, border);
    float tex = 0.3 + 0.2 * vnoise(p * 7.0) + 0.1 * vnoise(p * 1.3);
    dens = max(0.14 + 0.05 * fbm(p * 2.0), mix(tex, cil, lod(0.08)));
  }
  return max(dens, memb);
}


// Cytoplasm of a sectioned cell: ribosomes, mitochondria with cristae and rough ER.
// q: position in the cell frame, g: cell id, R: cell radius, keep: centre and radius of an area to keep clear.
float cytoplasm(vec2 p, vec2 q, vec2 g, float R, vec3 keep) {
  vec2 rv = voronoi(p * 28.0);
  float rib = smoothstep(0.32, 0.14, rv.x) * smoothstep(0.38, 0.55, vnoise(p * 9.0)) * lod(0.02);
  rib = max(rib * 0.8, 0.35 * smoothstep(0.55, 0.75, vnoise(p * 14.0)) * (1.0 - lod(0.02)));
  float cyto = 0.2 + 0.08 * fbm(p * 3.0) + 0.25 * rib + 0.06 * (vnoise(p * 200.0) - 0.5) * lod(0.01);
  for (int m = 0; m < 6; m++) {
    vec2 hm = hash22(vec2(float(m), 5.0) + g * 1.9);
    vec2 mc = (hm - 0.5) * R * 1.3;
    if (length(mc - keep.xy) < keep.z) continue;
    vec2 mq = rot(hm.x * 6.28) * (q - mc);
    float e = length(mq / vec2(0.9, 0.35));
    if (e < 1.08) {
      float mem = ring(e, 1.0, 0.06) * 0.9;
      float cri = (1.0 - smoothstep(0.015, 0.015 + gPx, abs(fract(mq.x * 5.0) - 0.5) / 5.0)) * step(e, 0.95) * lod(0.05);
      cyto = max(cyto * 0.8 + 0.25 * step(e, 1.0), max(mem, cri * 0.75));
    }
  }
  float er = 0.0;
  for (int j = 0; j < 4; j++) {
    vec2 hj = hash22(vec2(float(j), 8.0) + g);
    vec2 eq = rot(hj.x * 3.0) * (q - (hj - 0.5) * R);
    if (length((hj - 0.5) * R - keep.xy) < keep.z * 0.8) continue;
    float wav = eq.y + 0.25 * sin(eq.x * 1.7 + hj.y * 9.0);
    float pair = max(ring(abs(wav), 0.035, 0.012), 0.0) * step(abs(eq.x), 2.5);
    er = max(er, pair * lod(0.03));
  }
  return max(cyto, er * 0.8);
}

// Shape of a nucleus outline at elliptical angle th (also used in model.ts to find a pore).
float nucWob(float th, float seed) { return 1.0 + 0.03 * sin(3.0 * th + seed) + 0.02 * sin(5.0 * th + 2.0 * seed); }

// The nucleus, sectioned: double envelope with pores, ribosomes on the outer membrane, heterochromatin
// lining the envelope (interrupted at the pores) and in clumps, pale euchromatin, and a nucleolus: a dense
// spongy network of granules with small pale fibrillar centres. Returns density, or -1 outside the nucleus.
const float PORE_SLOT = 0.85;
const float HOME_PORE = 7.0;
// A soft membrane profile (stained lipid bilayer), fading once thinner than a pixel.
float softLine(float d, float w) { float s = max(w, gPx * 0.7); return exp(-d * d / (s * s)) * min(1.0, w / gPx + 0.1); }
float nucleusSection(vec2 nq, vec2 ax, float seed, vec3 nucleolus, bool home) {
  float th = atan(nq.y / ax.y, nq.x / ax.x);
  float w = nucWob(th, seed);
  vec2 rim = ax * w * vec2(cos(th), sin(th));
  float rl = length(rim);
  float dEnv = (length(nq) / rl - 1.0) * rl; // um, negative inside
  if (dEnv > 0.1) return -1.0;
  dEnv += 0.012 * sin(th * rl * 9.0 + seed) * lod(0.03); // gentle undulation of the envelope

  // Pores: one in most 0.85 um stretches of the outline (arc length measured with the mean radius).
  float Rm = 0.5 * (ax.x + ax.y);
  float sArc = (th + 3.14159265) * Rm;
  float k = floor(sArc / PORE_SLOT);
  bool target = home && k == HOME_PORE;
  bool has = target || hash12(vec2(k, seed)) < 0.65;
  float pc = (k + 0.5) * PORE_SLOT + (target ? 0.0 : (hash12(vec2(k, seed + 1.0)) - 0.5) * 0.45);
  float dp = has ? abs(sArc - pc) : 1.0;
  float inPore = 1.0 - smoothstep(0.044, 0.05, dp);

  // Two thin membranes with the perinuclear space between them; they join round the edge of each pore.
  float sep = 0.024 + 0.028 * smoothstep(0.2, 0.9, vnoise(vec2(sArc * 3.0, seed)));
  float memb = max(softLine(dEnv, 0.0055), softLine(dEnv - sep, 0.0055));
  memb = max(memb, softLine(dp - 0.048, 0.0055) * smoothstep(-0.006, 0.0, dEnv) * smoothstep(sep + 0.006, sep, dEnv));
  memb *= (1.0 - inPore) * (0.48 + 0.2 * vnoise(vec2(sArc * 90.0, seed)) + 0.12 * vnoise(vec2(sArc, dEnv) * 300.0));
  // The pore complex: fuzzy material filling the opening, densest in the middle, with fibrils either side.
  float fuzz = 0.5 + 0.5 * vnoise(vec2(sArc, dEnv) * 160.0);
  float mid = dEnv - sep * 0.5;
  float plug = (1.0 - smoothstep(0.035, 0.065, dp)) * (0.5 * exp(-(dp * dp + mid * mid) / 0.0009) + 0.3 * fuzz * exp(-mid * mid / 0.0015));

  if (dEnv > sep + 0.006) {
    // Cytoplasm side: ribosomes stuck to the outer membrane.
    float rs = sArc / 0.032;
    float off = 0.058 + 0.01 * (hash12(vec2(floor(rs), seed + 2.0)) - 0.5);
    float d = length(vec2((fract(rs) - 0.5) * 0.032, dEnv - off));
    float ribo = smoothstep(0.013, 0.007, d) * step(0.5, hash12(vec2(floor(rs), seed))) * (1.0 - inPore) * lod(0.02);
    float v = max(memb, max(plug, ribo * 0.75));
    return v > 0.05 ? max(v, 0.26) : -1.0;
  }
  if (dEnv > 0.0) return max(0.22 + 0.1 * (fuzz - 0.5) + 0.06 * (vnoise(nq * 200.0) - 0.5), max(memb, plug));

  // Inside. Fine granular texture of chromatin fibres, only resolved at high magnification.
  float grain = 0.6 * vnoise(nq * 70.0 + seed) + 0.4 * vnoise(nq * 140.0);
  float eu = 0.21 + 0.07 * fbm(nq * 5.0 + seed) + 0.22 * (grain - 0.5) * lod(0.015);
  // Heterochromatin: a dark layer of uneven thickness under the envelope, with pale channels to the pores.
  float band = 0.1 + 0.2 * fbm(vec2(sArc * 2.2, seed));
  float rough = 0.05 * (fbm(nq * 22.0 + seed) - 0.5);
  float het = smoothstep(-band - 0.04, -band + 0.03, dEnv + rough);
  het *= 1.0 - (1.0 - smoothstep(0.04, 0.12, dp + 0.15 * smoothstep(-0.05, -0.35, dEnv)));
  // Irregular clumps through the interior.
  het = max(het, smoothstep(0.6, 0.7, fbm(nq * 1.3 + seed * 3.0) + 0.1 * (fbm(nq * 14.0 + seed) - 0.5)));
  float hd = 0.52 + 0.1 * fbm(nq * 18.0) + 0.3 * (grain - 0.5) * lod(0.015);
  float dens = mix(eu, hd, het);

  if (nucleolus.z > 0.0) {
    vec2 oq = nq - nucleolus.xy;
    float orad = nucleolus.z * (0.92 + 0.22 * fbm(normalize(oq + 1e-4) * 2.0 + seed));
    float rr = length(oq);
    // Heterochromatin clinging round the nucleolus.
    dens = mix(dens, hd, smoothstep(orad + 0.25, orad + 0.05, rr) * smoothstep(0.45, 0.6, fbm(oq * 4.0 + seed)));
    float inN = 1.0 - smoothstep(orad - gPx, orad + gPx + 0.02, rr);
    if (inN > 0.0) {
      // Nucleolonema: a spongy network of dense strands with paler spaces between.
      float net = smoothstep(0.38, 0.56, fbm(oq * 6.0 + seed * 2.0));
      vec2 gv = voronoi(oq / 0.026 + seed);
      float granules = smoothstep(0.45, 0.15, gv.x);
      float nuc = mix(0.55, 0.68, net) + 0.22 * (granules - 0.5) * lod(0.022) + 0.12 * (fbm(oq * 25.0) - 0.5);
      // Fibrillar centres: small pale islands rimmed by the dense fibrillar component.
      for (int f = 0; f < 6; f++) {
        vec2 hf = hash22(vec2(float(f), seed + 4.0));
        vec2 fc = (hf - 0.5) * orad * 1.25;
        float fr = 0.05 + 0.06 * hf.y;
        float d = length(oq - fc) * (1.0 + 0.25 * vnoise((oq - fc) * 60.0));
        nuc = mix(nuc, 0.8, smoothstep(fr + 0.06, fr + 0.01, d) * smoothstep(fr - 0.03, fr + 0.01, d) * lod(0.03));
        nuc = mix(nuc, 0.4 + 0.1 * grain, smoothstep(fr + 0.01, fr - 0.02, d) * lod(0.03));
      }
      dens = mix(dens, nuc, inN);
    }
  }
  return max(dens, max(memb, plug));
}

float nucleusTissue(vec2 p) {
  float dens = 0.06 + 0.03 * fbm(p * 0.8);
  vec2 g = floor(p / 26.0 + 0.5);
  bool home = g.x == 0.0 && g.y == 0.0;
  vec2 h = hash22(g + 3.0);
  if (!home && h.x <= 0.3) return dens;
  vec2 h2 = hash22(g * 1.7 + 9.0);
  vec2 c = g * 26.0 + (home ? vec2(0.0) : (h - 0.5) * 6.0);
  vec2 q = rot(home ? 0.0 : h.y * 6.28) * (p - c);
  float rr = length(q);
  float th = atan(q.y, q.x);
  float R = (home ? 9.5 : 7.0 + 3.0 * h.x) * (1.0 + 0.12 * sin(3.0 * th + h.x * 9.0) + 0.06 * sin(7.0 * th));
  float inside = disc(rr, R);
  if (inside <= 0.0) return dens;
  // Each cell was cut at a different height through its nucleus: big, small, or missed altogether.
  float cutH = home ? 0.0 : (h2.x - 0.5) * 2.4;
  float sc = sqrt(max(0.0, 1.0 - cutH * cutH / 1.44));
  vec2 nOff = home ? vec2(0.0) : (h2 - 0.5) * 3.0;
  vec2 ax = (home ? vec2(4.6, 3.6) : vec2(3.6 + 1.2 * h.y, 2.8 + 0.8 * h2.y)) * sc;
  // The nucleolus only appears if the slice passes through it.
  vec3 nl = home ? vec3(1.2, 0.8, 1.0) : vec3((h2.yx - 0.5) * ax * 0.8, step(0.4, sc) * step(abs(cutH - 0.3 * (h.x - 0.5)), 0.5) * (0.6 + 0.4 * h2.x) * sc);
  float cellD = cytoplasm(p, q, g, R, vec3(nOff, max(ax.x, 1.0) + 1.0));
  if (sc > 0.15) {
    float n = nucleusSection(q - nOff, ax, home ? 1.0 : h.x * 17.0, nl, home);
    if (n >= 0.0) cellD = n;
  }
  cellD = max(cellD, ring(rr, R, 0.012) * 0.9);
  return mix(dens, cellD, inside);
}

void main() {
  vec2 v = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  gPx = uFov / min(uRes.x, uRes.y);
  vec2 p = uStage + v * uFov;

  float dens;
  if (uSpec > 1.5) dens = nucleusTissue(p);
  else if (uSpec > 0.5) dens = ciliaSection(p);
  else {
  // Resin section: nearly transparent, with faint texture.
  dens = 0.06 + 0.03 * fbm(p * 0.8);

  // Cells sectioned at random heights on a 26 um grid; the cell at the origin is always there.
  vec2 g = floor(p / 26.0 + 0.5);
  bool home = g.x == 0.0 && g.y == 0.0;
  vec2 h = hash22(g + 3.0);
  if (home || h.x > 0.3) {
    vec2 c = g * 26.0 + (home ? vec2(0.0) : (h - 0.5) * 6.0);
    vec2 q = rot(home ? 0.0 : h.y * 6.28) * (p - c);
    float rr = length(q);
    float th = atan(q.y, q.x);
    float R = (home ? 9.0 : 7.0 + 3.0 * h.x) * (1.0 + 0.12 * sin(3.0 * th + h.x * 9.0) + 0.06 * sin(7.0 * th));
    float inside = disc(rr, R);
    if (inside > 0.0) {
      // Cytoplasm: speckled with ribosomes (about 20 nm) once they can be resolved.
      vec2 rv = voronoi(p * 28.0);
      float rib = (1.0 - smoothstep(0.24, 0.24 + gPx * 28.0, rv.x)) * smoothstep(0.42, 0.52, vnoise(p * 9.0)) * lod(0.02);
      rib = max(rib * 0.9, 0.35 * smoothstep(0.55, 0.75, vnoise(p * 14.0)) * (1.0 - lod(0.02)));
      float cyto = 0.2 + 0.08 * fbm(p * 3.0) + 0.25 * rib;
      // Mitochondria with cristae.
      for (int m = 0; m < 6; m++) {
        vec2 hm = hash22(vec2(float(m), 5.0) + g * 1.9);
        vec2 mc = (hm - 0.5) * R * 1.3;
        if (length(mc + vec2(3.5, 0.0)) < 4.5) continue;
        vec2 mq = rot(hm.x * 6.28) * (q - mc);
        float e = length(mq / vec2(0.9, 0.35));
        if (e < 1.08) {
          float mem = ring(e, 1.0, 0.06) * 0.9;
          float cri = (1.0 - smoothstep(0.015, 0.015 + gPx, abs(fract(mq.x * 5.0) - 0.5) / 5.0)) * step(e, 0.95) * lod(0.05);
          cyto = max(cyto * 0.8 + 0.25 * step(e, 1.0), max(mem, cri * 0.75));
        }
      }
      // Rough ER: paired membranes.
      float er = 0.0;
      for (int j = 0; j < 4; j++) {
        vec2 hj = hash22(vec2(float(j), 8.0) + g);
        vec2 eq = rot(hj.x * 3.0) * (q - (hj - 0.5) * R);
        float wav = eq.y + 0.25 * sin(eq.x * 1.7 + hj.y * 9.0);
        float pair = max(ring(abs(wav), 0.035, 0.012), 0.0) * step(abs(eq.x), 2.5);
        er = max(er, pair * lod(0.03));
      }
      cyto = max(cyto, er * 0.8);

      // Nucleus: double envelope with pores, dark heterochromatin along the rim, a nucleolus.
      vec2 nq = q - vec2(-3.0, 0.0);
      float nr = length(nq / vec2(4.2, 3.5));
      float nuc = 0.32 + 0.12 * fbm(nq * 4.0);
      nuc += 0.35 * smoothstep(0.82, 0.97, nr) * (0.6 + 0.4 * vnoise(nq * 8.0));
      nuc = max(nuc, 0.75 * disc(length(nq - vec2(0.8, 0.6)), 0.9) * (0.7 + 0.3 * fbm(nq * 12.0)));
      float env = ring(nr, 1.0, 0.012) + ring(nr, 1.012, 0.010);
      float pore = step(0.85, fract(atan(nq.y, nq.x) * 7.0)) ;
      env *= 1.0 - 0.9 * pore;
      float cellD = nr < 1.0 ? nuc : cyto;
      cellD = max(cellD, env * 0.95);
      // Plasma membrane.
      cellD = max(cellD, ring(rr, R, 0.012) * 0.9);

      if (home) {
        // Centrosome beside the nucleus: two centrioles at right angles, in a cloud of dense material,
        // with microtubules running out from it.
        vec2 cq = q - vec2(2.0, 0.6);
        float pcm = 0.18 * smoothstep(0.6, 0.15, length(cq)) * (0.5 + 0.5 * vnoise(cq * 60.0));
        cellD = max(cellD, cellD + pcm);
        float cc = centrioleCross(cq);
        float cl = centrioleLong(rot(-0.3) * (cq - vec2(0.33, 0.12)));
        for (int k = 0; k < 10; k++) {
          float a = float(k) * 0.63 + 0.2;
          vec2 dir = vec2(cos(a), sin(a));
          vec2 mq2 = cq - dir * 0.45;
          float along = dot(mq2, dir);
          float side = abs(dot(mq2, vec2(-dir.y, dir.x)));
          float tube = (1.0 - smoothstep(0.003, 0.003 + gPx, abs(side - 0.0105))) * step(0.0, along) * step(along, 1.8);
          cellD = max(cellD, tube * 0.6 * lod(0.025) + 0.15 * step(side, 0.012) * step(0.0, along) * step(along, 1.8) * (1.0 - lod(0.025)));
        }
        cellD = max(cellD, max(cc, cl));
      }
      dens = mix(dens, cellD, inside);
    }
  }

  }
  // Copper grid bars block the beam completely.
  vec2 gp = abs(fract(p / 85.0 + 0.5) - 0.5) * 85.0;
  float bar = smoothstep(32.0, 32.5, max(gp.x, gp.y));
  dens = mix(dens, 1.0, bar);

  // A hole burned by the beam: the resin is gone, with a bubbled rim.
  if (uBurn.z > 0.5) {
    float bd = length(p - uBurn.xy) / (uFov * 0.18);
    float rim = vnoise((p - uBurn.xy) / uFov * 40.0);
    dens = mix(dens * (1.0 + 0.4 * smoothstep(1.6, 1.0, bd)), 0.0, smoothstep(1.0 + 0.2 * rim, 0.85 + 0.2 * rim, bd));
  }
  outColor = vec4(vec3(clamp(dens, 0.0, 1.0)), 1.0);
}
`

// Pass 2: camera. Defocus blur and Fresnel fringes, brightness, shot noise, optional false colour.
export const TEM_POST = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform sampler2D uSharp;
uniform float uSeed;
uniform float uBright;
uniform float uBlurPx;
uniform float uDefocusSign;
uniform float uSpecimen;
uniform float uFalse;
out vec4 outColor;
${NOISE}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  if (uBright <= 0.0) { outColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
  float d = 0.0;
  if (uSpecimen > 0.5) {
    float lod = log2(max(1.0, uBlurPx));
    float sharp = textureLod(uSharp, uv, max(0.0, lod - 1.0)).r;
    float blur = textureLod(uSharp, uv, lod + 0.7).r;
    // Underfocus gives bright fringes at edges, overfocus dark ones.
    d = sharp + uDefocusSign * (sharp - blur) * min(1.0, uBlurPx / 4.0) * 1.5;
  }
  float I = uBright * (1.0 - 0.92 * clamp(d, 0.0, 1.2));
  float photons = 30.0 + 600.0 * uBright;
  I += (hash12(gl_FragCoord.xy + uSeed) - 0.5) * 2.0 * sqrt(max(I, 0.0) / photons);
  vec2 cv = uv - 0.5;
  I *= 1.0 - 0.25 * dot(cv, cv) * 2.0;
  I = clamp(I, 0.0, 1.0);
  vec3 c = vec3(I);
  if (uFalse > 0.5) {
    // A false-colour map like the textbook micrographs: dense = deep brown, thin = pale gold.
    vec3 a = vec3(0.12, 0.06, 0.02), b = vec3(0.72, 0.52, 0.08), e = vec3(0.98, 0.94, 0.72);
    c = I < 0.5 ? mix(a, b, I * 2.0) : mix(b, e, (I - 0.5) * 2.0);
  }
  outColor = vec4(c, 1.0);
}
`
