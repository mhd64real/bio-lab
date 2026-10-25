import { kit, tasks, checklistStep } from '../../lab/stepKit'
import type { ObserveStep } from '../../lab/steps'
import { ask, checklist, type Step } from '../../instruments/engine'
import { inFocusAmount, photons, type ConfocalState } from '../../instruments/confocal/model'
import { focusOk, LEAF, MAGS, type TemState } from '../../instruments/tem/model'

export const ELODEA_100_STEPS: ObserveStep[] = [
  kit.place('Elodea'),
  kit.clip(),
  kit.centre(),
  kit.coarse('Raise the stage with coarse focus until the green leaf appears.'),
  kit.fine(4),
  kit.lens(10, 'Turn to the 10x objective.'),
  kit.fine(10),
  kit.lens(40, 'Turn to the 40x objective.'),
  kit.fine(40, 'Sharpen with fine focus and fix the light.', true),
  kit.oil(),
  kit.lens(100, 'Turn the 100x oil immersion lens (white ring) into the oil.'),
  kit.fine(100, 'Sharpen with fine focus. At 1,000x you need plenty of light.', true),
  kit.ask('green', 'Green discs', 'Each green disc is one chloroplast, about 5 micrometres across.', {
    q: 'What green pigment do these chloroplasts contain?',
    options: ['Chromoplast', 'Chlorophyll', 'Iodine', 'Hoechst'],
    correct: 1,
    explain: 'Right. Chlorophyll traps the energy of light. It gives leaves and stems their green colour.',
  }),
  kit.ask('streaming', 'On the move', 'Watch one chloroplast for a few seconds.', {
    q: 'Why do the chloroplasts travel around the edge of each cell?',
    options: ['They swim', 'The cytoplasm flows and carries them, so they all get their turn in the light', 'The cell is dying', 'The microscope lamp is too hot'],
    correct: 1,
    explain: 'Yes: cytoplasmic streaming. Chloroplasts also move to face more or less light, depending on how bright it is.',
  }),
  kit.ask('where', 'Where in the plant?', 'Elodea is a water plant; this is one of its thin leaves.', {
    q: 'Why are chloroplasts found in leaves, but not in roots?',
    options: ['Roots are too small', 'Leaves get light; chloroplasts capture light energy', 'Roots have no cells', 'Leaves have no mitochondria'],
    correct: 1,
    explain: 'Exactly. Photosynthesis needs light.',
  }),
  kit.putAway(false, true),
]

export const PEPPER_STEPS: ObserveStep[] = [
  kit.place('red pepper'),
  kit.clip(),
  kit.centre(),
  kit.coarse('Raise the stage with coarse focus until an orange-red patch appears.'),
  kit.fine(4),
  kit.lens(10, 'Turn to the 10x objective.'),
  kit.fine(10),
  kit.lens(40, 'Turn to the 40x objective.'),
  kit.fine(40, 'Sharpen with fine focus and fix the light.', true),
  kit.ask('where', 'Where is the red?', 'Look closely inside one cell.', {
    q: 'Where does the red-orange colour come from?',
    options: ['The whole cell is dyed evenly', 'Many tiny red-orange bodies inside each cell', 'The cell walls', 'The water'],
    correct: 1,
    explain: 'Right. The colour is packed into small plastids.',
  }),
  kit.ask('chromoplast', 'Coloured plastids', 'These plastids are not green.', {
    q: 'What are these red-orange plastids called?',
    options: ['Chloroplasts', 'Chromoplasts', 'Mitochondria', 'Vacuoles'],
    correct: 1,
    explain: 'Yes: chromoplasts. They contain red, orange or yellow pigments and give colour to plant structures such as flowers, leaves and fruits.',
  }),
  kit.ask('green', 'Green to red', 'An unripe pepper is green; it turns red as it ripens.', {
    q: 'What happens to the plastids as a green pepper turns red?',
    options: ['The cells die', 'Chloroplasts change into chromoplasts: the chlorophyll breaks down and red pigments build up', 'The pepper absorbs red paint', 'Mitochondria turn red'],
    correct: 1,
    explain: 'Right. Chloroplasts and chromoplasts are both plastids, and one kind can turn into another.',
  }),
  kit.ask('walls', 'Thick walls', 'Notice the thick, beaded walls between the cells.', {
    q: 'What are those thick walls made of?',
    options: ['Peptidoglycan', 'Cellulose', 'Starch', 'Protein'],
    correct: 1,
    explain: 'Cellulose, as in every plant cell wall. The beads are thin spots, called pits, where neighbouring cells connect.',
  }),
  kit.putAway(false),
]

