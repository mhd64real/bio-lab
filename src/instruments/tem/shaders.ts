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
uniform float uSpec; // 0 centrosome cell, 1 ciliated windpipe lining, 2 nucleus, 3 leaf, 4 liver, 5 macrophage
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


// A mitochondrion cut lengthwise: smooth outer membrane, inner membrane folded into cristae that reach
// into the dense matrix. lq: local coords (x along the long axis), ax: semi-axes.
float mitoTem(vec2 lq, vec2 ax, float seed) {
  float e = length(lq / ax);
  if (e > 1.15) return -1.0;
  float rl = length(lq) / max(e, 1e-4);
  float dE = (e - 1.0) * rl; // um, negative inside
  float outer = softLine(dE, 0.006);
  float inner = softLine(dE + 0.022, 0.006);
  // Cristae: folds of the inner membrane running across the width, each a pair of membranes
  // around a narrow pale space, stopping short of the far side.
  float k = floor(lq.x / 0.11 + 0.5);
  float cx = k * 0.11 + 0.025 * (hash12(vec2(k, seed)) - 0.5);
  float reach = ax.y * (0.7 + 0.8 * hash12(vec2(k, seed + 3.0)));
  float fromSide = (hash12(vec2(k, seed + 5.0)) > 0.5 ? 1.0 : -1.0);
  float dist = ax.y - fromSide * lq.y; // depth from the side it grows from
  float wav = 0.01 * sin(lq.y * 14.0 + k);
  float along = smoothstep(reach + 0.02, reach - 0.02, dist) * step(-0.022, -dE - 0.02);
  float cr = max(softLine(lq.x - cx - wav - 0.011, 0.0055), softLine(lq.x - cx - wav + 0.011, 0.0055)) * along;
  float space = (1.0 - smoothstep(0.003, 0.007, abs(lq.x - cx - wav))) * along;
  float matrix = 0.42 + 0.08 * fbm(lq * 30.0 + seed) + 0.1 * (vnoise(lq * 180.0) - 0.5) * lod(0.012);
  // Small dark matrix granules.
  matrix += 0.3 * smoothstep(0.25, 0.1, voronoi(lq / 0.12 + seed).x) * step(0.93, hash12(floor(lq / 0.12 + seed))) * lod(0.02);
  float d = dE < -0.022 ? matrix : (dE < 0.0 ? 0.22 : 0.0);
  d = mix(d, 0.3, space);
  d = max(d, max(outer, inner) * 0.8);
  d = max(d, cr * 0.85);
  // When the membrane pairs are too fine to resolve, each crista shows as one pale band in a darker matrix.
  float band = (1.0 - smoothstep(0.009, 0.009 + gPx, abs(lq.x - cx - wav))) * along;
  float dl = dE < -0.022 ? 0.56 + 0.06 * fbm(lq * 30.0 + seed) : (dE < 0.0 ? 0.3 : 0.0);
  dl = mix(dl, 0.3, band * min(1.0, 0.018 / gPx));
  dl = max(dl, max(outer, inner) * 0.8);
  d = mix(dl, d, smoothstep(1.5, 3.0, 0.011 / gPx));
  // Below the resolution of the view, cristae blur into an even grey.
  return e <= 1.0 + 0.01 / rl ? d : (outer > 0.05 ? outer * 0.8 : -1.0);
}

