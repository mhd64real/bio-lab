import { Hot, type PrepDef, type SceneProps } from '../../lab/PrepRunner'
import { ArtStage, BlotSprite, Inset, PhotoSlide, Sprite } from '../../lab/artKit'
import { makeDishScene } from '../../lab/dishBench'
import { Caption, CoverInset } from '../p1/sceneKit'

// ---------------------------------------------------------------------------
// Red onion epidermis: a wet mount with no stain, because the vacuoles are already purple.

const WATER = 'rgba(150,205,240,0.45)'
const P7 = (n: string) => `p7/${n}`

// Close-up: the thin purple skin peeled off the outer side of the piece, see-through, one cell thick.
function PeelInset({ p }: { p: number }) {
  const L = 170, x0 = -85
  const peeled = p * L
  const bx = x0 + peeled
  const tipX = x0 + peeled * 0.35, tipY = -peeled * 0.5
  const ribbon = `M${bx} -4 Q${bx - peeled * 0.25} -12 ${tipX} ${tipY} L${tipX + 12} ${tipY + 12} Q${bx - peeled * 0.18} 2 ${bx} 4 Z`
  return (
    <Inset x={560} y={170} caption="One cell thick: you can see through it">
      <Sprite src={P7('redonion-piece')} x={0} y={30} w={220} h={160} shadow={false} />
      <rect x={bx} y={-6} width={Math.max(0, 85 - bx)} height={10} fill="rgba(150,40,110,0.55)" />
      {p > 0.02 && (
        <g>
          <path d={ribbon} fill="rgba(170,60,140,0.55)" stroke="rgba(120,30,90,0.7)" strokeWidth="1.2" />
          <g transform={`translate(${tipX + 6} ${tipY + 6}) rotate(-125)`}><Sprite src="shared/forceps" x={70} y={0} w={150} h={18} /></g>
        </g>
      )}
    </Inset>
  )
}

function RedOnionScene({ flags, active, progress, angle, bubbles }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const dropping = active === 'water' && progress > 0
  return (
    <ArtStage label="Lab bench with a red onion, knife, forceps and a slide" defs={<>
      <pattern id="redCells" width="14" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <rect width="14" height="6" fill="rgba(175,55,140,0.45)" />
        <path d="M0 0.25 H14 M0.25 0 V3 M7 3 V6 M0 3 H14" stroke="rgba(110,30,85,0.5)" strokeWidth="0.6" fill="none" />
      </pattern>
    </>}>
      <Sprite src="onion/board" x={200} y={268} w={340} h={240} />
      <Hot id={['cut', 'piece']} ring={{ cx: 200, cy: 262, r: 112 }}>
        {has('cut')
          ? <Sprite src={P7('redonion-half')} x={205} y={262} w={176} h={180} />
          : <Sprite src={P7('redonion-whole')} x={200} y={258} w={150} h={195} rot={-6} />}
        <rect x="90" y="160" width="230" height="210" fill="transparent" />
      </Hot>
      <Sprite src="onion/knife" x={has('cut') ? 150 : 170} y={has('cut') ? 420 : 428} w={210} h={33} rot={has('cut') ? -8 : -2} />
      {has('piece') && !has('peel') && <Sprite src={P7('redonion-piece')} x={305} y={352} w={52} h={38} rot={10} />}

      <BlotSprite x={392} y={96} stain={has('blot') ? WATER : undefined} />
      <Hot id="peel"><Sprite src="shared/forceps" x={420} y={330} w={160} h={19} rot={-14} /></Hot>
      <Hot id="water" ring={{ cx: 730, cy: 250, r: 66 }}>{!dropping && <Sprite src="shared/dropper" x={730} y={250} w={22} h={122} rot={8} />}</Hot>

      <Hot id={['lay', 'blot']} ring={{ cx: 630, cy: 400, r: 70 }}>
        <PhotoSlide x={600} y={400} label="Red onion" bubbles={bubbles} cover={has('cover')}>
          {has('water') && <ellipse rx={has('cover') ? 46 : 26} ry={has('cover') ? 40 : 19} fill={WATER} />}
          {has('lay') && <path d="M-12 -10 q12 -4 24 1 q3 10 -1 20 q-12 4 -22 -1 q-3 -10 -1 -20 z" fill="url(#redCells)" stroke="rgba(120,30,90,0.6)" strokeWidth="0.8" />}
          {has('blot') && <rect x="46" y="-34" width="34" height="68" rx="3" fill="#fbfbf7" stroke="#d9dde3" />}
        </PhotoSlide>
      </Hot>
      {dropping && (
        <g>
          <Sprite src="shared/dropper" x={630} y={298} w={24} h={130} />
          {progress < 1 && <ellipse cx="630" cy={360 + progress * 30} rx="5" ry="7" fill="rgba(150,205,240,0.85)" />}
        </g>
      )}
      {(active === 'peel' || (has('peel') && !has('lay'))) && <PeelInset p={has('peel') ? 1 : progress} />}
      {active === 'cover' && <CoverInset x={560} y={170} angle={angle} liquid={WATER} />}
      {active === 'cut' && <Caption x={200} y={140}>A whole red onion</Caption>}
      {active === 'piece' && <Caption x={208} y={140}>The colour is only in the outer skin of each ring</Caption>}
    </ArtStage>
  )
}

