import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer, OrbitControls, RoundedBox } from '@react-three/drei'
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { OBJECTIVES, STAGE_MAX, type Objective, type ScopeState } from './model'

export type PartId =
  | 'eyepiece' | 'head' | 'arm' | 'nosepiece' | 'objectives' | 'stage' | 'clips' | 'stageKnobs'
  | 'condenser' | 'iris' | 'lamp' | 'coarse' | 'fine' | 'base' | 'brightness' | 'power'

export const PART_INFO: Record<PartId, { name: string; job: string }> = {
  eyepiece: { name: 'Eyepiece', job: 'The lens you look through. It magnifies 10 times.' },
  head: { name: 'Head', job: 'Holds the eyepieces and carries the image up from the objective.' },
  arm: { name: 'Arm', job: 'Joins the head to the base. Carry the microscope by the arm and the base.' },
  nosepiece: { name: 'Revolving nosepiece', job: 'Turns to swing a different objective over the slide. It clicks into place.' },
  objectives: { name: 'Objective lenses', job: 'The lenses closest to the slide: 4x (red), 10x (yellow), 40x (blue) and 100x (white), which only works with a drop of immersion oil.' },
  stage: { name: 'Stage', job: 'The flat platform the slide sits on. Light comes up through the hole in the middle.' },
  clips: { name: 'Stage clips', job: 'Hold the slide still on the stage.' },
  stageKnobs: { name: 'Stage controls', job: 'Move the slide left, right, forward and back without touching it.' },
  condenser: { name: 'Condenser', job: 'Gathers the lamp light and focuses it on the specimen.' },
  iris: { name: 'Iris diaphragm', job: 'Opens and closes to control how much light reaches the slide. Closing it adds contrast.' },
  lamp: { name: 'Lamp', job: 'The light source. Light passes up through the specimen into the lenses.' },
  coarse: { name: 'Coarse focus knob', job: 'Moves the stage up and down a lot. Use it only with the 4x objective.' },
  fine: { name: 'Fine focus knob', job: 'Moves the stage a tiny amount to sharpen the image. Safe at every objective.' },
  base: { name: 'Base', job: 'The heavy bottom that keeps the microscope steady.' },
  brightness: { name: 'Brightness dial', job: 'Turns the lamp brighter or dimmer.' },
  power: { name: 'Power switch', job: 'Turns the lamp on and off.' },
}

export interface ScopeHandlers {
  coarse(dz: number): void
  fine(dz: number): void
  objective(o: Objective): void
  lamp(): void
  brightness(v: number): void
  iris(v: number): void
  stage(dx: number, dy: number): void
  stageTap(): void
  clip(): void
  oil(): void
  phase(): void
  cleanLens(): void
}

interface Ctx {
  state: ScopeState
  on: ScopeHandlers
  highlight: Set<PartId>
  labels: boolean
  onPart?: (p: PartId) => void
  setOrbit(enabled: boolean): void
  // DOM label elements drawn over the canvas, positioned each frame from the 3D anchors.
  labelEls: React.RefObject<Partial<Record<PartId, HTMLDivElement | null>>>
}
const SceneCtx = createContext<Ctx>(null!)

const WHITE = '#f3f5f8'
const PALE = '#dfe5ec'
const METAL = '#c9d1da'
const DARK = '#2b3340'
const ACCENT = new THREE.Color('#f2a516')

// Stage height in the scene for a given focus position.
const stageY = (z: number) => 10.2 + (z / STAGE_MAX) * 2.6

function useDrag(onDelta: (dx: number, dy: number) => void, onTap?: () => void) {
  const { setOrbit } = useContext(SceneCtx)
  const last = useRef<{ x: number; y: number; moved: number } | null>(null)
  return {
    onPointerDown(e: ThreeEvent<PointerEvent>) {
      e.stopPropagation()
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      last.current = { x: e.clientX, y: e.clientY, moved: 0 }
      setOrbit(false)
    },
    onPointerMove(e: ThreeEvent<PointerEvent>) {
      const l = last.current
      if (!l) return
      e.stopPropagation()
      const dx = e.clientX - l.x, dy = e.clientY - l.y
      l.x = e.clientX; l.y = e.clientY; l.moved += Math.abs(dx) + Math.abs(dy)
      if (dx || dy) onDelta(dx, dy)
    },
    onPointerUp(e: ThreeEvent<PointerEvent>) {
      e.stopPropagation()
      ;(e.target as Element).releasePointerCapture?.(e.pointerId)
      if (last.current && last.current.moved < 6) onTap?.()
      last.current = null
      setOrbit(true)
    },
  }
}