// A chloroplast, lens shaped: double envelope, granular stroma, grana (stacks of disc-shaped thylakoids,
// seen edge on as fine parallel lines) joined by single stroma thylakoids, a starch grain and dark plastoglobuli.
float chloroTem(vec2 lq, vec2 ax, float seed) {
  float e = length(lq / ax);
  if (e > 1.1) return -1.0;
  float rl = length(lq) / max(e, 1e-4);
  float dE = (e - 1.0) * rl;
  float env = max(softLine(dE, 0.006), softLine(dE + 0.02, 0.006));
  float stroma = 0.3 + 0.06 * fbm(lq * 12.0 + seed) + 0.12 * (vnoise(lq * 160.0) - 0.5) * lod(0.012);
  // Thylakoid membranes follow the long axis, gently curved with the lens.
  float bend = lq.y + 0.06 * lq.x * lq.x / ax.x;
  float inner = step(dE, -0.06);
  // Grana: stacks about 0.45 um wide, every 0.6 um, 0.15 to 0.45 um tall, offset up and down.
  float gk = floor(lq.x / 0.42 + 0.5);
  float gcx = gk * 0.42 + 0.06 * (hash12(vec2(gk, seed)) - 0.5);
  float gcy = (hash12(vec2(gk, seed + 1.0)) - 0.5) * ax.y * 0.9;
  float gh = 0.08 + 0.16 * hash12(vec2(gk, seed + 2.0));
  vec2 sd = vec2((lq.x - gcx) / 0.17, (bend - gcy) / (gh * 0.5));
  float inStack = smoothstep(1.05, 0.95, pow(pow(abs(sd.x), 4.0) + pow(abs(sd.y), 4.0), 0.25));
  float stackLines = softLine(abs(fract(bend / 0.02) - 0.5) * 0.02, 0.0035);
  float grana = inStack * stackLines;
  float granaBlur = inStack * 0.68; // unresolved at low magnification: a dark block
  // Stroma thylakoids: single pairs of membranes running between the grana.
  float sl = softLine(abs(fract((bend + 0.03) / 0.07) - 0.5) * 0.07, 0.0045);
  sl *= step(0.3, vnoise(vec2(lq.x * 1.5, floor((bend + 0.03) / 0.07) + seed)));
  float thyl = max(mix(granaBlur, max(grana * 0.9, inStack * 0.45), lod(0.02)), sl * 0.6) * inner;
  float d = max(stroma, thyl);
  d = max(d, 0.4 * inStack * lod(0.02) * (0.6 + 0.4 * stackLines));
  // Starch grain: an empty-looking pale ellipse.
  vec2 sq = (lq - vec2(ax.x * 0.3, -ax.y * 0.2)) / vec2(0.5, 0.22);
  d = mix(d, 0.07, (1.0 - smoothstep(0.9, 1.0, length(sq))) * inner);
  // Plastoglobuli: small, very dense droplets.
  vec2 pg = voronoi(lq / 0.35 + seed);
  d = max(d, 0.85 * (1.0 - smoothstep(0.1, 0.16, pg.x)) * step(0.82, hash12(floor(lq / 0.35 + seed))) * inner * lod(0.03));
  d = dE < 0.0 ? d : 0.0;
  d = max(d, env * 0.8);
  return e <= 1.0 + 0.01 / rl ? d : (env > 0.05 ? env * 0.8 : -1.0);
}

float leafTissue(vec2 p) {
  // Leaf mesophyll cells on a 24 um grid; the cell at the origin is centred exactly.
  vec2 g0 = floor(p / 24.0 + 0.5);
  float d1 = 1e9, d2 = 1e9; vec2 id = g0, cc = vec2(0.0);
  float nearN = 1e9;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 gg = g0 + vec2(x, y);
    vec2 c = gg * 24.0 + ((gg.x == 0.0 && gg.y == 0.0) ? vec2(0.0) : (hash22(gg) - 0.5) * 6.0);
    float d = length(p - c);
    if (d < d1) { d2 = d1; d1 = d; id = gg; cc = c; } else if (d < d2) d2 = d;
  }
  float border = (d2 - d1) * 0.5;
  bool home = id.x == 0.0 && id.y == 0.0;
  vec2 q = p - cc;
  float seed = hash12(id) * 40.0;
  // Rounded cells with air spaces between them (spongy leaf tissue); the wall is a fibrous band.
  float rIn = home ? 9.6 : 8.0 + 1.5 * hash12(id + 4.0);
  float th0 = atan(q.y, q.x);
  float rEdge = rIn + 0.35 + (home ? 0.0 : 0.6 * sin(3.0 * th0 + seed));
  float depth = min(rEdge - length(q), border - 0.2); // distance in from the outer face of the wall
  if (depth < 0.0) return 0.04 + 0.02 * fbm(p * 2.0); // air space: only resin
  float wallD = 0.4 + 0.12 * vnoise(p * 60.0) * lod(0.02);
  if (depth < 0.25) return wallD;
  float memb = softLine(depth - 0.26, 0.005) * 0.8;
  // A thin layer of cytoplasm against the wall; the big central vacuole fills the rest.
  float cyto = 0.28 + 0.07 * fbm(p * 3.0) + 0.14 * smoothstep(0.32, 0.12, voronoi(p * 28.0).x) * lod(0.02);
  float tono = softLine(depth - 0.7, 0.005) * 0.75;
  float dens = depth > 0.7 ? 0.05 + 0.02 * fbm(p * 2.0) : cyto;
  dens = max(dens, max(memb, tono));
  // Chloroplasts around the cell, lying along the wall.
  float th = atan(q.y, q.x);
  for (int k = 0; k < 10; k++) {
    float fk = float(k);
    float a = (home && k == 0) ? 1.5707963 : (fk + 0.35 * (hash12(vec2(fk, seed)) - 0.5)) * 0.6283185 + 1.5707963;
    vec2 dir = vec2(cos(a), sin(a));
    vec2 cc2 = dir * (rIn - 1.6);
    vec2 lq = vec2(dot(q - cc2, vec2(-dir.y, dir.x)), dot(q - cc2, dir));
    float c = chloroTem(lq, vec2(2.6, 1.0), seed + fk * 7.0);
    if (c >= 0.0) { dens = c; break; }
    if (length(lq / vec2(2.9, 1.3)) < 1.0) { dens = max(cyto, memb); }
  }
  // Mitochondria in the cytoplasm between chloroplasts; the first one in the middle cell is placed exactly.
  for (int k = 0; k < 4; k++) {
    float fk = float(k);
    float a = (home && k == 0) ? 1.05 : 1.05 + fk * 1.6 + hash12(vec2(fk, seed + 9.0));
    vec2 dir = vec2(cos(a), sin(a));
    vec2 mc = dir * (rIn - 0.75);
    vec2 lq = vec2(dot(q - mc, vec2(-dir.y, dir.x)), dot(q - mc, dir));
    float m = mitoTem(lq, vec2(0.6, 0.3), seed + fk * 3.0);
    if (m >= 0.0) { dens = m; break; }
    if (length(lq / vec2(0.8, 0.5)) < 1.0) dens = max(cyto, memb);
  }
  return dens;
}

