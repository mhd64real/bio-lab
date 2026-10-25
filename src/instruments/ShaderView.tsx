// A two-pass WebGL2 view shared by the confocal and electron microscopes.
// Pass 1 renders the sharp specimen into a mipmapped texture; pass 2 applies the instrument's optics
// (blur, haze, noise, tone) by sampling it. Animated views redraw every frame, others only on change.
import { useEffect, useRef } from 'react'

export type Uniform = number | [number, number] | [number, number, number] | boolean
export type Uniforms = Record<string, Uniform>

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

function compile(gl: WebGL2RenderingContext, fs: string) {
  const mk = (type: number, src: string) => {
    const sh = gl.createShader(type)!
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) || 'shader error')
    return sh
  }
  const p = gl.createProgram()!
  gl.attachShader(p, mk(gl.VERTEX_SHADER, VERT))
  gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs))
  gl.bindAttribLocation(p, 0, 'aPos')
  gl.linkProgram(p)
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) || 'link error')
  const cache = new Map<string, WebGLUniformLocation | null>()
  const loc = (n: string) => { if (!cache.has(n)) cache.set(n, gl.getUniformLocation(p, n)); return cache.get(n)! }
  return { p, loc }
}

function setAll(gl: WebGL2RenderingContext, loc: (n: string) => WebGLUniformLocation | null, u: Uniforms) {
  for (const [k, v] of Object.entries(u)) {
    const l = loc(k)
    if (!l) continue
    if (typeof v === 'boolean') gl.uniform1f(l, v ? 1 : 0)
    else if (typeof v === 'number') gl.uniform1f(l, v)
    else if (v.length === 2) gl.uniform2f(l, v[0], v[1])
    else gl.uniform3f(l, v[0], v[1], v[2])
  }
}

export interface ShaderViewProps {
  specimen: string // full fragment shader for pass 1 (uniforms uRes, uTime are provided)
  post: string // full fragment shader for pass 2 (uSharp sampler, uRes, uTime provided)
  uniforms: Uniforms
  animate: boolean
  shape?: 'round' | 'square'
  label: string
  // Reduced resolution for pass 1, as a fraction of the canvas.
  scale?: number
}

export function ShaderView({ specimen, post, uniforms, animate, shape = 'square', label, scale = 1 }: ShaderViewProps) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const uni = useRef(uniforms)
  uni.current = uniforms
  const draw = useRef<(() => void) | null>(null)

  useEffect(() => {
    const c = canvas.current!
    const gl = c.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true })
    if (!gl) return
    let p1: ReturnType<typeof compile>, p2: ReturnType<typeof compile>
    try { p1 = compile(gl, specimen); p2 = compile(gl, post) } catch (e) { console.error(e); return }
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    const tex = gl.createTexture()!, fbo = gl.createFramebuffer()!
    let w = 1, h = 1, tw = 1, th = 1
    const alloc = () => {
      tw = Math.max(32, Math.round(w * scale)); th = Math.max(32, Math.round(h * scale))
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    }
    alloc()
    const t0 = performance.now()
    let frame = 0
    const render = () => {
      const time = (performance.now() - t0) / 1000
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
      gl.viewport(0, 0, tw, th)
      gl.useProgram(p1.p)
      setAll(gl, p1.loc, { ...uni.current, uRes: [tw, th], uTime: time })
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.viewport(0, 0, w, h)
      gl.useProgram(p2.p)
      gl.uniform1i(p2.loc('uSharp'), 0)
      setAll(gl, p2.loc, { ...uni.current, uRes: [w, h], uTime: time, uSeed: (frame++ % 97) * 13.7 })
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    draw.current = render
    const ro = new ResizeObserver(([e]) => {
      const box = e.contentRect
      const size = Math.max(64, Math.min(box.width, box.height) - 24)
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      c.style.width = c.style.height = `${size}px`
      w = h = Math.min(1400, Math.round(size * dpr))
      c.width = w; c.height = h
      alloc()
      render()
    })
    ro.observe(wrap.current!)
    return () => {
      ro.disconnect()
      draw.current = null
      gl.deleteProgram(p1.p); gl.deleteProgram(p2.p); gl.deleteTexture(tex); gl.deleteFramebuffer(fbo); gl.deleteBuffer(buf)
    }
  }, [specimen, post, scale])

  // Redraw on every change, and every frame while animating.
  useEffect(() => {
    if (!animate) { draw.current?.(); return }
    let raf = 0
    const loop = () => { draw.current?.(); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  })

  return (
    <div ref={wrap} className="eyepiece-wrap">
      <canvas ref={canvas} role="img" aria-label={label} className={shape === 'round' ? 'eyepiece-canvas' : 'camera-canvas'} />
    </div>
  )
}
