import { Hot, type PrepDef, type SceneProps } from '../../lab/PrepRunner'
import { ArtStage, BlotSprite, Drip, Inset, PhotoSlide, Sprite } from '../../lab/artKit'
import { Caption, CoverInset, mix } from '../p1/sceneKit'

// Photo sprites (public/art/p5 and shared); liquids, the peeled skin and the smear are drawn in code.
const WATER: [number, number, number] = [150, 205, 240]
const IODINE: [number, number, number] = [205, 145, 35]

const defs = (
  <>
    <pattern id="pepCells" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="rgba(235,90,50,0.35)" /><path d="M0 0.3 H5 M0.3 0 V5" stroke="rgba(150,40,20,0.45)" strokeWidth="0.5" /></pattern>
    <pattern id="starch" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="rgba(245,240,225,0.6)" /><circle cx="2.5" cy="2.5" r="1.1" fill="rgba(255,255,255,0.9)" /></pattern>
    <pattern id="starchBlue" width="5" height="5" patternUnits="userSpaceOnUse"><rect width="5" height="5" fill="rgba(110,80,60,0.35)" /><circle cx="2.5" cy="2.5" r="1.2" fill="rgba(40,30,80,0.9)" /></pattern>
  </>
)

const P5 = (n: string) => `p5/${n}`

