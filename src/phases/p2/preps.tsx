import { Hot, type PrepDef, type SceneProps } from '../../lab/PrepRunner'
import { ArtStage, BlotSprite, Drip, Sprite, VideoInset } from '../../lab/artKit'
import { Caption, mix } from '../p1/sceneKit'

const C = (n: string) => `confocal/${n}`
const T = (n: string) => `tem/${n}`
type RGB = [number, number, number]

// ---------------------------------------------------------------------------
// Living cells for the confocal microscope

function DishWithCells({ x, y, dyes, rinsed, lid }: { x: number; y: number; dyes: number; rinsed: boolean; lid: boolean }) {
  // The dye tints the medium faintly until it is rinsed away; the cells stay stained.
  return (
    <g>
      <Sprite src={C('dish')} x={x} y={y} w={190} h={194} />
      {!rinsed && dyes > 0 && <circle cx={x} cy={y} r={76} fill={mix([235, 120, 135], [120, 90, 200], dyes / 3, 0.12 + 0.1 * dyes)} />}
      {/* the living cells on the glass window, too small to see one by one */}
      <circle cx={x} cy={y} r={34} fill="rgba(255,255,255,0.12)" stroke="rgba(120,90,110,0.35)" strokeDasharray="2 3" />
      {lid && <Sprite src={C('lid')} x={x + 4} y={y - 4} w={196} h={200} opacity={0.75} />}
    </g>
  )
}

function ConfocalPrepScene({ flags, active, progress }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const dyes = ['hoechst', 'tubulin', 'actin'].filter(has).length
  const pipetting = (id: string) => active === id && progress > 0
  const tubes: { id: string; sprite: string; x: number; label: string; colour: string }[] = [
    { id: 'hoechst', sprite: 'tube-blue', x: 560, label: 'Hoechst', colour: 'rgba(110,100,240,0.9)' },
    { id: 'tubulin', sprite: 'tube-green', x: 650, label: 'Tubulin', colour: 'rgba(40,180,90,0.9)' },
    { id: 'actin', sprite: 'tube-purple', x: 740, label: 'SiR-actin', colour: 'rgba(120,40,140,0.9)' },
  ]
  return (
    <ArtStage label="Cell culture bench with a dish of living cells, dyes, pipette and medium">
      <Hot id={['take', 'lid']} ring={{ cx: 330, cy: 260, r: 110 }}>
        <DishWithCells x={330} y={260} dyes={dyes} rinsed={has('fresh')} lid={!has('take') || has('lid')} />
      </Hot>
      {active === 'take' && <Caption x={330} y={130}>Living human cells, grown on the glass bottom of the dish</Caption>}

      {tubes.map((t) => (
        <Hot key={t.id} id={t.id} ring={{ cx: t.x, cy: 110, r: 34 }}>
          <Sprite src={C(t.sprite)} x={t.x} y={110} w={26} h={88} />
          <text x={t.x} y={172} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">{t.label}</text>
        </Hot>
      ))}
      {tubes.map((t) => pipetting(t.id) && (
        <g key={t.id}>
          <Sprite src={C('pipette')} x={420} y={170} w={260} h={62} rot={-58} />
          <Drip x={346} y0={228} y1={252} t={progress} colour={t.colour} />
        </g>
      ))}
      {!['hoechst', 'tubulin', 'actin', 'drain', 'fresh'].some((id) => pipetting(id)) && <Sprite src={C('pipette')} x={560} y={330} w={230} h={55} rot={-8} />}

      <Hot id="incubate" ring={{ cx: 120, cy: 100, r: 60 }}>
        <g transform="translate(120 100)">
          <Sprite src="gram/timer" x={0} y={0} w={86} h={86} />
          <line x1="0" y1="0" x2="0" y2="-26" stroke="#e8590c" strokeWidth="3" strokeLinecap="round" transform={`rotate(${active === 'incubate' ? progress * 360 : 0})`} />
        </g>
        <text x={120} y={168} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">Incubator, 37 °C</text>
      </Hot>

      <Hot id="drain" ring={{ cx: 120, cy: 380, r: 66 }}>
        <Sprite src={C('beaker')} x={120} y={380} w={96} h={92} />
        <text x={120} y={444} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">Waste</text>
      </Hot>
      <Hot id="fresh" ring={{ cx: 700, cy: 380, r: 70 }}>
        <Sprite src={C('medium')} x={700} y={380} w={150} h={72} rot={-6} />
        <text x={700} y={440} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">Fresh warm medium</text>
      </Hot>
      {(pipetting('drain') || pipetting('fresh')) && <Sprite src={C('pipette')} x={420} y={170} w={260} h={62} rot={-58} />}
    </ArtStage>
  )
}

