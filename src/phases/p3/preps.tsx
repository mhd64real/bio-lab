import { useEffect, useState, type ReactNode } from 'react'
import { CheckCircle2, Circle, FastForward } from 'lucide-react'
import { Hot, type PrepDef, type SceneProps } from '../../lab/PrepRunner'
import { ArtStage, Drip, PhotoSlide, Sprite, VideoInset } from '../../lab/artKit'
import { Caption, CoverInset } from '../p1/sceneKit'
import { Button } from '../../ui/kit'
import { play } from '../../lib/sound'
import type { PrepStep } from '../../lab/PrepRunner'

const P = (n: string) => `p3/${n}`
const POND = 'rgba(165,175,120,0.45)'

function Label({ x, y, t }: { x: number; y: number; t: string }) {
  return <text x={x} y={y} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">{t}</text>
}

// ---------------------------------------------------------------------------
// Pond water

function PondScene({ flags, active, progress, angle, bubbles }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const holding = has('sample') && !has('drop')
  const slowed = has('slow')
  const liquid = slowed ? 'rgba(175,180,140,0.5)' : POND
  return (
    <ArtStage label="Bench with a jar of pond water, a dropper, methyl cellulose and a slide">
      <Hot id="sample" ring={{ cx: 170, cy: 240, r: 120 }}>
        <Sprite src={P('pond')} x={170} y={240} w={160} h={218} />
        <Label x={170} y={370} t="Pond water" />
      </Hot>
      {active === 'sample' && <Caption x={170} y={110}>Small living things gather near the plants at the bottom</Caption>}
      <Hot id="drop" ring={{ cx: 630, cy: 400, r: 70 }}>
        <PhotoSlide x={600} y={400} label="Pond" bubbles={bubbles} cover={has('cover')}>
          {has('drop') && <ellipse rx={has('cover') ? 46 : 24} ry={has('cover') ? 40 : 18} fill={liquid} />}
        </PhotoSlide>
      </Hot>
      {holding || active === 'drop'
        ? <g><Sprite src="shared/dropper" x={630} y={300} w={24} h={130} /><Drip x={630} y0={364} y1={392} t={active === 'drop' ? progress : 0} colour={POND} /></g>
        : <Sprite src="shared/dropper" x={360} y={300} w={22} h={122} rot={70} />}
      <Hot id="slow" ring={{ cx: 470, cy: 120, r: 54 }}>
        <Sprite src="gram/alcohol" x={470} y={120} w={38} h={110} />
        <Label x={470} y={190} t="Methyl cellulose" />
      </Hot>
      {active === 'slow' && progress > 0 && <Drip x={630} y0={330} y1={392} t={progress} colour="rgba(240,240,235,0.9)" />}
      {active === 'cover' && <CoverInset x={560} y={170} angle={angle} liquid={liquid} />}
    </ArtStage>
  )
}

export const POND_PREP: PrepDef = {
  name: 'Pond water wet mount',
  Scene: PondScene,
  steps: [
    { id: 'sample', kind: 'tap', action: 'Tap the jar to fill the dropper', title: 'A drop of pond water', body: 'Squeeze the dropper bulb, lower it to the bottom of the jar near the plants, and let go to suck up some water. Tiny living cells feed there.' },
    { id: 'drop', kind: 'drag', action: 'Drag to put one drop on the slide', title: 'Onto the slide', body: 'Put one drop in the middle of a clean slide.' },
    { id: 'slow', kind: 'drag', action: 'Drag to add methyl cellulose', title: 'Slow them down', body: 'Add a small drop of methyl cellulose, a thick, harmless syrup. It slows the swimmers down so you can follow them. Do not add any stain: stains would kill them.' },
    { id: 'cover', kind: 'lower', action: 'Lower the coverslip', title: 'Lower the coverslip', body: 'Lower the coverslip slowly at an angle.' },
  ],
  mount: (o) => ({ specimen: 'pond', bubbles: o.bubbles }),
  verdict: (o) => (o.bubbles.length ? <p className="leading-relaxed">You trapped <b>{o.bubbles.length} air bubble{o.bubbles.length > 1 ? 's' : ''}</b>. You can make it again or keep it.</p> : null),
}

// ---------------------------------------------------------------------------
// Elodea leaf

