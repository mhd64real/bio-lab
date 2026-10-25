import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { CheckCircle2, Circle } from 'lucide-react'
import { Button, Choice, type ChoiceQ } from '../../ui/kit'
import { Slider } from '../../scope/Controls'
import { play } from '../../lib/sound'

// A model nucleus that the student slices with a knife, to see why thin sections of the same 3D object differ
// (the "Infer" question of Figure 22). Units are micrometres; y is up. The section is drawn like a TEM image.

const A = 5, C = 3.5, B = 4 // semi-axes along x, y (height) and z
const NUCLEOLUS = { x: 1.2, y: 0.9, z: 0.8, r: 1.1 }
const H_MAX = 3.6
const TILT_MAX = 70
const SPAN = 6 // the section image covers -SPAN..SPAN in both directions

// Nuclear pores spread evenly over the envelope (a Fibonacci lattice on the ellipsoid).
const PORES = (() => {
  const n = 170, out: [number, number, number][] = []
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * 2.39996
    out.push([Math.cos(a) * r * A, y * C, Math.sin(a) * r * B])
  }
  return out
})()

function hash3(x: number, y: number, z: number) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return h - Math.floor(h)
}
function noise3(x: number, y: number, z: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  const fx = x - ix, fy = y - iy, fz = z - iz
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), uz = fz * fz * (3 - 2 * fz)
  const l = (a: number, b: number, t: number) => a + (b - a) * t
  const c = (dx: number, dy: number, dz: number) => hash3(ix + dx, iy + dy, iz + dz)
  return l(
    l(l(c(0, 0, 0), c(1, 0, 0), ux), l(c(0, 1, 0), c(1, 1, 0), ux), uy),
    l(l(c(0, 0, 1), c(1, 0, 1), ux), l(c(0, 1, 1), c(1, 1, 1), ux), uy),
    uz,
  )
}

// Knife plane: through (0, h, 0), tilted about the x axis. In-plane axes U = x, V = (0, sin t, cos t).
function planeAxes(h: number, tiltDeg: number) {
  const t = (tiltDeg * Math.PI) / 180
  return { U: new THREE.Vector3(1, 0, 0), V: new THREE.Vector3(0, Math.sin(t), Math.cos(t)), N: new THREE.Vector3(0, Math.cos(t), -Math.sin(t)), P0: new THREE.Vector3(0, h, 0) }
}

interface Section { rgba: Uint8ClampedArray; area: number; nucleolus: boolean }
const FULL_AREA = Math.PI * A * B // the widest horizontal section, um^2

