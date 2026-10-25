// The Gram-stain bench from generated photo sprites (public/art/gram, public/art/shared).
import { Hot, type SceneProps } from '../../lab/PrepRunner'
import { art, ArtStage, BlotSprite, PhotoSlide, Sprite } from '../../lab/artKit'
import { mix } from './sceneKit'

const GR = (n: string) => `gram/${n}`
const CREAM: [number, number, number] = [236, 230, 218]
const VIOLET: [number, number, number] = [92, 40, 160]
const DARK: [number, number, number] = [70, 28, 125]
const PINK: [number, number, number] = [214, 90, 140]

function smearColour(has: (f: string) => boolean, active: string | null, p: number) {
  if (has('safranin')) return mix(VIOLET, PINK, 0.35, 0.85)
  if (active === 'safranin' && has('safranin:started')) return mix(DARK, PINK, p * 0.35, 0.85)
  if (has('alcohol')) return mix(DARK, CREAM, 0.3, 0.85)
  if (active === 'alcohol') return mix(DARK, CREAM, p * 0.8, 0.85)
  if (has('gramIodine')) return mix(DARK, DARK, 0, 0.88)
  if (active === 'gramIodine' && has('gramIodine:started')) return mix(VIOLET, DARK, p, 0.88)
  if (has('crystal')) return mix(VIOLET, VIOLET, 0, 0.85)
  if (active === 'crystal' && has('crystal:started')) return mix(CREAM, VIOLET, p, 0.85)
  return mix(CREAM, CREAM, 0, 0.9)
}

const BOTTLES = [
  { id: 'crystal', x: 300, sprite: 'crystal', colour: '#6b2fb3', label: 'Crystal violet' },
  { id: 'gramIodine', x: 380, sprite: 'gram-iodine', colour: '#7a3d12', label: "Gram's iodine" },
  { id: 'alcohol', x: 460, sprite: 'alcohol', colour: '#c9d1da', label: 'Alcohol' },
  { id: 'safranin', x: 540, sprite: 'safranin', colour: '#d6336c', label: 'Safranin' },
]

export function GramArtScene({ flags, active, progress }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const smear = has('smear') ? 1 : active === 'smear' ? progress : 0
  const colour = smearColour(has, active, progress)
  const pouring = (id: string) => active === id && (has(`${id}:started`) || (id === 'alcohol' && progress > 0))
  const rinsing = active?.startsWith('rinse') === true && progress > 0
  const fixing = active === 'fix' && progress > 0
  return (
    <ArtStage label="Staining bench with yogurt, loop, burner, stains, wash bottle and a slide on a rack">
      <Sprite src={GR('rack')} x={450} y={390} w={380} h={196} />
      <Hot id={['water', 'blot']} ring={{ cx: 450, cy: 380, r: 74 }}>
        {!fixing && (
          <PhotoSlide x={430} y={380} label="Yogurt">
            {has('water') && !has('dry') && <ellipse rx={smear > 0 ? 30 : 18} ry={smear > 0 ? 14 : 12} fill="rgba(150,205,240,0.45)" />}
            {smear > 0 && <ellipse rx={10 + 36 * smear} ry={6 + 10 * smear} fill={colour} />}
            {has('blot') && <rect x="-60" y="-46" width="120" height="30" rx="3" fill="#fbfbf7" stroke="#d9dde3" />}
          </PhotoSlide>
        )}
      </Hot>

      <Hot id="smear" ring={{ cx: 110, cy: 330, r: 66 }}>
        <Sprite src={GR('yogurt')} x={110} y={330} w={118} h={118} />
      </Hot>
      {/* The loop: the photo handle with the thin wire loop drawn on (too fine to cut out of the photo). */}
      <g transform={active === 'smear' ? `translate(${470 + Math.sin(progress * 12) * 20} ${370 + Math.cos(progress * 12) * 6}) rotate(-60)` : 'translate(170 245) rotate(-8)'}>
        <image href={art(GR('loop'))} x="-10" y="-8" width="200" height="16" filter="url(#photoSh)" />
        <circle cx="-14" cy="0" r="5" fill="none" stroke="#a7b0bb" strokeWidth="1.6" />
        <line x1="-9" y1="0" x2="0" y2="0" stroke="#a7b0bb" strokeWidth="1.4" />
      </g>

      <Hot id="dry" ring={{ cx: 110, cy: 92, r: 54 }}>
        <g transform="translate(110 92)">
          <Sprite src={GR('timer')} x={0} y={0} w={86} h={86} />
          <line x1="0" y1="0" x2="0" y2="-26" stroke="#e8590c" strokeWidth="3" strokeLinecap="round" transform={`rotate(${active === 'dry' ? progress * 360 : 0})`} />
        </g>
      </Hot>

      {BOTTLES.map((b) => {
        const pour = pouring(b.id)
        return (
          <Hot key={b.id} id={b.id} ring={{ cx: b.x, cy: 92, r: 48 }}>
            {!pour && <Sprite src={GR(b.sprite)} x={b.x} y={92} w={36} h={104} />}
            {!pour && <text x={b.x} y={158} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">{b.label}</text>}
            {pour && (
              <g>
                <Sprite src={GR(b.sprite)} x={466} y={262} w={40} h={116} rot={180} />
                <path d="M466 322 L466 372" stroke={b.colour} strokeWidth="4" strokeDasharray="8 5" opacity="0.85" />
              </g>
            )}
          </Hot>
        )
      })}

      <Hot id={['rinse1', 'rinse2', 'rinse3', 'rinse4']} ring={{ cx: 730, cy: 110, r: 74 }}>
        {!rinsing && <Sprite src={GR('wash')} x={730} y={110} w={150} h={72} rot={-10} />}
      </Hot>
      {rinsing && (
        <g>
          <Sprite src={GR('wash')} x={600} y={250} w={150} h={72} rot={30} />
          <path d="M545 220 Q505 260 480 365" stroke="rgba(120,190,235,0.85)" strokeWidth="4" fill="none" strokeDasharray="10 6" />
        </g>
      )}

      <Hot id="fix" ring={{ cx: 715, cy: 300, r: 74 }}>
        {/* The burner photo lies on its side; it is stood upright and lit here. */}
        <Sprite src={GR('burner')} x={715} y={330} w={190} h={99} rot={-90} />
        <g transform="translate(715 236) scale(1.5)">
          <path d="M0 -70 C14 -46 12 -18 0 -4 C-12 -18 -14 -46 0 -70 Z" fill="#7cc4ff" opacity="0.6" />
          <path d="M0 -40 C7 -28 6 -14 0 -6 C-6 -14 -7 -28 0 -40 Z" fill="#2f7fe0" opacity="0.9" />
        </g>
      </Hot>
      {fixing && (
        <g transform={`translate(${672 + ((progress * 3) % 1) * 90} 150)`}>
          <image href={art('shared/slide')} x="-60" y="-21" width="120" height="42" opacity="0.9" />
          <path d="M55 0 L95 -14" stroke="#5a6779" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      <BlotSprite x={110} y={440} />
    </ArtStage>
  )
}
