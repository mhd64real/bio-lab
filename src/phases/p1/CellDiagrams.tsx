// Figure 17 "Visualizing Cells": an illustration of an animal cell, a plant cell and a prokaryotic cell, with an
// invisible tap zone over every structure. Zones are drawn in the pixels of the 1264 x 848 illustration; a picked
// zone is outlined and named with a label beside the cell.
import type { ReactNode } from 'react'

export type CellKind = 'animal' | 'plant' | 'prokaryote'

export const STRUCTURES: Record<CellKind, Record<string, string>> = {
  animal: {
    membrane: 'Cell membrane', cytoplasm: 'Cytoplasm', nucleus: 'Nucleus', nucleolus: 'Nucleolus',
    mito: 'Mitochondrion', rer: 'Rough endoplasmic reticulum', ser: 'Smooth endoplasmic reticulum', golgi: 'Golgi apparatus',
    lysosome: 'Lysosome', vesicle: 'Vesicle', centriole: 'Centrioles', ribosomes: 'Ribosomes',
  },
  plant: {
    wall: 'Cell wall (cellulose)', membrane: 'Cell membrane', cytoplasm: 'Cytoplasm', vacuole: 'Central vacuole', nucleus: 'Nucleus',
    nucleolus: 'Nucleolus', chloroplast: 'Chloroplast', mito: 'Mitochondrion', rer: 'Rough endoplasmic reticulum',
    golgi: 'Golgi apparatus', vesicle: 'Vesicle', ribosomes: 'Ribosomes',
  },
  prokaryote: {
    capsule: 'Capsule', wall: 'Cell wall (peptidoglycan)', membrane: 'Plasma membrane', cytoplasm: 'Cytoplasm', dna: 'DNA',
    ribosomes: 'Ribosomes', flagella: 'Flagellum',
  },
}

const W = 1264, H = 848
const px = (x: number) => (x * W) / 100
const py = (y: number) => (y * H) / 100

// Shapes, positions in percent of the illustration, sizes in its pixels.
type Shape =
  | { k: 'e'; x: number; y: number; rx: number; ry: number; rot: number }
  | { k: 'poly'; pts: [number, number][] }
  | { k: 'band'; x: number; y: number; w: number; h: number; r: number; sw: number } // a ring (membrane, wall), pixels
  | { k: 'fill'; x: number; y: number; w: number; h: number; r: number } // a filled rounded box, pixels
  | { k: 'line'; pts: [number, number][]; sw: number }
const e = (x: number, y: number, rx: number, ry = rx, rot = 0): Shape => ({ k: 'e', x, y, rx, ry, rot })
const poly = (...pts: [number, number][]): Shape => ({ k: 'poly', pts })
const dots = (pts: [number, number][], r = 22) => pts.map(([x, y]) => e(x, y, r))

// Where a label goes: beside the cell (worked out automatically) or at a fixed spot in the illustration's pixels.
interface Zone { id: string; shapes: Shape[]; anchor: [number, number]; at?: { x: number; y: number } }
interface Figure { src: string; alt: string; view: [number, number, number, number]; zones: Zone[] }

