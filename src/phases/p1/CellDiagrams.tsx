// Figure 17 "Visualizing Cells": tappable diagrams of an animal cell, a plant cell and a prokaryotic cell.
import type { ReactNode } from 'react'

export type CellKind = 'animal' | 'plant' | 'prokaryote'

export const STRUCTURES: Record<CellKind, Record<string, string>> = {
  animal: {
    membrane: 'Cell membrane', cytoplasm: 'Cytoplasm', nucleus: 'Nucleus', nucleolus: 'Nucleolus', pore: 'Nuclear pore',
    mito: 'Mitochondrion', rer: 'Rough endoplasmic reticulum', ser: 'Smooth endoplasmic reticulum', golgi: 'Golgi apparatus',
    lysosome: 'Lysosome', vesicle: 'Vesicle', centriole: 'Centriole', ribosomes: 'Ribosomes', microtubule: 'Microtubule',
  },
  plant: {
    wall: 'Cell wall (cellulose)', membrane: 'Cell membrane', cytoplasm: 'Cytoplasm', vacuole: 'Central vacuole', nucleus: 'Nucleus',
    nucleolus: 'Nucleolus', pore: 'Nuclear pore', chloroplast: 'Chloroplast', mito: 'Mitochondrion', rer: 'Rough endoplasmic reticulum',
    ser: 'Smooth endoplasmic reticulum', golgi: 'Golgi apparatus', vesicle: 'Vesicle', ribosomes: 'Ribosomes', microtubule: 'Microtubule',
  },
  prokaryote: {
    capsule: 'Capsule', wall: 'Cell wall (peptidoglycan)', membrane: 'Plasma membrane', cytoplasm: 'Cytoplasm', dna: 'DNA',
    ribosomes: 'Ribosomes', flagella: 'Flagella',
  },
}

interface P { picked: string | null; onPick: (id: string) => void; showAll: boolean }

function Hit({ id, onPick, picked, children }: { id: string; onPick: (id: string) => void; picked: string | null; children: ReactNode }) {
  return (
    <g onClick={(e) => { e.stopPropagation(); onPick(id) }} className={`cell-part ${picked === id ? 'cell-part-on' : ''}`} role="button" aria-label={id}>
      {children}
    </g>
  )
}

function Label({ x, y, tx, ty, text, show, on }: { x: number; y: number; tx: number; ty: number; text: string; show: boolean; on: boolean }) {
  if (!show && !on) return null
  const anchor = tx < x ? 'end' : 'start'
  return (
    <g pointerEvents="none">
      <line x1={x} y1={y} x2={tx} y2={ty} stroke={on ? '#f2a516' : '#5a6779'} strokeWidth={on ? 2 : 1} />
      <text x={tx + (anchor === 'end' ? -4 : 4)} y={ty + 4} textAnchor={anchor} fontSize="12" fontWeight="800" fill={on ? '#9a6400' : '#17212e'} paintOrder="stroke" stroke="#fff" strokeWidth="3">{text}</text>
    </g>
  )
}

const ribo = (pts: [number, number][]) => pts.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.2" fill="#3b4655" />)