export const CONFOCAL_PREP: PrepDef = {
  name: 'Staining living cells',
  Scene: ConfocalPrepScene,
  steps: [
    { id: 'take', kind: 'tap', action: 'Tap the dish to take off the lid', title: 'Living cells', body: 'These are living human cells, grown in a dish with a thin glass bottom. They are alive and must stay warm and wet. Nothing here kills them: that is the whole point of the confocal microscope.' },
    { id: 'hoechst', kind: 'drag', action: 'Drag to add Hoechst', title: 'Dye 1: Hoechst', body: 'Add a few drops of Hoechst. It passes into living cells and sticks to DNA, so the nucleus will glow blue when violet laser light hits it.' },
    { id: 'tubulin', kind: 'drag', action: 'Drag to add the tubulin dye', title: 'Dye 2: tubulin dye', body: 'This dye sticks to tubulin, the protein that microtubules are made of. It will glow green under blue (488 nm) laser light.' },
    { id: 'actin', kind: 'drag', action: 'Drag to add SiR-actin', title: 'Dye 3: SiR-actin', body: 'SiR-actin sticks to actin, the protein of microfilaments. It glows deep red under red (640 nm) laser light; the computer shows it as magenta.' },
    { id: 'incubate', kind: 'timer', seconds: 3600, action: 'Tap the incubator', title: 'Back to the incubator', body: 'Put the dish back in the incubator for one hour at body temperature, 37 °C, so the dyes have time to soak into the living cells.' },
    { id: 'drain', kind: 'drag', action: 'Drag to remove the old medium', title: 'Remove the dye', body: 'Pipette the coloured medium out of the dish into the waste beaker. Leftover dye in the liquid would glow everywhere and blur the image.' },
    { id: 'fresh', kind: 'drag', action: 'Drag to add fresh medium', title: 'Fresh, warm medium', body: 'Add fresh medium warmed to 37 °C so the cells stay healthy while you image them.' },
    { id: 'lid', kind: 'tap', action: 'Tap the dish to put the lid back on', title: 'Lid on', body: 'Put the lid back on to keep the cells clean. The dish is ready for the confocal microscope.' },
  ],
  mount: () => ({ specimen: 'letter-e', bubbles: [] }),
  verdict: () => null,
}

// ---------------------------------------------------------------------------
// Fixing, embedding, sectioning and staining cells for the electron microscope

const LIQ: Record<string, RGB> = {
  fix: [225, 235, 240],
  osmium: [40, 40, 45],
  ethanol: [235, 240, 245],
  resin: [215, 170, 60],
}

