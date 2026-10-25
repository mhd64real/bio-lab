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

void main() {
  vec2 v = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);
  gPx = uFov / min(uRes.x, uRes.y);
  vec2 p = uStage + v * uFov;

  // Resin section: nearly transparent, with faint texture.
  float dens = 0.06 + 0.03 * fbm(p * 0.8);

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
