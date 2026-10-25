import { kit } from '../../lab/stepKit'
import type { ObserveStep } from '../../lab/steps'
import { specimenTime } from '../../scope/clock'
import { ask, checklist, type Step } from '../../instruments/engine'
import { inFocusAmount, photons, type ConfocalState } from '../../instruments/confocal/model'
import { focusOk, MACRO, type TemState } from '../../instruments/tem/model'

// Seconds since salt water reached the cells (mount.variant holds the specimen time plus 1, see RED_ONION).
const saltFor = (v?: number) => (v && v > 0.5 ? specimenTime() - (v - 1) : 0)

export const RED_ONION_STEPS: ObserveStep[] = [
  kit.place('red onion'),
  kit.clip(),
  kit.centre(),
  kit.coarse('Raise the stage with coarse focus until a purple patch appears.'),
  kit.fine(4),
  kit.lens(10, 'Turn to the 10x objective.'),
  kit.fine(10),
  kit.ask('purple', 'Purple cells', 'No stain was added, yet the cells are purple.', {
    q: 'How much of each cell is purple?',
    options: ['Only a small dot in the middle', 'Almost the whole cell', 'Only the cell wall', 'None of it'],
    correct: 1,
    explain: 'Right. The purple is dissolved in the sap of one huge vacuole that fills almost the whole cell.',
  }),
  kit.lens(40, 'Turn to the 40x objective.'),
  kit.fine(40, 'Sharpen with fine focus and fix the light.', true),
  kit.ask('vacuole', 'The central vacuole', 'Look at one cell closely. The purple reaches almost to the wall all round.', {
    q: 'What is the purple part of each cell?',
    options: ['The nucleus', 'The large central vacuole, full of purple sap', 'A chloroplast', 'The cell wall'],
    correct: 1,
    explain: 'Yes. The vacuole stores water and dissolved materials, here including a purple pigment. The cytoplasm is squashed into a thin layer against the wall.',
  }),
  {
    id: 'salt', title: 'Salt water', body: 'Now an experiment, with the slide still on the stage. Put a drop of strong salt water right next to one edge of the coverslip.',
    highlight: [], lock: () => ({ allow: ['fine'] }), act: { label: 'Drop salt water at the left edge' }, done: (_, seen) => seen.has('acted'),
  },
  {
    id: 'draw', title: 'Pull it through', body: 'Touch a paper towel to the opposite edge of the coverslip. It soaks up the water under the coverslip and pulls the salt water across the cells.',
    highlight: [], lock: () => ({ allow: ['fine'] }),
    act: { label: 'Touch a paper towel to the right edge', mount: (m) => ({ ...m, variant: specimenTime() + 1 }) },
    done: (_, seen) => seen.has('acted'),
  },
  {
    id: 'watch', title: 'Watch the same cells', body: 'Keep watching the cells for about a minute. Do not move the slide.',
    highlight: ['fine'], lock: () => ({ allow: ['fine'] }), done: (s) => saltFor(s.mount?.variant) > 40,
  },
  kit.ask('shrink', 'What changed?', 'Compare the cells now with how they looked in water.', {
    q: 'What happened to the purple part of each cell?',
    options: ['It grew and burst the cell', 'It shrank away from the cell wall and got darker', 'It turned green', 'It left the cell'],
    correct: 1,
    explain: 'Right. The salt water drew water out of the vacuole. The same purple pigment, in less water, looks darker.',
  }),
  kit.ask('wall', 'The wall stays', 'The outline of every cell is still in exactly the same place.', {
    q: 'Why did the cell outlines not shrink?',
    options: ['The salt made them hard', 'The cell wall is stiff (cellulose): it keeps its shape while the inside shrinks', 'The microscope held them', 'They did shrink'],
    correct: 1,
    explain: 'Yes. The wall gives plant cells protection and support. In normal conditions the full vacuole pushes the cytoplasm against it, like air in a tyre.',
  }),
  kit.putAway(true),
]

