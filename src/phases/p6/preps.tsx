import type { PrepDef } from '../../lab/PrepRunner'
import { makeDishScene } from '../../lab/dishBench'

// Giving living cells two new genes (transfection), then holding the tagged protein in the ER at 40 °C.
const TransfectScene = makeDishScene({
  label: 'Cell culture bench with a dish of living cells, two gene mixes, Hoechst, pipette and medium',
  incubator: 'Incubator, 40 °C',
  tubes: [
    { id: 'gene', sprite: 'tube-green', label: ['Protein + GFP', 'gene'], colour: 'rgba(40,180,90,0.9)' },
    { id: 'marker', sprite: 'tube-purple', label: ['Golgi marker', 'gene'], colour: 'rgba(120,40,140,0.9)' },
    { id: 'hoechst', sprite: 'tube-blue', label: ['Hoechst'], colour: 'rgba(110,100,240,0.9)' },
  ],
  captions: { take: 'Living human cells on the glass bottom of the dish', incubate: 'Inside, ribosomes on the rough ER are making the new proteins' },
})

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