function Pepper({ x, y }: { x: number; y: number }) {
  return <Sprite src={P5('pepper')} x={x} y={y} w={150} h={192} />
}
// The strip photo runs diagonally; rotating it by 42 degrees lays it flat.
function PepperStrip({ x, y, rot = 0, peeled, w = 120 }: { x: number; y: number; rot?: number; peeled?: boolean; w?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot + 42})`}>
      <Sprite src={P5('pepper-strip')} x={0} y={0} w={w} h={w * 1.08} />
      {peeled && <ellipse cx={w * 0.06} cy={-w * 0.06} rx={w * 0.09} ry={w * 0.05} fill="#f6b48e" transform="rotate(-42)" />}
    </g>
  )
}
function Potato({ x, y }: { x: number; y: number }) {
  return <Sprite src={P5('potato')} x={x} y={y} w={180} h={192} rot={-8} />
}
function PotatoHalves({ x, y, scraped }: { x: number; y: number; scraped: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <Sprite src={P5('potato-halves')} x={0} y={0} w={240} h={203} />
      {scraped && <path d="M-72 -18 C-58 -24 -40 -24 -26 -16 L-28 -8 C-42 -14 -58 -14 -72 -8 Z" fill="rgba(255,255,255,0.8)" />}
    </g>
  )
}

// ---------------------------------------------------------------------------
// Red pepper

function PepperScene({ flags, active, progress, angle, bubbles }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const liquid = mix(WATER, WATER, 0, 0.45)
  const dropping = active === 'water' && progress > 0
  return (
    <ArtStage label="Bench with a red pepper, knife, forceps, water dropper and a slide" defs={defs}>
      <Sprite src="onion/board" x={200} y={268} w={340} h={240} />
      <Hot id="cut" ring={{ cx: 190, cy: 255, r: 110 }}>
        {has('cut') ? <g><Pepper x={150} y={250} /><PepperStrip x={270} y={330} rot={-8} peeled={has('peel')} /></g> : <Pepper x={190} y={255} />}
        <rect x="90" y="150" width="220" height="220" fill="transparent" />
      </Hot>
      <Sprite src="onion/knife" x={has('cut') ? 150 : 170} y={has('cut') ? 420 : 428} w={210} h={33} rot={has('cut') ? -8 : -2} />
      <Hot id="peel"><Sprite src="shared/forceps" x={420} y={330} w={160} h={19} rot={-14} /></Hot>
      <Hot id="water" ring={{ cx: 730, cy: 250, r: 66 }}>{!dropping && <Sprite src="shared/dropper" x={730} y={250} w={22} h={122} rot={8} />}</Hot>
      <Hot id="lay" ring={{ cx: 630, cy: 400, r: 70 }}>
        <PhotoSlide x={600} y={400} label="Pepper" bubbles={bubbles} cover={has('cover')}>
          {has('water') && <ellipse rx={has('cover') ? 46 : 26} ry={has('cover') ? 40 : 19} fill={liquid} />}
          {has('lay') && <path d="M-11 -9 q11 -3 22 1 q3 9 -1 18 q-11 3 -20 -1 q-3 -9 -1 -18 z" fill="url(#pepCells)" stroke="rgba(170,50,25,0.6)" strokeWidth="0.8" />}
        </PhotoSlide>
      </Hot>
      {dropping && <g><Sprite src="shared/dropper" x={630} y={298} w={24} h={130} /><Drip x={630} y0={362} y1={392} t={progress} colour={liquid} /></g>}
      {active === 'peel' && progress > 0 && (
        <Inset x={560} y={170} caption="A thin, see-through red skin">
          <PepperStrip x={-10} y={30} rot={0} w={170} />
          <path d={`M-20 18 C${-20 + progress * 30} ${18 - progress * 50} ${-10 + progress * 60} ${10 - progress * 70} ${10 + progress * 70} ${-progress * 60}`} stroke="rgba(240,110,70,0.75)" strokeWidth={10} fill="none" strokeLinecap="round" />
          <g transform={`translate(${10 + progress * 70} ${-progress * 60}) rotate(-30)`}><Sprite src="shared/forceps" x={60} y={0} w={130} h={16} shadow={false} /></g>
        </Inset>
      )}
      {active === 'cut' && <Caption x={190} y={128}>A ripe red pepper</Caption>}
      {active === 'cover' && <CoverInset x={560} y={170} angle={angle} liquid={liquid} />}
    </ArtStage>
  )
}

export const PEPPER_PREP: PrepDef = {
  name: 'Red pepper wet mount',
  Scene: PepperScene,
  steps: [
    { id: 'cut', kind: 'tap', action: 'Tap the pepper to cut a strip', title: 'Cut a strip', body: 'Cut a thin strip from the wall of a ripe red pepper.' },
    { id: 'water', kind: 'tap', action: 'Tap the water dropper', title: 'A drop of water', body: 'Put one drop of water in the middle of a clean slide.' },
    { id: 'peel', kind: 'drag', action: 'Drag to peel the skin', title: 'Peel the red skin', body: 'Bend the strip, grip the shiny outer skin with the forceps and peel off a very thin piece, with as little flesh as possible. It should be thin enough to see light through.' },
    { id: 'lay', kind: 'tap', action: 'Tap the slide to lay the skin in the drop', title: 'Lay it flat', body: 'Lay the piece flat in the drop. No stain is needed: the pigments that colour the pepper are already inside the cells.' },
    { id: 'cover', kind: 'lower', action: 'Lower the coverslip', title: 'Lower the coverslip', body: 'Lower the coverslip slowly at an angle.' },
  ],
  mount: (o) => ({ specimen: 'pepper', bubbles: o.bubbles }),
  verdict: (o) => (o.bubbles.length ? <p className="leading-relaxed">You trapped <b>{o.bubbles.length} air bubble{o.bubbles.length > 1 ? 's' : ''}</b>. You can make it again or keep it.</p> : null),
}

// ---------------------------------------------------------------------------
// Potato and iodine

function PotatoScene({ flags, active, progress, angle, bubbles }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const stained = has('iodine') ? 1 : active === 'iodine' && has('iodine:started') ? progress : 0
  const liquid = mix(WATER, IODINE, stained, 0.4 + 0.15 * stained)
  const dropping = (active === 'water' && progress > 0) || (active === 'iodine' && has('iodine:started'))
  const drip = active === 'water' ? progress : active === 'iodine' && has('iodine:started') ? Math.min(1, progress * 3) : 0
  const scraping = active === 'scrape' && progress > 0
  return (
    <ArtStage label="Bench with a potato, knife, iodine, water dropper and a slide" defs={defs}>
      <Sprite src="onion/board" x={200} y={268} w={340} h={240} />
      <Hot id="cut" ring={{ cx: 200, cy: 262, r: 110 }}>
        {has('cut') ? <PotatoHalves x={200} y={262} scraped={has('scrape')} /> : <Potato x={200} y={262} />}
        <rect x="90" y="160" width="230" height="210" fill="transparent" />
      </Hot>
      <Hot id={['scrape', 'smear']}>
        {scraping
          ? <Sprite src="onion/knife" x={160 + progress * 40} y={262 - progress * 4} w={190} h={30} rot={-10} />
          : <Sprite src="onion/knife" x={has('cut') ? 150 : 170} y={has('cut') ? 420 : 428} w={210} h={33} rot={has('cut') ? -8 : -2} />}
        <rect x="60" y="400" width="220" height="50" fill="transparent" />
      </Hot>
      <BlotSprite x={392} y={96} stain={has('blot') ? liquid : undefined} />
      <Hot id="iodine" ring={{ cx: 744, cy: 100, r: 60 }}>{!(active === 'iodine' && dropping) && <Sprite src="onion/iodine" x={744} y={100} w={40} h={110} />}</Hot>
      <Hot id="water" ring={{ cx: 730, cy: 250, r: 66 }}>{!(active === 'water' && dropping) && <Sprite src="shared/dropper" x={730} y={250} w={22} h={122} rot={8} />}</Hot>
      <Hot id="blot" ring={{ cx: 630, cy: 400, r: 70 }}>
        <PhotoSlide x={600} y={400} label="Potato" bubbles={bubbles} cover={has('cover')}>
          {has('water') && <ellipse rx={has('cover') ? 46 : 26} ry={has('cover') ? 40 : 19} fill={liquid} />}
          {has('smear') && <ellipse rx={has('cover') ? 30 : 16} ry={has('cover') ? 24 : 12} fill={stained > 0.5 ? 'url(#starchBlue)' : 'url(#starch)'} />}
          {has('blot') && <rect x="46" y="-34" width="34" height="68" rx="3" fill="#fbfbf7" stroke="#d9dde3" />}
        </PhotoSlide>
      </Hot>
      {dropping && (
        <g>
          {active === 'water' ? <Sprite src="shared/dropper" x={630} y={298} w={24} h={130} /> : <Sprite src="onion/iodine" x={628} y={292} w={44} h={120} rot={180} />}
          <Drip x={630} y0={360} y1={392} t={drip} colour={liquid} />
        </g>
      )}
      {active === 'scrape' && progress > 0 && <Caption x={200} y={150}>Cloudy white juice collects on the blade</Caption>}
      {active === 'cover' && <CoverInset x={560} y={170} angle={angle} liquid={liquid} />}
    </ArtStage>
  )
}

export const POTATO_PREP: PrepDef = {
  name: 'Potato starch with iodine',
  Scene: PotatoScene,
  steps: [
    { id: 'cut', kind: 'tap', action: 'Tap the potato to cut it', title: 'Cut the potato', body: 'Cut a raw potato in half. A potato is a swollen underground stem that stores food for the plant.' },
    { id: 'water', kind: 'tap', action: 'Tap the water dropper', title: 'A drop of water', body: 'Put one drop of water in the middle of a clean slide.' },
    { id: 'scrape', kind: 'drag', action: 'Drag to scrape the cut face', title: 'Scrape the cut face', body: 'Scrape the blade gently across the wet cut surface. Cloudy white juice collects on it: it is full of tiny grains from broken cells, plus some whole cells.' },
    { id: 'smear', kind: 'tap', action: 'Tap the knife to stir it into the drop', title: 'Into the drop', body: 'Touch the blade to the drop and stir the juice in.' },
    { id: 'iodine', kind: 'timer', seconds: 60, action: 'Tap the iodine bottle', title: 'Add iodine', body: 'Add one drop of iodine solution and wait one minute. Iodine is a test for starch: starch turns it blue-black.', tip: 'Iodine stains skin and clothes. One drop is enough.' },
    { id: 'cover', kind: 'lower', action: 'Lower the coverslip', title: 'Lower the coverslip', body: 'Lower the coverslip slowly at an angle.' },
    { id: 'blot', kind: 'tap', action: 'Tap the slide to blot the extra liquid', title: 'Soak up the extra liquid', body: 'Touch blotting paper to the edge of the coverslip.' },
  ],
  mount: (o) => ({ specimen: 'potato', bubbles: o.bubbles }),
  verdict: (o) => (o.bubbles.length ? <p className="leading-relaxed">You trapped <b>{o.bubbles.length} air bubble{o.bubbles.length > 1 ? 's' : ''}</b>. You can make it again or keep it.</p> : null),
}
