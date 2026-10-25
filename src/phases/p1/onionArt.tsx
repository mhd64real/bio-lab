// Experiment: the onion bench built from generated photo sprites (public/art/onion).
// Liquids, the peel, the coverslip and the slide glass stay drawn in code so they can move continuously.
import { Hot, type SceneProps } from '../../lab/PrepRunner'
import type { ReactNode } from 'react'
import type { Bubble } from '../../scope/model'
import { Caption, CoverInset, mix } from './sceneKit'

const WATER: [number, number, number] = [150, 205, 240]
const IODINE: [number, number, number] = [205, 145, 35]
const src = (name: string) => `${import.meta.env.BASE_URL}art/onion/${name}.webp`

// A sprite placed by its centre, in scene units; rotation in degrees around its centre.
function Sprite({ name, x, y, w, h, rot = 0, shadow = true }: { name: string; x: number; y: number; w: number; h: number; rot?: number; shadow?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} filter={shadow ? 'url(#photoSh)' : undefined}>
      <image href={src(name)} x={-w / 2} y={-h / 2} width={w} height={h} preserveAspectRatio="xMidYMid meet" />
    </g>
  )
}

// The glass slide photo, slightly see-through so the bench shows under the clear glass.
// Children are drawn at the specimen area, (0, 0) in local units.
function PhotoSlide({ x, y, children, bubbles = [], cover }: { x: number; y: number; children?: ReactNode; bubbles?: Bubble[]; cover?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <image href={src('slide')} x="-165" y="-58" width="330" height="116" opacity="0.88" filter="url(#sh)" />
      <g transform="translate(36 0)">
        {children}
        {bubbles.map((b, i) => <circle key={i} cx={b.x * 13} cy={-b.y * 11} r={2 + b.r * 6} fill="rgba(255,255,255,0.6)" stroke="#5a6779" strokeWidth="1.3" />)}
        {cover && <rect x="-44" y="-44" width="88" height="88" rx="2" fill="rgba(225,240,250,0.28)" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />}
      </g>
      <text x="-117" y="5" textAnchor="middle" fontSize="13" fontWeight="800" fill="#5a6779" transform="rotate(0)">Onion</text>
    </g>
  )
}

function ArtStage({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 820 480" className="h-full w-full" role="img" aria-label="Lab bench with an onion, knife, forceps, slide and stains">
      <defs>
        <linearGradient id="glass" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f3fbff" stopOpacity="0.85" /><stop offset="1" stopColor="#d6ecf7" stopOpacity="0.85" /></linearGradient>
        <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="2" dy="5" stdDeviation="5" floodOpacity="0.18" /></filter>
        <filter id="photoSh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="4" dy="7" stdDeviation="6" floodColor="#1d2733" floodOpacity="0.28" /></filter>
        <pattern id="cells" width="14" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
          <rect width="14" height="6" fill="rgba(240,248,255,0.25)" />
          <path d="M0 0.25 H14 M0.25 0 V3 M7 3 V6 M0 3 H14" stroke="rgba(110,140,165,0.55)" strokeWidth="0.6" fill="none" />
        </pattern>
        <pattern id="cellsStained" width="7" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
          <rect width="7" height="3" fill="rgba(215,160,60,0.22)" />
          <path d="M0 0.2 H7 M0.2 0 V1.5 M3.5 1.5 V3 M0 1.5 H7" stroke="rgba(160,105,30,0.4)" strokeWidth="0.35" fill="none" />
        </pattern>
        <clipPath id="insetClip"><circle cx="0" cy="0" r="118" /></clipPath>
        {/* The square cut out of one onion ring, applied live to the onion-half photo. */}
        <mask id="notch" maskUnits="userSpaceOnUse" x="0" y="0" width="820" height="480">
          <rect width="820" height="480" fill="white" />
          <rect x="-13" y="-13" width="26" height="26" fill="black" transform="translate(268 205) rotate(-38)" />
        </mask>
      </defs>
      <image href={src('bench')} x="0" y="0" width="820" height="480" preserveAspectRatio="xMidYMid slice" />
      {children}
    </svg>
  )
}

