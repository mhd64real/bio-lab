import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button, Choice } from '../../ui/kit'

interface Instrument {
  id: string
  name: string
  short: string
  seesWith: string
  specimen: string
  alive: string
  colour: string
  power: string
  inLab: string
  diagram: 'light' | 'confocal' | 'tem' | 'sem'
}

const INSTRUMENTS: Instrument[] = [
  {
    id: 'light', name: 'Light microscope', short: 'The one you just used.',
    seesWith: 'Visible light passing through the specimen',
    specimen: 'Thin and see-through: wet mounts, stained cells',
    alive: 'Yes. You can watch living cells move.',
    colour: 'Real colours (or stains you add)',
    power: 'Up to about 1,000x',
    inLab: 'Onion and cheek cells, bacteria, Paramecium, elodea',
    diagram: 'light',
  },
  {
    id: 'confocal', name: 'Fluorescence (confocal) microscope', short: 'Makes chosen parts of a cell glow.',
    seesWith: 'A laser that makes fluorescent dyes glow',
    specimen: 'Cells treated with dyes that stick to one kind of organelle',
    alive: 'Yes. You can watch organelles move inside a living cell.',
    colour: 'The colour of the glowing dye',
    power: 'Up to about 1,000x, with sharp slices through the cell',
    inLab: 'Mitochondria, the cytoskeleton, lysosomes, proteins on the move',
    diagram: 'confocal',
  },
  {
    id: 'tem', name: 'Transmission electron microscope (TEM)', short: 'Sees inside organelles.',
    seesWith: 'A beam of electrons passing through an ultra-thin slice',
    specimen: 'Fixed, dried, set in resin, sliced thinner than a wavelength of light',
    alive: 'No. The specimen is in a vacuum and must be dead.',
    colour: 'Black and white. Colour is added later by computer.',
    power: 'Up to 1,000,000x and more',
    inLab: 'Inside the nucleus, mitochondria, chloroplasts, ER, Golgi',
    diagram: 'tem',
  },
  {
    id: 'sem', name: 'Scanning electron microscope (SEM)', short: 'Sees surfaces in 3D.',
    seesWith: 'A beam of electrons scanning across the surface',
    specimen: 'Fixed, dried and coated with a thin layer of gold',
    alive: 'No. The specimen is in a vacuum and must be dead.',
    colour: 'Black and white. Colour is added later by computer.',
    power: 'Up to about 500,000x',
    inLab: 'Cilia lining the windpipe, the surface of cells',
    diagram: 'sem',
  },
]

function Diagram({ kind }: { kind: Instrument['diagram'] }) {
  const electrons = kind === 'tem' || kind === 'sem'
  const beam = kind === 'confocal' ? '#3fd07a' : electrons ? '#5aa9ff' : '#ffd25a'
  return (
    <svg viewBox="0 0 320 220" className="w-full" role="img" aria-label="How it forms an image">
      <rect width="320" height="220" rx="16" fill={electrons ? '#1d2633' : '#f6f9fc'} />
      {kind === 'light' && (<>
        <circle cx="160" cy="196" r="12" fill="#ffd25a" /><text x="186" y="200" fontSize="12" fontWeight="800" fill="#5a6779">lamp</text>
        <path d="M150 184 L170 184 L176 112 L144 112 Z" fill="#ffd25a" opacity="0.45" />
        <rect x="110" y="104" width="100" height="8" rx="2" fill="#bfe3f5" stroke="#7fb0cc" /><text x="218" y="112" fontSize="12" fontWeight="800" fill="#5a6779">living specimen</text>
        <path d="M146 104 L174 104 L168 52 L152 52 Z" fill="#ffd25a" opacity="0.35" />
        <rect x="146" y="58" width="28" height="22" rx="5" fill="#c9d1da" /><text x="182" y="74" fontSize="12" fontWeight="800" fill="#5a6779">glass lenses</text>
        <ellipse cx="160" cy="26" rx="16" ry="9" fill="#17212e" /><text x="182" y="30" fontSize="12" fontWeight="800" fill="#5a6779">your eye</text>
      </>)}
      {kind === 'confocal' && (<>
        <rect x="30" y="40" width="58" height="26" rx="6" fill="#3a4350" /><text x="36" y="58" fontSize="12" fontWeight="800" fill="#fff">laser</text>
        <path d="M88 53 L150 53 L160 120" stroke="#5aa9ff" strokeWidth="4" fill="none" />
        <rect x="100" y="120" width="120" height="10" rx="2" fill="#bfe3f5" />
        <circle cx="160" cy="125" r="7" fill={beam} /><text x="226" y="130" fontSize="12" fontWeight="800" fill="#5a6779">dye glows</text>
        <path d="M160 118 L160 62" stroke={beam} strokeWidth="4" strokeDasharray="6 5" />
        <rect x="140" y="40" width="40" height="8" fill="#17212e" /><rect x="157" y="40" width="6" height="8" fill="#f6f9fc" /><text x="188" y="48" fontSize="12" fontWeight="800" fill="#5a6779">pinhole</text>
        <rect x="140" y="12" width="40" height="18" rx="4" fill="#3a4350" /><text x="188" y="25" fontSize="12" fontWeight="800" fill="#5a6779">detector</text>
      </>)}
      {kind === 'tem' && (<>
        <rect x="140" y="12" width="40" height="18" rx="4" fill="#7c8a9e" /><text x="188" y="25" fontSize="12" fontWeight="800" fill="#c9d1da">electron gun</text>
        <path d="M156 30 L164 30 L168 100 L152 100 Z" fill={beam} opacity="0.5" />
        <rect x="118" y="100" width="84" height="6" rx="1" fill="#e8b10c" /><text x="210" y="107" fontSize="12" fontWeight="800" fill="#c9d1da">ultra-thin slice</text>
        <path d="M150 106 L170 106 L196 176 L124 176 Z" fill={beam} opacity="0.35" />
        <rect x="128" y="128" width="64" height="12" rx="6" fill="#4a5566" /><text x="200" y="138" fontSize="12" fontWeight="800" fill="#c9d1da">magnetic lenses</text>
        <rect x="110" y="178" width="100" height="12" rx="2" fill="#9be7a8" /><text x="218" y="189" fontSize="12" fontWeight="800" fill="#c9d1da">screen</text>
        <text x="16" y="208" fontSize="11" fontWeight="800" fill="#7c8a9e">all inside a vacuum</text>
      </>)}
      {kind === 'sem' && (<>
        <rect x="140" y="12" width="40" height="18" rx="4" fill="#7c8a9e" /><text x="188" y="25" fontSize="12" fontWeight="800" fill="#c9d1da">electron gun</text>
        <path d="M156 30 L164 30 L162 128 L158 128 Z" fill={beam} />
        <path d="M70 160 Q110 120 150 150 T230 140 L250 190 L60 190 Z" fill="#e8b10c" /><text x="200" y="208" fontSize="12" fontWeight="800" fill="#c9d1da">gold-coated surface</text>
        <path d="M160 132 L222 92" stroke={beam} strokeWidth="2" strokeDasharray="4 4" />
        <rect x="222" y="78" width="40" height="22" rx="4" fill="#4a5566" /><text x="228" y="72" fontSize="12" fontWeight="800" fill="#c9d1da">detector</text>
        <path d="M110 140 L210 140" stroke="#c9d1da" strokeWidth="1.5" strokeDasharray="3 5" /><text x="16" y="120" fontSize="11" fontWeight="800" fill="#7c8a9e">beam scans</text><text x="16" y="134" fontSize="11" fontWeight="800" fill="#7c8a9e">back and forth</text>
      </>)}
    </svg>
  )
}