// ---- Liver cell (hepatocyte) ----
// Fuzzy dense granules about 25 nm across (ribosomes): a jittered grid, each spot present with probability
// amount, soft-edged and of varying size, as they look in a real section.
float granules(vec2 p, float cellSize, float amount, float size, float seed) {
  vec2 i0 = floor(p / cellSize);
  float acc = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 c = i0 + vec2(x, y);
    vec2 h = hash22(c + seed);
    if (hash12(c * 1.7 + seed) > amount) continue;
    vec2 gp = (c + 0.15 + 0.7 * h) * cellSize;
    float r = size * (0.75 + 0.5 * hash12(c + seed + 3.0));
    float d = length(p - gp);
    acc = max(acc, exp(-d * d / (r * r)) * (0.75 + 0.25 * h.x));
  }
  return acc;
}
float cytosol(vec2 p, float ribAmount) {
  float tex = 0.2 + 0.05 * fbm(p * 3.0) + 0.05 * (fbm(p * 0.9) - 0.5) + 0.05 * (fbm(p * 14.0) - 0.5) * lod(0.04) + (0.07 * (vnoise(p * 140.0) - 0.5) + 0.05 * (vnoise(p * 380.0) - 0.5)) * lod(0.008);
  // Free ribosomes, crowded into loose clusters (polysomes) where the noise is high.
  float amt = ribAmount * (0.15 + 0.85 * smoothstep(0.4, 0.8, fbm(p * 6.0)));
  float rib = granules(p, 0.03, amt, 0.0085, 1.0);
  return mix(tex + 0.05 * ribAmount, max(tex, 0.19 + 0.36 * rib), lod(0.022));
}

// Rough ER: flattened sacs about 0.2 um apart, gently curved, each with its own bends, ending in rounded
// tips; the outer faces carry ribosomes. lq: local frame, x along the sacs. -1 where there is no sac.
float sacDist(vec2 lq, float k, float seed, out float vv) {
  float hk = hash12(vec2(k, seed));
  float yc = k * 0.2 + 0.05 * (hk - 0.5) + 0.07 * sin(lq.x * 1.1 + hk * 6.0) + 0.02 * sin(lq.x * 3.7 + k);
  vv = lq.y - yc;
  float best = 1e9;
  for (int j = 0; j < 2; j++) {
    float fj = float(j);
    float L = 0.55 + 0.85 * hash12(vec2(k, seed + 2.0 + fj)) - 0.06 * abs(k);
    float x0 = (fj - 0.5) * 1.9 + 0.6 * (hash12(vec2(k, seed + 4.0 + fj)) - 0.5);
    if (L <= 0.1) continue;
    float dx = max(abs(lq.x - x0) - L, 0.0);
    float hw = 0.011 + 0.013 * vnoise(vec2(lq.x * 3.0, k * 5.0 + fj)) + 0.006 * smoothstep(L - 0.12, L, abs(lq.x - x0));
    best = min(best, length(vec2(dx, vv)) - hw);
  }
  return best;
}
float rerStack(vec2 lq, float seed) {
  float k0 = floor(lq.y / 0.2 + 0.5);
  float d = 1e9, vv = 0.0, kk = k0;
  for (int t = -1; t <= 1; t++) {
    float k = k0 + float(t);
    if (abs(k) > 4.0) continue;
    float v;
    float dk = sacDist(lq, k, seed, v);
    if (dk < d) { d = dk; vv = v; kk = k; }
  }
  if (d > 0.055) return -1.0;
  float memb = softLine(d, 0.0065) * (0.8 + 0.2 * vnoise(lq * 300.0));
  float lumen = 0.17 + 0.07 * (vnoise(lq * 110.0 + seed) - 0.5) * lod(0.01);
  // Ribosomes in an irregular row just outside the membrane.
  float side = vv > 0.0 ? 1.0 : -1.0;
  float rs = lq.x / 0.027;
  float ribo = 0.0;
  for (int t = -1; t <= 1; t++) {
    float c = floor(rs) + float(t);
    vec2 h = hash22(vec2(c, kk * 3.0 + side + seed));
    if (h.x < 0.12) continue;
    float cx = (c + 0.5 + 0.35 * (h.y - 0.5)) * 0.027;
    float off = 0.015 + 0.006 * hash12(vec2(c, kk + side * 7.0));
    float r = 0.0105 * (0.8 + 0.4 * hash12(vec2(c, kk + side + 11.0)));
    vec2 dv = vec2(lq.x - cx, d - off);
    ribo = max(ribo, exp(-dot(dv, dv) / (r * r)) * (0.8 + 0.2 * h.y));
  }
  // At low magnification the ribosomes merge into a dark fuzzy coat on the sacs.
  float cd = (d - 0.016) / 0.02;
  float coat = exp(-cd * cd) * 0.55;
  if (d < 0.0) return max(lumen, memb * 0.9);
  float dens = max(memb * 0.9, mix(coat, 0.2 + 0.62 * ribo, lod(0.012)));
  return dens > 0.215 ? dens : -1.0;
}

