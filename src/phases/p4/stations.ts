import { ask, checklist, type Step } from '../../instruments/engine'
import { inFocusAmount, photons, type ConfocalState } from '../../instruments/confocal/model'
import { focusOk, MAGS, NUCLEUS, type TemState } from '../../instruments/tem/model'

type CS = ConfocalState
type TS = TemState

export const CONFOCAL_NUC_STEPS: Step<CS>[] = [
  checklist<CS>('setup', 'Set up', 'You know this microscope from Phase 2. This time there are only two dyes, so you need two lasers.', [
    { text: 'Switch the system on', done: (s) => s.power, lock: ['power'], highlight: ['power'] },
    { text: 'Turn on the 405 nm laser (Hoechst: DNA)', done: (s) => s.lasers[405], lock: ['laser'], highlight: ['laser'] },
    { text: 'Turn on the 488 nm laser (GFP: nuclear pores)', done: (s) => s.lasers[488], lock: ['laser'], highlight: ['laser'] },
    { text: 'Choose the 63x oil objective', done: (s) => s.objective === 63, lock: ['objective'], highlight: ['objective', 'objectives'] },
    { text: 'Put a drop of immersion oil on the lens', done: (s) => s.oil, lock: ['oil'], highlight: ['oil'] },
    { text: 'Place the dish on the stage', done: (s) => s.dish, lock: ['dish'], highlight: ['dish', 'stage'] },
    { text: 'Start the live scan', done: (s) => s.scanning, lock: ['scan'], highlight: ['scan'] },
  ]),
  { id: 'focus', title: 'Find the nuclei', body: 'Focus up from the glass into the cells until blue shapes appear.', tip: 'The readout shows the height of the focus above the glass.', highlight: ['focus'], lock: () => ['focus'], done: (s) => inFocusAmount(s) > 0.6 },
  checklist<CS>('tune', 'A sharp, gentle image', 'Make a thin optical section with as little laser light as possible.', [
    { text: 'Close the pinhole to about 1 AU', done: (s) => s.pinhole <= 1.3, lock: ['pinhole', 'focus'], highlight: ['pinhole'] },
    { text: 'Raise the laser power until the grain goes (10% to 30%)', done: (s) => photons(s) >= 25 && s.laserPower <= 0.3, lock: ['laserPower', 'pinhole', 'focus'], highlight: ['laserPower'] },
    { text: 'Zoom in 4x on the nucleus in the middle', done: (s) => s.zoom === 4, lock: ['zoom', 'laserPower', 'focus'], highlight: ['zoom'] },
  ]),
  { id: 'middle', title: 'The middle of the nucleus', body: 'Focus up and down until the nucleus in the middle looks as wide as it can be. That is its middle, about 4.5 um above the glass.', highlight: ['focus'], lock: () => ['focus'], done: (s) => s.zoom === 4 && Math.abs(s.z - 4.5) < 0.6 && s.pinhole <= 1.3 },
  ask<CS>('blue', 'The blue glow', 'Hoechst sticks to DNA, so blue means DNA.', {
    q: 'The blue fills the whole nucleus, unevenly. What is it?',
    options: ['Water', 'Chromatin: DNA attached to protein, spread throughout the nucleus', 'Ribosomes', 'The plasma membrane'],
    correct: 1,
    explain: 'Right. The brighter patches, many along the edge, are where the chromatin is packed most tightly.',
  }, ['focus']),
  ask<CS>('holes', 'Dark holes', 'Look at the round dark spots inside the blue.', {
    q: 'What are the round dark spots where there is almost no DNA?',
    options: ['Holes in the nucleus', 'Nucleoli: the sites of ribosome production', 'Air bubbles', 'Nuclear pores'],
    correct: 1,
    explain: 'Yes. A nucleolus is packed with RNA and protein for making ribosomes, with little DNA, so Hoechst barely lights it.',
  }, ['focus']),
  ask<CS>('ring', 'A green ring', 'These cells make a protein that is part of every nuclear pore, joined to a green fluorescent protein (GFP).', {
    q: 'What is the ring of green dots around the nucleus?',
    options: ['Chloroplasts', 'Nuclear pores in the nuclear envelope', 'Mitochondria', 'Microtubules'],
    correct: 1,
    explain: 'Right. At the middle, the thin optical section cuts across the side of the envelope, so you see the pores as a ring of dots.',
  }, ['focus']),
  { id: 'top', title: 'Near the top', body: 'Now focus up slowly towards the top of the nucleus, until it is roughly half as wide and covered in green dots (about 7 um).', highlight: ['focus'], lock: () => ['focus'], done: (s) => s.z > 6.7 && s.z < 7.6 },
  ask<CS>('sheet', 'Pores face-on', 'Compare this with the view at the middle.', {
    q: 'Why is the nucleus smaller here, and why are the green dots spread across it?',
    options: ['The nucleus shrank', 'Near its top the nucleus is narrower, and the section skims along the top of the envelope, so you see the pores face-on', 'The dye is fading', 'The pores moved to the top'],
    correct: 1,
    explain: 'Exactly. The nucleus is a 3D shape: each focus height shows a different slice through it. Keep that in mind for the electron microscope.',
  }, ['focus']),
  checklist<CS>('shutdown', 'Shut down', 'Leave the microscope clean and safe.', [
    { text: 'Stop the live scan', done: (s) => !s.scanning, lock: ['scan'], highlight: ['scan'] },
    { text: 'Take the dish off the stage', done: (s) => !s.dish, lock: ['dish'], highlight: ['dish'] },
    { text: 'Wipe the oil off the lens', done: (s) => !s.oil, lock: ['clean'], highlight: ['clean'] },
    { text: 'Switch the system off', done: (s) => !s.power, lock: ['power'], highlight: ['power'] },
  ]),
]