function TemPrepScene({ flags, active, progress }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const liquid = has('resin') ? LIQ.resin : has('ethanol') || (active === 'ethanol' && progress > 0) ? LIQ.ethanol : has('osmium') || (active === 'osmium' && has('osmium:started')) ? LIQ.osmium : has('fix') || (active === 'fix' && has('fix:started')) ? LIQ.fix : null
  const pelletDark = has('osmium') || (active === 'osmium' && has('osmium:started') && progress > 0.4)
  const embedded = has('embed')
  const onGrid = has('pickup')
  return (
    <ArtStage label="Electron microscopy preparation bench">
      {/* The sample: a small pellet of cells in a glass beaker, then a resin block, then sections on a grid. */}
      {!embedded && (
        <g>
          <Sprite src={C('beaker')} x={330} y={250} w={140} h={134} />
          {liquid && <ellipse cx={330} cy={262} rx={44} ry={28} fill={`rgb(${liquid.join(',')})`} opacity={liquid === LIQ.osmium ? 0.75 : 0.45} />}
          <ellipse cx={330} cy={272} rx={12} ry={6} fill={pelletDark ? '#2a2a2e' : '#e9dfd2'} stroke="rgba(0,0,0,0.25)" />
          <text x={330} y={340} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">Cells (the same kind as before)</text>
        </g>
      )}
      {embedded && !onGrid && (
        <Hot id="pickup" ring={{ cx: 330, cy: 250, r: 70 }}>
          <Sprite src={T('capsule')} x={330} y={250} w={44} h={100} />
          <text x={330} y={325} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">{has('cure') ? 'Hard resin block' : 'Liquid resin'}</text>
        </Hot>
      )}
      {onGrid && (
        <g>
          <Sprite src={T('grid')} x={330} y={250} w={90} h={90} />
          <rect x={312} y={238} width={36} height={8} fill="rgba(200,160,80,0.45)" />
          <text x={330} y={318} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">Sections on a copper grid (3 mm)</text>
        </g>
      )}

      <Hot id="fix" ring={{ cx: 80, cy: 90, r: 46 }}><Sprite src={T('fixative')} x={80} y={90} w={34} h={82} /><Label x={80} y={150} t="Fixative" /></Hot>
      <Hot id="osmium" ring={{ cx: 175, cy: 90, r: 46 }}><Sprite src={T('osmium')} x={175} y={90} w={34} h={82} /><Label x={175} y={150} t="Osmium" /></Hot>
      <Hot id="ethanol" ring={{ cx: 290, cy: 100, r: 60 }}><Sprite src={T('ethanol-rack')} x={290} y={100} w={44} h={132} rot={90} /><Label x={290} y={150} t="Alcohol series" /></Hot>
      <Hot id="resin" ring={{ cx: 405, cy: 90, r: 46 }}><Sprite src={T('resin')} x={405} y={90} w={38} h={80} /><Label x={405} y={150} t="Resin" /></Hot>
      <Hot id="embed" ring={{ cx: 495, cy: 95, r: 42 }}><Sprite src={T('capsule')} x={495} y={95} w={30} h={68} /><Label x={495} y={150} t="Capsule" /></Hot>
      <Hot id="cure" ring={{ cx: 120, cy: 300, r: 62 }}>
        <g transform="translate(120 300)">
          <Sprite src="gram/timer" x={0} y={0} w={86} h={86} />
          <line x1="0" y1="0" x2="0" y2="-26" stroke="#e8590c" strokeWidth="3" strokeLinecap="round" transform={`rotate(${active === 'cure' ? progress * 360 * 4 : 0})`} />
        </g>
        <Label x={120} y={366} t="Oven, 60 °C" />
      </Hot>
      <Hot id="cut" ring={{ cx: 560, cy: 300, r: 60 }}>
        <g transform="translate(560 300)">
          <rect x="-56" y="-40" width="112" height="80" rx="10" fill="#3b4655" />
          <rect x="-40" y="-26" width="80" height="34" rx="4" fill="#1d2733" />
          <path d="M-30 18 L30 18 L22 30 L-22 30 Z" fill="#c9d1da" />
        </g>
        <Label x={560} y={366} t="Ultramicrotome" />
      </Hot>
      <Hot id={['ua', 'lead']} ring={{ cx: 700, cy: 300, r: 64 }}><Sprite src={T('parafilm')} x={700} y={300} w={120} h={120} /><Label x={700} y={374} t="Heavy metal stains" /></Hot>
      <Sprite src={T('grid-box')} x={700} y={110} w={130} h={90} />
      <Sprite src={T('fine-forceps')} x={600} y={190} w={180} h={18} rot={-10} />
      <Hot id="dry"><BlotSprite x={470} y={420} /></Hot>

      {active === 'cut' && <VideoInset name="ultramicrotome" p={progress} from={0.3} to={9.6} caption="Slices 70 nm thick, a thousand times thinner than paper" x={560} y={190} />}
      {active === 'fix' && <Caption x={330} y={180}>Kills the cells instantly and locks every protein in place</Caption>}
      {active === 'osmium' && <Caption x={330} y={180}>A heavy metal: it sticks to membranes and stains them black</Caption>}
    </ArtStage>
  )
}

