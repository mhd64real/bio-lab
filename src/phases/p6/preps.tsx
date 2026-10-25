import { Hot, type PrepDef, type SceneProps } from '../../lab/PrepRunner'
import { ArtStage, Drip, Sprite } from '../../lab/artKit'
import { Caption, mix } from '../p1/sceneKit'

const C = (n: string) => `confocal/${n}`

// ---------------------------------------------------------------------------
// Giving living cells two new genes (transfection), then holding the tagged protein in the ER at 40 °C.

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

const TUBES: { id: string; sprite: string; x: number; label: string[]; colour: string }[] = [
  { id: 'gene', sprite: 'tube-green', x: 560, label: ['Protein + GFP', 'gene'], colour: 'rgba(40,180,90,0.9)' },
  { id: 'marker', sprite: 'tube-purple', x: 650, label: ['Golgi marker', 'gene'], colour: 'rgba(120,40,140,0.9)' },
  { id: 'hoechst', sprite: 'tube-blue', x: 740, label: ['Hoechst'], colour: 'rgba(110,100,240,0.9)' },
]

function TransfectScene({ flags, active, progress }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const added = ['gene', 'marker', 'hoechst'].filter(has).length
  const pipetting = (id: string) => active === id && progress > 0
  return (
    <ArtStage label="Cell culture bench with a dish of living cells, two gene mixes, Hoechst, pipette and medium">
      <Hot id={['take', 'lid']} ring={{ cx: 330, cy: 260, r: 110 }}>
        <Dish x={330} y={260} added={added} rinsed={has('fresh')} lid={!has('take') || has('lid')} />
      </Hot>
      {active === 'take' && <Caption x={330} y={130}>Living human cells on the glass bottom of the dish</Caption>}
      {active === 'incubate' && <Caption x={330} y={130}>Inside, ribosomes on the rough ER are making the new proteins</Caption>}

      {TUBES.map((t) => (
        <Hot key={t.id} id={t.id} ring={{ cx: t.x, cy: 110, r: 34 }}>
          <Sprite src={C(t.sprite)} x={t.x} y={110} w={26} h={88} />
          {t.label.map((l, i) => (
            <text key={l} x={t.x} y={172 + i * 13} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">{l}</text>
          ))}
        </Hot>
      ))}
      {TUBES.map((t) => pipetting(t.id) && (
        <g key={t.id}>
          <Sprite src={C('pipette')} x={420} y={170} w={260} h={62} rot={-58} />
          <Drip x={346} y0={228} y1={252} t={progress} colour={t.colour} />
        </g>
      ))}
      {!['gene', 'marker', 'hoechst', 'drain', 'fresh'].some((id) => pipetting(id)) && <Sprite src={C('pipette')} x={560} y={330} w={230} h={55} rot={-8} />}

      <Hot id="incubate" ring={{ cx: 120, cy: 100, r: 60 }}>
        <g transform="translate(120 100)">
          <Sprite src="gram/timer" x={0} y={0} w={86} h={86} />
          <line x1="0" y1="0" x2="0" y2="-26" stroke="#e8590c" strokeWidth="3" strokeLinecap="round" transform={`rotate(${active === 'incubate' ? progress * 360 : 0})`} />
        </g>
        <text x={120} y={168} textAnchor="middle" fontSize="11" fontWeight="800" fill="#5a6779" paintOrder="stroke" stroke="#fff" strokeWidth="3">Incubator, 40 °C</text>
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

export const TRANSFECT_PREP: PrepDef = {
  name: 'Giving living cells new genes',
  Scene: TransfectScene,
  steps: [
    { id: 'take', kind: 'tap', action: 'Tap the dish to take off the lid', title: 'Living cells', body: 'Living human cells, grown on the thin glass bottom of a dish. This time you will not stain a structure with a dye: you will make the cells build a glowing protein themselves.' },
    { id: 'gene', kind: 'drag', action: 'Drag to add the first gene mix', title: 'Gene 1: a tagged protein', body: 'This tiny loop of DNA carries the instructions for a membrane protein joined to GFP, a protein that glows green. It is mixed with fatty droplets that carry it into the cells.', tip: 'Inside the cell, ribosomes on the rough ER will read these instructions.' },
    { id: 'marker', kind: 'drag', action: 'Drag to add the second gene mix', title: 'Gene 2: a Golgi marker', body: 'A second loop of DNA, for a protein that stays in the Golgi apparatus and glows far-red. It will show you exactly where the Golgi is.' },
    { id: 'incubate', kind: 'timer', seconds: 57600, action: 'Tap the incubator', title: 'Overnight at 40 °C', body: 'The cells make the two new proteins overnight. At 40 °C the tagged protein folds into the wrong shape, so the ER holds on to it: by morning it has piled up in the ER.', tip: 'Body temperature is 37 °C. These cells cope fine with 40 °C for a night.' },
    { id: 'hoechst', kind: 'drag', action: 'Drag to add Hoechst', title: 'A dye for the nucleus', body: 'Add a few drops of Hoechst. It sticks to DNA, so the nucleus will glow blue under the violet laser. Wait 15 minutes.' },
    { id: 'drain', kind: 'drag', action: 'Drag to remove the old medium', title: 'Remove the old medium', body: 'Pipette the medium out into the waste beaker, together with any leftover dye and gene mix.' },
    { id: 'fresh', kind: 'drag', action: 'Drag to add fresh medium', title: 'Fresh medium with a stop drug', body: 'Add fresh warm medium. It contains a drug that stops ribosomes from starting new proteins, so no new green protein appears: you will follow only the batch already waiting in the ER.' },
    { id: 'lid', kind: 'tap', action: 'Tap the dish to put the lid back on', title: 'Lid on', body: 'Lid on. The dish goes straight onto the heated stage of the confocal microscope, still at 40 °C.' },
  ],
  mount: () => ({ specimen: 'letter-e', bubbles: [] }),
  verdict: () => null,
}