// Back to front: later zones sit on top and win the tap.
const FIG: Record<CellKind, Figure> = {
  animal: {
    src: 'art/p1/cell-animal.webp', alt: 'An animal cell', view: [-150, 40, 1564, 776],
    zones: [
      { id: 'cytoplasm', shapes: [e(50, 50, 410, 342)], anchor: [44, 88] },
      { id: 'membrane', shapes: [{ k: 'band', x: 632 - 428, y: 424 - 360, w: 856, h: 720, r: 400, sw: 40 }], anchor: [83.4, 40] },
      { id: 'rer', shapes: [poly([24, 40], [23, 50], [27, 57], [31, 56], [33, 44], [37, 36], [45, 34], [47, 30], [46, 24], [38, 20.5], [30, 25], [26, 32])], anchor: [27, 30] },
      { id: 'ser', shapes: [poly([62, 68], [62.5, 77], [67, 81], [74, 75], [78, 65], [77.5, 53], [73, 51], [68, 60])], anchor: [76, 62] },
      { id: 'golgi', shapes: [e(50, 77, 128, 96)], anchor: [57, 74] },
      { id: 'nucleus', shapes: [e(42.5, 49.5, 124, 126)], anchor: [36, 60] },
      { id: 'nucleolus', shapes: [e(40, 46, 44)], anchor: [40, 46] },
      { id: 'mito', shapes: [e(51, 19, 78, 44, 28), e(74.5, 37.5, 76, 40, 55), e(27.5, 70, 74, 42, 40)], anchor: [27.5, 70] },
      { id: 'lysosome', shapes: [e(22, 54, 34), e(69, 46, 34)], anchor: [22, 54] },
      { id: 'centriole', shapes: [e(62, 31, 62, 64)], anchor: [64, 28] },
      { id: 'vesicle', shapes: [e(42, 16, 26), e(60, 49, 30), e(64, 56.2, 22), e(60, 60.5, 30), e(36, 80, 30)], anchor: [42, 16] },
      { id: 'ribosomes', shapes: dots([[49, 29], [52, 30], [49.3, 34], [51.5, 33.3], [59, 26.5], [20, 43], [21.6, 45], [19.6, 47], [20, 60.3], [22, 61], [21, 63.3], [38.5, 68], [41, 67], [31, 80.6], [69, 39.5], [63.4, 44.2], [64.7, 47.5], [76.6, 50.3], [78.4, 48.6], [78.7, 52.2], [60, 69.8], [61, 81.4], [60.6, 84.6], [63.2, 82.4]]), anchor: [20, 43] },
    ],
  },
  plant: {
    src: 'art/p1/cell-plant.webp', alt: 'A plant cell', view: [-150, 40, 1564, 776],
    zones: [
      { id: 'cytoplasm', shapes: [{ k: 'fill', x: 258, y: 124, w: 746, h: 590, r: 76 }], anchor: [46.7, 18.3] },
      { id: 'wall', shapes: [{ k: 'band', x: 226, y: 94, w: 810, h: 648, r: 100, sw: 36 }], anchor: [82, 22] },
      { id: 'membrane', shapes: [{ k: 'band', x: 250, y: 117, w: 762, h: 604, r: 80, sw: 20 }], anchor: [19.8, 75] },
      { id: 'vacuole', shapes: [poly([56, 31], [62, 28.5], [69, 31], [72.5, 40], [71.5, 55], [67, 66], [60, 73], [52, 72.5], [46.5, 66], [46.5, 58], [50.5, 51], [54, 42])], anchor: [66, 40] },
      { id: 'rer', shapes: [poly([31, 46], [34, 52], [37, 56.5], [44, 55.5], [47, 51], [50, 46], [52.5, 38], [51.5, 30], [47, 21.5], [43.5, 24], [43.5, 36], [40.5, 44], [34, 45])], anchor: [47, 53] },
      { id: 'nucleus', shapes: [e(34.8, 33.3, 106, 106)], anchor: [29, 40] },
      { id: 'nucleolus', shapes: [e(37, 30.5, 44)], anchor: [37, 30.5] },
      { id: 'chloroplast', shapes: [e(50, 20.5, 76, 44), e(73, 27, 74, 48, 40), e(24, 52.5, 42, 76), e(71, 74.5, 78, 48, -32)], anchor: [24, 52.5] },
      { id: 'mito', shapes: [e(75, 52, 36, 66, 15), e(27.5, 73.5, 72, 40, 40), e(56, 80, 68, 36)], anchor: [75, 52] },
      { id: 'golgi', shapes: [e(37.5, 70, 102, 96)], anchor: [33, 73] },
      { id: 'vesicle', shapes: [e(23, 36.5, 28), e(42, 61.5, 32), e(47.5, 75, 28), e(76, 39.5, 28)], anchor: [76, 39.5] },
      { id: 'ribosomes', shapes: dots([[39.5, 19], [42, 17.5], [42.6, 20.5], [24.8, 24.5], [24.8, 28], [54.5, 29.8], [64.4, 25.4], [65.5, 24.4], [22.4, 66.6], [71.6, 63], [78, 62], [63, 74.5], [46.5, 81.4], [29.8, 55.4], [31.3, 56.7], [29.9, 57.6]]), anchor: [24.8, 28] },
    ],
  },
  prokaryote: {
    src: 'art/p1/cell-prokaryote.webp', alt: 'A rod-shaped prokaryotic cell', view: [0, 30, 1264, 790],
    zones: [
      { id: 'capsule', shapes: [{ k: 'band', x: 101, y: 218, w: 789, h: 407, r: 203, sw: 40 }], anchor: [24, 26], at: { x: 260, y: 90 } },
      { id: 'wall', shapes: [{ k: 'band', x: 133, y: 250, w: 726, h: 347, r: 173, sw: 28 }], anchor: [42, 29.5], at: { x: 560, y: 90 } },
      { id: 'cytoplasm', shapes: [{ k: 'fill', x: 160, y: 278, w: 679, h: 291, r: 145 }], anchor: [40, 62.7], at: { x: 520, y: 770 } },
      { id: 'membrane', shapes: [{ k: 'band', x: 152, y: 270, w: 695, h: 307, r: 153, sw: 18 }], anchor: [60, 31.8], at: { x: 890, y: 90 } },
      { id: 'dna', shapes: [e(39.3, 49, 210, 92)], anchor: [51, 46], at: { x: 860, y: 770 } },
      { id: 'flagella', shapes: [{ k: 'line', pts: [[69, 49.5], [75, 49.5], [80, 53], [84, 57.5], [87, 54], [90, 48.5], [93, 50], [96, 52.5]], sw: 32 }], anchor: [84, 57.5], at: { x: 1110, y: 680 } },
      { id: 'ribosomes', shapes: dots([[22, 37], [27.5, 36], [31, 37.5], [36, 36.5], [38, 38.5], [43, 35], [47, 37.5], [50.5, 37.5], [56, 36.5], [56.5, 40], [59, 39], [17, 41.5], [22, 41], [17, 47.5], [21, 48], [15, 50.5], [59.5, 44], [63.5, 47.5], [58, 50.5], [19, 54], [60.5, 55], [63, 54], [22.5, 59], [18.5, 60.5], [55.5, 59], [60, 61], [24, 63], [27, 61.5], [31.5, 64.5], [36.5, 62.5], [43, 64.5], [48, 62], [52, 64], [55, 63]], 20), anchor: [24, 63], at: { x: 230, y: 770 } },
    ],
  },
}

