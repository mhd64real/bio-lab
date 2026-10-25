// Shared drawing pieces for the slide-prep bench scenes (SVG, 820 x 480 viewBox).
import { PillLabel } from '../../lab/artKit'
import type { ReactNode } from 'react'
import type { Bubble } from '../../scope/model'

export function Stage({ children, label }: { children: ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 820 480" className="h-full w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id="bench" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fbfcfe" /><stop offset="1" stopColor="#e9eff5" /></linearGradient>
        <linearGradient id="glass" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f3fbff" /><stop offset="1" stopColor="#d6ecf7" /></linearGradient>
        <linearGradient id="wood" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stopColor="#f0d3a6" /><stop offset="1" stopColor="#ddb27a" /></linearGradient>
        <radialGradient id="onionSkin" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stopColor="#f0c27a" /><stop offset="0.6" stopColor="#d08e43" /><stop offset="1" stopColor="#9c5a22" /></radialGradient>
        <radialGradient id="onionFlesh" cx="0.5" cy="0.5" r="0.55"><stop offset="0" stopColor="#fffdf2" /><stop offset="1" stopColor="#f6eccb" /></radialGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="5" stdDeviation="6" floodOpacity="0.16" /></filter>
        <clipPath id="insetClip"><circle cx="0" cy="0" r="118" /></clipPath>
      </defs>
      <rect width="820" height="480" fill="url(#bench)" />
      {children}
    </svg>
  )
}

// A glass slide seen from above, with a frosted label end. Children are drawn at the slide centre (0, 0).
export function Slide({ x, y, label, children, bubbles = [], cover }: { x: number; y: number; label: string; children?: ReactNode; bubbles?: Bubble[]; cover?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} filter="url(#sh)">
      <rect x="-160" y="-50" width="320" height="100" rx="6" fill="url(#glass)" stroke="#9cc3d8" strokeWidth="2" />
      <rect x="-152" y="-42" width="70" height="84" rx="3" fill="#fff" stroke="#e1e7ee" />
      <text x="-117" y="5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#5a6779">{label}</text>
      <g transform="translate(30 0)">
        {children}
        {bubbles.map((b, i) => <circle key={i} cx={b.x * 13} cy={-b.y * 11} r={2 + b.r * 6} fill="rgba(255,255,255,0.6)" stroke="#5a6779" strokeWidth="1.3" />)}
        {cover && <rect x="-44" y="-44" width="88" height="88" rx="2" fill="rgba(214,236,247,0.3)" stroke="#7fb0cc" strokeWidth="1.5" />}
      </g>
    </g>
  )
}

export function Dropper({ x, y, bulb, liquid, rot = 0, drip }: { x: number; y: number; bulb: string; liquid: string; rot?: number; drip?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x="-13" y="-58" width="26" height="40" rx="11" fill={bulb} />
      <path d="M-10 -20 L10 -20 L5 52 L-5 52 Z" fill="rgba(226,240,250,0.95)" stroke="#86b4cf" strokeWidth="1.5" />
      <path d="M-7 10 L7 10 L5 50 L-5 50 Z" fill={liquid} />
      {drip !== undefined && drip > 0 && drip < 1 && <ellipse cx="0" cy={56 + drip * 60} rx="5" ry="7" fill={liquid} />}
    </g>
  )
}

export function Bottle({ x, y, colour, label, tilt = 0 }: { x: number; y: number; colour: string; label: string; tilt?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt})`} filter="url(#sh)">
      <rect x="-22" y="-18" width="44" height="70" rx="9" fill={colour} opacity="0.92" />
      <rect x="-9" y="-34" width="18" height="18" rx="3" fill="#3b4655" />
      <rect x="-18" y="6" width="36" height="26" rx="3" fill="#fff" opacity="0.92" />
      <text x="0" y="23" textAnchor="middle" fontSize="8.5" fontWeight="900" fill="#17212e">{label}</text>
    </g>
  )
}

export function BlotPaper({ x, y, stain }: { x: number; y: number; stain?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(6)`} filter="url(#sh)">
      <rect x="-40" y="-30" width="80" height="60" rx="3" fill="#fbfbf7" stroke="#d9dde3" />
      {stain && <ellipse cx="-30" cy="0" rx="14" ry="20" fill={stain} />}
      <text x="0" y="45" textAnchor="middle" fontSize="11" fontWeight="800" fill="#8a96a8">blotting paper</text>
    </g>
  )
}

// The drop under a coverslip tilted up by `angle` degrees (45 = raised, 0 = down), side view.
const dropPath = (angle: number) => {
  const down = 1 - Math.min(45, Math.max(0, angle)) / 45
  const w = 40 + 70 * down * down // half-width: spreads out under the glass
  const h = 11 - 9.5 * down // height of the bead: squashed to a thin film
  return `M${-w} 20 q${w} ${-2 * h} ${2 * w} 0 Z`
}

// Side view inset used while lowering the coverslip.
export function CoverInset({ x, y, angle, liquid }: { x: number; y: number; angle: number; liquid: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="120" fill="#fff" stroke="#d6dee8" strokeWidth="3" filter="url(#sh)" />
      <g clipPath="url(#insetClip)">
        <rect x="-140" y="20" width="280" height="24" fill="url(#glass)" stroke="#9cc3d8" />
        {/* The drop: a tall bead while the coverslip is raised, squashed flat and spread wide as it comes down. */}
        <path d={dropPath(angle)} fill={liquid} />
        <g transform={`translate(-55 18) rotate(${-angle})`}>
          <rect x="0" y="-3" width="120" height="5" rx="1.5" fill="rgba(214,236,247,0.95)" stroke="#7fb0cc" strokeWidth="1.5" />
        </g>
        <path d="M-55 18 l-20 -40" stroke="#5a6779" strokeWidth="4" strokeLinecap="round" />
      </g>
      <PillLabel y={-92} size={13}>side view</PillLabel>
    </g>
  )
}

export function Caption({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return <text x={x} y={y} textAnchor="middle" fontSize="13" fontWeight="800" fill="#5a6779">{children}</text>
}

export const mix = (a: [number, number, number], b: [number, number, number], t: number, alpha = 1) =>
  `rgba(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')},${alpha})`