const near = (s: TS, x: number, y: number, r: number) => Math.hypot(s.x - x, s.y - y) <= r
const P = NUCLEUS.pore, NL = NUCLEUS.nucleolus

export const TEM_NUC_STEPS: Step<TS>[] = [
  checklist<TS>('load', 'Into the vacuum', 'Load the new grid the same way as before.', [
    { text: 'Clip the grid into the holder tip', done: (s) => s.holder !== 'out', lock: ['load'], highlight: ['load', 'holder'] },
    { text: 'Push the holder into the airlock', done: (s) => s.holder === 'airlock' || s.holder === 'in', lock: ['toAirlock'], highlight: ['toAirlock', 'holder'] },
    { text: 'Pump the air out of the airlock', done: (s) => s.airlock >= 1 || s.holder === 'in', lock: ['pump', 'insert'], highlight: ['pump'] },
    { text: 'Insert the holder fully', done: (s) => s.holder === 'in', lock: ['insert'], highlight: ['insert', 'holder'] },
    { text: 'Switch on the high tension', done: (s) => s.ht, lock: ['ht'], highlight: ['ht'] },
    { text: 'Switch the beam on', done: (s) => s.beam, lock: ['beam'], highlight: ['beam'] },
  ]),
  { id: 'find', title: 'Find a cell', body: 'Move to the cell in the middle of a grid square.', highlight: ['stage'], lock: () => ['stage'], done: (s) => s.mag === 0 && near(s, 0, 0, 7) },
  { id: 'm2000', title: 'The cell', body: 'Go to 2,000x and centre the cell. Notice the nuclei of the neighbouring cells as you pass: they are not all the same size, and some show no nucleolus. You will find out why after this.', highlight: ['mag', 'stage'], lock: () => ['mag', 'stage'], done: (s) => s.mag === 1 && near(s, 0, 0, 2.5) },
  { id: 'm5000', title: 'The nucleus', body: 'Go to 5,000x and focus. The nucleus fills most of the screen.', highlight: ['mag', 'focus'], lock: () => ['mag', 'focus', 'stage'], done: (s) => s.mag === 2 && focusOk(s) && near(s, 0, 0, 2.5) },
  ask<TS>('chromatin', 'Dark and pale', 'Inside the nucleus some areas are dark and clumped, others pale. Dark means dense: it stopped more electrons.', {
    q: 'What are the dark clumps, many of them lining the inside of the nucleus?',
    options: ['Holes', 'Tightly packed chromatin (DNA attached to protein)', 'Mitochondria', 'Cell walls'],
    correct: 1,
    explain: 'Right. Chromatin is spread throughout the nucleus; where it is packed tightly, it looks dark.',
  }, ['stage', 'focus']),
  { id: 'nucleolus', title: 'The nucleolus', body: 'Find the large, dark, grainy body inside the nucleus. Go to 15,000x, centre it and focus.', highlight: ['mag', 'stage', 'focus'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 3 && near(s, NL.x, NL.y, 0.6) && focusOk(s) },
  ask<TS>('ribosomes', 'A factory inside the factory', 'The nucleolus is packed with tiny granules and has a few small pale islands.', {
    q: 'What does the nucleolus produce?',
    options: ['DNA', 'Ribosomes', 'Nuclear pores', 'Cellulose'],
    correct: 1,
    explain: 'Yes. The granules are ribosome parts being assembled. They leave the nucleus through the nuclear pores.',
  }, ['stage', 'focus']),
  { id: 'edge', title: 'The edge of the nucleus', body: 'Stay at 15,000x and move down to the bottom edge of the nucleus, below the centre, where the dark rim of the nucleus meets the cytoplasm.', highlight: ['stage'], lock: () => ['stage', 'focus'], done: (s) => s.mag === 3 && near(s, P.x, P.y, 0.9) },
  {
    id: 'm44000', title: '44,000x, like Figure 22', body: 'Lower the brightness to 25% or less to protect the section. Then go to 44,000x, focus, and move along the edge until you find a gap in the envelope.',
    tip: 'A gap in the envelope is where the two lines meet and stop.',
    highlight: ['brightness', 'mag', 'stage', 'focus'], lock: (s) => (s.brightness > 0.25 ? ['brightness'] : ['mag', 'stage', 'focus', 'brightness']),
    done: (s) => MAGS[s.mag] === 44000 && near(s, P.x, P.y, 0.35) && focusOk(s) && s.brightness <= 0.25 && s.brightness >= 0.15,
  },
  ask<TS>('double', 'Two lines', 'Look closely at the edge of the nucleus.', {
    q: 'Why is the edge of the nucleus made of two thin dark lines?',
    options: ['It is out of focus', 'The nuclear envelope is a double membrane', 'There are two nuclei', 'It is the cell wall'],
    correct: 1,
    explain: 'Right. Two membranes with a narrow space between them. The dots on the outer membrane are ribosomes.',
  }, ['stage', 'focus']),
  ask<TS>('pore', 'The gap', 'At the gap, the two membranes join and leave an opening, with fuzzy material in it. Notice the pale path through the dark chromatin leading to it.', {
    q: 'What is this opening in the envelope?',
    options: ['A tear made by the knife', 'A nuclear pore: it lets larger substances move in and out of the nucleus', 'A ribosome', 'A nucleolus'],
    correct: 1,
    explain: 'Exactly. In the confocal you saw thousands of these as green dots. Here you see one cut through the middle.',
  }, ['stage', 'focus']),
  checklist<TS>('shutdown', 'Finish', 'Leave the TEM ready for the next person.', [
    { text: 'Back to the lowest magnification', done: (s) => s.mag === 0, lock: ['mag'], highlight: ['mag'] },
    { text: 'Switch the beam off', done: (s) => !s.beam, lock: ['beam'], highlight: ['beam'] },
    { text: 'Withdraw the holder', done: (s) => s.holder !== 'in' && s.holder !== 'airlock', lock: ['withdraw'], highlight: ['withdraw', 'holder'] },
  ]),
]