type TS = TemState
const near = (s: TS, p: { x: number; y: number }, r: number) => Math.hypot(s.x - p.x, s.y - p.y) <= r
const loadTasks = (what: string) => checklist<TS>('load', 'Into the vacuum', `Load the ${what} grid the same way as before.`, [
  { text: 'Clip the grid into the holder tip', done: (s) => s.holder !== 'out', lock: ['load'], highlight: ['load', 'holder'] },
  { text: 'Push the holder into the airlock', done: (s) => s.holder === 'airlock' || s.holder === 'in', lock: ['toAirlock'], highlight: ['toAirlock', 'holder'] },
  { text: 'Pump the air out of the airlock', done: (s) => s.airlock >= 1 || s.holder === 'in', lock: ['pump', 'insert'], highlight: ['pump'] },
  { text: 'Insert the holder fully', done: (s) => s.holder === 'in', lock: ['insert'], highlight: ['insert', 'holder'] },
  { text: 'Switch on the high tension', done: (s) => s.ht, lock: ['ht'], highlight: ['ht'] },
  { text: 'Switch the beam on', done: (s) => s.beam, lock: ['beam'], highlight: ['beam'] },
])
const finish = (colour: boolean) => checklist<TS>('shutdown', 'Finish', 'Leave the TEM ready for the next grid.', [
  ...(colour ? [{ text: 'Turn false colour off', done: (s: TS) => !s.falseColour, lock: ['falseColour'], highlight: ['falseColour'] }] : []),
  { text: 'Back to the lowest magnification', done: (s) => s.mag === 0, lock: ['mag'], highlight: ['mag'] },
  { text: 'Switch the beam off', done: (s) => !s.beam, lock: ['beam'], highlight: ['beam'] },
  { text: 'Withdraw the holder', done: (s) => s.holder !== 'in' && s.holder !== 'airlock', lock: ['withdraw'], highlight: ['withdraw', 'holder'] },
])

