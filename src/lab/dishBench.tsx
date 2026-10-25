import { Hot, type SceneProps } from './PrepRunner'
import { ArtStage, Drip, Sprite } from './artKit'
import { Caption, mix } from '../phases/p1/sceneKit'

// A cell-culture bench: a glass-bottomed dish of living cells, three tubes to pipette in, an incubator,
// a waste beaker and fresh medium. Step ids: 'take' and 'lid' (dish), one per tube, 'incubate', 'drain', 'fresh'.
const C = (n: string) => `confocal/${n}`
export interface DishTube { id: string; sprite: 'tube-green' | 'tube-purple' | 'tube-blue'; label: string[]; colour: string }

function Dish({ x, y, added, rinsed, lid }: { x: number; y: number; added: number; rinsed: boolean; lid: boolean }) {
  return (
    <g>
      <Sprite src={C('dish')} x={x} y={y} w={190} h={194} />
      {!rinsed && added > 0 && <circle cx={x} cy={y} r={76} fill={mix([235, 120, 135], [120, 160, 120], added / 3, 0.1 + 0.08 * added)} />}
      <circle cx={x} cy={y} r={34} fill="rgba(255,255,255,0.12)" stroke="rgba(120,90,110,0.35)" strokeDasharray="2 3" />
      {lid && <Sprite src={C('lid')} x={x + 4} y={y - 4} w={196} h={200} opacity={0.75} />}
    </g>
  )
}

const tag = (x: number, y: number, t: string) => <text x={x} y={y} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">{t}</text>

export function makeDishScene({ label, tubes, incubator, captions = {} }: { label: string; tubes: DishTube[]; incubator: string; captions?: Record<string, string> }) {
  const xs = [560, 650, 740]
  return function DishScene({ flags, active, progress }: SceneProps) {
    const has = (f: string) => flags.has(f)
    const added = tubes.filter((t) => has(t.id)).length
    const pipetting = (id: string) => active === id && progress > 0
    return (
      <ArtStage label={label}>
        <Hot id={['take', 'lid']} ring={{ cx: 330, cy: 260, r: 110 }}>
          <Dish x={330} y={260} added={added} rinsed={has('fresh')} lid={!has('take') || has('lid')} />
        </Hot>
        {active && captions[active] && <Caption x={330} y={130}>{captions[active]}</Caption>}

        {tubes.map((t, i) => (
          <Hot key={t.id} id={t.id} ring={{ cx: xs[i], cy: 110, r: 34 }}>
            <Sprite src={C(t.sprite)} x={xs[i]} y={110} w={26} h={88} />
            {t.label.map((l, k) => <g key={l}>{tag(xs[i], 172 + k * 13, l)}</g>)}
          </Hot>
        ))}
        {tubes.map((t) => pipetting(t.id) && (
          <g key={t.id}>
            <Sprite src={C('pipette')} x={420} y={170} w={260} h={62} rot={-58} />
            <Drip x={346} y0={228} y1={252} t={progress} colour={t.colour} />
          </g>
        ))}
        {![...tubes.map((t) => t.id), 'drain', 'fresh'].some((id) => pipetting(id)) && <Sprite src={C('pipette')} x={560} y={330} w={230} h={55} rot={-8} />}

        <Hot id="incubate" ring={{ cx: 120, cy: 100, r: 60 }}>
          <g transform="translate(120 100)">
            <Sprite src="gram/timer" x={0} y={0} w={86} h={86} />
            <line x1="0" y1="0" x2="0" y2="-26" stroke="#e8590c" strokeWidth="3" strokeLinecap="round" transform={`rotate(${active === 'incubate' ? progress * 360 : 0})`} />
          </g>
          {tag(120, 168, incubator)}
        </Hot>

        <Hot id="drain" ring={{ cx: 120, cy: 380, r: 66 }}>
          <Sprite src={C('beaker')} x={120} y={380} w={96} h={92} />
          {tag(120, 444, 'Waste')}
        </Hot>
        <Hot id="fresh" ring={{ cx: 700, cy: 380, r: 70 }}>
          <Sprite src={C('medium')} x={700} y={380} w={150} h={72} rot={-6} />
          {tag(700, 440, 'Fresh warm medium')}
        </Hot>
        {(pipetting('drain') || pipetting('fresh')) && <Sprite src={C('pipette')} x={420} y={170} w={260} h={62} rot={-58} />}
      </ArtStage>
    )
  }
}