function ElodeaScene({ flags, active, progress, angle, bubbles }: SceneProps) {
  const has = (f: string) => flags.has(f)
  return (
    <ArtStage label="Bench with Elodea in water, forceps, a dropper and a slide">
      <Hot id="leaf" ring={{ cx: 180, cy: 240, r: 110 }}>
        <Sprite src={P('elodea')} x={180} y={240} w={150} h={204} />
        <Label x={180} y={360} t="Elodea (pondweed)" />
      </Hot>
      {active === 'leaf' && <Caption x={180} y={115}>Pick one young leaf near the tip</Caption>}
      <Sprite src="shared/forceps" x={420} y={300} w={160} h={19} rot={-14} />
      <Hot id="water" ring={{ cx: 730, cy: 250, r: 62 }}>{active !== 'water' && <Sprite src="shared/dropper" x={730} y={250} w={22} h={122} rot={8} />}</Hot>
      {active === 'water' && <g><Sprite src="shared/dropper" x={630} y={300} w={24} h={130} /><Drip x={630} y0={364} y1={392} t={progress} colour="rgba(150,205,240,0.85)" /></g>}
      <Hot id={['lay']} ring={{ cx: 630, cy: 400, r: 70 }}>
        <PhotoSlide x={600} y={400} label="Elodea" bubbles={bubbles} cover={has('cover')}>
          {has('water') && <ellipse rx={has('cover') ? 46 : 24} ry={has('cover') ? 40 : 18} fill="rgba(150,205,240,0.4)" />}
          {has('lay') && <path d="M-18 0 Q0 -9 18 0 Q0 9 -18 0 Z" fill="rgba(80,150,60,0.75)" stroke="rgba(50,110,40,0.8)" strokeWidth="0.8" />}
        </PhotoSlide>
      </Hot>
      {active === 'cover' && <CoverInset x={560} y={170} angle={angle} liquid="rgba(150,205,240,0.45)" />}
    </ArtStage>
  )
}

export const ELODEA_PREP: PrepDef = {
  name: 'Elodea leaf wet mount',
  Scene: ElodeaScene,
  steps: [
    { id: 'water', kind: 'tap', action: 'Tap the dropper', title: 'A drop of water', body: 'Put a drop of water from the plant’s own tank on a clean slide.' },
    { id: 'leaf', kind: 'tap', action: 'Tap the Elodea to pull off a leaf', title: 'Take one leaf', body: 'With the forceps, pull off one young leaf near the tip of the stem. Elodea leaves are only two cells thick, so light passes straight through them.' },
    { id: 'lay', kind: 'tap', action: 'Tap the slide to lay the leaf in the drop', title: 'Lay it in the drop', body: 'Lay the leaf flat in the water, top side up. No stain is needed: the chloroplasts are already green.' },
    { id: 'cover', kind: 'lower', action: 'Lower the coverslip', title: 'Lower the coverslip', body: 'Lower the coverslip slowly at an angle.' },
  ],
  mount: (o) => ({ specimen: 'elodea', bubbles: o.bubbles }),
  verdict: (o) => (o.bubbles.length ? <p className="leading-relaxed">You trapped <b>{o.bubbles.length} air bubble{o.bubbles.length > 1 ? 's' : ''}</b>. You can make it again or keep it.</p> : null),
}

// ---------------------------------------------------------------------------
// Scanning electron microscope preparation

function SemScene({ flags, active, progress }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const onStub = has('mount')
  return (
    <ArtStage label="Bench with tissue, fixative, alcohol series, critical point dryer, stubs, carbon tape and sputter coater">
      {!onStub && (
        <Hot id="mount" ring={{ cx: 330, cy: 250, r: 80 }}>
          <Sprite src={P('tissue')} x={330} y={250} w={140} h={132} />
          <Label x={330} y={330} t={has('cpd') ? 'Dried tissue' : 'Windpipe lining'} />
        </Hot>
      )}
      <Hot id="fix" ring={{ cx: 90, cy: 90, r: 46 }}><Sprite src="tem/fixative" x={90} y={90} w={34} h={82} /><Label x={90} y={150} t="Fixative" /></Hot>
      <Hot id="ethanol" ring={{ cx: 210, cy: 100, r: 60 }}><Sprite src="tem/ethanol-rack" x={210} y={100} w={44} h={132} rot={90} /><Label x={210} y={150} t="Alcohol series" /></Hot>
      <Hot id="cpd" ring={{ cx: 120, cy: 330, r: 80 }}><Sprite src={P('cpd')} x={120} y={330} w={130} h={136} /><Label x={120} y={420} t="Critical point dryer" /></Hot>
      <Hot id="tape" ring={{ cx: 470, cy: 110, r: 50 }}><Sprite src={P('tape')} x={470} y={110} w={80} h={71} /><Label x={470} y={165} t="Carbon tape" /></Hot>
      <g>
        <Sprite src={P('stub')} x={560} y={300} w={70} h={70} />
        {has('tape') && <ellipse cx={560} cy={290} rx={18} ry={9} fill="#151515" opacity="0.9" />}
        {onStub && <ellipse cx={560} cy={288} rx={11} ry={6} fill={has('coat') ? '#d9b34a' : '#e8d8c8'} stroke={has('coat') ? '#a07a1c' : '#c9b19c'} />}
        <Label x={560} y={350} t="Aluminium stub" />
      </g>
      <Hot id="coat" ring={{ cx: 710, cy: 320, r: 90 }}><Sprite src={P('sputter')} x={710} y={320} w={150} h={178} /><Label x={710} y={425} t="Sputter coater" /></Hot>
      {active === 'coat' && <VideoInset name="sputter" p={progress} from={0.3} to={9.6} caption="A layer of gold a few atoms thick" x={560} y={170} />}
      {active === 'cpd' && <Caption x={330} y={150}>Air-drying would crush the cilia flat</Caption>}
    </ArtStage>
  )
}

