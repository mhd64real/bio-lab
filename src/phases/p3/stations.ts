import { checklistStep, kit, tasks } from '../../lab/stepKit'
import type { ObserveStep } from '../../lab/steps'
import { nearestSwimmer } from '../../scope/pond'
import { specimenTime } from '../../scope/clock'
import { ask, checklist, type Step } from '../../instruments/engine'
import { levelsOk, semFocusOk, type SemState } from '../../instruments/sem/model'
import { focusOk, MAGS, type TemState } from '../../instruments/tem/model'
import type { ScopeState } from '../../scope/model'

const near = (kind: 'para' | 'eug', s: ScopeState, r: number) => nearestSwimmer(kind, s.stageX, s.stageY, specimenTime()) <= r

const condenserBack = { text: 'Set the condenser back to brightfield', done: (s: ScopeState) => !s.phase, lock: { allow: ['phase' as const] }, highlight: ['condenser' as const] }

export const POND_STEPS: ObserveStep[] = [
  kit.place('pond water'),
  kit.clip(),
  kit.centre(),
  kit.coarse('Raise the stage with coarse focus. Only a few faint specks and clumps will appear.'),
  kit.fine(4),
  { id: 'iris', title: 'Close the iris a little', body: 'Colourless things show up better with less, narrower light. Close the iris diaphragm to about 40%.', highlight: ['iris'], lock: () => ({ allow: ['iris'] }), done: (s) => s.iris <= 0.45 },
  kit.lens(10, 'Turn to the 10x objective.'),
  kit.fine(10),
  kit.ask('invisible', 'Where are they?', 'This drop is full of living cells, but you can hardly see them.', {
    q: 'Why are the living cells so hard to see?',
    options: ['There are none in the drop', 'They are colourless and almost transparent, and staining them would kill them', 'The lens is dirty', 'They are too big'],
    correct: 1,
    explain: 'Right. Light passes straight through them. Phase contrast solves this without any stain.',
  }),
  { id: 'phase', title: 'Phase contrast', body: 'Switch the condenser to phase contrast. A special ring in the condenser and the objective turns tiny delays in the light, caused by the cells, into dark and light.', highlight: ['condenser' as never], lock: () => ({ allow: ['phase'] }), done: (s) => s.phase },
  {
    id: 'findPara', title: 'Find a Paramecium', body: 'Look for a slipper-shaped cell about 0.2 mm long. Move the slide to bring one into the middle of the view.',
    tip: 'It swims, so it will not wait for you. Remember: things move the opposite way to the slide.',
    highlight: ['stageKnobs'], lock: () => ({ allow: ['stage'] }), done: (s) => s.objective === 10 && near('para', s, 0.15),
  },
  kit.lens(40, 'Turn to the 40x objective while the Paramecium is in the middle.'),
  kit.fine(40, 'Sharpen with fine focus. Turn the brightness up if it is too dark.', true),
  {
    id: 'track', title: 'Follow it', body: 'Keep the Paramecium near the middle of the view for 5 seconds by moving the slide as it swims.',
    highlight: ['stageKnobs'], lock: () => ({ allow: ['stage', 'fine'] }), done: (s) => s.objective === 40 && near('para', s, 0.1), hold: 5,
  },
  kit.ask('cilia', 'The fringe', 'Look at the edge of the Paramecium: the whole cell is surrounded by a shimmering fringe, with waves running along it.', {
    q: 'What is the shimmering fringe around the Paramecium?',
    options: ['Water boiling', 'Thousands of short cilia beating together, like oars in a rowboat', 'Its cell wall', 'A single long flagellum'],
    correct: 1,
    explain: 'Yes. Cilia are short and numerous. They beat in waves and push the cell through the water.',
  }, true),
  kit.lens(10, 'Go back to 10x to search a wider area.'),
  {
    id: 'findEug', title: 'Find a Euglena', body: 'Now look for a much smaller, green, spindle-shaped cell. Bring it to the middle.',
    highlight: ['stageKnobs'], lock: () => ({ allow: ['stage', 'fine'] }), done: (s) => s.objective === 10 && near('eug', s, 0.1),
  },
  kit.lens(40, 'Turn to the 40x objective.'),
  kit.fine(40, 'Sharpen with fine focus.', true),
  kit.ask('flagellum', 'The whip', 'At the front of the Euglena there is one long, thin thread lashing back and forth.', {
    q: 'What is the long thread at the front of the Euglena?',
    options: ['A cilium', 'A flagellum: it moves with a whiplike motion', 'A crack in the slide', 'Part of its cell wall'],
    correct: 1,
    explain: 'Right. Flagella are longer and fewer than cilia. Cells with flagella typically have one or two.',
  }, true),
  kit.ask('compare', 'Cilia or flagella?', 'Think about both cells you followed.', {
    q: 'Which statement compares cilia and flagella correctly?',
    options: ['Cilia are long and few; flagella are short and many', 'Cilia are short and numerous; flagella are longer and less numerous', 'Only plants have them', 'They are made of cellulose'],
    correct: 1,
    explain: 'Exactly. Both project outside the plasma membrane and both are used for movement.',
  }),
  checklistStep('putaway', 'Put the microscope away', 'Get it ready for the next slide.', [tasks.lens4(), tasks.lower(), tasks.remove(), condenserBack]),
]