export const TEM_VACUOLE_STEPS: Step<TS>[] = [
  loadTasks('leaf'),
  { id: 'find', title: 'Find a leaf cell', body: 'Move to the cell in the middle of a grid square.', highlight: ['stage'], lock: () => ['stage'], done: (s) => s.mag === 0 && near(s, { x: 0, y: 0 }, 7) },
  { id: 'm2000', title: 'The whole cell', body: 'Go to 2,000x and centre the cell.', highlight: ['mag', 'stage'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 1 && near(s, { x: 0, y: 0 }, 2.5) },
  ask<TS>('empty', 'An empty middle?', 'The chloroplasts line the edge of the cell. The middle looks almost empty.', {
    q: 'What fills the middle of this leaf cell?',
    options: ['Nothing: it is a hole', 'One large vacuole', 'The nucleus', 'Air'],
    correct: 1,
    explain: 'Right: the central vacuole, as in Figure 27. In this cell it fills most of the space.',
  }, ['stage']),
  {
    id: 'm5000', title: '5,000x, like Figure 27', body: 'Centre the top edge of the cell, where the chloroplasts meet the vacuole. Go to 5,000x (close to the 4,500x of Figure 27) and focus.',
    highlight: ['mag', 'stage', 'focus'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 2 && near(s, { x: 0, y: 7.5 }, 1.5) && focusOk(s),
  },
  ask<TS>('pale', 'Pale inside', 'A thin membrane separates the vacuole from the cytoplasm around it.', {
    q: 'Why does the vacuole look so pale and empty in the TEM?',
    options: ['The knife cut it out', 'It holds mostly water with dissolved materials, which barely stop electrons', 'It is full of air', 'The beam burned it'],
    correct: 1,
    explain: 'Yes. Membranes and proteins take up the heavy-metal stains; watery sap does not.',
  }, ['stage', 'focus']),
  ask<TS>('store', 'A storage tank', 'Compare this with the red onion cells.', {
    q: 'What does a plant cell store in its vacuole?',
    options: ['DNA', 'Food, enzymes, other materials it needs, and some wastes', 'Ribosomes', 'Chloroplasts'],
    correct: 1,
    explain: 'Right. A vacuole is a sac for temporary storage, like a factory storeroom.',
  }, ['stage', 'focus']),
  finish(false),
]

const L = MACRO.lysosome, B = MACRO.bacterium, A = MACRO.autophagy
export const TEM_LYSO_STEPS: Step<TS>[] = [
  loadTasks('white blood cell'),
  { id: 'find', title: 'Find a white blood cell', body: 'Move to the cell in the middle of a grid square.', highlight: ['stage'], lock: () => ['stage'], done: (s) => s.mag === 0 && near(s, { x: 0, y: 0 }, 7) },
  { id: 'm2000', title: 'A macrophage', body: 'Go to 2,000x and centre the cell.', highlight: ['mag', 'stage'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 1 && near(s, { x: 0, y: 0 }, 2.5) },
  ask<TS>('dots', 'Dark dots', 'This white blood cell is a macrophage: its job is to swallow bacteria. Notice the thin folds round its edge for catching them, and the many very dark dots inside.', {
    q: 'What are the many small, very dark round bodies?',
    options: ['Nuclei', 'Lysosomes, packed with digestive enzymes', 'Chloroplasts', 'Holes'],
    correct: 1,
    explain: 'Right. A cell that eats bacteria needs a big cleanup crew.',
  }, ['stage']),
  {
    id: 'lyso', title: 'One lysosome, like Figure 28', body: 'Centre the large round body up and to the right of the nucleus. Go to 15,000x (close to the 13,500x of Figure 28) and focus.',
    highlight: ['mag', 'stage', 'focus'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 3 && near(s, L, 0.5) && focusOk(s),
  },
  ask<TS>('membrane', 'One membrane', 'Dense, mixed contents, wrapped in a single membrane.', {
    q: 'What is the job of the membrane around the lysosome?',
    options: ['To make enzymes', 'To keep the digestive enzymes from destroying the cell', 'To capture light', 'To let the enzymes leak out'],
    correct: 1,
    explain: 'Yes. The enzymes stay sealed inside until the lysosome fuses with something that needs digesting.',
  }, ['stage', 'focus']),
  {
    id: 'bact', title: 'Something swallowed', body: 'Move down from the lysosome, past the right side of the nucleus, to a pale oval sac with a rod inside. Centre it and focus.',
    highlight: ['stage', 'focus', 'mag'], lock: () => ['stage', 'focus', 'mag'], done: (s) => s.mag === 3 && near(s, B, 0.5) && focusOk(s),
  },
  ask<TS>('digest', 'A meal', 'The rod has a wall and dense insides, and one end is breaking up. Dark lysosome material lines one side of the sac.', {
    q: 'What is happening here?',
    options: ['The cell is dividing', 'The macrophage swallowed a bacterium; lysosomes fused with the sac and are digesting it', 'A mitochondrion is making energy', 'The section is torn'],
    correct: 1,
    explain: 'Right. Lysosomes digest bacteria and viruses that have entered the cell.',
  }, ['stage', 'focus']),
  {
    id: 'auto', title: 'A double wrapping', body: 'Go down to 5,000x to travel. Above the nucleus, slightly left, is an oval with two membranes round it. Centre it, go back to 15,000x and focus.',
    highlight: ['stage', 'focus', 'mag'], lock: () => ['stage', 'focus', 'mag'], done: (s) => s.mag === 3 && near(s, A, 0.5) && focusOk(s),
  },
  ask<TS>('worn', 'Recycling', 'Inside the double membrane there is a mitochondrion: you can still see its folds, but it is fading.', {
    q: 'What is happening to this mitochondrion?',
    options: ['It is dividing', 'It is worn out, and has been wrapped up to be digested by lysosomes', 'It is turning into a chloroplast', 'It is leaving the cell'],
    correct: 1,
    explain: 'Yes. Lysosomes digest excess or worn-out organelles, and the cell reuses the parts.',
  }, ['stage', 'focus']),
  { id: 'colour', title: 'Like the textbook', body: 'Go back to the large lysosome and turn on false colour to compare with Figure 28.', highlight: ['falseColour', 'stage'], lock: () => ['falseColour', 'stage', 'focus', 'mag'], done: (s) => s.falseColour && near(s, L, 1.2) },
  finish(true),
]

type CS = ConfocalState
export const CONFOCAL_LYSO_STEPS: Step<CS>[] = [
  checklist<CS>('setup', 'Set up', 'Living macrophages that have just swallowed glowing bacteria. Three channels this time.', [
    { text: 'Switch the system on', done: (s) => s.power, lock: ['power'], highlight: ['power'] },
    { text: 'Turn on the 405 nm laser (Hoechst: nucleus)', done: (s) => s.lasers[405], lock: ['laser'], highlight: ['laser'] },
    { text: 'Turn on the 488 nm laser (GFP: bacteria)', done: (s) => s.lasers[488], lock: ['laser'], highlight: ['laser'] },
    { text: 'Turn on the 640 nm laser (LysoTracker: lysosomes)', done: (s) => s.lasers[640], lock: ['laser'], highlight: ['laser'] },
    { text: 'Choose the 63x oil objective', done: (s) => s.objective === 63, lock: ['objective'], highlight: ['objective', 'objectives'] },
    { text: 'Put a drop of immersion oil on the lens', done: (s) => s.oil, lock: ['oil'], highlight: ['oil'] },
    { text: 'Place the dish on the stage', done: (s) => s.dish, lock: ['dish'], highlight: ['dish', 'stage'] },
    { text: 'Start the live scan', done: (s) => s.scanning, lock: ['scan'], highlight: ['scan'] },
  ]),
  { id: 'focus', title: 'Find the cells', body: 'Focus up from the glass until coloured dots and green rods appear.', highlight: ['focus'], lock: () => ['focus'], done: (s) => Math.abs(s.z - 1.8) < 1 && inFocusAmount(s) > 0.6 },
  checklist<CS>('tune', 'A sharp, gentle image', 'Thin section, little light, one cell filling the screen.', [
    { text: 'Close the pinhole to about 1 AU', done: (s) => s.pinhole <= 1.3, lock: ['pinhole', 'focus'], highlight: ['pinhole'] },
    { text: 'Raise the laser power until the grain goes (10% to 30%)', done: (s) => photons(s) >= 25 && s.laserPower <= 0.3, lock: ['laserPower', 'pinhole', 'focus'], highlight: ['laserPower'] },
    { text: 'Zoom in 4x', done: (s) => s.zoom === 4, lock: ['zoom', 'laserPower', 'focus'], highlight: ['zoom'] },
  ]),
  ask<CS>('rods', 'Green rods', 'The faint green haze is the cell itself. Look at the bright green rods.', {
    q: 'What are the green rods inside the cell?',
    options: ['Mitochondria', 'Bacteria the macrophage has swallowed', 'Chloroplasts', 'Lysosomes'],
    correct: 1,
    explain: 'Right. Each one is sealed inside a small sac of membrane.',
  }, ['focus']),
  ask<CS>('dots', 'Magenta dots', 'Watch the magenta dots for a few seconds.', {
    q: 'LysoTracker collects in acidic sacs full of digestive enzymes. What are the magenta dots?',
    options: ['Nuclei', 'Ribosomes', 'Lysosomes', 'Vacuoles full of purple sap'],
    correct: 2,
    explain: 'Yes. Notice how they wander and sometimes dart quickly: they are carried along microtubules.',
  }, ['focus']),
  { id: 'watch', title: 'Speed up time', body: 'Turn on the time-lapse and watch the bacteria. Keep an eye on the clock.', highlight: ['timelapse'], lock: () => ['timelapse', 'focus'], done: (s) => s.clockMin >= 15 },
  { id: 'pause', title: 'Slow down', body: 'Turn the time-lapse off to look closely.', highlight: ['timelapse'], lock: () => ['timelapse', 'focus'], done: (s) => !s.timelapse },
  ask<CS>('fuse', 'Around the bacteria', 'Green and magenta overlapping shows as white.', {
    q: 'What has happened around each bacterium?',
    options: ['Nothing', 'Lysosomes gathered and fused with the sac, adding their enzymes', 'The bacteria escaped', 'The nucleus moved there'],
    correct: 1,
    explain: 'Right. The lysosomes poured their digestive enzymes in with the bacterium.',
  }, ['focus']),
  { id: 'watch2', title: 'Keep watching', body: 'Turn the time-lapse on again and watch until about 40 minutes.', highlight: ['timelapse'], lock: () => ['timelapse', 'focus'], done: (s) => s.clockMin >= 40 },
  ask<CS>('gone', 'Where is the green?', 'Look at the sacs where the bacteria were.', {
    q: 'Why has the green disappeared?',
    options: ['The laser bleached it', 'The lysosome enzymes digested the bacteria, glowing protein and all', 'The bacteria swam away', 'The cell divided'],
    correct: 1,
    explain: 'Yes. Only the magenta, acidic digesting sacs are left. Bleaching would have dimmed the magenta too.',
  }, ['focus', 'timelapse']),
  checklist<CS>('shutdown', 'Shut down', 'Leave the microscope clean and safe.', [
    { text: 'Turn off the time-lapse', done: (s) => !s.timelapse, lock: ['timelapse'], highlight: ['timelapse'] },
    { text: 'Stop the live scan', done: (s) => !s.scanning, lock: ['scan'], highlight: ['scan'] },
    { text: 'Take the dish off the stage', done: (s) => !s.dish, lock: ['dish'], highlight: ['dish'] },
    { text: 'Wipe the oil off the lens', done: (s) => !s.oil, lock: ['clean'], highlight: ['clean'] },
    { text: 'Switch the system off', done: (s) => !s.power, lock: ['power'], highlight: ['power'] },
  ]),
]
