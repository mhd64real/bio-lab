// The cheek-cell bench from generated photo sprites (public/art/cheek, public/art/shared).
import { Hot, type SceneProps } from '../../lab/PrepRunner'
import { art, ArtStage, BlotSprite, Drip, PhotoSlide, Sprite, VideoInset } from '../../lab/artKit'
import { CoverInset, mix } from './sceneKit'

const WATER: [number, number, number] = [150, 205, 240]
const BLUE: [number, number, number] = [55, 100, 200]
const CH = (n: string) => `cheek/${n}`

// The swab tip carries a few loose cheek cells once it has been rubbed.
function SwabWithCells({ x, y, rot, cells }: { x: number; y: number; rot: number; cells: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <Sprite src={CH('swab')} x={0} y={0} w={18} h={180} />
      {Array.from({ length: Math.round(cells * 9) }, (_, i) => (
        <circle key={i} cx={-5 + (i * 5) % 11} cy={-82 + ((i * 7) % 12)} r="1.8" fill="rgba(240,226,210,0.95)" stroke="rgba(190,170,150,0.8)" strokeWidth="0.5" />
      ))}
    </g>
  )
}

export function CheekArtScene({ flags, active, progress, angle, bubbles }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const stained = has('stain') ? 1 : active === 'stain' && has('stain:started') ? progress : 0
  const liquid = mix(WATER, BLUE, stained, 0.35 + 0.15 * stained)
  const smear = has('smear') ? 1 : active === 'smear' ? progress : 0
  const out = has('open')
  const binned = has('bin')
  const staining = active === 'stain' && has('stain:started')
  return (
    <ArtStage label="Lab bench with a swab packet, disinfectant, methylene blue and a slide">
      <Hot id="open" ring={{ cx: 180, cy: 150, r: 110 }}>
        <Sprite src={CH('swab-pack')} x={180} y={150} w={48} h={212} rot={-72} opacity={out ? 0.55 : 1} />
      </Hot>
      {out && !binned && active !== 'scrape' && active !== 'smear' && <SwabWithCells x={200} y={250} rot={-80} cells={has('scrape') ? 1 : 0} />}

      <Hot id="bin" ring={{ cx: 130, cy: 375, r: 72 }}>
        <Sprite src={CH('disinfectant')} x={130} y={375} w={84} h={133} />
        {/* Used swab, cotton end first into the disinfectant, the clean wooden end sticking out. */}
        {binned && <g transform="translate(130 352) rotate(194)"><image href={art(CH('swab'))} x="-6" y="-70" width="12" height="120" /></g>}
      </Hot>

      <BlotSprite x={392} y={96} stain={has('blot') ? liquid : undefined} />
      <Hot id="stain" ring={{ cx: 744, cy: 110, r: 62 }}>
        {!staining && <Sprite src={CH('meth-blue')} x={744} y={110} w={42} h={128} />}
      </Hot>

      <Hot id="blot" ring={{ cx: 630, cy: 400, r: 70 }}>
        <PhotoSlide x={600} y={400} label="Cheek" bubbles={bubbles} cover={has('cover')}>
          {smear > 0 && <ellipse rx={8 + 30 * smear} ry={6 + 12 * smear} fill={mix([235, 228, 214], BLUE, stained, 0.7)} />}
          {has('stain:started') && <ellipse rx={has('cover') ? 46 : 28} ry={has('cover') ? 40 : 20} fill={liquid} />}
          {has('blot') && <rect x="46" y="-34" width="34" height="68" rx="3" fill="#fbfbf7" stroke="#d9dde3" />}
        </PhotoSlide>
      </Hot>
      {/* Rolling the cotton tip across the slide: the tip (top of the sprite, 90 units from its centre) touches
          the smear, the wooden stick points up and away. */}
      {active === 'smear' && <SwabWithCells x={636 + (smear - 0.5) * 60 - 31} y={398 - 85} rot={160} cells={1 - smear * 0.7} />}
      {staining && (
        <g>
          <Sprite src={CH('meth-blue')} x={634} y={300} w={44} h={134} rot={180} />
          <Drip x={634} y0={364} y1={392} t={Math.min(1, progress * 3)} colour="rgba(55,100,200,0.9)" />
        </g>
      )}
      {active === 'scrape' && <VideoInset name="cheek-swab" p={progress} from={1.2} to={8.5} caption="Rub the swab on the inside of the cheek" />}
      {active === 'cover' && <CoverInset x={560} y={170} angle={angle} liquid={liquid} />}
    </ArtStage>
  )
}
