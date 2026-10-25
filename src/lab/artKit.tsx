// Photo-sprite scenes: generated photos (public/art/<scene>/<name>.webp) placed and swapped in code.
// Anything that moves continuously (liquids, films, coverslips, bubbles) is drawn in code on top.
import type { ReactNode } from 'react'
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

// A round close-up lens over the bench. Children are drawn in the lens, centred on (0, 0), radius 118.
export function Inset({ x, y, caption, children, bg = '#e9edf1' }: { x: number; y: number; caption?: string; children: ReactNode; bg?: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="120" fill="#fff" stroke="#d6dee8" strokeWidth="3" filter="url(#sh)" />
      <g clipPath="url(#insetClip)">
        <rect x="-130" y="-130" width="260" height="260" fill={bg} />
        {children}
      </g>
      {caption && <text y="98" textAnchor="middle" fontSize="12.5" fontWeight="900" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">{caption}</text>}
      <text y="-98" textAnchor="middle" fontSize="13" fontWeight="900" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">close-up</text>
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
  )
}