function Mito({ x, y, r = 0 }: { x: number; y: number; r?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${r})`}>
      <ellipse rx="22" ry="11" fill="#e07a7a" stroke="#a84848" strokeWidth="2" />
      <path d="M-15 0 q4 -8 8 0 t8 0 t8 0 t8 0" fill="none" stroke="#a84848" strokeWidth="1.6" />
    </g>
  )
}

function Golgi({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} fill="none" stroke="#d99a1e" strokeWidth="5" strokeLinecap="round">
      <path d="M-24 -10 q24 -14 48 0" /><path d="M-26 0 q26 -14 52 0" /><path d="M-24 10 q24 -14 48 0" />
      <circle cx="32" cy="-8" r="4" fill="#f2c24e" stroke="none" /><circle cx="36" cy="6" r="3" fill="#f2c24e" stroke="none" />
    </g>
  )
}

export function AnimalCell({ picked, onPick, showAll }: P) {
  const L = (id: string, x: number, y: number, tx: number, ty: number) => <Label x={x} y={y} tx={tx} ty={ty} text={STRUCTURES.animal[id]} show={showAll} on={picked === id} />
  return (
    <svg viewBox="0 0 560 360" className="cell-svg" role="img" aria-label="Animal cell">
      <Hit id="cytoplasm" onPick={onPick} picked={picked}>
        <path d="M150 70 q90 -50 200 -20 q120 30 120 140 q-10 110 -130 130 q-120 20 -200 -30 q-80 -50 -60 -130 q10 -60 70 -90 z" fill="#e9edf3" />
      </Hit>
      <Hit id="membrane" onPick={onPick} picked={picked}>
        <path d="M150 70 q90 -50 200 -20 q120 30 120 140 q-10 110 -130 130 q-120 20 -200 -30 q-80 -50 -60 -130 q10 -60 70 -90 z" fill="none" stroke="#5f6f86" strokeWidth="7" />
      </Hit>
      <Hit id="microtubule" onPick={onPick} picked={picked}><path d="M140 120 L250 170 M330 110 L420 250 M170 260 L300 220" stroke="#9fb3c8" strokeWidth="3" /></Hit>
      <Hit id="rer" onPick={onPick} picked={picked}>
        <path d="M230 205 q15 -10 30 0 t30 0 M225 220 q18 -10 36 0 t36 0 M232 235 q15 -10 30 0 t30 0" fill="none" stroke="#b9708a" strokeWidth="5" />
        {ribo([[240, 200], [262, 205], [285, 200], [236, 216], [260, 222], [290, 216], [300, 233], [252, 238]])}
      </Hit>
      <Hit id="ser" onPick={onPick} picked={picked}><path d="M330 215 q15 -14 30 0 q15 14 30 0 M335 232 q15 -14 30 0 q15 14 30 0" fill="none" stroke="#d58fa8" strokeWidth="6" strokeLinecap="round" /></Hit>
      <Hit id="nucleus" onPick={onPick} picked={picked}><circle cx="250" cy="140" r="52" fill="#a58ad1" stroke="#6f55a1" strokeWidth="4" /></Hit>
      <Hit id="pore" onPick={onPick} picked={picked}>{[[205, 115], [240, 89], [298, 130], [282, 182], [212, 172]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4.5" fill="#efe8fb" stroke="#6f55a1" />)}</Hit>
      <Hit id="nucleolus" onPick={onPick} picked={picked}><circle cx="258" cy="146" r="16" fill="#6f55a1" /></Hit>
      <Hit id="mito" onPick={onPick} picked={picked}><Mito x={380} y={150} r={-20} /><Mito x={170} y={230} r={30} /></Hit>
      <Hit id="golgi" onPick={onPick} picked={picked}><Golgi x={360} y={280} /></Hit>
      <Hit id="lysosome" onPick={onPick} picked={picked}><circle cx="160" cy="150" r="12" fill="#f4d35e" stroke="#c9a227" strokeWidth="2" /><circle cx="420" cy="205" r="9" fill="#f4d35e" stroke="#c9a227" strokeWidth="2" /></Hit>
      <Hit id="vesicle" onPick={onPick} picked={picked}><circle cx="410" cy="100" r="7" fill="#fff" stroke="#8a96a8" strokeWidth="2" /><circle cx="200" cy="290" r="6" fill="#fff" stroke="#8a96a8" strokeWidth="2" /></Hit>
      <Hit id="centriole" onPick={onPick} picked={picked}>
        <rect x="320" y="72" width="26" height="10" rx="3" fill="#e8b10c" transform="rotate(-20 333 77)" />
        <rect x="335" y="80" width="10" height="26" rx="3" fill="#e8b10c" />
      </Hit>
      <Hit id="ribosomes" onPick={onPick} picked={picked}>{ribo([[190, 100], [205, 205], [320, 170], [390, 230], [300, 290], [430, 160], [140, 190]])}</Hit>
      {L('membrane', 470, 180, 520, 120)}{L('nucleus', 210, 110, 120, 40)}{L('nucleolus', 262, 140, 300, 30)}{L('pore', 240, 89, 210, 20)}
      {L('mito', 395, 145, 520, 160)}{L('rer', 300, 233, 280, 340)}{L('ser', 390, 230, 520, 230)}{L('golgi', 380, 280, 520, 300)}
      {L('lysosome', 160, 150, 40, 140)}{L('vesicle', 410, 100, 500, 60)}{L('centriole', 335, 80, 380, 30)}{L('ribosomes', 140, 190, 40, 200)}
      {L('microtubule', 200, 145, 40, 260)}{L('cytoplasm', 170, 280, 60, 320)}
    </svg>
  )
}

export function PlantCell({ picked, onPick, showAll }: P) {
  const L = (id: string, x: number, y: number, tx: number, ty: number) => <Label x={x} y={y} tx={tx} ty={ty} text={STRUCTURES.plant[id]} show={showAll} on={picked === id} />
  return (
    <svg viewBox="0 0 560 360" className="cell-svg" role="img" aria-label="Plant cell">
      <Hit id="wall" onPick={onPick} picked={picked}><rect x="110" y="40" width="340" height="280" rx="30" fill="#c8d96f" stroke="#8fa33a" strokeWidth="3" /></Hit>
      <Hit id="cytoplasm" onPick={onPick} picked={picked}><rect x="126" y="56" width="308" height="248" rx="20" fill="#eef2e6" /></Hit>
      <Hit id="membrane" onPick={onPick} picked={picked}><rect x="126" y="56" width="308" height="248" rx="20" fill="none" stroke="#6a7d3a" strokeWidth="4" /></Hit>
      <Hit id="vacuole" onPick={onPick} picked={picked}><rect x="250" y="78" width="160" height="150" rx="40" fill="#dfe9f2" stroke="#9fb3c8" strokeWidth="3" /></Hit>
      <Hit id="microtubule" onPick={onPick} picked={picked}><path d="M140 250 L240 280 M140 90 L230 70" stroke="#9fb3c8" strokeWidth="3" /></Hit>
      <Hit id="rer" onPick={onPick} picked={picked}>
        <path d="M150 200 q15 -10 30 0 t30 0 M148 216 q16 -10 32 0 t32 0" fill="none" stroke="#b9708a" strokeWidth="5" />
        {ribo([[160, 196], [182, 202], [205, 196], [158, 212], [190, 218], [212, 212]])}
      </Hit>
      <Hit id="ser" onPick={onPick} picked={picked}><path d="M240 250 q14 -12 28 0 q14 12 28 0" fill="none" stroke="#d58fa8" strokeWidth="6" strokeLinecap="round" /></Hit>
      <Hit id="nucleus" onPick={onPick} picked={picked}><circle cx="190" cy="130" r="42" fill="#a58ad1" stroke="#6f55a1" strokeWidth="4" /></Hit>
      <Hit id="pore" onPick={onPick} picked={picked}>{[[155, 110], [190, 89], [228, 125], [205, 168]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#efe8fb" stroke="#6f55a1" />)}</Hit>
      <Hit id="nucleolus" onPick={onPick} picked={picked}><circle cx="196" cy="134" r="13" fill="#6f55a1" /></Hit>
      <Hit id="chloroplast" onPick={onPick} picked={picked}>
        {[[330, 265, 10], [400, 255, -15], [160, 280, 0]].map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <ellipse rx="26" ry="13" fill="#5fb85a" stroke="#2f7d34" strokeWidth="2" />
            {[-12, -4, 4, 12].map((d) => <rect key={d} x={d - 2.5} y="-6" width="5" height="12" rx="1.5" fill="#2f7d34" />)}
          </g>
        ))}
      </Hit>
      <Hit id="mito" onPick={onPick} picked={picked}><Mito x={415} y={290} r={0} /><Mito x={140} y={160} r={70} /></Hit>
      <Hit id="golgi" onPick={onPick} picked={picked}><Golgi x={230} y={210} /></Hit>
      <Hit id="vesicle" onPick={onPick} picked={picked}><circle cx="272" cy="236" r="6" fill="#fff" stroke="#8a96a8" strokeWidth="2" /></Hit>
      <Hit id="ribosomes" onPick={onPick} picked={picked}>{ribo([[240, 120], [230, 160], [300, 245], [370, 240], [420, 240], [150, 240]])}</Hit>
      {L('wall', 450, 200, 520, 200)}{L('membrane', 434, 100, 520, 90)}{L('vacuole', 360, 110, 520, 40)}{L('nucleus', 160, 110, 40, 60)}
      {L('nucleolus', 196, 134, 250, 30)}{L('pore', 190, 89, 140, 20)}{L('chloroplast', 330, 265, 330, 350)}{L('mito', 415, 290, 520, 320)}
      {L('rer', 150, 200, 40, 200)}{L('ser', 290, 250, 290, 345)}{L('golgi', 250, 210, 520, 260)}{L('vesicle', 272, 236, 520, 230)}
      {L('ribosomes', 150, 240, 40, 250)}{L('microtubule', 150, 90, 40, 120)}{L('cytoplasm', 140, 280, 60, 335)}
    </svg>
  )
}

export function ProkaryoteCell({ picked, onPick, showAll }: P) {
  const L = (id: string, x: number, y: number, tx: number, ty: number) => <Label x={x} y={y} tx={tx} ty={ty} text={STRUCTURES.prokaryote[id]} show={showAll} on={picked === id} />
  return (
    <svg viewBox="0 0 560 360" className="cell-svg" role="img" aria-label="Prokaryotic cell">
      <Hit id="flagella" onPick={onPick} picked={picked}><path d="M420 190 q30 -30 50 0 t50 0 t40 -10" fill="none" stroke="#5a6779" strokeWidth="5" strokeLinecap="round" /></Hit>
      <Hit id="capsule" onPick={onPick} picked={picked}><rect x="110" y="100" width="320" height="170" rx="85" fill="#d9e8b0" stroke="#a9be6a" strokeWidth="3" /></Hit>
      <Hit id="wall" onPick={onPick} picked={picked}><rect x="126" y="116" width="288" height="138" rx="69" fill="#8fbf5a" /></Hit>
      <Hit id="membrane" onPick={onPick} picked={picked}><rect x="138" y="128" width="264" height="114" rx="57" fill="#c9a96b" /></Hit>
      <Hit id="cytoplasm" onPick={onPick} picked={picked}><rect x="146" y="136" width="248" height="98" rx="49" fill="#cfe3ef" /></Hit>
      <Hit id="dna" onPick={onPick} picked={picked}>
        <path d="M210 160 q20 -20 40 0 t40 0 t30 20 q-10 25 -40 15 t-40 10 t-30 -20 q-10 -15 0 -25" fill="none" stroke="#7a4fb3" strokeWidth="4" strokeLinejoin="round" />
      </Hit>
      <Hit id="ribosomes" onPick={onPick} picked={picked}>{ribo([[180, 160], [175, 205], [340, 155], [355, 210], [300, 220], [200, 222], [260, 150]])}</Hit>
      {L('capsule', 160, 108, 120, 50)}{L('wall', 270, 120, 300, 50)}{L('membrane', 400, 160, 470, 110)}{L('cytoplasm', 340, 200, 470, 290)}
      {L('dna', 250, 160, 230, 320)}{L('ribosomes', 175, 205, 60, 260)}{L('flagella', 490, 190, 500, 250)}
    </svg>
  )
}