export const ELODEA_STEPS: ObserveStep[] = [
  kit.place('Elodea'),
  kit.clip(),
  kit.centre(),
  kit.coarse('Raise the stage with coarse focus until a green leaf appears.'),
  kit.fine(4),
  kit.lens(10, 'Turn to the 10x objective.'),
  kit.fine(10),
  kit.ask('walls', 'Boxes', 'The leaf is made of rows of long, box-shaped cells.', {
    q: 'What are the thin, clear lines between the green cells?',
    options: ['Cell walls', 'Microtubules', 'Cracks', 'Nuclei'],
    correct: 0,
    explain: 'Right. Each plant cell has a cell wall outside its plasma membrane, and the walls of neighbouring cells are pressed together.',
  }),
  kit.lens(40, 'Turn to the 40x objective.'),
  kit.fine(40, 'Sharpen with fine focus and fix the light.', true),
  kit.ask('streaming', 'Moving green', 'Watch the green chloroplasts in one cell for a few seconds.', {
    q: 'What are the chloroplasts doing?',
    options: ['Nothing, they are fixed', 'Moving around the cell, carried by flowing cytoplasm', 'Leaving the cell', 'Dividing every second'],
    correct: 1,
    explain: 'Yes: this is cytoplasmic streaming. You will look at chloroplasts closely in Phase 5. Notice how the rigid walls keep every cell the same box shape while the inside flows.',
  }),
  kit.ask('cellulose', 'What is the wall made of?', 'A plant cell wall is a thick, rigid mesh of fibres.', {
    q: 'Plant cell walls are made of which carbohydrate?',
    options: ['Peptidoglycan', 'Cellulose', 'Starch', 'Protein'],
    correct: 1,
    explain: 'Right: cellulose, which makes the wall inflexible.',
  }),
  kit.ask('stand', 'Why rigid?', 'Compare the boxy Elodea cells with your floppy cheek cells from Phase 1.', {
    q: 'What do rigid cell walls allow plants to do?',
    options: ['Swim', 'Stand at different heights, from grass to tall trees', 'Change shape easily', 'Make food'],
    correct: 1,
    explain: 'Exactly. The wall protects the cell and gives it support, so whole plants can stand upright.',
  }),
  kit.putAway(true),
]

// ---------------------------------------------------------------------------

type SS = SemState
const nearS = (s: SS, x: number, y: number, r: number) => Math.hypot(s.x - x, s.y - y) <= r