// Wraps a part: tap to learn its name, glow when the guide points at it, show a label.
const tmp = new THREE.Vector3()

function Part({ id, children, anchor, onTap }: { id: PartId; children: ReactNode; anchor: [number, number, number]; onTap?: () => void }) {
  const { highlight, onPart, labelEls } = useContext(SceneCtx)
  const group = useRef<THREE.Group>(null)
  const lit = highlight.has(id)
  useFrame(({ clock, camera, size }) => {
    const g = group.current
    if (!g) return
    const el = labelEls.current?.[id]
    if (el) {
      tmp.set(...anchor).applyMatrix4(g.matrixWorld).project(camera)
      el.style.transform = `translate(-50%, -50%) translate(${((tmp.x + 1) / 2) * size.width}px, ${((1 - tmp.y) / 2) * size.height}px)`
    }
    const k = lit ? 0.35 + 0.3 * Math.sin(clock.elapsedTime * 5) : 0
    g.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
      if (m && 'emissive' in m && !m.userData.glow) {
        m.emissive.copy(ACCENT)
        m.emissiveIntensity = k
      }
    })
  })
  return (
    <group
      ref={group}
      onClick={(e) => { e.stopPropagation(); onPart?.(id); onTap?.() }}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
      onPointerOut={() => { document.body.style.cursor = '' }}
    >
      {children}
    </group>
  )
}

function Mat({ color, metal = 0.1, rough = 0.45, ...rest }: { color: string; metal?: number; rough?: number } & Partial<THREE.MeshStandardMaterialParameters>) {
  return <meshStandardMaterial color={color} metalness={metal} roughness={rough} {...rest} />
}

