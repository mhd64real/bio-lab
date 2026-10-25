import type { SpecimenDef } from './specimens'

// Red bell pepper skin: small cells with thick, beaded walls (pit canals), each packed with
// red-orange chromoplasts: plastids holding red and orange pigments, some granular, some needle-like.
export const PEPPER: SpecimenDef = {
  id: 'pepper',
  layerZ: 2,
  helpers: /* glsl */ `
// Irregular polygonal cells about 35 um across: distance to the wall, and the cell id.
float pepCell(vec2 q, out vec2 id, out vec2 cc) {
  vec2 g = floor(q / 35.0);
  float d1 = 1e9, d2 = 1e9;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 gg = g + vec2(x, y);
    vec2 c = (gg + 0.5 + (hash22(gg + 3.0) - 0.5) * 0.75) * 35.0;
    float d = length(q - c);
    if (d < d1) { d2 = d1; d1 = d; id = gg; cc = c; } else if (d < d2) d2 = d;
  }
  return (d2 - d1) * 0.5;
}
`,
  body: /* glsl */ `
  vec2 q = s * 1000.0;
  q += 2.0 * (vec2(vnoise(q * 0.04), vnoise(q * 0.04 + 9.0)) - 0.5);
  float aa = max(0.4, gPx * 1000.0 * 1.2);
  vec2 id, cc;
  float d = pepCell(q, id, cc);
  // Thick walls, thinner where pit canals cross them, so the walls look beaded.
  float beads = smoothstep(0.3, 0.65, vnoise(q * 0.7 + id * 3.0));
  float wth = mix(1.0, 3.2, beads);
  float wall = 1.0 - smoothstep(wth, wth + aa, d);
  vec3 cell = vec3(1.0, 0.8, 0.62) * (0.94 + 0.08 * fbm(q * 0.1 + id));
  // Chromoplasts: small granules and a few needle-shaped pigment crystals, mostly near the walls.
  vec2 pv = voronoi(q / 2.6 + id * 7.0);
  vec2 pid = floor(q / 2.6 + id * 7.0);
  float keep = step(0.2, hash12(pid)) * smoothstep(1.5, 4.0, d + wth * 0.3) * (0.65 + 0.35 * smoothstep(12.0, 3.0, d));
  float gran = smoothstep(0.5, 0.25, pv.x) * keep;
  float a = hash12(id + 2.0) * 3.14;
  vec2 nq = mat2(cos(a), sin(a), -sin(a), cos(a)) * q;
  float needle = smoothstep(0.35, 0.1, abs(fract(nq.y / 6.0) - 0.5) * 6.0) * smoothstep(0.55, 0.75, vnoise(vec2(nq.x * 0.35, floor(nq.y / 6.0)))) * smoothstep(2.0, 5.0, d);
  float pig = max(gran, needle * 0.8);
  vec3 red = mix(vec3(0.9, 0.3, 0.1), vec3(0.72, 0.12, 0.06), hash12(pid + 4.0));
  cell = mix(cell, red, pig * 0.9);
  cell = mix(cell, vec3(0.95, 0.9, 0.66), wall);
  cell *= 1.0 - 0.3 * (1.0 - smoothstep(wth + aa, wth + 2.5 * aa, d)) * (1.0 - wall);
  float edge = length(s * vec2(1.0, 1.3)) + 0.25 * (fbm(s * 2.0) - 0.5) + 0.05 * (fbm(s * 12.0) - 0.5);
  float peel = 1.0 - smoothstep(2.0, 2.05, edge);
  t0 = mix(vec3(0.985), cell, peel);
  t1 = vec3(1.0);
`,
}

// Potato tuber scraped and stained with iodine: big thin-walled cells packed with oval starch grains
// (amyloplasts). Iodine turns starch blue-black; the grains show faint growth rings around a hilum.
export const POTATO: SpecimenDef = {
  id: 'potato',
  layerZ: 22,
  helpers: /* glsl */ `
// Starch grains on a jittered 34 um lattice. present: chance a slot holds a grain.
vec3 starch(vec2 q, float seed, float present, float aa) {
  vec3 T = vec3(1.0);
  vec2 g = floor(q / 34.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 gg = g + vec2(x, y);
    vec2 h = hash22(gg + seed);
    if (hash12(gg + seed * 2.0) > present) continue;
    float R = 7.0 + 22.0 * h.x * h.x;
    vec2 c = (gg + 0.5 + (h - 0.5) * 0.5) * 34.0;
    float ang = hash12(gg + seed + 5.0) * 6.28;
    vec2 p = mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * (q - c);
    vec2 ax = vec2(R, R * (0.68 + 0.25 * h.y));
    float e = length(p / ax);
    if (e > 1.0 + aa / R) continue;
    float inside = 1.0 - smoothstep(1.0 - aa / R, 1.0, e);
    // Growth rings around a hilum near the narrow end.
    vec2 hil = vec2(-0.55 * ax.x, 0.0);
    float rd = length((p - hil) / ax) * 9.0;
    float rings = 0.5 + 0.5 * cos(rd * 6.2831);
    float depth = 0.55 + 0.45 * sqrt(max(0.0, 1.0 - e * e)); // thicker in the middle
    vec3 dark = mix(vec3(0.5, 0.42, 0.75), vec3(0.2, 0.15, 0.4), depth * smoothstep(5.0, 22.0, R));
    vec3 g2 = dark * (0.82 + 0.3 * rings * smoothstep(0.2, 0.9, e)) + 0.18 * smoothstep(0.82, 1.0, e); // bright refractive rim
    T *= mix(vec3(1.0), g2, inside);
  }
  return T;
}
`,
  body: /* glsl */ `
  vec2 q = s * 1000.0;
  float aa = max(0.6, gPx * 1000.0 * 1.2);
  vec3 iodine = vec3(0.99, 0.9, 0.68);
  // Cells about 170 um across with thin walls; scraped tissue thins to loose grains at the edge.
  vec2 v = voronoi(q / 170.0 + 3.0);
  float d = (v.y - v.x) * 0.5 * 170.0;
  float tissue = 1.0 - smoothstep(1.4, 1.7, length(s * vec2(1.0, 1.2)) + 0.4 * (fbm(s * 1.8) - 0.5));
  float wall = (1.0 - smoothstep(0.8, 0.8 + aa, d)) * tissue;
  float full = tissue * smoothstep(0.15, 0.4, vnoise(q / 300.0 + 5.0));
  vec3 T = iodine * (0.97 + 0.03 * fbm(q * 0.01));
  T *= starch(q, 1.0, mix(0.06, 0.7, full), aa);
  T = mix(T, T * vec3(0.8, 0.72, 0.5), wall);
  t0 = T;
  t1 = starch(q + vec2(17.0, 11.0), 7.0, mix(0.03, 0.35, full), aa);
  
`,
}