// Smooth ER: a meshwork of narrow tubules without ribosomes. A thin section cuts it into many small round
// and short tubular profiles with pale insides. amount: 0..1, how crowded.
float serProfiles(vec2 q, float amount, float seed) {
  const float CS = 0.12;
  vec2 i0 = floor(q / CS);
  float best = 1e9;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 c = i0 + vec2(x, y);
    if (hash12(c + seed + 40.0) > amount) continue;
    vec2 h = hash22(c + seed + 41.0);
    vec2 pc = (c + 0.2 + 0.6 * h) * CS;
    float a = hash12(c + seed + 42.0) * 6.2831;
    vec2 dir = vec2(cos(a), sin(a));
    float L = h.x < 0.5 ? 0.0 : 0.02 + 0.05 * h.y;
    vec2 lq = q - pc;
    float u = clamp(dot(lq, dir), -L, L);
    vec2 bend = vec2(-dir.y, dir.x) * 0.25 * u * u / max(L, 0.01);
    float w = 0.015 + 0.008 * hash12(c + seed + 43.0);
    best = min(best, length(lq - dir * u - bend) - w);
  }
  if (best > 0.04) return -1.0;
  float memb = softLine(best, 0.0065) * (0.75 + 0.25 * vnoise(q * 250.0));
  if (best < 0.0) return max(0.15 + 0.05 * vnoise(q * 150.0), memb * 0.62);
  return memb > 0.1 ? max(memb * 0.62, 0.2) : -1.0;
}
// Glycogen: very dark rosettes, clusters of 20 to 30 nm particles; liver cells store sugar this way.
float glycogen(vec2 q, float amount, float seed) {
  const float CS = 0.1;
  vec2 i0 = floor(q / CS);
  float m = 0.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 c = i0 + vec2(x, y);
    if (hash12(c + seed + 60.0) > amount) continue;
    vec2 pc = (c + 0.25 + 0.5 * hash22(c + seed + 61.0)) * CS;
    float rc = 0.025 + 0.025 * hash12(c + seed + 62.0);
    m = max(m, smoothstep(rc + 0.012, rc - 0.01, length(q - pc)));
  }
  if (m <= 0.0) return 0.0;
  float part = granules(q, 0.02, 0.9, 0.0095, seed + 70.0);
  return m * mix(0.36, 0.25 + 0.62 * part, lod(0.012));
}

