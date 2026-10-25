// Photo-sprite scenes: generated photos (public/art/<scene>/<name>.webp) placed and swapped in code.
// Anything that moves continuously (liquids, films, coverslips, bubbles) is drawn in code on top.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { Bubble } from '../scope/model'

export const art = (path: string) => `${import.meta.env.BASE_URL}art/${path}.webp`

// A sprite placed by its centre, in scene units; rotation in degrees around its centre.
export function Sprite({ src, x, y, w, h, rot = 0, shadow = true, opacity }: { src: string; x: number; y: number; w: number; h: number; rot?: number; shadow?: boolean; opacity?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} filter={shadow ? 'url(#photoSh)' : undefined} opacity={opacity}>
      <image href={art(src)} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
    </g>
  )
}

// The glass slide photo, slightly see-through so the bench shows under the clear glass.
// Children are drawn at the specimen area, (0, 0) in local units.
export function PhotoSlide({ x, y, label, children, bubbles = [], cover }: { x: number; y: number; label: string; children?: ReactNode; bubbles?: Bubble[]; cover?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <image href={art('shared/slide')} x="-165" y="-58" width="330" height="116" opacity="0.88" filter="url(#sh)" />
      <g transform="translate(36 0)">
        {children}
        {bubbles.map((b, i) => <circle key={i} cx={b.x * 13} cy={-b.y * 11} r={2 + b.r * 6} fill="rgba(255,255,255,0.6)" stroke="#5a6779" strokeWidth="1.3" />)}
        {cover && <rect x="-44" y="-44" width="88" height="88" rx="2" fill="rgba(225,240,250,0.28)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />}
      </g>
      <text x="-117" y="5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#5a6779">{label}</text>
    </g>
  )
}

export function BlotSprite({ x, y, stain }: { x: number; y: number; stain?: string }) {
  return (
    <g filter="url(#photoSh)" transform={`translate(${x} ${y}) rotate(6)`}>
      <image href={art('shared/blot')} x="-40" y="-41" width="80" height="83" />
      {stain && <ellipse cx="-26" cy="0" rx="13" ry="19" fill={stain} />}
    </g>
  )
}

// A short label on a rounded white background, centred on (x, y), for text drawn over pictures.
// The width is estimated from the text length (about 0.5 em per character in this font).
export function PillLabel({ x = 0, y, size = 13, children }: { x?: number; y: number; size?: number; children: string }) {
  const w = children.length * size * 0.5 + size * 1.5
  const h = size * 1.75
  return (
    <g transform={`translate(${x} ${y})`} pointerEvents="none">
      <rect x={-w / 2} y={-h * 0.66} width={w} height={h} rx={h / 2} fill="rgba(255,255,255,0.92)" />
      <text textAnchor="middle" fontSize={size} fontWeight="900" fill="#5a6779">{children}</text>
    </g>
  )
}

// A round close-up lens over the bench. Children are drawn in the lens, centred on (0, 0), radius 118.
export function Inset({ x, y, caption, children, bg = '#e9edf1' }: { x: number; y: number; caption?: string; children: ReactNode; bg?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="120" fill="#fff" stroke="#d6dee8" strokeWidth="3" filter="url(#sh)" />
      <g clipPath="url(#insetClip)">
        <rect x="-130" y="-130" width="260" height="260" fill={bg} />
        {children}
      </g>
      {caption && <PillLabel y={98} size={12.5}>{caption}</PillLabel>}
      <PillLabel y={-98} size={13}>close-up</PillLabel>
    </g>
  )
}

// A falling drop from a dropper tip at (x, y0) to the slide at y1.
export function Drip({ x, y0, y1, t, colour }: { x: number; y0: number; y1: number; t: number; colour: string }) {
  if (t <= 0 || t >= 1) return null
  return <ellipse cx={x} cy={y0 + (y1 - y0) * t} rx="5" ry="7" fill={colour} />
}

export function ArtStage({ label, children, defs }: { label: string; children: ReactNode; defs?: ReactNode }) {
  return (
    // The wrapper is the positioning box for HTML laid over the scene (see VideoInset).
    <div className="relative h-full w-full min-h-0">
    <svg viewBox="0 0 820 480" className="h-full w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id="glass" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f3fbff" stopOpacity="0.85" /><stop offset="1" stopColor="#d6ecf7" stopOpacity="0.85" /></linearGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="2" dy="5" stdDeviation="5" floodOpacity="0.18" /></filter>
        <filter id="photoSh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="4" dy="7" stdDeviation="6" floodColor="#1d2733" floodOpacity="0.28" /></filter>
        <clipPath id="insetClip"><circle cx="0" cy="0" r="118" /></clipPath>
        {defs}
      </defs>
      <image href={art('shared/bench')} x="0" y="0" width="820" height="480" preserveAspectRatio="xMidYMid slice" />
      {children}
    </svg>
    </div>
  )
}

// A generated video in a close-up lens, scrubbed by the step's progress (0..1) between two times in seconds.
// The video is an ordinary HTML element laid exactly over the lens, not inside the SVG: Safari draws video
// inside an SVG foreignObject in the wrong place and at the wrong size.
export function VideoInset({ name, p, from, to, caption, x = 560, y = 170 }: { name: string; p: number; from: number; to: number; caption?: string; x?: number; y?: number }) {
  const ref = useRef<HTMLVideoElement>(null)
  const holder = useRef<SVGCircleElement>(null)
  const [box, setBox] = useState<{ host: HTMLElement; left: number; top: number; size: number } | null>(null)
  useLayoutEffect(() => {
    const c = holder.current
    const svg = c?.ownerSVGElement
    const host = svg?.parentElement
    if (!c || !svg || !host) return
    const place = () => {
      const r = c.getBoundingClientRect(), h = host.getBoundingClientRect()
      setBox({ host, left: r.left - h.left, top: r.top - h.top, size: r.width })
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(svg)
    window.addEventListener('resize', place)
    return () => { ro.disconnect(); window.removeEventListener('resize', place) }
  }, [x, y])
  useEffect(() => {
    const v = ref.current
    if (!v) return
    const seek = () => { v.currentTime = from + p * (to - from) }
    if (v.readyState >= 1) seek(); else v.addEventListener('loadedmetadata', seek, { once: true })
  }, [p, from, to, box])
  const label = 'pointer-events-none absolute -left-8 -right-8 text-center'
  const pill = 'inline-block rounded-full bg-white/90 px-[0.8em] py-[0.2em] font-black leading-tight text-[#5a6779]'
  return (
    <>
      <Inset x={x} y={y}><circle ref={holder} r={118} fill="#e9edf1" /></Inset>
      {box && createPortal(
        <div className="pointer-events-none absolute" style={{ left: box.left, top: box.top, width: box.size, height: box.size }}>
          <div className="h-full w-full overflow-hidden rounded-full">
            <video ref={ref} src={`${import.meta.env.BASE_URL}art/video/${name}.mp4`} muted playsInline preload="auto" className="h-full w-full object-cover" />
          </div>
          <span className={label} style={{ top: '5%', fontSize: box.size * 0.055 }}><span className={pill}>close-up</span></span>
          {caption && <span className={label} style={{ bottom: '7%', fontSize: box.size * 0.052 }}><span className={pill}>{caption}</span></span>}
        </div>,
        box.host,
      )}
    </>
  )
}
