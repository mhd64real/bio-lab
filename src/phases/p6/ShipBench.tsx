import { useState } from 'react'
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '../../ui/kit'
import { play } from '../../lib/sound'
import { art } from '../../lab/artKit'

// Follow one exported protein (albumin, which liver cells release into the blood) through the cell
// illustration: tap each stop in order. Coordinates are in the image's own pixels (1376 x 768).
type Org = 'nucleus' | 'rer' | 'ser' | 'golgi' | 'vesicle' | 'membrane' | 'free' | 'mito'
const NAMES: Record<Org, string> = {
  nucleus: 'Nucleus', rer: 'Rough ER', ser: 'Smooth ER', golgi: 'Golgi apparatus', vesicle: 'Vesicle',
  membrane: 'Plasma membrane', free: 'Free ribosomes', mito: 'Mitochondrion',
}
const JOBS: Record<Org, string> = {
  nucleus: 'The nucleus stores the DNA: the instructions. It does not build the protein itself.',
  rer: 'Ribosomes on the rough ER make proteins for export, feeding them straight into the ER.',
  ser: 'Smooth ER has no ribosomes. It makes complex carbohydrates and lipids, and in the liver it detoxifies harmful substances.',
  golgi: 'The Golgi apparatus modifies, sorts and packages proteins into vesicles.',
  vesicle: 'Vesicles are small membrane sacs that carry materials around the cell.',
  membrane: 'The plasma membrane is the boundary of the cell.',
  free: 'Free ribosomes make proteins that stay in the cytoplasm, for use inside the cell.',
  mito: 'Mitochondria convert fuel into usable energy. They are not a stop on the protein route.',
}
type Shape = { cx: number; cy: number; rx: number; ry: number }
const HITS: { org: Org; s: Shape }[] = [
  { org: 'ser', s: { cx: 540, cy: 590, rx: 235, ry: 112 } },
  { org: 'nucleus', s: { cx: 345, cy: 255, rx: 150, ry: 160 } },
  { org: 'rer', s: { cx: 578, cy: 345, rx: 132, ry: 178 } },
  { org: 'golgi', s: { cx: 865, cy: 400, rx: 112, ry: 128 } },
  { org: 'mito', s: { cx: 793, cy: 100, rx: 80, ry: 40 } },
  { org: 'mito', s: { cx: 823, cy: 192, rx: 72, ry: 40 } },
  { org: 'mito', s: { cx: 1017, cy: 185, rx: 76, ry: 46 } },
  { org: 'free', s: { cx: 612, cy: 102, rx: 70, ry: 36 } },
  { org: 'free', s: { cx: 1115, cy: 256, rx: 24, ry: 24 } },
  { org: 'vesicle', s: { cx: 1040, cy: 346, rx: 30, ry: 30 } },
  { org: 'vesicle', s: { cx: 1100, cy: 390, rx: 32, ry: 32 } },
  { org: 'vesicle', s: { cx: 1045, cy: 437, rx: 30, ry: 30 } },
  { org: 'membrane', s: { cx: 1188, cy: 410, rx: 48, ry: 58 } },
]
const STAGES: { q: string; answer: Org; ok: string; at: [number, number]; label: [number, number] }[] = [
  { q: 'A liver cell makes albumin, a protein it releases into the blood. Where are the instructions for making albumin kept?', answer: 'nucleus', ok: 'Right. The DNA in the nucleus holds the instructions. A copy of them leaves through a nuclear pore.', at: [470, 262], label: [250, 70] },
  { q: 'Which ribosomes build a protein that will leave the cell? Tap where they are.', answer: 'rer', ok: 'Yes. Ribosomes on the rough ER build the albumin and thread it into the ER as it is made.', at: [612, 330], label: [640, 120] },
  { q: 'The new albumin is inside the ER. A small sac carries it to the next stop, where it is finished, sorted and packed. Tap that stop.', answer: 'golgi', ok: 'Right: the Golgi apparatus. It modifies the albumin and packages it into vesicles, like boots boxed in a factory.', at: [865, 404], label: [865, 250] },
  { q: 'Packed and ready. What carries the albumin from the Golgi to the edge of the cell?', answer: 'vesicle', ok: 'Yes. A vesicle buds off the Golgi with the albumin inside.', at: [1100, 390], label: [1100, 320] },
  { q: 'Where does the vesicle release the albumin?', answer: 'membrane', ok: 'Right. The vesicle fuses with the plasma membrane and releases the albumin outside the cell, into the blood.', at: [1262, 410], label: [1215, 495] },
]

const labelW = (o: Org) => 40 + NAMES[o].length * 11.5