// The Golgi apparatus: a curved stack of thin flattened sacs (cisternae) with swollen rims, clouds of small
// vesicles around the rims and larger vesicles full of dense particles leaving the outer (trans) face.
// lq: local frame, y pointing away from the nucleus. Returns density, or -1 in the cytosol.
float golgiStack(vec2 lq, float seed, out float zone) {
  vec2 d = lq - vec2(0.0, -1.1);
  float r = length(d);
  float a = atan(d.x, d.y);
  zone = smoothstep(0.55, 0.25, length((lq - vec2(0.0, 0.05)) / vec2(1.4, 1.0)) - 0.25);
  if (r < 0.8 || r > 1.75 || abs(a) > 0.95) return -1.0;
  float dens = -1.0;
  const float SP = 0.048;
  float k0 = floor((r - 1.0) / SP + 0.5);
  for (int t = -1; t <= 1; t++) {
    float k = k0 + float(t);
    if (k < 0.0 || k > 5.0) continue;
    float rk = 1.0 + k * SP + 0.012 * sin(a * 7.0 + k * 2.0 + seed) + 0.008 * sin(a * 17.0 + k * 5.0);
    float s = a * rk;
    float S = rk * (0.34 - 0.03 * abs(k - 2.5) + 0.12 * (hash12(vec2(k, seed + sign(s))) - 0.5));
    float rim = smoothstep(S - 0.12, S - 0.01, abs(s));
    float hw = 0.0065 + 0.016 * rim * (0.6 + 0.6 * hash12(vec2(k, seed + sign(s)))) + 0.002 * vnoise(vec2(s * 25.0, k));
    float dx = max(abs(s) - S, 0.0);
    float dd = length(vec2(dx, r - rk)) - hw;
    // Holes (fenestrae) in the rims.
    if (rim > 0.3 && hash12(vec2(floor(s / 0.06), k + seed)) > 0.78) continue;
    if (dd < 0.022) {
      float memb = softLine(dd, 0.0055) * (0.75 + 0.25 * vnoise(lq * 260.0 + k));
      // Content stains darker on the inner (cis) side, paler towards the trans side.
      float lumen = mix(0.58, 0.36, k / 5.0) * mix(1.0, 0.7, rim) + 0.08 * (vnoise(lq * 140.0 + k) - 0.5);
      float v = dd < 0.0 ? max(lumen, memb * 0.72) : memb * 0.72;
      if (v > 0.2) dens = max(dens, v);
    }
  }
  // Unresolved at low magnification: a dark crescent.
  float S0 = 0.36 * r;
  float band = step(1.0 - 0.01, r) * step(r, 1.0 + 5.0 * SP + 0.01) * step(abs(a * r), S0 + 0.03) * 0.42;
  if (band > 0.0 && lod(0.025) < 0.99) dens = max(dens, mix(band, dens, lod(0.025)));
  for (int i = 0; i < 30; i++) {
    float fi = float(i);
    vec2 h = hash22(vec2(fi, seed + 3.0));
    bool big = i >= 23;
    float va, vr, rad;
    if (i == 0) { va = 0.36 + 0.02; vr = 1.0 + 5.0 * SP; rad = 0.028; } // budding off the outermost rim
    else if (big) { va = -0.42 + 0.14 * (fi - 23.0) + 0.04 * (h.x - 0.5); vr = 1.38 + 0.16 * h.y; rad = 0.045 + 0.03 * hash12(vec2(fi, seed)); }
    else { float sd = h.x < 0.5 ? -1.0 : 1.0; va = sd * (0.36 + 0.2 * h.y); vr = 0.94 + 0.36 * hash12(vec2(fi, seed + 1.0)); rad = 0.02 + 0.012 * hash12(vec2(fi, seed + 2.0)); }
    vec2 vc = vec2(sin(va), cos(va)) * vr;
    vec2 dv = d - vc;
    float l = length(dv * vec2(1.0, 1.0 + 0.25 * (hash12(vec2(fi, seed + 5.0)) - 0.5)));
    if (l > rad + 0.025) continue;
    float memb = softLine(l - rad, 0.0052) * (0.7 + 0.3 * vnoise(dv * 400.0));
    float inside;
    if (big) inside = 0.2 + 0.6 * granules(dv, 0.036, 0.55, 0.014, fi + seed) * lod(0.012) + 0.12 * (1.0 - lod(0.012));
    else inside = 0.34 + 0.08 * vnoise(dv * 300.0);
    // Small vesicles carry a fuzzy protein coat.
    float cd = (l - rad - 0.008) / 0.006;
    float coat = big ? 0.0 : 0.22 * exp(-cd * cd) * (0.5 + 0.5 * vnoise(dv * 600.0));
    float vd = l < rad ? max(inside, memb * 0.65) : max(memb * 0.65, coat);
    vd = mix(0.42 * smoothstep(rad + 0.012, rad, l), vd, lod(0.018));
    if (vd > 0.2) dens = max(dens, vd);
  }
  return dens;
}

