import { useRef, useState } from 'react'
import { CheckCircle2, Lightbulb, RotateCcw } from 'lucide-react'
import { Button } from '../../ui/kit'
import { play } from '../../lib/sound'
import { art, ArtStage, Sprite } from '../../lab/artKit'
import type { Bubble, Mount } from '../../scope/model'

type Stage = 'cut' | 'place' | 'drop' | 'cover' | 'result'

const STEPS: Record<Stage, { title: string; body: string }> = {
  cut: { title: 'Cut out a letter e', body: 'Tap the circled letter e in the newspaper to cut out a small square around it with the scissors.' },
  place: { title: 'Put it on the slide', body: 'Tap the glass slide to lay the paper square in the middle, the right way up so you can read it.' },
  drop: { title: 'Add one drop of water', body: 'Tap the dropper to add a single drop of water on top of the paper. This is called a wet mount: the water holds the specimen flat and lets light pass through it evenly.' },
  cover: { title: 'Lower the coverslip', body: 'The coverslip is touching the slide at one edge, at an angle. Drag the slider down to lower it onto the drop. Go slowly so the water pushes the air out.' },
  result: { title: 'Your slide is ready', body: '' },
}

function makeBubbles(speed: number): Bubble[] {
  const n = speed > 140 ? 4 + Math.floor(Math.random() * 3) : speed > 60 ? 1 + Math.floor(Math.random() * 2) : 0
  return Array.from({ length: n }, () => ({
    x: (Math.random() - 0.5) * 3.2,
    y: (Math.random() - 0.5) * 3.2,
    r: 0.1 + Math.random() * 0.35,
  }))
}

