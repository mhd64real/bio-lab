import { useEffect, useRef } from 'react'
import { NOISE } from './glsl'
import { EMPTY, SPECIMENS, type SpecimenDef } from './specimens'
import { blurAt, optics, type ScopeState } from './model'

const VERT = /* glsl */ `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

function specimenFrag(def: SpecimenDef) {
  return /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uFov;
uniform vec2 uStage;
uniform sampler2D uTex;
uniform float uTexSize;
uniform float uBroken;
uniform vec2 uCrackAt;
uniform vec3 uBubbles[8];
uniform int uBubbleCount;
uniform float uVariant;
uniform float uSeed;
layout(location = 0) out vec4 outLayer0;
layout(location = 1) out vec4 outLayer1;
${NOISE}
float gPx; // slide millimetres per pixel, for anti-aliasing fine detail
${def.helpers}
// t0: the main focal plane. t1: a second plane (e.g. a nucleus) at the specimen's layer depth.
void specimen(vec2 s, out vec3 t0, out vec3 t1) {
  t1 = vec3(1.0);
${def.body}
}
void main() {
  vec2 v = (gl_FragCoord.xy - 0.5 * uRes) / (0.5 * min(uRes.x, uRes.y));
  // The objective and eyepiece turn the image through 180 degrees.
  gPx = uFov / min(uRes.x, uRes.y);
  vec2 s = -uStage - v * uFov * 0.5;
  float crack = 0.0;
  if (uBroken > 0.5) {
    // Cracks radiate from the point the lens pressed on, with a ring of broken glass around it.
    vec2 d = s - uCrackAt;
    float r = length(d);
    float a = atan(d.y, d.x);
    float spokes = abs(fract(a / 6.2831 * 9.0 + 0.15 * vnoise(vec2(r * 6.0, 1.0)) + 0.3 * hash12(vec2(floor(a / 6.2831 * 9.0), 4.0))) - 0.5) * 2.0 * r * 0.7;
    float w = max(0.003, gPx * 1.5);
    crack = 1.0 - smoothstep(w * 0.5, w * 1.5, spokes);
    crack *= smoothstep(1.6, 0.6, r);
    vec2 vo = voronoi(d * 9.0);
    crack = max(crack, (1.0 - smoothstep(0.0, max(0.02, gPx * 14.0), vo.y - vo.x)) * smoothstep(0.35, 0.1, r));
    s += (hash22(floor(vec2(a * 1.43, r * 4.0))) - 0.5) * 0.02 * smoothstep(1.0, 0.0, r);
  }
  vec3 t, t1;
  specimen(s, t, t1);
  for (int i = 0; i < 8; i++) {
    if (i >= uBubbleCount) break;
    vec3 b = uBubbles[i];
    float d = length(s - b.xy) / b.z;
    if (d < 1.0) {
      // Air bubble: a thick dark rim from refraction and a bright clear centre.
      float rim = smoothstep(0.62, 0.97, d);
      t = mix(vec3(0.97), t, 0.25);
      t *= mix(1.0, 0.06, rim);
      t += vec3(0.25) * (1.0 - smoothstep(0.0, 0.35, abs(d - 0.5))) * 0.4;
    }
  }
  t = mix(t, vec3(0.05), crack * 0.9);
  outLayer0 = vec4(clamp(t, 0.0, 1.0), 1.0);
  outLayer1 = vec4(clamp(t1, 0.0, 1.0), 1.0);
}
`
}