export const RED_ONION_PREP: PrepDef = {
  name: 'Red onion wet mount',
  Scene: RedOnionScene,
  steps: [
    { id: 'cut', kind: 'tap', action: 'Tap the red onion to cut it in half', title: 'Cut the red onion', body: 'Cut the red onion in half. Each ring is a fleshy scale leaf, white inside, with a purple-red skin on its outer side.' },
    { id: 'piece', kind: 'tap', action: 'Tap one of the rings to cut a piece out', title: 'Cut out a small piece', body: 'Cut a small piece from one of the rings, about the size of your fingernail.' },
    { id: 'water', kind: 'tap', action: 'Tap the water dropper', title: 'A drop of water on the slide', body: 'Put one drop of water in the middle of a clean slide.' },
    { id: 'peel', kind: 'drag', action: 'Drag to peel the purple skin off', title: 'Peel the purple skin', body: 'Bend the piece and grip the edge of the purple skin on its outer side with the forceps. Peel it off slowly: you want a thin, see-through layer only one cell thick.', tip: 'If the piece you peel is white and thick, you took flesh too. Try again near the edge.' },
    { id: 'lay', kind: 'tap', action: 'Tap the slide to lay the skin in the drop', title: 'Lay it flat', body: 'Lay the skin flat in the drop, purple side up.' },
    { id: 'cover', kind: 'lower', action: 'Lower the coverslip', title: 'Lower the coverslip', body: 'Touch one edge of the coverslip to the water, then lower it slowly. No stain this time: the cells are already coloured.' },
    { id: 'blot', kind: 'tap', action: 'Tap the slide to blot the extra water', title: 'Soak up the extra water', body: 'Touch blotting paper to the edge of the coverslip. Keep the paper towel nearby: you will need it again at the microscope.' },
  ],
  mount: (o) => ({ specimen: 'redonion', bubbles: o.bubbles }),
  verdict: (o) => (o.bubbles.length ? <p className="leading-relaxed">You trapped <b>{o.bubbles.length} air bubble{o.bubbles.length > 1 ? 's' : ''}</b>. They will show as dark rings. You can make it again or keep it.</p> : null),
}

// ---------------------------------------------------------------------------
// White blood cells (macrophages) fed glowing bacteria, then stained for lysosomes and DNA.

export const LYSO_PREP: PrepDef = {
  name: 'Feeding white blood cells',
  Scene: makeDishScene({
    label: 'Cell culture bench with a dish of white blood cells, glowing bacteria, two dyes, pipette and medium',
    incubator: 'Incubator, 37 °C',
    tubes: [
      { id: 'bacteria', sprite: 'tube-green', label: ['Glowing', 'bacteria'], colour: 'rgba(40,180,90,0.9)' },
      { id: 'lyso', sprite: 'tube-purple', label: ['LysoTracker', 'Deep Red'], colour: 'rgba(120,40,140,0.9)' },
      { id: 'hoechst', sprite: 'tube-blue', label: ['Hoechst'], colour: 'rgba(110,100,240,0.9)' },
    ],
    captions: { take: 'Living white blood cells (macrophages) on the glass', incubate: 'The macrophages are swallowing bacteria' },
  }),
  steps: [
    { id: 'take', kind: 'tap', action: 'Tap the dish to take off the lid', title: 'Living white blood cells', body: 'These living cells are macrophages, white blood cells whose job is to eat bacteria. They grow on the glass bottom of the dish.' },
    { id: 'bacteria', kind: 'drag', action: 'Drag to add the bacteria', title: 'A meal of glowing bacteria', body: 'Add harmless lab bacteria that make GFP, so they glow green. The macrophages will swallow them, each inside a small sac of membrane.' },
    { id: 'incubate', kind: 'timer', seconds: 1200, action: 'Tap the incubator', title: 'Twenty minutes at 37 °C', body: 'Back in the incubator at body temperature for 20 minutes while the macrophages eat.' },
    { id: 'drain', kind: 'drag', action: 'Drag to remove the old medium', title: 'Wash away the leftovers', body: 'Pipette the medium into the waste, taking all the bacteria that were not eaten. Only the swallowed ones stay, inside the cells.' },
    { id: 'fresh', kind: 'drag', action: 'Drag to add fresh medium', title: 'Fresh, warm medium', body: 'Add fresh medium warmed to 37 °C.' },
    { id: 'lyso', kind: 'drag', action: 'Drag to add LysoTracker', title: 'Dye 1: LysoTracker Deep Red', body: 'Lysosomes are acidic inside: their digestive enzymes work best in acid. LysoTracker collects only in acidic compartments, so lysosomes will glow deep red under the 640 nm laser. The computer shows it as magenta.' },
    { id: 'hoechst', kind: 'drag', action: 'Drag to add Hoechst', title: 'Dye 2: Hoechst', body: 'A few drops of Hoechst, which sticks to DNA, so each nucleus glows blue.' },
    { id: 'lid', kind: 'tap', action: 'Tap the dish to put the lid back on', title: 'Lid on', body: 'Lid on. Straight to the confocal microscope, whose stage keeps the dish at 37 °C.' },
  ],
  mount: () => ({ specimen: 'letter-e', bubbles: [] }),
  verdict: () => null,
}