export function ShipBench({ onDone }: { onDone: (firstTry: boolean) => void }) {
  const [stage, setStage] = useState(0)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [missed, setMissed] = useState(false)
  const [flash, setFlash] = useState<number | null>(null)
  const done = stage >= STAGES.length
  const tap = (org: Org, i: number) => {
    if (done) return
    const st = STAGES[stage]
    if (org === st.answer) {
      play('ok')
      setMsg({ ok: true, text: st.ok })
      setStage(stage + 1)
    } else {
      play('click')
      setMissed(true)
      setFlash(i)
      window.setTimeout(() => setFlash(null), 600)
      setMsg({ ok: false, text: `Not this one: the ${NAMES[org].toLowerCase()}. ${JOBS[org]}` })
    }
  }
  const tok = stage > 0 ? STAGES[stage - 1].at : null

  return (
    <div className="grid gap-4 p-4 lg:h-full lg:grid-cols-[minmax(300px,380px)_1fr]">
      <div className="grid content-start gap-3">
        <div className="card">
          <span className="eyebrow">Figures 25 and 26</span>
          <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">Ship a protein</h2>
          <p className="leading-relaxed">You have seen each organelle in the microscopes. Now follow one protein, from its instructions to the outside of the cell. Tap each stop in order.</p>
        </div>
        <div className={`card ${done ? '' : 'attention'}`}>
          {!done ? (
            <>
              <span className="eyebrow">Stop {stage + 1} of {STAGES.length}</span>
              <p className="mt-1 text-lg font-bold leading-snug">{STAGES[stage].q}</p>
            </>
          ) : (
            <>
              <span className="eyebrow">Delivered</span>
              <p className="mt-1 text-lg font-bold leading-snug">The whole route of an exported protein:</p>
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm font-extrabold">
                {['Nucleus (instructions)', 'Ribosome on rough ER', 'ER', 'Vesicle', 'Golgi apparatus', 'Vesicle', 'Plasma membrane'].map((t, i, a) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <span className="rounded-full bg-[var(--color-ok-soft)] px-2.5 py-1">{t}</span>
                    {i < a.length - 1 && <ArrowRight size={14} className="text-[var(--color-faint)]" />}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
        {msg && (
          <div className={`card text-base font-bold leading-snug ${msg.ok ? 'bg-[var(--color-ok-soft)]' : 'bg-[var(--color-accent-soft)]'}`} role="status">
            {msg.text}
          </div>
        )}
        <div className="card">
          <ol className="grid gap-1.5">
            {STAGES.map((st, i) => (
              <li key={st.answer} className={`flex items-center gap-2 font-bold ${i < stage ? 'text-[var(--color-ok)]' : i === stage ? '' : 'text-[var(--color-faint)]'}`}>
                {i < stage ? <CheckCircle2 size={18} /> : <Circle size={18} />} {i < stage ? NAMES[st.answer] : `Stop ${i + 1}`}
              </li>
            ))}
          </ol>
        </div>
        {done && <div className="flex justify-end"><Button onClick={() => onDone(!missed)}>Next: sort the organelles</Button></div>}
      </div>

      {/* The card takes the illustration's own background colour so the picture has no visible edge. */}
      <div className="card grid min-h-0 place-items-center overflow-hidden p-2" style={{ background: '#e5e9ec' }}>
        <svg viewBox="0 0 1376 768" className="h-auto max-h-full w-full select-none" role="img" aria-label="Cutaway illustration of an animal cell. Tap the organelles.">
          <image href={art('p6/cell')} width={1376} height={768} />
          {HITS.map((h, i) => (
            <ellipse
              key={i} cx={h.s.cx} cy={h.s.cy} rx={h.s.rx} ry={h.s.ry}
              className={`ship-hit ${flash === i ? 'ship-miss' : ''}`}
              onClick={() => tap(h.org, i)}
              role="button" aria-label={NAMES[h.org]}
            />
          ))}
          {STAGES.slice(0, stage).map((st) => (
            <g key={st.answer} pointerEvents="none">
              <rect x={st.label[0] - labelW(st.answer) / 2} y={st.label[1] - 22} width={labelW(st.answer)} height={40} rx={20} fill="#fff" stroke="#22b455" strokeWidth={3} />
              <text x={st.label[0]} y={st.label[1] + 6} textAnchor="middle" fontSize={21} fontWeight={800} fill="#1f2a37">{NAMES[st.answer]}</text>
            </g>
          ))}
          {tok && (
            <g pointerEvents="none" style={{ transform: `translate(${tok[0]}px, ${tok[1]}px)`, transition: 'transform 1.1s ease-in-out' }}>
              <circle r={24} fill="rgba(34,180,85,0.25)" />
              <circle r={13} fill="#22b455" stroke="#fff" strokeWidth={4} />
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