function Knob({ r, h, color, ridges = 24 }: { r: number; h: number; color: string; ridges?: number }) {
  // A knurled knob: a cylinder with a ring of grip ridges.
  const ridgeList = useMemo(() => Array.from({ length: ridges }, (_, i) => (i / ridges) * Math.PI * 2), [ridges])
  return (
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh castShadow>
        <cylinderGeometry args={[r, r, h, 40]} />
        <Mat color={color} rough={0.6} />
      </mesh>
      {ridgeList.map((a) => (
        <mesh key={a} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation={[0, -a, 0]}>
          <boxGeometry args={[0.12, h * 0.92, 0.18]} />
          <Mat color={color} rough={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function Objectives() {
  const { state, on } = useContext(SceneCtx)
  const turret = useRef<THREE.Group>(null)
  const target = OBJECTIVES.indexOf(state.objective) * ((Math.PI * 2) / OBJECTIVES.length)
  useFrame((_, dt) => {
    const t = turret.current
    if (!t) return
    t.rotation.y += (-target - t.rotation.y) * Math.min(1, dt * 10)
  })
  const len: Record<Objective, number> = { 4: 2.2, 10: 3.0, 40: 3.9, 100: 4.2 }
  const ring: Record<Objective, string> = { 4: '#e0474c', 10: '#e8b10c', 40: '#3a9fe0', 100: '#f4f6f8' }
  return (
    <group position={[0, 17.2, -1.7]}>
      <Part id="nosepiece" anchor={[-3.4, 0.4, 0]} onTap={() => on.objective(OBJECTIVES[(OBJECTIVES.indexOf(state.objective) + 1) % OBJECTIVES.length])}>
        <mesh castShadow>
          <cylinderGeometry args={[2.7, 2.9, 1.2, 48]} />
          <Mat color={METAL} metal={0.7} rough={0.3} />
        </mesh>
      </Part>
      <group ref={turret}>
        <Part id="objectives" anchor={[2.6, -2.6, 1.7]}>
          {OBJECTIVES.map((o, i) => {
            const a = i * ((Math.PI * 2) / OBJECTIVES.length)
            const x = Math.sin(a) * 1.7, z = Math.cos(a) * 1.7
            return (
              <group key={o} position={[x, -0.6 - len[o] / 2, z]} onClick={() => on.objective(o)}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.62, 0.5, len[o], 32]} />
                  <Mat color={METAL} metal={0.75} rough={0.28} />
                </mesh>
                <mesh position={[0, -len[o] / 2 + 0.55, 0]}>
                  <cylinderGeometry args={[0.64, 0.64, 0.3, 32]} />
                  <Mat color={ring[o]} rough={0.4} />
                </mesh>
                <mesh position={[0, -len[o] / 2 - 0.02, 0]}>
                  <cylinderGeometry args={[0.28, 0.28, 0.05, 24]} />
                  <Mat color="#1b2836" metal={0.2} rough={0.1} />
                </mesh>
              </group>
            )
          })}
        </Part>
      </group>
    </group>
  )
}

function Stage() {
  const { state, on } = useContext(SceneCtx)
  const g = useRef<THREE.Group>(null)
  const slide = useRef<THREE.Group>(null)
  const clipL = useRef<THREE.Group>(null)
  const clipR = useRef<THREE.Group>(null)
  const lever = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const k = Math.min(1, dt * 14)
    if (g.current) g.current.position.y += (stageY(state.stageZ) - g.current.position.y) * k
    if (slide.current) {
      slide.current.position.x += (state.stageX / 10 - slide.current.position.x) * k
      slide.current.position.z += (-state.stageY / 10 - slide.current.position.z) * k
    }
    const clipA = state.slide === 'clipped' ? 0 : 0.5
    for (const c of [clipL.current, clipR.current]) if (c) c.rotation.x += (-clipA - c.rotation.x) * k
    if (lever.current) lever.current.rotation.y = -0.9 + state.iris * 1.8
  })
  const stageDrag = useDrag(
    (dx, dy) => on.stage(dx * 0.03, -dy * 0.03),
    () => (state.slide === 'none' ? on.stageTap() : state.slide === 'loose' ? on.clip() : undefined),
  )
  const knobDrag = useDrag((dx, dy) => on.stage(dx * 0.03, -dy * 0.03))
  const irisDrag = useDrag((dx) => on.iris(state.iris + dx * 0.006))
  return (
    <group ref={g} position={[0, stageY(state.stageZ), 0]}>
      <Part id="stage" anchor={[-6.5, 0.6, 3]}>
        <group {...stageDrag}>
          <RoundedBox args={[12, 0.7, 11]} radius={0.25} castShadow receiveShadow>
            <Mat color={DARK} rough={0.55} />
          </RoundedBox>
          <mesh position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.7, 32]} />
            <meshStandardMaterial color={state.lampOn ? '#fff7dc' : '#0d1218'} emissive={state.lampOn ? '#fff1c0' : '#000'} emissiveIntensity={state.lampOn ? 0.6 + state.brightness : 0} userData={{ glow: true }} />
          </mesh>
        </group>
      </Part>
      {/* Bracket joining the stage to the arm. */}
      <mesh position={[0, -0.6, -6.2]} castShadow>
        <boxGeometry args={[4, 1.6, 2.4]} />
        <Mat color={WHITE} />
      </mesh>
      <Part id="clips" anchor={[4.4, 1.2, -1.6]}>
        {[-3.2, 3.2].map((x, i) => (
          <group key={x} ref={i ? clipR : clipL} position={[x, 0.42, -2.6]} onClick={() => on.clip()}>
            <mesh position={[0, 0.05, 1.3]}>
              <boxGeometry args={[0.9, 0.08, 2.8]} />
              <Mat color={METAL} metal={0.8} rough={0.25} />
            </mesh>
            <mesh>
              <cylinderGeometry args={[0.3, 0.3, 0.4, 16]} />
              <Mat color={METAL} metal={0.8} rough={0.3} />
            </mesh>
          </group>
        ))}
      </Part>
      {state.slide !== 'none' && (
        <group ref={slide} position={[state.stageX / 10, 0.42, -state.stageY / 10]} {...stageDrag}>
          <mesh>
            <boxGeometry args={[7.5, 0.1, 2.5]} />
            <meshPhysicalMaterial color="#e8f6ff" transmission={0.85} transparent opacity={0.55} roughness={0.05} thickness={0.1} />
          </mesh>
          <mesh position={[-2.9, 0.06, 0]}>
            <boxGeometry args={[1.6, 0.02, 2.3]} />
            <Mat color="#ffffff" rough={0.9} />
          </mesh>
          <mesh position={[0, 0.07, 0]}>
            <boxGeometry args={[2.2, 0.02, 2.2]} />
            <meshPhysicalMaterial color="#f4fbff" transmission={0.9} transparent opacity={0.35} roughness={0.05} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.34, 0.01, 0.34]} />
            <Mat color={state.mount?.specimen === 'onion' ? '#e9c873' : state.mount?.specimen === 'cheek' ? '#9cc3e6' : state.mount?.specimen === 'yogurt' ? '#b9a0d6' : '#ece6d8'} rough={0.95} />
          </mesh>
          {state.oil && (
            <mesh position={[0, 0.12, 0]} scale={[1, 0.25, 1]}>
              <sphereGeometry args={[0.28, 24, 12]} />
              <meshPhysicalMaterial color="#fff6d0" transmission={0.6} transparent opacity={0.8} roughness={0.02} />
            </mesh>
          )}
          {state.broken && [0.3, 1.2, 2.0, 2.9, 3.9, 5.1].map((a, i) => (
            <mesh key={a} position={[Math.cos(a) * (0.5 + (i % 2) * 0.2), 0.09, Math.sin(a) * (0.5 + (i % 2) * 0.2)]} rotation={[0, -a, 0]}>
              <boxGeometry args={[1.0 + (i % 3) * 0.3, 0.012, 0.025]} />
              <meshBasicMaterial color="#3b4655" />
            </mesh>
          ))}
        </group>
      )}
      <Part id="stageKnobs" anchor={[7.6, -2.6, 3.6]}>
        <group position={[5.6, -1.6, 3.4]} {...knobDrag}>
          <mesh castShadow>
            <cylinderGeometry args={[0.55, 0.55, 0.7, 24]} />
            <Mat color={PALE} rough={0.6} />
          </mesh>
          <mesh position={[0, -0.85, 0]} castShadow>
            <cylinderGeometry args={[0.7, 0.7, 0.7, 24]} />
            <Mat color={PALE} rough={0.6} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.12, 0.12, 1.2, 12]} />
            <Mat color={METAL} metal={0.7} />
          </mesh>
        </group>
      </Part>
      <Part id="condenser" anchor={[-2.6, -2.2, 0]}>
        <mesh position={[0, -1.5, 0]} castShadow>
          <cylinderGeometry args={[1.2, 1.0, 2.2, 32]} />
          <Mat color={DARK} metal={0.4} rough={0.4} />
        </mesh>
      </Part>
      <Part id="iris" anchor={[0, -2.2, 3.3]}>
        <group position={[0, -1.1, 0]} ref={lever}>
          <mesh position={[0, 0, 1.7]} {...irisDrag}>
            <boxGeometry args={[0.4, 0.3, 2.4]} />
            <Mat color="#f2a516" rough={0.5} />
          </mesh>
          <mesh position={[0, 0, 2.9]} {...irisDrag}>
            <sphereGeometry args={[0.35, 16, 12]} />
            <Mat color="#f2a516" rough={0.5} />
          </mesh>
        </group>
      </Part>
    </group>
  )
}