export const POTATO_STEPS: ObserveStep[] = [
  kit.place('potato'),
  kit.clip(),
  kit.centre(),
  kit.coarse('Raise the stage with coarse focus until dark specks appear.'),
  kit.fine(4),
  kit.lens(10, 'Turn to the 10x objective.'),
  kit.fine(10),
  kit.ask('test', 'The iodine test', 'Iodine solution is yellow-brown. It turns blue-black where there is starch.', {
    q: 'What does the blue-black colour tell you?',
    options: ['The cells are dead', 'The grains are full of starch', 'There is chlorophyll', 'There is DNA'],
    correct: 1,
    explain: 'Right. The yellow-brown background shows where there is no starch.',
  }),
  kit.lens(40, 'Turn to the 40x objective.'),
  kit.fine(40, 'Sharpen with fine focus and fix the light.', true),
  kit.ask('plastid', 'Storage plastids', 'Each oval grain formed inside a plastid. Faint rings show how it grew, layer by layer.', {
    q: 'What is the job of these plastids?',
    options: ['Capturing light', 'Storing starch', 'Giving the potato colour', 'Making proteins'],
    correct: 1,
    explain: 'Yes. Some plastids are used for storage: these store starch.',
  }),
  kit.ask('noGreen', 'No green', 'You cannot see a single chloroplast in the potato.', {
    q: 'Why does the potato store starch but have almost no chloroplasts?',
    options: ['It is not a plant', 'It grows underground in the dark and stores food made by the leaves', 'Iodine destroyed them', 'They are too small to see'],
    correct: 1,
    explain: 'Exactly. The leaves make sugar by photosynthesis; it is carried down and stored in the tuber as starch.',
  }),
  checklistStep('putaway', 'Put the microscope away', 'Leave it ready for the next person.', [tasks.lens4(), tasks.lower(), tasks.remove(), tasks.lampOff()]),
]

