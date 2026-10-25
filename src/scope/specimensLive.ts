// Living specimens: pond water (Paramecium and Euglena) and an Elodea leaf. Both move (uTime, seconds).
import type { SpecimenDef } from './specimens'
import { SWIMMERS_GLSL } from './pond'

export const POND: SpecimenDef = {
  id: 'pond',
  animated: true,
  helpers: /* glsl */ `
${SWIMMERS_GLSL}
mat2 rot2(float a) { return mat2(cos(a), sin(a), -sin(a), cos(a)); }

// Paramecium, local coordinates in um (front is +x). Writes optical thickness and a faint colour.
void paramecium(vec2 q, float t, float seed, inout float ph, inout vec3 col) {
  if (abs(q.x) > 125.0 || abs(q.y) > 50.0) return;
  float hx = clamp(q.x / 105.0, -1.0, 1.0);
  float hw = 30.0 * sqrt(max(0.0, 1.0 - hx * hx)) * (q.x > 0.0 ? 0.82 : 1.0);
  // The oral groove: a shallow dent on one side.
  hw -= (q.y > 0.0 ? 7.0 : 0.0) * exp(-pow((q.x - 5.0) / 32.0, 2.0));
  float d = hw - abs(q.y); // um inside the edge
  // Cilia: a fringe 10 um deep, with waves running from front to back (metachronal waves).
  if (d < 0.0 && d > -11.0) {
    // Fine shimmering strands, with wave crests sweeping along them.
    float wave = 0.5 + 0.5 * sin(q.x * 0.42 + t * 13.0 + seed);
    float strands = 0.7 + 0.3 * vnoise(vec2(q.x * 0.6, d * 0.3 + t * 2.0));
    ph = max(ph, 0.6 * pow(1.0 + d / 11.0, 0.7) * (0.3 + 0.7 * wave) * strands);
  }
  if (d <= 0.0) return;
  float body = 0.55 + 0.1 * fbm(q * 0.08 + seed) + 0.12 * (vnoise(q * 0.9 + seed) - 0.5);
  body += 0.3 * smoothstep(2.5, 0.0, d); // the pellicle at the edge
  // Macronucleus.
  body += 0.2 * smoothstep(1.0, 0.8, length((q - vec2(-8.0, -4.0)) / vec2(30.0, 17.0)));
  // Food vacuoles: dark granules.
  for (int i = 0; i < 9; i++) {
    vec2 h = hash22(vec2(float(i), seed));
    vec2 c = vec2((h.x - 0.5) * 140.0, (h.y - 0.5) * 30.0);
    float r = length(q - c);
    body += 0.45 * smoothstep(5.0, 3.5, r);
    col = mix(col, vec3(0.86, 0.8, 0.68), 0.5 * smoothstep(5.0, 3.0, r));
  }
  // Two contractile vacuoles, filling and squeezing empty in turn.
  for (int k = 0; k < 2; k++) {
    float cyc = fract(t * 0.18 + float(k) * 0.5 + seed * 0.1);
    float r = 9.0 * smoothstep(0.0, 0.85, cyc) * (1.0 - smoothstep(0.85, 1.0, cyc));
    float dv = length(q - vec2(k == 0 ? 62.0 : -62.0, 0.0));
    float star = r * (1.0 + 0.6 * pow(abs(sin(atan(q.y, q.x - (k == 0 ? 62.0 : -62.0)) * 3.0)), 6.0) * smoothstep(1.0, 0.3, cyc));
    body = mix(body, 0.08, smoothstep(star + 1.0, star - 1.0, dv));
  }
  ph = max(ph, body);
  col = mix(col, vec3(0.94, 0.94, 0.9), 0.25);
}

// Euglena, local um: a spindle with green chloroplasts, a red eyespot and one long whipping flagellum.
void euglena(vec2 q, float t, float seed, inout float ph, inout vec3 col) {
  if (abs(q.x) > 90.0 || abs(q.y) > 25.0) return;
  // The flagellum: from the front, a wave travelling outward, about as long as the cell.
  if (q.x > 25.0 && q.x < 78.0) {
    float u = q.x - 25.0;
    float y = 5.0 * (u / 52.0 + 0.15) * sin(u * 0.24 - t * 18.0 + seed);
    float dd = abs(q.y - y);
    ph = max(ph, 0.75 * smoothstep(1.2, 0.3, dd) * smoothstep(52.0, 46.0, u));
  }
  float hx = clamp(q.x / 28.0, -1.0, 1.0);
  float squirm = 1.0 + 0.12 * sin(t * 1.3 + q.x * 0.1 + seed);
  float hw = 7.0 * pow(max(0.0, 1.0 - hx * hx), 0.7) * squirm;
  float d = hw - abs(q.y);
  if (d <= 0.0) return;
  float body = 0.45 + 0.25 * smoothstep(1.5, 0.0, d);
  vec3 c = vec3(0.92, 0.96, 0.9);
  // Chloroplasts are coloured, so they show even in brightfield.
  vec2 v = voronoi(q * 0.33 + seed);
  float chl = smoothstep(0.5, 0.25, v.x) * step(-20.0, q.x) * step(q.x, 18.0);
  c = mix(c, vec3(0.42, 0.7, 0.3), chl * 0.85);
  body += 0.3 * chl;
  float eye = smoothstep(2.6, 1.6, length(q - vec2(19.0, 2.0)));
  c = mix(c, vec3(0.85, 0.25, 0.15), eye);
  ph = max(ph, body);
  col = c;
}
`,
  body: /* glsl */ `
  float t = uTime;
  vec3 col = vec3(0.985, 0.985, 0.975);
  float ph = 0.0;
  // Debris: specks, bacteria and the odd brown clump, mostly colourless.
  vec2 dv = voronoi(s * 60.0);
  ph = max(ph, 0.45 * smoothstep(0.08, 0.02, dv.x) * step(0.72, hash12(floor(s * 60.0))));
  float clump = smoothstep(0.7, 0.76, fbm(s * 5.0 + 7.0));
  col = mix(col, vec3(0.8, 0.74, 0.6), clump * 0.6);
  ph = max(ph, clump * 0.6);
  for (int i = 0; i < NS; i++) {
    vec4 a = SW_A[i];
    vec2 b = SW_B[i];
    float ang = a.w * t + b.x;
    vec2 c = a.xy + a.z * vec2(cos(ang), 0.6 * sin(1.3 * ang));
    vec2 vel = a.z * a.w * vec2(-sin(ang), 0.78 * cos(1.3 * ang));
    float heading = atan(vel.y, vel.x);
    vec2 q = rot2(-heading) * (s - c) * 1000.0;
    if (b.y < 0.5) paramecium(q, t, float(i) * 3.7, ph, col);
    else euglena(q, t, float(i) * 2.3, ph, col);
  }
  gPhase = ph;
  t0 = col * (1.0 - 0.06 * ph);
`,
}

