// Experiment: the onion bench built from generated photo sprites (public/art/onion).
// Liquids, the peel, the coverslip and the slide glass stay drawn in code so they can move continuously.
import { Hot, type SceneProps } from '../../lab/PrepRunner'
import { Caption, CoverInset, mix } from './sceneKit'
import { ArtStage, BlotSprite, PhotoSlide, Sprite as KitSprite, VideoInset } from '../../lab/artKit'

const WATER: [number, number, number] = [150, 205, 240]
const IODINE: [number, number, number] = [205, 145, 35]
const ON = (name: string) => `onion/${name}`
const SH = (name: string) => `shared/${name}`

function Sprite(p: { name: string; x: number; y: number; w: number; h: number; rot?: number }) {
  const { name, ...rest } = p
  return <KitSprite src={['forceps', 'dropper'].includes(name) ? SH(name) : ON(name)} {...rest} />
}

export function OnionArtScene({ flags, active, progress, angle, bubbles }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const stained = has('iodine') ? 1 : active === 'iodine' && has('iodine:started') ? progress : 0
  const liquid = mix(WATER, IODINE, stained, 0.4 + 0.15 * stained)
  // A tool moves over the slide only once the student has tapped it; until then it waits, glowing, in its place.
  const dropping = (active === 'water' && progress > 0) || (active === 'iodine' && has('iodine:started'))
  const drip = active === 'water' ? progress : active === 'iodine' && has('iodine:started') ? Math.min(1, progress * 3) : 0
  return (
    <ArtStage label="Lab bench with an onion, knife, forceps, slide and stains" defs={<>
      <pattern id="cells" width="14" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <rect width="14" height="6" fill="rgba(240,248,255,0.25)" />
        <path d="M0 0.25 H14 M0.25 0 V3 M7 3 V6 M0 3 H14" stroke="rgba(110,140,165,0.55)" strokeWidth="0.6" fill="none" />
      </pattern>
      <pattern id="cellsStained" width="7" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
        <rect width="7" height="3" fill="rgba(215,160,60,0.22)" />
        <path d="M0 0.2 H7 M0.2 0 V1.5 M3.5 1.5 V3 M0 1.5 H7" stroke="rgba(160,105,30,0.4)" strokeWidth="0.35" fill="none" />
      </pattern>
      <mask id="notch" maskUnits="userSpaceOnUse" x="0" y="0" width="820" height="480">
        <rect width="820" height="480" fill="white" />
        <rect x="-13" y="-13" width="26" height="26" fill="black" transform="translate(268 205) rotate(-38)" />
      </mask>
    </>}>
      <Sprite name="board" x={200} y={268} w={340} h={240} />

      <Hot id={['cut', 'piece']} ring={{ cx: 200, cy: 262, r: 112 }}>
        {has('cut')
          ? <g mask={has('piece') ? 'url(#notch)' : undefined}><Sprite name="onion-half" x={208} y={262} w={176} h={178} /></g>
          : <Sprite name="onion-whole" x={200} y={262} w={196} h={180} rot={-8} />}
        <rect x="90" y="160" width="230" height="210" fill="transparent" />
      </Hot>
      <Sprite name="knife" x={has('cut') ? 150 : 170} y={has('cut') ? 420 : 428} w={210} h={33} rot={has('cut') ? -8 : -2} />
      {has('piece') && !has('peel') && <Sprite name="onion-piece" x={300} y={355} w={42} h={43} rot={12} />}

      <BlotSprite x={392} y={96} stain={has('blot') ? liquid : undefined} />
      <Hot id="peel"><Sprite name="forceps" x={420} y={330} w={160} h={19} rot={-14} /></Hot>
      <Hot id="iodine" ring={{ cx: 744, cy: 100, r: 60 }}>{!(active === 'iodine' && dropping) && <Sprite name="iodine" x={744} y={100} w={40} h={110} />}</Hot>
      <Hot id="water" ring={{ cx: 730, cy: 250, r: 66 }}>{!(active === 'water' && dropping) && <Sprite name="dropper" x={730} y={250} w={22} h={122} rot={8} />}</Hot>

      <Hot id={['lay', 'blot']} ring={{ cx: 630, cy: 400, r: 70 }}>
        <PhotoSlide x={600} y={400} label="Onion" bubbles={bubbles} cover={has('cover')}>
          {has('water') && <ellipse rx={has('cover') ? 46 : 26} ry={has('cover') ? 40 : 19} fill={liquid} />}
          {has('lay') && (
            <g>
              <path d="M-12 -10 q12 -4 24 1 q3 10 -1 20 q-12 4 -22 -1 q-3 -10 -1 -20 z" fill={stained > 0.5 ? 'url(#cellsStained)' : 'url(#cells)'} />
              <path d="M-12 -10 q12 -4 24 1 q3 10 -1 20 q-12 4 -22 -1 q-3 -10 -1 -20 z" fill="none" stroke={stained > 0.5 ? 'rgba(170,115,35,0.55)' : 'rgba(150,175,195,0.7)'} strokeWidth="0.8" />
            </g>
          )}
          {has('blot') && <rect x="46" y="-34" width="34" height="68" rx="3" fill="#fbfbf7" stroke="#d9dde3" />}
        </PhotoSlide>
      </Hot>
      {dropping && (
        <g>
          {active === 'water'
            ? <Sprite name="dropper" x={630} y={298} w={24} h={130} />
            : <Sprite name="iodine" x={628} y={292} w={44} h={120} rot={180} />}
          {drip > 0 && drip < 1 && <ellipse cx="630" cy={360 + drip * 30} rx="5" ry="7" fill={active === 'water' ? 'rgba(150,205,240,0.85)' : 'rgba(205,145,35,0.9)'} />}
        </g>
      )}

      {(active === 'peel' || (has('peel') && !has('lay'))) && <VideoInset name="onion-peel" p={has('peel') ? 1 : progress} from={0.6} to={9.2} caption="So thin you can see through it" />}
      {active === 'cover' && <CoverInset x={560} y={170} angle={angle} liquid={liquid} />}
      {active === 'cut' && <Caption x={200} y={140}>A whole onion bulb</Caption>}
      {active === 'piece' && <Caption x={208} y={140}>Each ring is a fleshy scale leaf</Caption>}
    </ArtStage>
  )
}
