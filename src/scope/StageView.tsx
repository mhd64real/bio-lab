import { useRef } from 'react'
import type { ScopeState } from './model'
import type { ScopeApi } from './useScope'

// The stage seen from the side, as you look at it with your own eyes before using the eyepiece. Units are
// millimetres: the light hole is at (0, 0) and the specimen is at the slide's origin, so the specimen sits
// over the hole when stageX = stageY = 0. The slide can be dragged directly, or moved with the stage controls.
export const CENTRED_MM = 0.7

function Specimen({ id }: { id: string }) {
  switch (id) {
    case 'letter-e': return (
      <g>
        <rect x={-1.6} y={-1.6} width={3.2} height={3.2} fill="#dcdcd6" stroke="#b5b5ae" strokeWidth={0.08} />
        <text x={0} y={0.75} textAnchor="middle" fontFamily="Georgia, serif" fontSize={2.6} fill="#1c1c1c">e</text>
      </g>
    )
    case 'onion': return <path d="M-3 -2.4 q3 -1 6 0.3 q0.8 2.4 -0.2 4.8 q-3 1 -5.6 -0.2 q-0.9 -2.4 -0.2 -4.9z" fill="rgba(215,165,70,0.5)" stroke="rgba(160,110,35,0.6)" strokeWidth={0.1} />
    case 'redonion': return <path d="M-3 -2.4 q3 -1 6 0.3 q0.8 2.4 -0.2 4.8 q-3 1 -5.6 -0.2 q-0.9 -2.4 -0.2 -4.9z" fill="rgba(170,60,140,0.55)" stroke="rgba(120,30,90,0.6)" strokeWidth={0.1} />
    case 'cheek': return <ellipse rx={3.4} ry={2.2} fill="rgba(70,110,200,0.32)" />
    case 'yogurt': return <ellipse rx={4} ry={2.6} fill="rgba(120,60,170,0.35)" />
    case 'pond': return <g>{[[-1.5, 0.6], [1.2, -0.8], [0.3, 1.4], [-0.6, -1.2]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={0.18} fill="rgba(60,110,60,0.6)" />)}</g>
    case 'elodea': return <ellipse rx={4.2} ry={1.4} transform="rotate(-20)" fill="rgba(60,150,60,0.65)" stroke="rgba(30,100,30,0.6)" strokeWidth={0.1} />
    case 'pepper': return <path d="M-2.6 -2 q2.6 -0.8 5.2 0.3 q0.6 2 -0.2 4 q-2.6 0.8 -4.8 -0.2 q-0.8 -2 -0.2 -4.1z" fill="rgba(220,80,40,0.55)" stroke="rgba(170,50,20,0.6)" strokeWidth={0.1} />
    case 'potato': return <ellipse rx={3.6} ry={2.4} fill="rgba(60,40,95,0.45)" />
    default: return <circle r={1.5} fill="rgba(120,120,120,0.4)" />
  }
}

export function StageView({ state: s, api }: { state: ScopeState; api: ScopeApi }) {
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<{ x: number; y: number } | null>(null)
  const mm = (e: React.PointerEvent) => {
    const m = svg.current?.getScreenCTM()
    return m ? { x: (e.clientX - m.e) / m.a, y: (e.clientY - m.f) / m.d } : { x: 0, y: 0 }
  }
  const sx = s.stageX, sy = -s.stageY // slide offset on screen (y down)
  const on = Math.hypot(s.stageX, s.stageY) <= CENTRED_MM
  const lit = s.lampOn
  return (
    <div className="relative h-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[#e9edf1]">
      <svg ref={svg} viewBox="-20 -13 40 26" className="h-full w-full touch-none select-none" role="img" aria-label="The stage seen from the side: the slide over the light hole">
        <defs>
          <radialGradient id="holeLight">
            <stop offset="0" stopColor="#fffbe8" />
            <stop offset="0.6" stopColor="#fff2b8" />
            <stop offset="1" stopColor="#f4d77a" />
          </radialGradient>
        </defs>
        {/* The stage plate with its light hole. */}
        <rect x={-30} y={-20} width={60} height={40} fill="#2b3340" />
        <circle r={4.4} fill="#151a21" />
        <circle r={4} fill={lit ? 'url(#holeLight)' : '#3a4250'} />
        {lit && <circle r={6.5} fill="rgba(255,240,180,0.12)" />}

        {/* The slide: glass you can see the light through, with its frosted label end and the coverslip. */}
        <g transform={`translate(${sx} ${sy})`} style={{ cursor: drag.current ? 'grabbing' : 'grab' }}
          onPointerDown={(e) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); drag.current = mm(e) }}
          onPointerMove={(e) => {
            if (!drag.current) return
            const p = mm(e)
            api.stage(p.x - drag.current.x, -(p.y - drag.current.y))
            drag.current = p
          }}
          onPointerUp={() => { drag.current = null }}
          onPointerCancel={() => { drag.current = null }}
        >
          <rect x={-37.5} y={-12.5} width={75} height={25} rx={0.6} fill="rgba(235,245,252,0.32)" stroke="rgba(255,255,255,0.85)" strokeWidth={0.18} />
          <rect x={-37.5} y={-12.5} width={18} height={25} fill="rgba(245,247,250,0.92)" />
          <rect x={-11} y={-11} width={22} height={22} fill="rgba(225,240,250,0.18)" stroke="rgba(255,255,255,0.7)" strokeWidth={0.12} />
          {s.mount && <Specimen id={s.mount.specimen} />}
          {s.mount?.bubbles.map((b, i) => <circle key={i} cx={b.x * 3} cy={-b.y * 3} r={0.25 + b.r * 0.8} fill="rgba(255,255,255,0.5)" stroke="#5a6779" strokeWidth={0.08} />)}
        </g>

        {/* The target: a ring over the light hole that turns green once the specimen is in place. */}
        <circle r={2.4} fill="none" stroke={on ? '#22b455' : '#f2a516'} strokeWidth={0.28} strokeDasharray={on ? undefined : '0.9 0.6'} className={on ? undefined : 'attention-svg'} />
        <path d="M-3.4 0 H-2.7 M2.7 0 H3.4 M0 -3.4 V-2.7 M0 2.7 V3.4" stroke={on ? '#22b455' : '#f2a516'} strokeWidth={0.22} strokeLinecap="round" />
      </svg>
      <span className={`pointer-events-none absolute left-3 top-3 rounded-full px-3 py-1 text-sm font-extrabold ${on ? 'bg-[var(--color-ok-soft)] text-[var(--color-ok)]' : 'bg-white/90 text-[var(--color-muted)]'}`}>
        {on ? 'Over the light hole' : 'Looking at the stage from the side'}
      </span>
    </div>
  )
}