function PeelInset({ p }: { p: number }) {
  // Close-up: a small onion piece snapped back, and the epidermis lifting off as a clear film,
  // only one cell thick, so the background and the piece show straight through it.
  const L = 150, x0 = -70, y = 50
  // The skin is drawn as a sheet seen slightly from above: every edge has a depth offset (dx, dy).
  const dx = 16, dy = -12
  const peeled = p * L
  const bx = x0 + peeled // the line where the skin is still attached
  const tipX = bx - peeled * 0.45, tipY = y - peeled * 0.75
  const cx = bx - peeled * 0.15, cy = y - peeled * 0.15
  const film = `M${bx} ${y} Q${cx} ${cy} ${tipX} ${tipY} L${tipX + dx} ${tipY + dy} Q${cx + dx} ${cy + dy} ${bx + dx} ${y + dy} Z`
  const sheen = `M${bx + 3} ${y - 3} Q${cx + 4} ${cy - 3} ${tipX + 5} ${tipY - 3}`
  const lying = `M${bx} ${y} L78 ${y} L${78 + dx} ${y + dy} L${bx + dx} ${y + dy} Z`
  return (
    <g transform="translate(560 170)">
      <circle r="120" fill="#fff" stroke="#d6dee8" strokeWidth="3" filter="url(#sh)" />
      <g clipPath="url(#insetClip)">
        <rect x="-130" y="-130" width="260" height="260" fill="#e9edf1" />
        <image href={src('onion-piece')} x="-78" y={34} width="156" height="80" preserveAspectRatio="xMidYMin slice" />
        {/* skin still attached to the inner surface */}
        {bx < 78 && <path d={lying} fill="url(#cells)" stroke="rgba(120,150,175,0.6)" strokeWidth="0.8" />}
        {p > 0.02 && (
          <g>
            <path d={film} fill="rgba(225,238,250,0.35)" />
            <path d={film} fill="url(#cells)" />
            <path d={film} fill="none" stroke="rgba(120,150,175,0.85)" strokeWidth="1.2" />
            <path d={sheen} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" />
            <g transform={`translate(${tipX + dx / 2} ${tipY + dy / 2}) rotate(-120)`}>
              <image href={src('forceps')} x="-6" y="-9" width="150" height="18" />
            </g>
          </g>
        )}
      </g>
      <text y="98" textAnchor="middle" fontSize="12.5" fontWeight="900" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">So thin you can see through it</text>
      <text y="-98" textAnchor="middle" fontSize="13" fontWeight="900" fill="#5a6779">close-up</text>
    </g>
  )
}

export function OnionArtScene({ flags, active, progress, angle, bubbles }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const stained = has('iodine') ? 1 : active === 'iodine' && has('iodine:started') ? progress : 0
  const liquid = mix(WATER, IODINE, stained, 0.4 + 0.15 * stained)
  // A tool moves over the slide only once the student has tapped it; until then it waits, glowing, in its place.
  const dropping = (active === 'water' && progress > 0) || (active === 'iodine' && has('iodine:started'))
  const drip = active === 'water' ? progress : active === 'iodine' && has('iodine:started') ? Math.min(1, progress * 3) : 0
  return (
    <ArtStage>
      <Sprite name="board" x={200} y={268} w={340} h={240} />

      <Hot id={['cut', 'piece']} ring={{ cx: 200, cy: 262, r: 112 }}>
        {has('cut')
          ? <g mask={has('piece') ? 'url(#notch)' : undefined}><Sprite name="onion-half" x={208} y={262} w={176} h={178} /></g>
          : <Sprite name="onion-whole" x={200} y={262} w={196} h={180} rot={-8} />}
        <rect x="90" y="160" width="230" height="210" fill="transparent" />
      </Hot>
      <Sprite name="knife" x={has('cut') ? 150 : 170} y={has('cut') ? 420 : 428} w={210} h={33} rot={has('cut') ? -8 : -2} />
      {has('piece') && !has('peel') && <Sprite name="onion-piece" x={300} y={355} w={42} h={43} rot={12} />}

      <g filter="url(#photoSh)" transform="translate(392 96) rotate(6)">
        <image href={src('blot')} x="-40" y="-41" width="80" height="83" />
        {has('blot') && <ellipse cx="-26" cy="0" rx="13" ry="19" fill={liquid} />}
      </g>
      <Hot id="peel"><Sprite name="forceps" x={420} y={330} w={160} h={19} rot={-14} /></Hot>
      <Hot id="iodine" ring={{ cx: 744, cy: 100, r: 60 }}>{!(active === 'iodine' && dropping) && <Sprite name="iodine" x={744} y={100} w={40} h={110} />}</Hot>
      <Hot id="water" ring={{ cx: 730, cy: 250, r: 66 }}>{!(active === 'water' && dropping) && <Sprite name="dropper" x={730} y={250} w={22} h={122} rot={8} />}</Hot>

      <Hot id={['lay', 'blot']} ring={{ cx: 630, cy: 400, r: 70 }}>
        <PhotoSlide x={600} y={400} bubbles={bubbles} cover={has('cover')}>
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

      {(active === 'peel' || (has('peel') && !has('lay'))) && <PeelInset p={has('peel') ? 1 : progress} />}
      {active === 'cover' && <CoverInset x={560} y={170} angle={angle} liquid={liquid} />}
      {active === 'cut' && <Caption x={200} y={140}>A whole onion bulb</Caption>}
      {active === 'piece' && <Caption x={208} y={140}>Each ring is a fleshy scale leaf</Caption>}
    </ArtStage>
  )
}