// Draws the section as a TEM would show it: dense (dark) heterochromatin and nucleolus, pale euchromatin,
// a dark envelope broken by pores. Outside the nucleus: cytoplasm, or transparent for the 3D cut face.
function renderSection(h: number, tiltDeg: number, n: number, cytoplasm: boolean): Section {
  const { U, V } = planeAxes(h, tiltDeg)
  const rgba = new Uint8ClampedArray(n * n * 4)
  const px = (2 * SPAN) / n
  let inside = 0, nucl = 0
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const u = -SPAN + (i + 0.5) * px, v = SPAN - (j + 0.5) * px
      const x = u * U.x + v * V.x, y = h + u * U.y + v * V.y, z = u * U.z + v * V.z
      const e = Math.sqrt((x / A) ** 2 + (y / C) ** 2 + (z / B) ** 2)
      const rl = Math.hypot(x, y, z) / Math.max(e, 1e-6)
      const dEnv = (e - 1) * rl
      const grain = hash3(x * 40, y * 40, z * 40)
      let dens: number, alpha = 255
      if (dEnv > 0.08) {
        if (cytoplasm) dens = 0.12 + 0.08 * noise3(x * 3, y * 3, z * 3) + 0.08 * grain
        else { dens = 0; alpha = 0 }
      } else {
        if (dEnv > -0.08) {
          let pore = false
          for (const p of PORES) if ((p[0] - x) ** 2 + (p[1] - y) ** 2 + (p[2] - z) ** 2 < 0.06) { pore = true; break }
          dens = pore ? 0.3 : 0.95
        } else {
          inside++
          const band = 0.25 + 0.35 * noise3(x * 1.5 + 7, y * 1.5, z * 1.5)
          const clump = noise3(x * 1.1 + 3, y * 1.1, z * 1.1) * 0.7 + noise3(x * 4, y * 4, z * 4) * 0.3
          const het = dEnv > -band || clump > 0.66
          dens = het ? 0.7 + 0.12 * grain : 0.34 + 0.1 * noise3(x * 6, y * 6, z * 6) + 0.06 * grain
          const dn = Math.hypot(x - NUCLEOLUS.x, y - NUCLEOLUS.y, z - NUCLEOLUS.z)
          if (dn < NUCLEOLUS.r) { nucl++; dens = 0.8 + 0.12 * noise3(x * 8, y * 8, z * 8) + 0.06 * grain }
        }
      }
      const g = Math.round(255 * (1 - 0.9 * Math.min(1, dens)))
      const k = (j * n + i) * 4
      rgba[k] = g; rgba[k + 1] = g; rgba[k + 2] = cytoplasm ? g : Math.min(255, g + 8); rgba[k + 3] = alpha
    }
  }
  const pxArea = px * px
  return { rgba, area: (inside * pxArea) / FULL_AREA, nucleolus: nucl * pxArea > 0.15 }
}

function toDataUrl(sec: Section, n: number) {
  const c = document.createElement('canvas')
  c.width = c.height = n
  c.getContext('2d')!.putImageData(new ImageData(sec.rgba as unknown as Uint8ClampedArray<ArrayBuffer>, n, n), 0, 0)
  return c.toDataURL()
}

interface Target { text: string; h: number; tilt: number; match: (s: Section) => boolean }
const TARGETS: Target[] = [
  { text: 'A wide slice through the middle, with the nucleolus in it', h: 0.9, tilt: 0, match: (s) => s.area > 0.8 && s.nucleolus },
  { text: 'A wide slice that misses the nucleolus', h: -1.3, tilt: 0, match: (s) => s.area > 0.7 && !s.nucleolus },
  { text: 'A small slice that only just clips the top or the bottom', h: 3.2, tilt: 0, match: (s) => s.area > 0.02 && s.area < 0.3 },
]

export const SLICE_Q: ChoiceQ = {
  q: 'Infer: why are the cross sections of a nucleus not all identical?',
  options: [
    'Every nucleus has a different shape inside',
    'The nucleus is a 3D shape, so a thin slice shows a different 2D cut depending on where and at what angle it passes through',
    'The electron beam changes the nucleus',
    'Some cells have no nucleus',
  ],
  correct: 1,
  explain: 'Right. A slice near the middle is wide and may include the nucleolus; a slice near the top is small and may miss it completely. The same is true of every organelle in a TEM image.',
}

const N = 200

function CutFace({ h, tilt, section }: { h: number; tilt: number; section: Section }) {
  const canvas = useMemo(() => { const c = document.createElement('canvas'); c.width = c.height = N; return c }, [])
  const texture = useMemo(() => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; return t }, [canvas])
  useEffect(() => {
    canvas.getContext('2d')!.putImageData(new ImageData(section.rgba as unknown as Uint8ClampedArray<ArrayBuffer>, N, N), 0, 0)
    texture.needsUpdate = true
  }, [section, canvas, texture])
  const { U, V, P0 } = planeAxes(h, tilt)
  const m = new THREE.Matrix4().makeBasis(U, V, new THREE.Vector3().crossVectors(U, V))
  const q = new THREE.Quaternion().setFromRotationMatrix(m)
  return (
    <group position={P0} quaternion={q}>
      <mesh renderOrder={2}>
        <planeGeometry args={[2 * SPAN, 2 * SPAN]} />
        <meshBasicMaterial map={texture} transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* the knife blade: a faint glass sheet with a bright edge */}
      <mesh renderOrder={1}>
        <planeGeometry args={[2 * SPAN + 1, 2 * SPAN + 1]} />
        <meshBasicMaterial color="#8fb8ff" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(2 * SPAN + 1, 2 * SPAN + 1)]} />
        <lineBasicMaterial color="#5b8def" />
      </lineSegments>
    </group>
  )
}