float liverTissue(vec2 p) {
  // Liver cells (hepatocytes) on a 23 um grid; the cell at the origin is centred exactly and not rotated.
  vec2 g0 = floor(p / 23.0 + 0.5);
  float d1 = 1e9, d2 = 1e9; vec2 id = g0, cc = vec2(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 gg = g0 + vec2(x, y);
    vec2 c = gg * 23.0 + ((gg.x == 0.0 && gg.y == 0.0) ? vec2(0.0) : (hash22(gg) - 0.5) * 7.0);
    float d = length(p - c);
    if (d < d1) { d2 = d1; d1 = d; id = gg; cc = c; } else if (d < d2) d2 = d;
  }
  float border = (d2 - d1) * 0.5;
  bool home = id.x == 0.0 && id.y == 0.0;
  float seed = home ? 2.0 : hash12(id) * 40.0;
  // Some spaces are sinusoids, blood channels between the cells, with the odd red blood cell.
  if (!home && hash12(id + 7.0) < 0.14) {
    vec2 rq = p - cc - (hash22(id + 2.0) - 0.5) * 6.0;
    float rbc = disc(length(rq), 3.6) * (0.62 + 0.06 * fbm(p * 4.0));
    return max(0.05 + 0.02 * fbm(p * 2.0), max(rbc, softLine(border, 0.006) * 0.7));
  }
  // Two plasma membranes with a narrow gap between neighbouring cells; a faint line at low magnification.
  float pm = max(softLine(border - 0.012, 0.0065), softLine(border + 0.012, 0.0065));
  pm = max(pm, 0.4 * exp(-border * border / (gPx * gPx)) * (1.0 - lod(0.03)));
  float ang = home ? 0.0 : hash12(id + 3.0) * 6.2831;
  vec2 q = rot(ang) * (p - cc);
  vec2 jit = home ? vec2(0.0) : (hash22(id + 5.0) - 0.5) * 2.0;

  float dens = -1.0;
  float zone = 0.0;
  // Nucleus (some cells were cut beside it and show none).
  vec2 N = vec2(-4.5, -0.5) + jit;
  bool hasN = home || hash12(id + 9.0) > 0.25;
  if (hasN && length(q - N) < 4.0) {
    float n = nucleusSection(q - N, home ? vec2(3.3, 2.9) : vec2(3.0, 2.7), seed, home ? vec3(0.9, 0.6, 0.85) : vec3(0.5, -0.4, 0.7), false);
    if (n >= 0.0) dens = n;
  }
  // Golgi stack beside the nucleus, its outer face pointing away from it.
  vec2 G = vec2(0.6, 3.3) + jit;
  if (dens < 0.0 && length(q - G) < 1.9) {
    vec2 u = normalize(G - N);
    vec2 gq = q - G;
    float gs = golgiStack(vec2(dot(gq, vec2(u.y, -u.x)), dot(gq, u)), seed, zone);
    if (gs >= 0.0) dens = gs;
  }
  // A large stack of rough ER.
  vec2 R = vec2(4.6, -1.8) + jit;
  if (dens < 0.0 && length((q - R) * vec2(0.75, 1.0)) < 2.6) {
    float re = rerStack(rot(-0.5) * (q - R), seed);
    if (re >= 0.0) dens = re;
  }
  // Many mitochondria (a liver cell has more than a thousand).
  if (dens < 0.0) {
    const float MS = 1.7;
    vec2 m0 = floor(q / MS);
    for (int y = -1; y <= 1 && dens < 0.0; y++) for (int x = -1; x <= 1; x++) {
      vec2 c = m0 + vec2(x, y);
      vec2 hm = hash22(c + seed + 6.0);
      vec2 mc = (c + 0.2 + 0.6 * hm) * MS;
      if (length(mc - N) < 4.0 || length(mc - G) < 2.0 || length((mc - R) * vec2(0.75, 1.0)) < 2.9 || hash12(c + seed + 8.0) < 0.3) continue;
      vec2 lq = rot(hm.x * 6.28) * (q - mc);
      float mt = mitoTem(lq, vec2(0.5 + 0.3 * hm.y, 0.36 + 0.06 * hm.x), seed + c.x * 3.0 + c.y);
      if (mt >= 0.0) { dens = mt; break; }
    }
  }
  // Smooth ER and glycogen fill a region of the cytoplasm away from the rough ER.
  vec2 S = vec2(-0.8, -5.6) + jit;
  float serW = smoothstep(3.0, 1.6, length((q - S) * vec2(0.75, 1.0)) + 0.9 * (vnoise(q * 0.7 + seed) - 0.5));
  if (dens < 0.0 && serW > 0.0) {
    float se = serProfiles(q, 0.75 * serW, seed);
    if (se >= 0.0) dens = mix(0.2 + 0.08 * serW, se, lod(0.012));
  }
  if (dens < 0.0) {
    dens = cytosol(p, 0.6 * (1.0 - 0.8 * zone) * (1.0 - 0.6 * serW));
    float gl = glycogen(q, 0.04 + 0.5 * serW, seed);
    dens = max(dens, gl);
  }
  return max(dens, pm * 0.82) * (1.0 + 0.12 * (fbm(p * 0.35 + 3.0) - 0.5));
}

// ---- White blood cell (macrophage) with lysosomes ----
// A lysosome: one membrane around dense, finely granular enzyme content. Older (secondary) lysosomes are
// bigger and mixed: dense granules, pale lipid drops and curled membrane remains (whorls) of what they digested.
// lq: offset from the centre, r: radius, kind: 0 dense, 1 mixed. Returns density or -1 outside.
float lysosome(vec2 lq, float r, float kind, float seed) {
  float th = atan(lq.y, lq.x);
  float rr = r * (1.0 + 0.05 * sin(3.0 * th + seed) + 0.03 * sin(5.0 * th + seed * 2.0));
  float d = length(lq) - rr;
  if (d > 0.03) return -1.0;
  float memb = softLine(d, 0.0055);
  if (d > 0.0) return memb > 0.08 ? max(0.2, memb * 0.8) : -1.0;
  float gran = 0.6 * vnoise(lq * 120.0 + seed) + 0.4 * vnoise(lq * 260.0);
  float dens = 0.74 + 0.08 * fbm(lq * 14.0 + seed) + 0.16 * (gran - 0.5) * lod(0.01);
  if (kind > 0.5) {
    // Mixed contents: patches of dense matter, pale drops and membrane whorls.
    float patchy = smoothstep(0.4, 0.65, fbm(lq * 5.0 + seed));
    dens = mix(0.34 + 0.1 * gran, 0.72 + 0.1 * gran, patchy);
    vec2 wc = vec2(0.3, -0.2) * r;
    float wr = length(lq - wc);
    float whorl = softLine(abs(fract(wr / 0.024 + 0.3 * vnoise(lq * 30.0)) - 0.5) * 0.024, 0.0045) * smoothstep(0.4 * r, 0.3 * r, wr);
    dens = max(dens, mix(0.45, 0.8 * whorl + 0.25, lod(0.012)) * smoothstep(0.4 * r, 0.3 * r, wr));
    for (int k = 0; k < 3; k++) {
      vec2 hk = hash22(vec2(float(k), seed + 2.0));
      vec2 lc = (hk - 0.5) * r;
      float lr = r * (0.08 + 0.08 * hk.y);
      dens = mix(dens, 0.26, smoothstep(lr, lr - 0.012, length(lq - lc)));
    }
  }
  // A thin pale halo just inside the membrane.
  dens = mix(dens, 0.3, smoothstep(-0.03, -0.008, d) * 0.5);
  return max(dens, memb * 0.8);
}