const WHY = {
  q: 'Your textbook shows a "Color-enhanced TEM" of a mitochondrion. Why is it not a photo of a living, moving mitochondrion in its real colours?',
  options: [
    'The cell was too small to film',
    'Electrons need a vacuum, so the cell was killed, sliced and dried. Electrons have no colour, so colour was added by computer.',
    'Mitochondria do not move',
    'The microscope was broken',
  ],
  correct: 1,
  explain: 'Right. That is why living, moving cells are studied with light and fluorescence microscopes, and electron microscopes are used for the finest detail of fixed cells.',
}

export function Instruments({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const [solved, setSolved] = useState(false)
  const last = i === INSTRUMENTS.length
  const ins = INSTRUMENTS[i]
  return (
    <div className="mx-auto grid max-w-5xl gap-4 p-4">
      <div className="flex items-center gap-2">
        {INSTRUMENTS.map((x, k) => (
          <span key={x.id} className={`h-2 flex-1 rounded-full ${k <= i ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-line)]'}`} />
        ))}
        <span className={`h-2 flex-1 rounded-full ${last ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-line)]'}`} />
      </div>
      {!last ? (
        <div className="card grid gap-5 md:grid-cols-[1fr_1.1fr]">
          <div>
            <span className="eyebrow">Instrument {i + 1} of {INSTRUMENTS.length}</span>
            <h2 className="mt-1 font-display text-3xl font-bold leading-tight">{ins.name}</h2>
            <p className="mb-4 text-lg text-[var(--color-muted)]">{ins.short}</p>
            <Diagram kind={ins.diagram} />
          </div>
          <dl className="grid content-start gap-3">
            {([
              ['Sees with', ins.seesWith],
              ['Specimen', ins.specimen],
              ['Can it be alive?', ins.alive],
              ['Colour', ins.colour],
              ['Magnification', ins.power],
              ['You will use it for', ins.inLab],
            ] as const).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-[var(--color-sunk)] p-3">
                <dt className="text-sm font-extrabold text-[var(--color-muted)]">{k}</dt>
                <dd className="font-bold leading-snug">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="card">
          <span className="eyebrow">Think about it</span>
          <h2 className="mb-3 mt-1 font-display text-3xl font-bold leading-tight">Dead, sliced and coloured by computer</h2>
          <Choice item={WHY} untilCorrect onDone={() => setSolved(true)} />
        </div>
      )}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}><ArrowLeft size={18} /> Back</Button>
        {!last ? <Button onClick={() => setI(i + 1)}>Next</Button> : <Button onClick={onDone} disabled={!solved}>Next: quick check</Button>}
      </div>
    </div>
  )
}
