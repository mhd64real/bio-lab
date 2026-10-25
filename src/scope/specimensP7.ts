import { ONION, type SpecimenDef } from './specimens'

// Red onion: the outer epidermis of a scale leaf, unstained. Each cell's big central vacuole is full of
// purple sap (anthocyanin), so the vacuole shows without any stain; the cytoplasm is a thin colourless
// layer against the wall, the nucleus a pale disc in the second focal plane.
// uVariant: 0 in water; otherwise salt water was drawn through at specimen time uVariant - 1 (seconds).
// Water then leaves the vacuole: over about 45 s the protoplast shrinks away from the wall (plasmolysis),
// and the purple gets darker as the same pigment is packed into less water.
export const RED_ONION: SpecimenDef = {
  id: 'redonion',
  layerZ: 3,
  animated: true,
  // Same cell shapes as the white onion (read lazily: specimens.ts imports this file before ONION exists).
  get helpers() { return ONION.helpers },
  body: /* glsl */ `
  float ca = cos(0.26), sa = sin(0.26);
  vec2 q = mat2(ca, sa, -sa, ca) * s * 1000.0;
  q.y += 40.0 * sin(q.x * 0.0011) + 60.0 * (fbm(s * 0.6) - 0.5);
  q += 2.5 * (vec2(vnoise(q * 0.03), vnoise(q * 0.03 + 7.0)) - 0.5);
  vec2 id, local, size;
  float d = onionCell(q, id, local, size);
  float aa = max(0.6, gPx * 1000.0 * 1.2);
  float edge = length(s * vec2(1.0, 1.25)) + 0.25 * (fbm(s * 2.0) - 0.5) + 0.05 * (fbm(s * 14.0) - 0.5);
  float peel = 1.0 - smoothstep(2.15, 2.2, edge);
  vec3 bg = vec3(0.985);
  vec2 h = hash22(id + 21.0);
  float p = uVariant > 0.5 ? clamp((uTime - (uVariant - 1.0)) / 45.0 * (0.75 + 0.5 * h.x), 0.0, 1.0) : 0.0;
  p = p * p * (3.0 - 2.0 * p);
  // How purple each cell is: most are strongly coloured, a few are almost clear.
  float pig = h.y < 0.1 ? 0.12 : 0.45 + 0.55 * hash12(id + 4.0);
  // The protoplast: everything inside the cell membrane. In water it presses on the wall; in salt it pulls in,
  // further at the ends, unevenly, and its corners round off.
  // As it shrinks it rounds off into a smooth blob (a rounded box), never past the wall.
  vec2 hb = 0.5 * size - mix(vec2(-60.0), vec2(14.0 + 0.12 * size.x + 10.0 * h.x, 8.0 + 0.12 * size.y + 3.0 * h.y), p);
  float rr = min(max(hb.y, 1.0), 6.0 + 14.0 * p);
  vec2 bq = abs(local + p * vec2(8.0 * (h.y - 0.5), 3.0 * (h.x - 0.5))) - hb + rr;
  float box = length(max(bq, 0.0)) + min(max(bq.x, bq.y), 0.0) - rr;
  float inset = 1.6;
  float pd = min(d - inset, -box + 2.0 * p * (vnoise(q * 0.03 + id * 3.0) - 0.5)); // distance inside the protoplast
  float proto = smoothstep(-aa, aa, pd);
  vec3 purple = mix(vec3(0.88, 0.5, 0.8), vec3(0.62, 0.1, 0.5), clamp(pig * (1.0 + 0.7 * p) - 0.3, 0.0, 1.0));
  vec3 sap = mix(vec3(1.0), purple, clamp(pig * (1.0 + 0.6 * p), 0.0, 1.0)) * (0.97 + 0.05 * fbm(q * 0.02 + id));
  // A thin colourless layer of cytoplasm lines the protoplast, slightly grainy.
  float cyto = smoothstep(-aa, 0.5, pd) * (1.0 - smoothstep(0.8, 2.4, pd));
  vec3 cellT = mix(vec3(0.99), sap, proto * (1.0 - 0.75 * cyto));
  cellT *= 1.0 - 0.08 * cyto * (0.6 + 0.4 * vnoise(q * 0.8));
  // The edge of the shrunken protoplast shows as a darker line.
  float er = pd / (0.8 + aa);
  cellT *= 1.0 - 0.18 * p * exp(-er * er);
  float wall = 1.0 - smoothstep(1.0, 1.0 + aa, d);
  cellT = mix(cellT, vec3(0.78, 0.74, 0.72), wall);
  t0 = mix(bg, cellT, peel);
  // Nucleus, pressed against the side of the cell; it moves inwards with the protoplast.
  vec2 nc = vec2((h.x - 0.5) * max(0.0, size.x - 60.0) * 0.8, sign(h.y - 0.5) * (0.5 * size.y - 11.0 - p * (4.0 + 0.12 * size.y)));
  vec2 nl = local - nc;
  float nr = length(nl / vec2(12.0, 8.5));
  float nuc = 1.0 - smoothstep(1.0 - aa / 10.0, 1.0, nr);
  vec3 nT = mix(vec3(1.0), vec3(0.9, 0.88, 0.9) * (0.95 + 0.06 * fbm(nl * 0.6)), nuc);
  nT *= 1.0 - 0.18 * nuc * smoothstep(0.75, 1.0, nr);
  t1 = mix(vec3(1.0), nT, peel * step(0.15, hash12(id + 9.0)));
`,
}