// A swallowed bacterium (a rod 1 um long) inside a phagosome that lysosomes have fused with: their dense
// enzyme content lines one side, and the far end of the bacterium is already breaking up.
float phagolysosome(vec2 lq, float seed) {
  float e = length(lq / vec2(0.82, 0.52));
  if (e > 1.12) return -1.0;
  float rl = length(lq) / max(e, 1e-4);
  float dV = (e - 1.0) * rl;
  float vm = softLine(dV, 0.0055);
  if (dV > 0.0) return vm > 0.08 ? max(0.2, vm * 0.8) : -1.0;
  float dens = 0.16 + 0.05 * vnoise(lq * 60.0);
  // Enzyme-rich lysosome content fused in along the lower side.
  float side = smoothstep(-0.05, -0.32, lq.y + 0.08 * sin(lq.x * 6.0)) * smoothstep(-0.0, -0.06, dV);
  dens = mix(dens, 0.62 + 0.12 * (vnoise(lq * 140.0) - 0.5), side);
  // The bacterium: outer membrane, cell wall and inner membrane, dense cytoplasm full of ribosomes, a paler nucleoid.
  vec2 bq = mat2(cos(0.25), sin(0.25), -sin(0.25), cos(0.25)) * (lq - vec2(-0.05, 0.1));
  vec2 bb = vec2(0.42, 0.2);
  vec2 bd2 = abs(bq) - bb + 0.2;
  float bd = length(max(bd2, 0.0)) + min(max(bd2.x, bd2.y), 0.0) - 0.2;
  float decay = smoothstep(0.05, 0.45, bq.x + 0.1 * vnoise(bq * 18.0)); // the right end is being digested
  float wall = max(softLine(bd, 0.006), softLine(bd + 0.022, 0.006)) * (1.0 - 0.8 * decay * step(0.55, vnoise(bq * 40.0)));
  if (bd < -0.022) {
    float rib = smoothstep(0.35, 0.18, voronoi(bq / 0.022 + seed).x) * lod(0.01);
    float cyt = 0.6 + 0.16 * (rib - 0.4) + 0.08 * (fbm(bq * 30.0) - 0.5) + 0.06 * (vnoise(bq * 200.0) - 0.5);
    float nucleoid = smoothstep(0.55, 0.62, fbm(bq * 7.0 + seed)) * smoothstep(0.32, 0.1, abs(bq.x));
    cyt = mix(cyt, 0.28 + 0.08 * vnoise(bq * 150.0), nucleoid);
    dens = mix(cyt, 0.3 + 0.15 * vnoise(bq * 90.0), decay);
  } else if (bd < 0.0) dens = 0.3;
  dens = max(dens, wall * 0.8 * (1.0 - 0.5 * decay));
  return max(dens, vm * 0.8);
}

// An autophagosome: a double membrane wrapped round a worn-out mitochondrion, whose inside is fading.
float autophagosome(vec2 lq, float seed) {
  float e = length(lq / vec2(0.72, 0.5));
  if (e > 1.12) return -1.0;
  float rl = length(lq) / max(e, 1e-4);
  float dA = (e - 1.0) * rl;
  float mem = max(softLine(dA, 0.0055), softLine(dA + 0.028, 0.0055));
  if (dA > 0.0) return mem > 0.08 ? max(0.2, mem * 0.8) : -1.0;
  if (dA > -0.028) return max(0.18, mem * 0.8);
  float dens = 0.3 + 0.1 * vnoise(lq * 80.0 + seed);
  float m = mitoTem(mat2(cos(0.3), sin(0.3), -sin(0.3), cos(0.3)) * (lq - vec2(-0.05, 0.0)), vec2(0.48, 0.27), seed);
  if (m >= 0.0) dens = mix(m, 0.32 + 0.12 * vnoise(lq * 50.0), 0.45 * smoothstep(-0.2, 0.3, lq.x)); // breaking down
  return max(dens, mem * 0.8);
}