export function PrepBench({ onDone }: { onDone: (mount: Mount) => void }) {
  const [stage, setStage] = useState<Stage>('cut')
  const [angle, setAngle] = useState(45)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  // Each slider change, with the angle it started from.
  const samples = useRef<{ from: number; t: number }[]>([])

  const lower = (a: number) => {
    const now = performance.now()
    samples.current.push({ from: angle, t: now })
    samples.current = samples.current.filter((s) => now - s.t < 200)
    setAngle(a)
    if (a <= 0) {
      // How fast the last 0.2 s of lowering was, in degrees per second. A single jump counts as very fast.
      const first = samples.current[0]
      const span = Math.max(0.1, (now - first.t) / 1000 + 0.016)
      const speed = (first.from - a) / span
      const b = makeBubbles(speed)
      setBubbles(b)
      play('drop')
      setStage('result')
    }
  }

  const redo = () => {
    setStage('cut'); setAngle(45); setBubbles([]); samples.current = []
  }

  const step = STEPS[stage]
  const paperOnSlide = stage !== 'cut' && stage !== 'place'
  const water = stage === 'cover' || stage === 'result'

  return (
    <div className="station prep">
      <aside className="station-guide">
        <div className="card">
          <span className="eyebrow">Prepare a slide</span>
          <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">{step.title}</h2>
          {stage !== 'result' && <p className="leading-relaxed">{step.body}</p>}
          {stage === 'cover' && (
            <p className="mt-3 flex gap-2 rounded-xl bg-[var(--color-accent-soft)] p-3 text-[0.95rem] leading-snug">
              <Lightbulb size={18} className="mt-0.5 flex-none text-[#9a6400]" /> Dropping the coverslip flat traps air under it. Air bubbles look like dark rings in the microscope and get in the way.
            </p>
          )}
          {stage === 'result' && (
            bubbles.length === 0 ? (
              <p className="flex gap-2 leading-relaxed"><CheckCircle2 className="mt-0.5 flex-none text-[var(--color-ok)]" /> No air bubbles. A clean wet mount.</p>
            ) : (
              <div className="grid gap-3">
                <p className="leading-relaxed">You trapped <b>{bubbles.length} air bubble{bubbles.length > 1 ? 's' : ''}</b>. You can see them as rings on the slide. Under the microscope they will show up as dark-edged circles.</p>
                <p className="leading-relaxed text-[var(--color-muted)]">You can make the slide again, or keep this one and see what bubbles look like.</p>
              </div>
            )
          )}
          {stage === 'result' && (
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={redo}><RotateCcw size={18} /> Make it again</Button>
              <Button onClick={() => onDone({ specimen: 'letter-e', bubbles })}>Take it to the microscope</Button>
            </div>
          )}
        </div>
      </aside>

      <section className="prep-bench card" aria-label="Lab bench">
        <ArtStage label="Bench with newspaper, scissors, slide, dropper and coverslips">
          {/* Newspaper clipping: a photo of blank newsprint with the article printed on it in code. */}
          <g transform="translate(40 40) rotate(-4)">
            <image href={art('p0/newsprint')} x="-6" y="-4" width="262" height="310" preserveAspectRatio="none" filter="url(#photoSh)" />
            <g style={{ mixBlendMode: 'multiply' }}>
              {Array.from({ length: 13 }, (_, i) => (
                <text key={i} x="16" y={40 + i * 19} fontFamily="Georgia, serif" fontSize="12.5" fill="#2e2e2e" opacity="0.88">
                  {['Students at the school will', 'help the science club build', 'a new garden next week. The', 'plan includes fresh beds for', 'herbs, a small pond and a', 'shelter where bees can rest.', 'Parents are welcome to join', 'the team on Saturday morning,', 'when the first seeds will be', 'planted near the east gate.', 'Tools and gloves are provided', 'and the club asks everyone to', 'bring a bottle of water along.'][i]}
                </text>
              ))}
              <text x="16" y="22" fontFamily="Georgia, serif" fontWeight="700" fontSize="15" fill="#151515">Garden project begins</text>
            </g>
            {stage === 'cut' ? (
              <g onClick={() => { play('clip'); setStage('place') }} className="cursor-pointer">
                <circle cx="38" cy="55" r="13" fill="rgba(242,165,22,0.15)" stroke="#f2a516" strokeWidth="3" strokeDasharray="5 4" className="attention-svg" />
                <rect x="14" y="32" width="48" height="46" fill="transparent" />
              </g>
            ) : (
              <rect x="29" y="45" width="18" height="18" fill="#c9c9c4" opacity="0.9" />
            )}
          </g>

          <Sprite src="p0/scissors" x={250} y={380} w={170} h={83} rot={-24} opacity={stage === 'cut' ? 1 : 0.85} />

          {/* Glass slide */}
          <g transform="translate(330 250)" onClick={() => { if (stage === 'place') { play('slide'); setStage('drop') } }} className={stage === 'place' ? 'cursor-pointer' : ''}>
            <image href={art('shared/slide')} x="-12" y="-8" width="404" height="136" opacity="0.88" filter="url(#sh)" />
            <text x="48" y="66" textAnchor="middle" fontWeight="800" fontSize="14" fill="#5a6779">e</text>
            {stage === 'place' && <rect x="-6" y="-6" width="392" height="132" rx="10" fill="none" stroke="#f2a516" strokeWidth="4" strokeDasharray="10 7" />}
            {paperOnSlide && (
              <g>
                {water && <ellipse cx="205" cy="60" rx={stage === 'result' ? 62 : 34} ry={stage === 'result' ? 46 : 26} fill="rgba(120,190,235,0.35)" />}
                <rect x="190" y="45" width="30" height="30" fill="#dcdcd6" stroke="#b9b9b2" />
                <text x="205" y="67" textAnchor="middle" fontFamily="Georgia, serif" fontSize="22" fill="#1c1c1c">e</text>
                {water && stage !== 'result' && <ellipse cx="205" cy="58" rx="26" ry="18" fill="rgba(140,205,245,0.45)" stroke="rgba(80,150,200,0.6)" />}
              </g>
            )}
            {stage === 'result' && bubbles.map((b, i) => (
              <circle key={i} cx={205 + b.x * 22} cy={60 - b.y * 16} r={3 + b.r * 9} fill="rgba(255,255,255,0.55)" stroke="#5a6779" strokeWidth="1.5" />
            ))}
            {stage === 'result' && (
              <rect x="150" y="10" width="110" height="100" rx="2" fill="rgba(225,240,250,0.28)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
            )}
            {stage === 'cover' && (
              <g transform={`translate(150 60) rotate(${-angle * 0.9})`}>
                <rect x="0" y="-3" width="112" height="6" rx="1.5" fill="rgba(214,236,247,0.9)" stroke="#7fb0cc" strokeWidth="1.5" />
              </g>
            )}
          </g>

          {/* Dropper */}
          <g
            transform={`translate(${stage === 'drop' ? 535 : 705} ${stage === 'drop' ? 175 : 150})`}
            onClick={() => { if (stage === 'drop') { play('drop'); setStage('cover') } }}
            className={stage === 'drop' ? 'cursor-pointer' : ''}
          >
            {stage === 'drop' && <circle cx="0" cy="0" r="72" fill="rgba(242,165,22,0.1)" stroke="#f2a516" strokeWidth="3" strokeDasharray="8 6" />}
            <Sprite src="shared/dropper" x={0} y={0} w={24} h={132} rot={stage === 'drop' ? 0 : 8} />
          </g>

          <Sprite src="p0/coverslips" x={620} y={78} w={80} h={85} />
        </ArtStage>

        {stage === 'cover' && (
          <div className="prep-lower">
            <span className="text-sm font-extrabold text-[var(--color-muted)]">Down</span>
            <input
              type="range" min={0} max={45} step={1}
              value={angle}
              onChange={(e) => lower(Number(e.target.value))}
              aria-label="Lower the coverslip"
              className="ctl-range prep-range attention"
              style={{ ['--fill' as string]: `${(angle / 45) * 100}%`, ['--tint' as string]: 'var(--color-primary)' }}
            />
            <span className="text-sm font-extrabold text-[var(--color-muted)]">Raised</span>
          </div>
        )}
      </section>
    </div>
  )
}