export const ELODEA: SpecimenDef = {
  id: 'elodea',
  animated: true,
  layerZ: 14,
  helpers: /* glsl */ `
// One layer of leaf cells. Cells are long boxes in staggered rows along the leaf (x).
// Chloroplasts sit in a band just inside each wall and stream around the cell (cytoplasmic streaming).
vec3 elodeaLayer(vec2 q, float t, float seed, out float wallOut) {
  wallOut = 0.0;
  const float W = 110.0, H = 30.0;
  float row = floor(q.y / H);
  // End walls are slanted, and each row is a slightly different height.
  q.x += (q.y - (row + 0.5) * H) * (hash12(vec2(row, seed + 5.0)) - 0.5) * 0.8;
  float off = hash12(vec2(row, seed)) * W;
  float colIdx = floor((q.x + off) / W);
  vec2 lc = vec2(mod(q.x + off, W) - W * 0.5, q.y - (row + 0.5) * H);
  vec2 hc = hash22(vec2(colIdx, row) + seed);
  float hw = W * 0.5 - 0.8, hh = H * 0.5 - 0.8;
  float dw = min(hw - abs(lc.x), hh - abs(lc.y)); // um from the wall
  float aa = max(0.5, gPx * 1000.0);
  float wall = 1.0 - smoothstep(0.0, aa * 1.2, dw);
  wallOut = wall;
  // Chloroplasts line the cytoplasm on the top and bottom faces too, so in face view they cover the cell.
  // They stream in concentric loops (bands 6 um apart), each loop measured along its own rounded box.
  float band = floor((dw - 1.6) / 6.2);
  float bw = hw - 1.6 - band * 6.2, bh = hh - 1.6 - band * 6.2;
  float chl = 0.0;
  float du = 0.0, r = 0.0, k = 0.0;
  if (band >= 0.0 && bh > 1.5) {
    float u;
    if (bh - abs(lc.y) < bw - abs(lc.x)) u = lc.y > 0.0 ? (bw - lc.x) : (2.0 * bw + 2.0 * bh + bw + lc.x);
    else u = lc.x < 0.0 ? (2.0 * bw + bh - lc.y) : (4.0 * bw + 2.0 * bh + bh + lc.y);
    float dir = hc.x > 0.5 ? 1.0 : -1.0;
    float speed = 3.5 + 3.0 * hc.y;
    float spacing = 6.0 + 1.5 * hash12(vec2(band, colIdx));
    float uu = u - dir * speed * t;
    k = floor(uu / spacing);
    float jit = hash12(vec2(k + band * 31.0, colIdx + row * 17.0 + seed));
    du = uu - (k + 0.5) * spacing - (jit - 0.5) * 2.0;
    r = (dw - 1.6 - band * 6.2) - 3.1 - (jit - 0.5) * 1.2;
    chl = smoothstep(2.8, 2.0, length(vec2(du / 1.3, r))) * step(band < 1.0 ? 0.12 : 0.5, jit);
  }
  vec3 c = vec3(0.95, 0.98, 0.93);
  vec3 green = vec3(0.32, 0.6, 0.22) * (0.8 + 0.35 * vnoise(vec2(du, r) * 1.5 + k));
  c = mix(c, green, chl);
  // The nucleus, pressed against one wall in some cells.
  float nuc = smoothstep(4.5, 3.5, length(lc - vec2((hc.y - 0.5) * 40.0, (hc.x > 0.5 ? 1.0 : -1.0) * (hh - 5.0))));
  c = mix(c, vec3(0.86, 0.88, 0.82), nuc * step(0.4, hc.y));
  // The cellulose wall: a clear line with dark edges where light bends at it.
  c = mix(c, vec3(0.9, 0.95, 0.86), wall);
  c *= 1.0 - 0.35 * (1.0 - smoothstep(aa * 1.2, aa * 2.4, dw)) * (1.0 - wall);
  return c;
}
`,
  body: /* glsl */ `
  float t = uTime;
  // The leaf: about 1.2 mm wide, its long axis along x, with toothed edges and a midrib.
  float ly = s.y + 0.08 * sin(s.x * 0.6);
  float half_ = 0.6 + 0.05 * sin(s.x * 1.3);
  float tooth = 0.03 * max(0.0, sin(s.x * 9.0)) ;
  float leaf = 1.0 - smoothstep(half_ + tooth - 0.004, half_ + tooth, abs(ly));
  vec2 q = vec2(s.x, ly) * 1000.0;
  float w0, w1;
  vec3 a = elodeaLayer(q, t, 1.0, w0);
  vec3 b = elodeaLayer(q + vec2(41.0, 13.0), t, 9.0, w1);
  float mid = 1.0 - smoothstep(0.05, 0.08, abs(ly));
  a = mix(a, a * vec3(0.92, 0.96, 0.9), mid);
  t0 = mix(vec3(0.985), a, leaf);
  t1 = mix(vec3(1.0), mix(vec3(1.0), b, 0.85), leaf);
`,
}