function ShapeEl({ s }: { s: Shape }) {
  switch (s.k) {
    case 'e': return <ellipse cx={px(s.x)} cy={py(s.y)} rx={s.rx} ry={s.ry} transform={s.rot ? `rotate(${s.rot} ${px(s.x)} ${py(s.y)})` : undefined} />
    case 'poly': return <polygon points={s.pts.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')} strokeLinejoin="round" />
    case 'fill': return <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} />
    case 'band': return <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} className="cell-band" style={{ strokeWidth: s.sw }} />
    case 'line': return <polyline points={s.pts.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')} className="cell-band" style={{ strokeWidth: s.sw }} strokeLinecap="round" strokeLinejoin="round" />
  }
}

// Labels beside the cell: each side is sorted top to bottom and spread so no two labels touch.
function layout(fig: Figure) {
  const [vx, vy, vw, vh] = fig.view
  const pos: Record<string, { x: number; y: number; align: 'start' | 'end' | 'center' }> = {}
  const sides: Record<'start' | 'end', Zone[]> = { start: [], end: [] }
  for (const z of fig.zones) {
    if (z.at) pos[z.id] = { ...z.at, align: 'center' }
    else sides[px(z.anchor[0]) < W / 2 ? 'end' : 'start'].push(z)
  }
  const GAP = 64
  for (const side of ['start', 'end'] as const) {
    const list = sides[side].sort((a, b) => a.anchor[1] - b.anchor[1])
    const ys = list.map((z) => py(z.anchor[1]))
    for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + GAP)
    const bottom = vy + vh - 36
    if (ys.length && ys[ys.length - 1] > bottom) ys[ys.length - 1] = bottom
    for (let i = ys.length - 2; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - GAP)
    list.forEach((z, i) => { pos[z.id] = { x: side === 'end' ? 190 : W - 190, y: ys[i], align: side } })
  }
  return { pos, pct: (x: number, y: number) => ({ left: `${((x - vx) / vw) * 100}%`, top: `${((y - vy) / vh) * 100}%` }) }
}

interface P { kind: CellKind; picked: string | null; hint: string | null; onPick: (id: string) => void; showAll: boolean }

export function CellFigure({ kind, picked, hint, onPick, showAll }: P) {
  const fig = FIG[kind]
  const [vx, vy, vw, vh] = fig.view
  const { pos, pct } = layout(fig)
  const shown = fig.zones.filter((z) => showAll || z.id === picked)
  const label = (z: Zone): ReactNode => {
    const p = pos[z.id]
    const t = p.align === 'end' ? 'translate(-100%, -50%)' : p.align === 'start' ? 'translate(0, -50%)' : 'translate(-50%, -50%)'
    return (
      <span key={z.id} className={`cell-label ${z.id === picked ? 'cell-label-on' : ''}`} style={{ ...pct(p.x, p.y), transform: t, textAlign: p.align === 'center' ? 'center' : p.align === 'end' ? 'right' : 'left' }}>
        {STRUCTURES[kind][z.id]}
      </span>
    )
  }
  return (
    <div className="cell-figure" style={{ aspectRatio: `${vw} / ${vh}` }}>
      <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} className="absolute inset-0 h-full w-full select-none" role="img" aria-label={fig.alt}>
        <image href={`${import.meta.env.BASE_URL}${fig.src}`} x={0} y={0} width={W} height={H} />
        {fig.zones.map((z) => (
          <g key={z.id} role="button" aria-label={STRUCTURES[kind][z.id]} onClick={(ev) => { ev.stopPropagation(); onPick(z.id) }}
            className={`cell-part ${z.id === picked ? 'cell-part-on' : ''} ${z.id === hint ? 'cell-part-hint' : ''}`}>
            {z.shapes.map((s, i) => <ShapeEl key={i} s={s} />)}
          </g>
        ))}
        {shown.map((z) => {
          const p = pos[z.id]
          return <line key={z.id} x1={px(z.anchor[0])} y1={py(z.anchor[1])} x2={p.x} y2={p.y} className={`cell-leader ${z.id === picked ? 'cell-leader-on' : ''}`} />
        })}
        {shown.map((z) => <circle key={z.id} cx={px(z.anchor[0])} cy={py(z.anchor[1])} r={7} className={`cell-pin ${z.id === picked ? 'cell-leader-on' : ''}`} />)}
      </svg>
      {shown.map(label)}
    </div>
  )
}