function Body() {
  const { state, on } = useContext(SceneCtx)
  const coarseRef = useRef<THREE.Group>(null)
  const fineRef = useRef<THREE.Group>(null)
  const dialRef = useRef<THREE.Group>(null)
  useFrame(() => {
    // Knobs turn with the stage: about 2 mm per turn for coarse, 0.1 mm per turn for fine.
    if (coarseRef.current) coarseRef.current.rotation.x = (state.stageZ / 2000) * Math.PI * 2
    if (fineRef.current) fineRef.current.rotation.x = (state.stageZ / 100) * Math.PI * 2
    if (dialRef.current) dialRef.current.rotation.x = -state.brightness * Math.PI * 1.5
  })
  const coarseDrag = useDrag((_, dy) => on.coarse(-dy * 14))
  const fineDrag = useDrag((_, dy) => on.fine(-dy * 0.3))
  const dialDrag = useDrag((_, dy) => on.brightness(state.brightness - dy * 0.006))
  const beam = state.lampOn ? Math.pow(state.brightness, 1.2) * (0.3 + 0.7 * state.iris) : 0
  return (
    <group>
      <Part id="base" anchor={[-7.2, 1.6, 8]}>
        <RoundedBox args={[15, 2.6, 21]} radius={0.9} position={[0, 1.3, -0.5]} castShadow receiveShadow>
          <Mat color={WHITE} />
        </RoundedBox>
      </Part>
      <Part id="lamp" anchor={[2.4, 3.2, 1.6]}>
        <mesh position={[0, 2.75, 0]}>
          <cylinderGeometry args={[1.3, 1.4, 0.35, 40]} />
          <meshStandardMaterial color={state.lampOn ? '#fff8e0' : '#3a4350'} emissive={state.lampOn ? '#fff0c4' : '#000000'} emissiveIntensity={state.lampOn ? 0.4 + state.brightness * 1.6 : 0} userData={{ glow: true }} />
        </mesh>
      </Part>
      {beam > 0 && (
        <mesh position={[0, 6.6, 0]}>
          <cylinderGeometry args={[0.45, 0.9, 7.4, 32, 1, true]} />
          <meshBasicMaterial color="#fff3c8" transparent opacity={0.12 + beam * 0.25} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      )}
      <Part id="power" anchor={[5.2, 0.4, 10.6]}>
        <group position={[5.2, 1.3, 9.95]} onClick={() => on.lamp()}>
          <RoundedBox args={[1.6, 1.0, 0.3]} radius={0.12}>
            <Mat color={DARK} />
          </RoundedBox>
          <mesh position={[state.lampOn ? 0.32 : -0.32, 0, 0.2]}>
            <boxGeometry args={[0.7, 0.6, 0.2]} />
            <Mat color={state.lampOn ? '#1f9d55' : '#e0e6ee'} />
          </mesh>
        </group>
      </Part>
      <Part id="brightness" anchor={[8.6, 2.6, 6]}>
        <group ref={dialRef} position={[7.75, 1.4, 5.5]} {...dialDrag}>
          <Knob r={1.0} h={0.8} color="#f2a516" ridges={18} />
          <mesh position={[0.42, 0.75, 0]}>
            <boxGeometry args={[0.1, 0.5, 0.18]} />
            <Mat color="#ffffff" />
          </mesh>
        </group>
      </Part>
      <Part id="arm" anchor={[0, 13, -10.5]}>
        <RoundedBox args={[4.2, 16, 4.6]} radius={0.8} position={[0, 10, -7.6]} castShadow>
          <Mat color={WHITE} />
        </RoundedBox>
        <RoundedBox args={[4.4, 3.6, 8.6]} radius={0.9} position={[0, 17.6, -4.6]} castShadow>
          <Mat color={WHITE} />
        </RoundedBox>
      </Part>
      <Part id="coarse" anchor={[5.6, 8.2, -5]}>
        <group ref={coarseRef} position={[2.75, 8, -7.4]} {...coarseDrag}>
          <Knob r={2.0} h={1.1} color="#13856b" />
        </group>
        <group position={[-2.75, 8, -7.4]} rotation={[0, Math.PI, 0]}>
          <Knob r={2.0} h={1.1} color="#13856b" />
        </group>
      </Part>
      <Part id="fine" anchor={[6.4, 6.2, -7.4]}>
        <group ref={fineRef} position={[3.75, 8, -7.4]} {...fineDrag}>
          <Knob r={1.15} h={0.9} color="#5cc1a6" ridges={18} />
        </group>
      </Part>
      <Part id="head" anchor={[-3.4, 21, -2.4]}>
        <RoundedBox args={[4.6, 3.2, 6.4]} radius={0.9} position={[0, 20.6, -2.6]} castShadow>
          <Mat color={WHITE} />
        </RoundedBox>
      </Part>
      <Part id="eyepiece" anchor={[0, 25.6, 3.4]}>
        {[-1.3, 1.3].map((x) => (
          <group key={x} position={[x, 22.6, -0.6]} rotation={[0.75, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.75, 0.75, 3.6, 32]} />
              <Mat color={PALE} metal={0.3} rough={0.4} />
            </mesh>
            <mesh position={[0, 2.1, 0]}>
              <cylinderGeometry args={[0.9, 0.85, 0.9, 32]} />
              <Mat color={DARK} rough={0.85} />
            </mesh>
          </group>
        ))}
      </Part>
    </group>
  )
}