export const SEM_STEPS: Step<SS>[] = [
  checklist<SS>('load', 'Load the stub', 'The chamber is kept at vacuum. To put a sample in, let air in first.', [
    { text: 'Vent the chamber (let air in)', done: (s) => s.chamber !== 'vacuum', lock: ['vent'], highlight: ['vent', 'chamber'] },
    { text: 'Open the door when the air is in', done: (s) => s.door, lock: ['door'], highlight: ['door', 'chamber'] },
    { text: 'Mount the stub on the stage', done: (s) => s.stub, lock: ['stub'], highlight: ['stub'] },
    { text: 'Close the door', done: (s) => s.stub && !s.door, lock: ['door'], highlight: ['door'] },
    { text: 'Pump the air out', done: (s) => s.stub && s.chamber === 'vacuum', lock: ['pump'], highlight: ['pump'] },
  ]),
  checklist<SS>('beam', 'Start the beam', 'Soft biological samples are imaged with gentle, low-energy electrons.', [
    { text: 'Choose 5 kV', done: (s) => s.kv === 5, lock: ['kv'], highlight: ['kv'] },
    { text: 'Switch the beam on', done: (s) => s.beam, lock: ['beam'], highlight: ['beam', 'monitors'] },
  ]),
  checklist<SS>('first', 'A first look', 'At 100x you see a large area of the lining. Get a clear picture.', [
    { text: 'Focus the image', done: semFocusOk, lock: ['focus'], highlight: ['focus'] },
    { text: 'Adjust brightness and contrast until it looks clear', done: levelsOk, lock: ['brightness', 'contrast'], highlight: ['brightness', 'contrast'] },
    { text: 'Move to the middle of the tissue', done: (s) => nearS(s, 0, 0, 150), lock: ['stage'], highlight: ['stage'] },
  ]),
  { id: 'm500', title: 'Zoom in', body: 'Go to 500x and keep the middle of the tissue in view.', highlight: ['mag', 'stage'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 1 && nearS(s, 0, 0, 60) },
  ask<SS>('twoKinds', 'Two kinds of cells', 'The surface is covered with two kinds of cells.', {
    q: 'What two kinds of cells cover the lining?',
    options: ['Bone cells and muscle cells', 'Hairy cells covered in cilia, and smooth cells (goblet cells) that make mucus', 'Plant cells and animal cells', 'Bacteria and viruses'],
    correct: 1,
    explain: 'Right. The smooth domes are goblet cells; some have a droplet of mucus in their opening.',
  }, ['stage', 'focus']),
  { id: 'm2000', title: 'Closer', body: 'Go to 2,000x, centre a hairy cell and focus.', highlight: ['mag', 'stage', 'focus'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 2 && nearS(s, 0, 0, 12) && semFocusOk(s) },
  { id: 'm5000', title: '5,000x', body: 'Go to 5,000x and focus. The picture is grainy: a fast scan only collects a few electrons from each point.', highlight: ['mag', 'focus'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 3 && semFocusOk(s) },
  { id: 'slow', title: 'A clean picture', body: 'Switch to slow scan and wait while the beam draws one whole picture, line by line, from top to bottom.', highlight: ['scan'], lock: () => ['scan'], done: (_, seen) => seen.has('slowFrame') },
  ask<SS>('hairs', 'The hairs', 'Each hair is about a quarter of a micrometre thick.', {
    q: 'What are the hairs covering these cells?',
    options: ['Flagella', 'Cilia', 'Microvilli', 'Cell walls'],
    correct: 1,
    explain: 'Yes: hundreds of cilia on each cell, all bending the same way.',
  }, ['scan']),
  { id: 'm15000', title: 'Highest magnification', body: 'Go to 15,000x and focus. You can now see individual cilia with rounded tips.', highlight: ['mag', 'focus'], lock: () => ['mag', 'focus', 'stage', 'scan'], done: (s) => s.mag === 4 && semFocusOk(s) },
  ask<SS>('why3d', 'Why it looks 3D', 'Compare this picture with your TEM pictures.', {
    q: 'Why does an SEM picture look three-dimensional?',
    options: ['It is coloured', 'The beam scans the surface; edges and slopes facing the detector give off more electrons and look brighter', 'The sample is alive', 'It uses two cameras'],
    correct: 1,
    explain: 'Right. A TEM looks through a thin slice; an SEM looks at the surface.',
  }, ['focus', 'stage']),
  ask<SS>('infer', 'Infer: what are cilia doing here?', 'This is the lining of the windpipe (trachea), the tube that carries air to the lungs. The cells do not move.', {
    q: 'What do these cilia do in the windpipe?',
    options: ['Move the cells around', 'Sweep mucus, with trapped dust and germs, up and out of the airways', 'Make food', 'Hold the windpipe open'],
    correct: 1,
    explain: 'Exactly. Cilia are also found on cells that do not move: here they move the mucus instead of the cell.',
  }),
  ask<SS>('where', 'Infer: where else?', 'Your textbook asks where in the body of an animal cilia might be found.', {
    q: 'Where else in the body would you expect to find cilia like these?',
    options: ['On the outer surface of the skin', 'Lining the nose and the airways into the lungs', 'Inside the bones', 'In tooth enamel'],
    correct: 1,
    explain: 'Right. The whole airway, from the nose to the small tubes in the lungs, is lined with ciliated cells.',
  }),
  checklist<SS>('shutdown', 'Finish', 'Leave the SEM ready for the next person.', [
    { text: 'Switch the beam off', done: (s) => !s.beam, lock: ['beam'], highlight: ['beam'] },
    { text: 'Back to the lowest magnification', done: (s) => s.mag === 0, lock: ['mag'], highlight: ['mag'] },
  ]),
]

type TS = TemState
const nearT = (s: TS, x: number, y: number, r: number) => Math.hypot(s.x - x, s.y - y) <= r
export const CIL_X = 0.99, CIL_Y = 0

export const TEM_CILIA_STEPS: Step<TS>[] = [
  checklist<TS>('load', 'Into the vacuum', 'Load the new grid the same way as before.', [
    { text: 'Clip the grid into the holder tip', done: (s) => s.holder !== 'out', lock: ['load'], highlight: ['load', 'holder'] },
    { text: 'Push the holder into the airlock', done: (s) => s.holder === 'airlock' || s.holder === 'in', lock: ['toAirlock'], highlight: ['toAirlock', 'holder'] },
    { text: 'Pump the air out of the airlock', done: (s) => s.airlock >= 1 || s.holder === 'in', lock: ['pump', 'insert'], highlight: ['pump'] },
    { text: 'Insert the holder fully', done: (s) => s.holder === 'in', lock: ['insert'], highlight: ['insert', 'holder'] },
    { text: 'Switch on the high tension', done: (s) => s.ht, lock: ['ht'], highlight: ['ht'] },
    { text: 'Switch the beam on', done: (s) => s.beam, lock: ['beam'], highlight: ['beam'] },
  ]),
  { id: 'find', title: 'Find the lining', body: 'This slice cut across the tops of the windpipe cells. Move to the middle of a grid square.', highlight: ['stage'], lock: () => ['stage', 'brightness'], done: (s) => s.mag === 0 && nearT(s, 0, 0, 7) },
  { id: 'm2000', title: 'The cells', body: 'Go to 2,000x and centre the cell in the middle.', highlight: ['mag', 'stage'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 1 && nearT(s, 0, 0, 3) },
  ask<TS>('goblet', 'Two kinds again', 'Some cells look finely speckled, others are full of pale bubbles.', {
    q: 'Which cells are full of pale bubbles?',
    options: ['The ciliated cells', 'The goblet cells: the bubbles are packets of mucus', 'Dead cells', 'Bacteria'],
    correct: 1,
    explain: 'Right. The same two kinds of cells you saw with the SEM, now cut across.',
  }, ['stage']),
  { id: 'm15000', title: 'Zoom into a speckled cell', body: 'Go to 15,000x, focus, and stay inside the speckled cell.', highlight: ['mag', 'focus', 'stage'], lock: () => ['mag', 'focus', 'stage'], done: (s) => s.mag === 3 && nearT(s, CIL_X, CIL_Y, 1.5) && focusOk(s) },
  ask<TS>('circles', 'Rings everywhere', 'The cell is packed with small rings.', {
    q: 'What are all the small rings?',
    options: ['Ribosomes', 'Cilia, cut straight across by the slice', 'Air bubbles', 'Nuclei'],
    correct: 1,
    explain: 'Yes. The slice went through the carpet of cilia you saw from above with the SEM, so each cilium appears as a ring.',
  }, ['stage', 'focus']),
  { id: 'm100k', title: 'One cilium', body: 'Centre one cilium precisely, go to 100,000x and focus.', tip: 'Keep the brightness below 80%.', highlight: ['mag', 'stage', 'focus'], lock: () => ['mag', 'stage', 'focus', 'brightness'], done: (s) => MAGS[s.mag] === 100000 && nearT(s, CIL_X, CIL_Y, 0.05) && focusOk(s) },
  ask<TS>('ninetwo', 'Count them', 'Count the microtubules around the edge and in the middle.', {
    q: 'How are the microtubules arranged inside a cilium?',
    options: ['9 triplets, nothing in the middle', '9 pairs around the edge and 2 single microtubules in the middle (9 + 2)', '4 pairs', 'One thick rod'],
    correct: 1,
    explain: 'Right: the 9 + 2 configuration. The little hooks on each pair are motor proteins that make the cilium bend.',
  }, ['stage', 'focus']),
  ask<TS>('vsCentriole', 'Compare with the centriole', 'Think back to the centriole you saw in Phase 2.', {
    q: 'How does a cilium differ from a centriole?',
    options: ['They are identical', 'A centriole has 9 triplets and nothing in the middle; a cilium has 9 pairs plus 2 in the middle', 'A cilium has no microtubules', 'A centriole has 9 + 2'],
    correct: 1,
    explain: 'Exactly. In fact each cilium grows from a centriole-like base at the cell surface.',
  }),
  ask<TS>('flagella', 'And flagella?', 'The Euglena’s flagellum was much longer than these cilia.', {
    q: 'What would you expect inside a cross-section of a eukaryotic flagellum?',
    options: ['Cellulose', 'The same 9 + 2 arrangement of microtubules', 'Nothing', 'Chloroplasts'],
    correct: 1,
    explain: 'Right. Cilia and flagella are both built from microtubules in a 9 + 2 configuration; they differ in length and number.',
  }),
  checklist<TS>('shutdown', 'Finish', 'Leave the TEM ready for the next person.', [
    { text: 'Switch the beam off', done: (s) => !s.beam, lock: ['beam'], highlight: ['beam'] },
    { text: 'Withdraw the holder', done: (s) => s.holder !== 'in' && s.holder !== 'airlock', lock: ['withdraw'], highlight: ['withdraw', 'holder'] },
  ]),
]