export const SEM_PREP: PrepDef = {
  name: 'Preparing tissue for the scanning electron microscope',
  Scene: SemScene,
  steps: [
    { id: 'fix', kind: 'timer', seconds: 7200, action: 'Tap the fixative', title: 'Fix the tissue', body: 'This is a small piece of the lining of a windpipe, from a sheep. Fixative locks every protein in place, so the cilia keep their shape. Like the TEM, the SEM uses a vacuum, so the tissue must be dead and dry.' },
    { id: 'ethanol', kind: 'repeat', times: 5, action: 'Tap the alcohol rack for each strength', title: 'Remove the water', body: 'Replace the water with alcohol step by step: 30%, 50%, 70%, 90%, 100%.' },
    { id: 'cpd', kind: 'timer', seconds: 5400, action: 'Tap the critical point dryer', title: 'Dry without crushing', body: 'If the tissue simply dried in air, the surface tension of the evaporating liquid would pull the delicate cilia flat and stick them together. In a critical point dryer the liquid is turned into gas under high pressure without ever forming a surface, so nothing is crushed.' },
    { id: 'tape', kind: 'tap', action: 'Tap the carbon tape', title: 'A sticky tab', body: 'Stick a disc of black carbon tape onto an aluminium stub. Carbon carries electric charge away from the sample.' },
    { id: 'mount', kind: 'tap', action: 'Tap the dried tissue', title: 'Mount the tissue', body: 'Press the dried tissue onto the tab, lining side up so the cilia face the beam.' },
    { id: 'coat', kind: 'drag', action: 'Drag to coat the sample with gold', title: 'Coat it with gold', body: 'In the sputter coater a purple glow of charged gas knocks gold atoms off a gold plate. They settle on the sample as a layer only a few atoms thick. The gold conducts electricity and gives off many electrons when the beam hits it, which makes a bright, sharp image.' },
  ],
  mount: () => ({ specimen: 'letter-e', bubbles: [] }),
  verdict: () => null,
}

// ---------------------------------------------------------------------------
// TEM preparation, replayed: the same method as Phase 2, only the sample changes.

export function ReplayPrep({ title, sample, note, steps, onDone }: { title: string; sample?: string; note?: ReactNode; steps: Pick<PrepStep, 'id' | 'title'>[]; onDone: () => void }) {
  const [done, setDone] = useState(-1)
  const running = done >= 0 && done < steps.length
  useEffect(() => {
    if (!running) return
    const id = window.setTimeout(() => { setDone(done + 1); play('tick') }, 380)
    return () => clearTimeout(id)
  }, [done, running])
  return (
    <div className="mx-auto grid max-w-2xl gap-4 p-4">
      <div className="card">
        <span className="eyebrow">Fast replay</span>
        <h2 className="mb-2 mt-1 font-display text-2xl font-bold leading-tight">{title}</h2>
        <p className="mb-4 leading-relaxed">{note ?? <>You already know this method from Phase 2. The only change is the sample: <b>{sample}</b>. Run it to prepare a new grid.</>}</p>
        <ol className="mb-4 grid gap-1.5">
          {steps.map((st, i) => (
            <li key={st.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 font-bold ${i < done ? 'text-[var(--color-ok)]' : i === done ? 'bg-[var(--color-accent-soft)]' : 'text-[var(--color-faint)]'}`}>
              {i < done ? <CheckCircle2 size={18} /> : <Circle size={18} />} {st.title}
            </li>
          ))}
        </ol>
        <div className="flex justify-end gap-2">
          {done < 0 && <Button onClick={() => setDone(0)}><FastForward size={18} /> Run the preparation</Button>}
          {done >= steps.length && <Button onClick={onDone}>Take it to the microscope</Button>}
        </div>
      </div>
    </div>
  )
}