float macroTissue(vec2 p) {
  float dens = 0.06 + 0.03 * fbm(p * 0.8);
  // Cells spread on a 20 um grid with resin between them; the cell at the origin is centred and not rotated.
  vec2 g = floor(p / 20.0 + 0.5);
  bool home = g.x == 0.0 && g.y == 0.0;
  vec2 h = hash22(g + 13.0);
  if (!home && h.x < 0.3) return dens;
  vec2 c = g * 20.0 + (home ? vec2(0.0) : (h - 0.5) * 6.0);
  float ang = home ? 0.0 : h.y * 6.2831;
  vec2 q = rot(ang) * (p - c);
  float seed = home ? 4.0 : hash12(g) * 30.0;
  float th = atan(q.y, q.x);
  // Irregular outline with ruffles and thin finger-like folds (pseudopods) for catching bacteria.
  float R = (home ? 7.2 : 5.5 + 2.0 * h.x) * (1.0 + 0.1 * sin(3.0 * th + seed) + 0.05 * sin(7.0 * th + seed * 2.0));
  float fk = floor((th + 3.14159) / 6.28318 * 26.0);
  float ff = fract((th + 3.14159) / 6.28318 * 26.0) - 0.5;
  float fh = hash12(vec2(fk, seed + 9.0));
  R += step(0.62, fh) * (0.6 + 2.2 * (fh - 0.62)) * exp(-ff * ff / 0.018) + 0.15 * sin(th * 13.0 + seed);
  float dEdge = R - length(q);
  if (dEdge < -0.03) return dens;
  float pm = softLine(dEdge, 0.0055);
  if (dEdge < 0.0) return max(dens, pm * 0.8);
  float cd = -1.0;
  vec2 N = vec2(-2.5, -0.6);
  vec2 nq = q - N;
  if (length(nq) < 3.6) {
    float n = nucleusSection(nq, vec2(3.1, 2.3), seed, vec3(0.6, 0.4, 0.55), false);
    if (n >= 0.0) cd = n;
  }
  if (home && cd < 0.0) {
    float v = lysosome(q - vec2(2.8, 2.6), 0.55, 1.0, 7.0);
    if (v >= 0.0) cd = v;
    if (cd < 0.0) { v = phagolysosome(q - vec2(3.6, -1.8), 3.0); if (v >= 0.0) cd = v; }
    if (cd < 0.0) { v = autophagosome(q - vec2(-0.5, 3.4), 5.0); if (v >= 0.0) cd = v; }
  }
  // Many small dense lysosomes, a few bigger mixed ones.
  if (cd < 0.0) {
    const float LS = 1.1;
    vec2 l0 = floor(q / LS);
    for (int y = -1; y <= 1 && cd < 0.0; y++) for (int x = -1; x <= 1; x++) {
      vec2 lc = l0 + vec2(x, y);
      vec2 hl = hash22(lc + seed + 20.0);
      if (hash12(lc + seed + 21.0) > 0.42) continue;
      vec2 lp = (lc + 0.2 + 0.6 * hl) * LS;
      if (length(lp - N) < 3.5 || length(lp) > R - 0.8) continue;
      if (home && (length(lp - vec2(2.8, 2.6)) < 1.0 || length(lp - vec2(3.6, -1.8)) < 1.2 || length(lp - vec2(-0.5, 3.4)) < 1.1)) continue;
      float big = step(0.85, hl.x);
      float v = lysosome(q - lp, mix(0.14 + 0.18 * hl.y, 0.35 + 0.15 * hl.y, big), big, lc.x + lc.y * 7.0);
      if (v >= 0.0) { cd = v; break; }
    }
  }
  // Mitochondria.
  if (cd < 0.0) {
    const float MS = 2.2;
    vec2 m0 = floor(q / MS);
    for (int y = -1; y <= 1 && cd < 0.0; y++) for (int x = -1; x <= 1; x++) {
      vec2 mc = m0 + vec2(x, y);
      vec2 hm = hash22(mc + seed + 30.0);
      if (hash12(mc + seed + 31.0) > 0.5) continue;
      vec2 mp = (mc + 0.2 + 0.6 * hm) * MS;
      if (length(mp - N) < 3.7 || length(mp) > R - 1.0) continue;
      if (home && (length(mp - vec2(2.8, 2.6)) < 1.3 || length(mp - vec2(3.6, -1.8)) < 1.5 || length(mp - vec2(-0.5, 3.4)) < 1.4)) continue;
      float v = mitoTem(rot(hm.x * 6.28) * (q - mp), vec2(0.45 + 0.2 * hm.y, 0.25), seed + mc.x);
      if (v >= 0.0) { cd = v; break; }
    }
  }
  if (cd < 0.0) cd = cytosol(p, 0.5);
  return max(cd, pm * 0.8);
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
  if (uSpec > 4.5) dens = macroTissue(p);
  else if (uSpec > 3.5) dens = liverTissue(p);
  else if (uSpec > 2.5) dens = leafTissue(p);
  else if (uSpec > 1.5) dens = nucleusTissue(p);
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