type CS = ConfocalState
export const CONFOCAL_MITO_STEPS: Step<CS>[] = [
  checklist<CS>('setup', 'Set up', 'These living cells are stained with two dyes: Hoechst for the nucleus and MitoTracker Green, which collects inside working mitochondria.', [
    { text: 'Switch the system on', done: (s) => s.power, lock: ['power'], highlight: ['power'] },
    { text: 'Turn on the 405 nm laser (Hoechst: nucleus)', done: (s) => s.lasers[405], lock: ['laser'], highlight: ['laser'] },
    { text: 'Turn on the 488 nm laser (MitoTracker: mitochondria)', done: (s) => s.lasers[488], lock: ['laser'], highlight: ['laser'] },
    { text: 'Choose the 63x oil objective', done: (s) => s.objective === 63, lock: ['objective'], highlight: ['objective', 'objectives'] },
    { text: 'Put a drop of immersion oil on the lens', done: (s) => s.oil, lock: ['oil'], highlight: ['oil'] },
    { text: 'Place the dish on the stage', done: (s) => s.dish, lock: ['dish'], highlight: ['dish', 'stage'] },
    { text: 'Start the live scan', done: (s) => s.scanning, lock: ['scan'], highlight: ['scan'] },
  ]),
  { id: 'focus', title: 'Find the cells', body: 'Focus up from the glass until green threads appear. They lie low in the flat cells, just above the glass.', highlight: ['focus'], lock: () => ['focus'], done: (s) => s.lasers[488] && Math.abs(s.z - 1.5) < 0.9 && inFocusAmount(s) > 0.6 },
  checklist<CS>('tune', 'A sharp, gentle image', 'Thin section, little light, and zoom in.', [
    { text: 'Close the pinhole to about 1 AU', done: (s) => s.pinhole <= 1.3, lock: ['pinhole', 'focus'], highlight: ['pinhole'] },
    { text: 'Raise the laser power until the grain goes (10% to 30%)', done: (s) => photons(s) >= 25 && s.laserPower <= 0.3, lock: ['laserPower', 'pinhole', 'focus'], highlight: ['laserPower'] },
    { text: 'Zoom in 4x', done: (s) => s.zoom === 4, lock: ['zoom', 'laserPower', 'focus'], highlight: ['zoom'] },
  ]),
  ask<CS>('threads', 'Green threads', 'The green threads are crowded around the blue nucleus.', {
    q: 'What are the green threads?',
    options: ['Chloroplasts', 'Mitochondria', 'Microfilaments', 'Nuclear pores'],
    correct: 1,
    explain: 'Right. In living cells mitochondria are often long and thread-like, not just the bean shape you see in drawings.',
  }, ['focus']),
  {
    id: 'watch', title: 'Speed up time', body: 'Turn on the time-lapse, then watch the long mitochondrion up and to the right of the nucleus for a few seconds.',
    highlight: ['timelapse'], lock: (s) => (s.timelapse ? ['focus'] : ['timelapse']),
    done: (_, seen) => seen.has('divisionSeen'),
  },
  ask<CS>('divide', 'What did it do?', 'Keep watching the same mitochondrion.', {
    q: 'What did the long mitochondrion do?',
    options: ['Nothing', 'It pinched in two, the halves moved apart, then they joined again', 'It turned blue', 'It left the cell'],
    correct: 1,
    explain: 'Yes. Mitochondria divide and join constantly, and move around the cell to where energy is needed.',
  }, ['focus', 'timelapse']),
  ask<CS>('why', 'Why so many?', 'Count roughly how many mitochondria one cell has.', {
    q: 'Which cells would you expect to have the most mitochondria?',
    options: ['Cells that use little energy', 'Cells that use a lot of energy, like muscle cells', 'Dead cells', 'Cells with no nucleus'],
    correct: 1,
    explain: 'Right. Mitochondria convert fuel into usable energy, so busy cells need many.',
  }, ['focus', 'timelapse']),
  checklist<CS>('shutdown', 'Shut down', 'Leave the microscope clean and safe.', [
    { text: 'Turn off the time-lapse', done: (s) => !s.timelapse, lock: ['timelapse'], highlight: ['timelapse'] },
    { text: 'Stop the live scan', done: (s) => !s.scanning, lock: ['scan'], highlight: ['scan'] },
    { text: 'Take the dish off the stage', done: (s) => !s.dish, lock: ['dish'], highlight: ['dish'] },
    { text: 'Wipe the oil off the lens', done: (s) => !s.oil, lock: ['clean'], highlight: ['clean'] },
    { text: 'Switch the system off', done: (s) => !s.power, lock: ['power'], highlight: ['power'] },
  ]),
]

type TS = TemState
const near = (s: TS, x: number, y: number, r: number) => Math.hypot(s.x - x, s.y - y) <= r
const C = LEAF.chloroplast, M = LEAF.mito