function Label({ x, y, t }: { x: number; y: number; t: string }) {
  return <text x={x} y={y} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">{t}</text>
}

export const TEM_PREP: PrepDef = {
  name: 'Preparing cells for the electron microscope',
  Scene: TemPrepScene,
  steps: [
    { id: 'fix', kind: 'timer', seconds: 7200, action: 'Tap the glutaraldehyde', title: 'Fix: kill and preserve', body: 'Electrons only travel in a vacuum, and a vacuum would boil a living cell. So the cells are killed first with glutaraldehyde, which links their proteins together so every structure stays exactly where it was. This takes two hours.', tip: 'This is why an electron microscope can never show living, moving cells.' },
    { id: 'osmium', kind: 'timer', seconds: 3600, action: 'Tap the osmium tetroxide', title: 'Stain membranes with osmium', body: 'Osmium tetroxide is a heavy metal compound. Heavy atoms block electrons, so wherever osmium sticks (on membranes) the image will be dark. One hour, in a fume cupboard: osmium is very toxic.' },
    { id: 'ethanol', kind: 'repeat', times: 5, action: 'Tap the alcohol rack for each strength', title: 'Remove all the water', body: 'Water would boil away in the vacuum, so it is replaced with alcohol, step by step: 30%, 50%, 70%, 90% and finally 100%. Going slowly stops the cells from shrinking.' },
    { id: 'resin', kind: 'timer', seconds: 43200, action: 'Tap the resin', title: 'Soak in resin', body: 'Liquid plastic resin slowly replaces the alcohol and fills every space inside the cells. This takes all night.' },
    { id: 'embed', kind: 'tap', action: 'Tap the capsule', title: 'Fill a capsule', body: 'Put the cells into the pointed tip of a small capsule and fill it with fresh resin.' },
    { id: 'cure', kind: 'timer', seconds: 172800, action: 'Tap the oven', title: 'Harden in the oven', body: 'Bake the capsule at 60 °C for two days. The resin sets into a hard plastic block with the cells inside, like insects in amber.' },
    { id: 'cut', kind: 'drag', action: 'Drag to cut ultra-thin sections', title: 'Cut ultra-thin slices', body: 'An ultramicrotome moves the block past a diamond knife again and again. Each slice is about 70 nanometres thick. The slices float off onto water as a shiny ribbon.' },
    { id: 'pickup', kind: 'tap', action: 'Tap the block to pick up the slices on a grid', title: 'Onto a copper grid', body: 'Lift the floating slices onto a tiny copper grid, 3 mm across. The grid is a mesh: the electrons pass through the slices in the open squares between the copper bars.' },
    { id: 'ua', kind: 'timer', seconds: 600, action: 'Tap the stain drops', title: 'Stain with uranyl acetate', body: 'Float the grid on a drop of uranyl acetate for 10 minutes. Uranium is a very heavy atom; it sticks to proteins and DNA and makes them dark.' },
    { id: 'lead', kind: 'timer', seconds: 300, action: 'Tap the stain drops again', title: 'Stain with lead citrate', body: 'Then 5 minutes on lead citrate, another heavy metal, which adds more contrast to ribosomes and membranes.' },
    { id: 'dry', kind: 'tap', action: 'Tap the blotting paper', title: 'Rinse and dry', body: 'Rinse the grid and dry it on blotting paper. Your specimen is a dead, dry, metal-stained plastic slice: about three days of work for one grid.' },
  ],
  mount: () => ({ specimen: 'letter-e', bubbles: [] }),
  verdict: () => null,
}