function Model({ h, tilt, section }: { h: number; tilt: number; section: Section }) {
  const { N: nrm, P0 } = planeAxes(h, tilt)
  // Keep what lies below the knife (three.js discards the side the plane normal points away from).
  const clip = useMemo(() => [new THREE.Plane()], [])
  clip[0].set(nrm.clone().negate(), nrm.dot(P0))
  const ghostClip = useMemo(() => [new THREE.Plane()], [])
  ghostClip[0].set(nrm.clone(), -nrm.dot(P0))
  const pores = useRef<THREE.InstancedMesh>(null)
  useEffect(() => {
    const o = new THREE.Object3D()
    PORES.forEach((p, i) => {
      o.position.set(...p)
      o.lookAt(p[0] * 2 / (A * A), p[1] * 2 / (C * C), p[2] * 2 / (B * B))
      o.updateMatrix()
      pores.current!.setMatrixAt(i, o.matrix)
    })
    pores.current!.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <group>
      {/* the part that was cut away, as a faint ghost */}
      <mesh scale={[A, C, B]}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshBasicMaterial color="#8b7fe0" wireframe transparent opacity={0.07} clippingPlanes={ghostClip} />
      </mesh>
      <mesh scale={[A, C, B]}>
        <sphereGeometry args={[1, 64, 48]} />
        <meshStandardMaterial color="#8a78e8" roughness={0.45} transparent opacity={0.55} side={THREE.DoubleSide} clippingPlanes={clip} depthWrite={false} />
      </mesh>
      <instancedMesh ref={pores} args={[undefined, undefined, PORES.length]}>
        <torusGeometry args={[0.11, 0.04, 6, 12]} />
        <meshStandardMaterial color="#4a3aa8" clippingPlanes={clip} />
      </instancedMesh>
      <mesh position={[NUCLEOLUS.x, NUCLEOLUS.y, NUCLEOLUS.z]}>
        <sphereGeometry args={[NUCLEOLUS.r, 32, 24]} />
        <meshStandardMaterial color="#3d2a7a" roughness={0.7} clippingPlanes={clip} />
      </mesh>
      <CutFace h={h} tilt={tilt} section={section} />
    </group>
  )
}

export function SliceBench({ onDone }: { onDone: (firstTry: boolean) => void }) {
  const [h, setH] = useState(H_MAX)
  const [tilt, setTilt] = useState(0)
  const [solved, setSolved] = useState(0)
  const [answer, setAnswer] = useState<boolean | null>(null)
  const section = useMemo(() => renderSection(h, tilt, N, false), [h, tilt])
  const view = useMemo(() => toDataUrl(renderSection(h, tilt, N, true), N), [h, tilt])
  const thumbs = useMemo(() => TARGETS.map((t) => toDataUrl(renderSection(t.h, t.tilt, 120, true), 120)), [])
  const sec = section
  const current = TARGETS[solved]
  // The slice has to stay matching for a moment, so sweeping the knife past does not count.
  useEffect(() => {
    if (!current || !current.match(sec)) return
    const id = window.setTimeout(() => { setSolved(solved + 1); play('ok') }, 700)
    return () => clearTimeout(id)
  }, [sec, current, solved])
  const allDone = solved >= TARGETS.length

  return (
    <div className="grid gap-4 p-4 lg:h-full lg:grid-cols-[minmax(300px,380px)_1fr]">
      <div className="grid content-start gap-3">
        <div className="card">
          <span className="eyebrow">Figure 22: Infer</span>
          <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">Slice a nucleus</h2>
          <p className="leading-relaxed">The TEM only ever shows one thin slice of each cell. This is a model of a whole nucleus. Move the knife and watch the cut face: it is what the slice would look like in the TEM.</p>
        </div>
        <div className="card grid gap-3">
          <Slider label="Knife height" value={(h + H_MAX) / (2 * H_MAX)} onChange={(v) => setH(-H_MAX + v * 2 * H_MAX)} colour="var(--color-primary)" attention={!allDone && solved === 0 && h === H_MAX} disabled={allDone} />
          <Slider label="Knife angle" value={tilt / TILT_MAX} onChange={(v) => setTilt(v * TILT_MAX)} colour="var(--color-accent)" disabled={allDone} />
          <div className="flex flex-wrap gap-1.5 text-sm font-extrabold">
            <span className="rounded-full bg-[var(--color-sunk)] px-2.5 py-1">Slice size: {Math.round(Math.min(1, sec.area) * 100)}% of the widest</span>
            <span className="rounded-full bg-[var(--color-sunk)] px-2.5 py-1">Nucleolus: {sec.nucleolus ? 'in the slice' : 'not in the slice'}</span>
          </div>
        </div>
        <div className="card">
          <h3 className="mb-2 font-display text-lg font-bold">Make these three TEM slices</h3>
          <ol className="grid gap-2">
            {TARGETS.map((t, i) => (
              <li key={t.text} className={`flex items-center gap-3 rounded-xl p-2 ${i < solved ? 'bg-[var(--color-ok-soft)]' : i === solved ? 'attention bg-[var(--color-accent-soft)]' : 'opacity-60'}`}>
                <img src={thumbs[i]} alt="" width={64} height={64} className="flex-none rounded-lg" />
                <span className="flex items-start gap-1.5 font-bold leading-snug">
                  {i < solved ? <CheckCircle2 size={18} className="mt-0.5 flex-none text-[var(--color-ok)]" /> : <Circle size={18} className="mt-0.5 flex-none text-[var(--color-faint)]" />}
                  {t.text}
                </span>
              </li>
            ))}
          </ol>
        </div>
        {allDone && (
          <div className="card">
            <Choice item={SLICE_Q} untilCorrect onDone={(first) => setAnswer(first)} />
            {answer !== null && <div className="mt-3 flex justify-end"><Button onClick={() => onDone(answer)}>Next: the role of the nucleus</Button></div>}
          </div>
        )}
      </div>
      <div className="grid min-h-0 gap-3 md:grid-cols-[1fr_minmax(220px,300px)] lg:min-h-[520px]">
        <div className="relative min-h-[380px] overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-b from-[#f4f6fb] to-[#e2e8f3]">
          <Canvas camera={{ position: [15, 12, 18], fov: 36 }} dpr={[1, 2]} onCreated={({ gl }) => { gl.localClippingEnabled = true }} style={{ touchAction: 'none' }}>
            <ambientLight intensity={0.8} />
            <directionalLight position={[6, 12, 8]} intensity={1.6} />
            <directionalLight position={[-8, 4, -6]} intensity={0.5} />
            <Model h={h} tilt={tilt} section={section} />
            <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={0.2} maxPolarAngle={1.5} />
          </Canvas>
          <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-sm font-extrabold text-[var(--color-muted)]">Drag to turn the model</span>
        </div>
        <div className="card content-start">
          <h3 className="mb-2 font-display text-lg font-bold">The slice in the TEM</h3>
          <img src={view} alt="The current slice as it would look in the electron microscope" className="w-full rounded-xl bg-black" />
          <p className="mt-2 text-sm font-bold leading-snug text-[var(--color-muted)]">Dark: dense chromatin and the nucleolus. The dark rim is the nuclear envelope; the gaps in it are nuclear pores.</p>
        </div>
      </div>
    </div>
  )
}