const OPTICS_FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform sampler2D uSharp;
uniform sampler2D uSharp1;
uniform float uBlur;
uniform float uBlur1;
uniform float uHasLayer1;
uniform float uLight;
uniform float uContrast;
uniform float uGlare;
uniform float uSeed;
out vec4 outColor;
${NOISE}
vec3 defocus(sampler2D tex, vec2 uv, float R) {
  if (R < 0.6) return texture(tex, uv).rgb;
  const int N = 32;
  float lod = log2(max(1.0, R * 1.7 / sqrt(float(N))));
  vec3 acc = vec3(0.0);
  float rot = hash12(gl_FragCoord.xy) * 6.2831;
  for (int i = 0; i < N; i++) {
    float fi = float(i);
    float rr = sqrt((fi + 0.5) / float(N)) * R;
    float th = fi * 2.39996 + rot;
    acc += textureLod(tex, uv + vec2(cos(th), sin(th)) * rr / uRes, lod).rgb;
  }
  return acc / float(N);
}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float scale = 0.5 * min(uRes.x, uRes.y);
  vec2 v = (gl_FragCoord.xy - 0.5 * uRes) / scale;
  float r = length(v);
  if (r > 1.0) { outColor = vec4(0.0, 0.0, 0.0, 1.0); return; }

  // Defocus: a disc blur per specimen plane, sampled from a coarser mip level as the disc grows.
  vec3 t = defocus(uSharp, uv, uBlur * 2.0 * scale);
  if (uHasLayer1 > 0.5) t *= defocus(uSharp1, uv, uBlur1 * 2.0 * scale);

  // Light from a cool white LED, through the specimen.
  vec3 I = t * uLight * vec3(1.0, 0.985, 0.95);
  float mean = 0.62 * uLight;
  I = mix(vec3(mean), I, uContrast);
  I += uGlare * 0.55;
  // Field stop and vignetting.
  I *= 1.0 - 0.2 * r * r;
  I *= 1.0 - smoothstep(0.965, 1.0, r);
  // Dust on the eyepiece lens stays put while the slide moves.
  for (int i = 0; i < 6; i++) {
    vec2 c = hash22(vec2(float(i), 7.0)) * 1.3 - 0.65;
    float sz = 0.015 + 0.03 * hash12(vec2(float(i), 3.0));
    float d = length(v - c) / sz;
    I *= 1.0 - 0.07 * (1.0 - smoothstep(0.6, 1.0, d)) * smoothstep(0.0, 0.6, d);
  }
  I = 1.0 - exp(-2.7 * max(I, 0.0));
  I += (hash12(gl_FragCoord.xy + uSeed) - 0.5) * 0.022 * (0.3 + uLight);
  outColor = vec4(clamp(I, 0.0, 1.0), 1.0);
}
`

function compile(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const mk = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error((type === gl.VERTEX_SHADER ? 'vertex: ' : 'fragment: ') + (gl.getShaderInfoLog(sh) || 'no log, context lost: ' + gl.isContextLost()))
    return sh
  }
  const p = gl.createProgram()!
  gl.attachShader(p, mk(gl.VERTEX_SHADER, vs))
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs))
  gl.bindAttribLocation(p, 0, 'aPos')
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link error')
  const uni = (name: string) => gl.getUniformLocation(p, name)
  return { p, uni }
}

interface Renderer {
  draw(s: ScopeState, low?: boolean): void
  resize(w: number, h: number): void
  dispose(): void
}

function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true })
  if (!gl) return null

  const quad = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, quad)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  gl.enableVertexAttribArray(0)
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

  const programs = new Map<string, ReturnType<typeof compile>>()
  const textures = new Map<string, WebGLTexture>()
  const opticsProg = compile(gl, VERT, OPTICS_FRAG)

  const specimenProgram = (def: SpecimenDef) => {
    let prog = programs.get(def.id)
    if (!prog) { prog = compile(gl, VERT, specimenFrag(def)); programs.set(def.id, prog) }
    let tex = textures.get(def.id)
    if (!tex) {
      tex = gl.createTexture()!
      gl.bindTexture(gl.TEXTURE_2D, tex)
      if (def.texture) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, def.texture())
        gl.generateMipmap(gl.TEXTURE_2D)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      textures.set(def.id, tex)
    }
    return { prog, tex }
  }

  // Off-screen targets for the sharp specimen, with mipmaps for the blur pass.
  // A reduced-resolution target is used while the student is moving a control.
  const makeTarget = () => ({ tex: gl.createTexture()!, tex1: gl.createTexture()!, fbo: gl.createFramebuffer()!, w: 1, h: 1 })
  const full = makeTarget(), low = makeTarget()
  let w = 1, h = 1
  const allocate = (t: ReturnType<typeof makeTarget>, tw: number, th: number) => {
    t.w = tw; t.h = th
    gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo)
    ;[t.tex, t.tex1].forEach((tex, i) => {
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, tex, 0)
    })
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1])
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }
  const allocateAll = () => {
    allocate(full, w, h)
    allocate(low, Math.max(32, Math.round(w * 0.6)), Math.max(32, Math.round(h * 0.6)))
  }
  allocateAll()
  let seed = 0

  return {
    resize(nw, nh) {
      if (nw === w && nh === h) return
      w = nw; h = nh
      canvas.width = w; canvas.height = h
      allocateAll()
    },
    draw(s, quick = false) {
      const target = quick ? low : full
      const o = optics(s)
      const def = s.slide !== 'none' && s.mount ? SPECIMENS[s.mount.specimen] : EMPTY
      const { prog, tex } = specimenProgram(def)

      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo)
      gl.viewport(0, 0, target.w, target.h)
      gl.useProgram(prog.p)
      gl.uniform2f(prog.uni('uRes'), target.w, target.h)
      gl.uniform1f(prog.uni('uFov'), o.fov)
      gl.uniform2f(prog.uni('uStage'), s.stageX, s.stageY)
      gl.uniform1f(prog.uni('uTexSize'), def.textureSize ?? 1)
      gl.uniform1f(prog.uni('uBroken'), s.broken ? 1 : 0)
      gl.uniform2f(prog.uni('uCrackAt'), s.crackAt.x, s.crackAt.y)
      const bubbles = s.slide !== 'none' ? (s.mount?.bubbles ?? []).slice(0, 8) : []
      const arr = new Float32Array(24)
      bubbles.forEach((b, i) => arr.set([b.x, b.y, b.r], i * 3))
      gl.uniform3fv(prog.uni('uBubbles'), arr)
      gl.uniform1i(prog.uni('uBubbleCount'), bubbles.length)
      gl.uniform1f(prog.uni('uVariant'), s.mount?.variant ?? 0)
      gl.uniform1f(prog.uni('uSeed'), 0)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.uniform1i(prog.uni('uTex'), 0)
      gl.drawArrays(gl.TRIANGLES, 0, 3)

      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      const layered = def.layerZ !== undefined
      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, target.tex1)
      if (layered) gl.generateMipmap(gl.TEXTURE_2D)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, target.tex)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.viewport(0, 0, w, h)
      gl.useProgram(opticsProg.p)
      const u = opticsProg.uni
      gl.uniform2f(u('uRes'), w, h)
      gl.uniform1i(u('uSharp'), 0)
      gl.uniform1i(u('uSharp1'), 1)
      gl.uniform1f(u('uBlur'), o.blur)
      gl.uniform1f(u('uBlur1'), layered ? blurAt(s, def.layerZ ?? 0) : 0)
      gl.uniform1f(u('uHasLayer1'), layered ? 1 : 0)
      gl.uniform1f(u('uLight'), o.light)
      gl.uniform1f(u('uContrast'), o.contrast)
      gl.uniform1f(u('uGlare'), o.glare)
      gl.uniform1f(u('uSeed'), (seed = (seed + 1) % 97) * 13.7)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      // The context belongs to the canvas, which React may remount, so it is not destroyed here.
      programs.forEach(({ p }) => gl.deleteProgram(p))
      textures.forEach((t) => gl.deleteTexture(t))
      gl.deleteProgram(opticsProg.p)
      for (const t of [full, low]) { gl.deleteTexture(t.tex); gl.deleteTexture(t.tex1); gl.deleteFramebuffer(t.fbo) }
      gl.deleteBuffer(quad)
    },
  }
}

export function OpticalView({ state }: { state: ScopeState }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const stateRef = useRef(state)
  const frame = useRef(0)
  stateRef.current = state

  const lastChange = useRef(0)
  const settle = useRef(0)
  const schedule = () => {
    const now = performance.now()
    // Changes arriving in quick succession mean a control is being held: draw fast, then sharpen once it stops.
    const moving = now - lastChange.current < 150
    lastChange.current = now
    clearTimeout(settle.current)
    if (moving) settle.current = window.setTimeout(() => rendererRef.current?.draw(stateRef.current), 180)
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = 0
      rendererRef.current?.draw(stateRef.current, moving)
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current!
    let r: Renderer | null = null
    try { r = createRenderer(canvas) } catch (e) { console.error(e) }
    rendererRef.current = r
    const ro = new ResizeObserver(([entry]) => {
      const box = entry.contentRect
      // Leave room for the eyepiece ring drawn around the canvas.
      const size = Math.max(64, Math.min(box.width, box.height) - 32)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const px = Math.max(64, Math.min(1600, Math.round(size * dpr)))
      canvas.style.width = canvas.style.height = `${size}px`
      r?.resize(px, px)
      schedule()
    })
    ro.observe(wrapRef.current!)
    // Dev only: lets tools/perf.mjs time a synchronous redraw.
    const redraw = () => r?.draw(stateRef.current)
    if (import.meta.env.DEV) window.addEventListener('bio-redraw', redraw)
    return () => { clearTimeout(settle.current); window.removeEventListener('bio-redraw', redraw); ro.disconnect(); cancelAnimationFrame(frame.current); frame.current = 0; r?.dispose() }
  }, [])

  useEffect(schedule, [state])

  return (
    <div ref={wrapRef} className="eyepiece-wrap">
      <canvas ref={canvasRef} className="eyepiece-canvas" role="img" aria-label="View through the eyepiece" />
    </div>
  )
}