// Keep the whole microscope in frame whatever the shape of its panel.
function FitCamera() {
  const { camera, size } = useThree()
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height)
    const dist = Math.max(64, 44 / aspect)
    const dir = new THREE.Vector3(38, 16, 46).normalize()
    camera.position.copy(dir.multiplyScalar(dist)).add(new THREE.Vector3(0, 1.5, 0))
    camera.lookAt(0, 1.5, 0)
  }, [camera, size.width, size.height])
  return null
}

export interface Microscope3DProps {
  state: ScopeState
  on: ScopeHandlers
  highlight?: PartId[]
  labels?: boolean
  onPart?: (p: PartId) => void
}

export function Microscope3D({ state, on, highlight = [], labels = false, onPart }: Microscope3DProps) {
  const orbit = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const hl = useMemo(() => new Set(highlight), [highlight.join()])
  const labelEls = useRef<Partial<Record<PartId, HTMLDivElement | null>>>({})
  const ctx: Ctx = {
    state, on, highlight: hl, labels, onPart, labelEls,
    setOrbit: (v) => { if (orbit.current) orbit.current.enabled = v },
  }
  return (
    <div className="relative h-full w-full">
    <Canvas shadows dpr={[1, 2]} camera={{ position: [38, 18, 46], fov: 34 }} style={{ touchAction: 'none' }}>
      <SceneCtx.Provider value={ctx}>
        <FitCamera />
        <ambientLight intensity={0.35} />
        <directionalLight position={[12, 30, 18]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} />
        <Environment resolution={128}>
          <Lightformer intensity={2} position={[0, 10, 10]} scale={[20, 10, 1]} />
          <Lightformer intensity={1} position={[-12, 6, 0]} rotation-y={Math.PI / 2} scale={[20, 6, 1]} />
          <Lightformer intensity={0.8} position={[12, 4, -6]} rotation-y={-Math.PI / 2} scale={[16, 6, 1]} color="#dbeafe" />
        </Environment>
        <group position={[0, -12, 0]}>
          <Body />
          <Stage />
          <Objectives />
          <ContactShadows position={[0, 0.01, 0]} opacity={0.35} scale={40} blur={2.4} far={14} />
        </group>
        <OrbitControls ref={orbit} target={[0, 1.5, 0]} enablePan={false} enableZoom={false} minPolarAngle={0.6} maxPolarAngle={1.45} minAzimuthAngle={-0.4} maxAzimuthAngle={1.5} />
      </SceneCtx.Provider>
    </Canvas>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {(Object.keys(PART_INFO) as PartId[]).map((id) => (
          <div
            key={id}
            ref={(el) => { labelEls.current[id] = el }}
            className={`part-label absolute left-0 top-0 ${hl.has(id) ? 'part-label-lit' : ''}`}
            style={{ display: labels || hl.has(id) ? 'block' : 'none' }}
          >
            {PART_INFO[id].name}
          </div>
        ))}
      </div>
    </div>
  )
}