export const TEM_LEAF_STEPS: Step<TS>[] = [
  checklist<TS>('load', 'Into the vacuum', 'Load the leaf grid the same way as before.', [
    { text: 'Clip the grid into the holder tip', done: (s) => s.holder !== 'out', lock: ['load'], highlight: ['load', 'holder'] },
    { text: 'Push the holder into the airlock', done: (s) => s.holder === 'airlock' || s.holder === 'in', lock: ['toAirlock'], highlight: ['toAirlock', 'holder'] },
    { text: 'Pump the air out of the airlock', done: (s) => s.airlock >= 1 || s.holder === 'in', lock: ['pump', 'insert'], highlight: ['pump'] },
    { text: 'Insert the holder fully', done: (s) => s.holder === 'in', lock: ['insert'], highlight: ['insert', 'holder'] },
    { text: 'Switch on the high tension', done: (s) => s.ht, lock: ['ht'], highlight: ['ht'] },
    { text: 'Switch the beam on', done: (s) => s.beam, lock: ['beam'], highlight: ['beam'] },
  ]),
  { id: 'find', title: 'Find a leaf cell', body: 'Move to the cell in the middle of a grid square.', highlight: ['stage'], lock: () => ['stage'], done: (s) => s.mag === 0 && near(s, 0, 0, 7) },
  { id: 'm2000', title: 'A leaf cell', body: 'Go to 2,000x and centre the cell.', highlight: ['mag', 'stage'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 1 && near(s, 0, 0, 2.5) },
  ask<TS>('ovals', 'Around the edge', 'Inside the wall, the middle of the cell is almost empty: a big vacuole (Phase 7). The organelles are pushed out to the edge.', {
    q: 'What are the large oval organelles lined up around the edge?',
    options: ['Nuclei', 'Chloroplasts', 'Ribosomes', 'Bacteria'],
    correct: 1,
    explain: 'Right. Leaf cells are packed with chloroplasts, lying close to the light.',
  }, ['stage']),
  { id: 'chloroplast', title: 'One chloroplast', body: 'Centre the chloroplast at the top of the cell, go to 15,000x (close to the 16,000x of Figure 24) and focus.', highlight: ['mag', 'stage', 'focus'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 3 && near(s, C.x, C.y, 0.7) && focusOk(s) },
  ask<TS>('thylakoids', 'Stacks', 'Inside, dark stacks are joined by fine lines, all running the same way.', {
    q: 'What are the dark stacks inside the chloroplast?',
    options: ['Starch', 'Stacks of disk-shaped thylakoids, where chlorophyll traps light energy', 'Mitochondria', 'Holes'],
    correct: 1,
    explain: 'Yes. Each stack is a pile of thylakoids, like a stack of coins seen from the side. Their membranes hold the chlorophyll.',
  }, ['stage', 'focus']),
  ask<TS>('starch', 'A pale oval', 'There is a pale, empty-looking oval in the chloroplast.', {
    q: 'This pale oval is a grain of starch. Where did it come from?',
    options: ['From the potato', 'The chloroplast made sugar by photosynthesis and stored some of it as starch', 'It is an air bubble', 'From the soil'],
    correct: 1,
    explain: 'Right. Starch grains form in chloroplasts during the day and are broken down again at night.',
  }, ['stage', 'focus']),
  { id: 'toMito', title: 'Its neighbour', body: 'Move right along the edge of the cell. Just past the chloroplast there is a small oval organelle with lines across it. Centre it.', highlight: ['stage'], lock: () => ['stage', 'focus'], done: (s) => s.mag === 3 && near(s, M.x, M.y, 0.6) },
  {
    id: 'm44000', title: '44,000x, like Figure 23', body: 'Lower the brightness to 25% or less to protect the section. Then go to 44,000x (close to the 46,000x of Figure 23), centre it and focus.',
    highlight: ['brightness', 'mag', 'stage', 'focus'], lock: (s) => (s.brightness > 0.25 ? ['brightness'] : ['mag', 'stage', 'focus', 'brightness']),
    done: (s) => MAGS[s.mag] === 44000 && near(s, M.x, M.y, 0.3) && focusOk(s) && s.brightness <= 0.25 && s.brightness >= 0.15,
  },
  ask<TS>('mito', 'An energy generator', 'A smooth outline, and inside it many folds.', {
    q: 'What is this organelle?',
    options: ['A chloroplast', 'A mitochondrion', 'A nucleus', 'A vacuole'],
    correct: 1,
    explain: 'Right. Plant cells have mitochondria as well as chloroplasts.',
  }, ['stage', 'focus']),
  ask<TS>('cristae', 'The folds', 'Follow the membranes: an outer one around the edge, and an inner one that folds deep into the middle.', {
    q: 'Why is the inner membrane folded so much?',
    options: ['It was damaged by the knife', 'The folds give a large surface area for breaking the bonds in sugar molecules', 'To trap light', 'To store DNA'],
    correct: 1,
    explain: 'Exactly. More surface means more energy can be released from fuel at once.',
  }, ['stage', 'focus']),
  ask<TS>('both', 'Two energy organelles', 'You have now seen a chloroplast and a mitochondrion side by side in one plant cell.', {
    q: 'How do the jobs of chloroplasts and mitochondria fit together in a plant?',
    options: ['They do the same job', 'Chloroplasts turn light energy into chemical energy (sugar); mitochondria convert that fuel into usable energy', 'Mitochondria make sugar from light', 'Chloroplasts break down sugar'],
    correct: 1,
    explain: 'Right. One stores the energy of light in sugar; the other releases it for the cell to use.',
  }),
  checklist<TS>('shutdown', 'Finish', 'Leave the TEM ready for the next person.', [
    { text: 'Back to the lowest magnification', done: (s) => s.mag === 0, lock: ['mag'], highlight: ['mag'] },
    { text: 'Switch the beam off', done: (s) => !s.beam, lock: ['beam'], highlight: ['beam'] },
    { text: 'Withdraw the holder', done: (s) => s.holder !== 'in' && s.holder !== 'airlock', lock: ['withdraw'], highlight: ['withdraw', 'holder'] },
  ]),
]
