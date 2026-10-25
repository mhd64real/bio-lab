import { ask, checklist, type Step } from '../../instruments/engine'
import { inFocusAmount, photons, type ConfocalState } from '../../instruments/confocal/model'
import { focusOk, LIVER, magOf, type TemState } from '../../instruments/tem/model'

type TS = TemState
const near = (s: TS, p: { x: number; y: number }, r: number) => Math.hypot(s.x - p.x, s.y - p.y) <= r
const at46 = (s: TS) => magOf(s) === 46000

export const TEM_LIVER_STEPS: Step<TS>[] = [
  checklist<TS>('load', 'Into the vacuum', 'Load the liver grid the same way as before.', [
    { text: 'Clip the grid into the holder tip', done: (s) => s.holder !== 'out', lock: ['load'], highlight: ['load', 'holder'] },
    { text: 'Push the holder into the airlock', done: (s) => s.holder === 'airlock' || s.holder === 'in', lock: ['toAirlock'], highlight: ['toAirlock', 'holder'] },
    { text: 'Pump the air out of the airlock', done: (s) => s.airlock >= 1 || s.holder === 'in', lock: ['pump', 'insert'], highlight: ['pump'] },
    { text: 'Insert the holder fully', done: (s) => s.holder === 'in', lock: ['insert'], highlight: ['insert', 'holder'] },
    { text: 'Switch on the high tension', done: (s) => s.ht, lock: ['ht'], highlight: ['ht'] },
    { text: 'Switch the beam on', done: (s) => s.beam, lock: ['beam'], highlight: ['beam'] },
  ]),
  { id: 'find', title: 'Find a liver cell', body: 'Move to the cell in the middle of a grid square.', highlight: ['stage'], lock: () => ['stage'], done: (s) => s.mag === 0 && near(s, { x: 0, y: 0 }, 7) },
  { id: 'm2000', title: 'Liver cells', body: 'Go to 2,000x and centre the cell.', highlight: ['mag', 'stage'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 1 && near(s, { x: 0, y: 0 }, 2.5) },
  ask<TS>('mito', 'A busy cell', 'Liver cells are packed side by side. The big round body is the nucleus.', {
    q: 'What are the many small dark ovals all through the cytoplasm?',
    options: ['Nuclei', 'Mitochondria', 'Ribosomes', 'Red blood cells'],
    correct: 1,
    explain: 'Right. A liver cell does a lot of work and has more than a thousand mitochondria.',
  }, ['stage']),
  {
    id: 'toRer', title: 'Parallel lines', body: 'To the right of the nucleus, a little lower, there is a stack of fine parallel lines. Centre it, go to 15,000x and focus.',
    highlight: ['mag', 'stage', 'focus'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 3 && near(s, LIVER.rer, 0.9) && focusOk(s),
  },
  {
    id: 'rer46', title: '46,000x, like Figure 26', body: 'Lower the brightness to 25% or less to protect the section. Then go to 46,000x, centre the stack and focus.',
    highlight: ['brightness', 'mag', 'stage', 'focus'], lock: (s) => (s.brightness > 0.25 ? ['brightness'] : ['mag', 'stage', 'focus', 'brightness']),
    done: (s) => at46(s) && near(s, LIVER.rer, 0.5) && focusOk(s) && s.brightness <= 0.25 && s.brightness >= 0.15,
  },
  ask<TS>('bumps', 'Beads on the sacs', 'Each pair of lines is a flattened sac seen edge on. Look along the outside of the sacs.', {
    q: 'What are the dark dots lined up along the outside of each sac?',
    options: ['Nuclear pores', 'Ribosomes', 'Glycogen', 'Holes burned by the beam'],
    correct: 1,
    explain: 'Yes. Sacs covered in ribosomes are rough ER: the bumps of Figure 25. These ribosomes make proteins for export.',
  }, ['stage', 'focus']),
  ask<TS>('free', 'Loose ribosomes', 'There are also dots scattered between the sacs, not attached to anything.', {
    q: 'What do these free ribosomes make?',
    options: ['Lipids', 'Proteins for use within the cytoplasm', 'DNA', 'Starch'],
    correct: 1,
    explain: 'Right. Free ribosomes make proteins the cell keeps; ribosomes on the ER make proteins for membranes or for export.',
  }, ['stage', 'focus']),
  {
    id: 'toSer', title: 'Below the nucleus', body: 'Go down to 5,000x to travel. Below the nucleus is a speckled area full of dark clusters. Centre it, then go back to 46,000x and focus.',
    highlight: ['mag', 'stage', 'focus'], lock: () => ['mag', 'stage', 'focus', 'brightness'],
    done: (s) => at46(s) && near(s, LIVER.ser, 1.0) && focusOk(s),
  },
  ask<TS>('smooth', 'No bumps', 'Look at the small pale tubes and rings. Compare them with the sacs you just saw.', {
    q: 'These tubes have no ribosomes on them. What are they?',
    options: ['Rough ER', 'Smooth ER', 'Microtubules', 'The Golgi apparatus'],
    correct: 1,
    explain: 'Right. The smooth ER is a network of tubes; the thin section cuts it into short pieces and rings.',
  }, ['stage', 'focus']),
  ask<TS>('detox', 'A liver speciality', 'The very dark clusters between the tubes are glycogen: the way liver cells store sugar.', {
    q: 'Which job of the smooth ER is especially important in the liver?',
    options: ['Capturing light', 'Detoxifying harmful substances', 'Making ribosomes', 'Moving the cell'],
    correct: 1,
    explain: 'Yes. Smooth ER in the liver detoxifies harmful substances. Everywhere, it also makes lipids and complex carbohydrates.',
  }, ['stage', 'focus']),
  {
    id: 'toGolgi', title: 'The packing station', body: 'Travel at lower magnification again. Find a small curved stack just above the nucleus, slightly to the right. Centre it, then go to 46,000x and focus.',
    highlight: ['mag', 'stage', 'focus'], lock: () => ['mag', 'stage', 'focus', 'brightness'],
    done: (s) => at46(s) && near(s, LIVER.golgi, 0.35) && focusOk(s),
  },
  ask<TS>('golgi', 'A curved stack', 'Thin flattened sacs, stacked and curved, with swollen rims.', {
    q: 'What is this curved stack of flattened membranes?',
    options: ['Rough ER', 'A mitochondrion', 'The Golgi apparatus', 'The nuclear envelope'],
    correct: 2,
    explain: 'Right: the Golgi apparatus, just like Figure 26 at the same magnification.',
  }, ['stage', 'focus']),
  ask<TS>('vesicles', 'Round sacs', 'Small round sacs crowd around the rims. Bigger ones, full of dark particles, sit on the outer side.', {
    q: 'What are these round sacs, and what are they doing?',
    options: ['Ribosomes making proteins', 'Vesicles carrying packaged material to and from the Golgi', 'Air bubbles', 'Nuclei'],
    correct: 1,
    explain: 'Yes. In liver cells the big vesicles carry particles of fat joined to protein, which the cell releases into the blood.',
  }, ['stage', 'focus']),
  { id: 'colour', title: 'Like the textbook', body: 'Turn on false colour to compare with Figure 26. Remember: the colours are added by a computer.', highlight: ['falseColour'], lock: () => ['falseColour', 'stage', 'focus'], done: (s) => s.falseColour },
  checklist<TS>('shutdown', 'Finish', 'Leave the TEM ready for the next person.', [
    { text: 'Turn false colour off', done: (s) => !s.falseColour, lock: ['falseColour'], highlight: ['falseColour'] },
    { text: 'Back to the lowest magnification', done: (s) => s.mag === 0, lock: ['mag'], highlight: ['mag'] },
    { text: 'Switch the beam off', done: (s) => !s.beam, lock: ['beam'], highlight: ['beam'] },
    { text: 'Withdraw the holder', done: (s) => s.holder !== 'in' && s.holder !== 'airlock', lock: ['withdraw'], highlight: ['withdraw', 'holder'] },
  ]),
]

type CS = ConfocalState
export const CONFOCAL_TRAFFIC_STEPS: Step<CS>[] = [
  checklist<CS>('setup', 'Set up', 'These living cells make a membrane protein joined to GFP, so the protein glows green wherever it goes. The stage heater keeps the dish at 40 °C.', [
    { text: 'Switch the system on', done: (s) => s.power, lock: ['power'], highlight: ['power'] },
    { text: 'Turn on the 405 nm laser (Hoechst: nucleus)', done: (s) => s.lasers[405], lock: ['laser'], highlight: ['laser'] },
    { text: 'Turn on the 488 nm laser (GFP: the protein)', done: (s) => s.lasers[488], lock: ['laser'], highlight: ['laser'] },
    { text: 'Choose the 63x oil objective', done: (s) => s.objective === 63, lock: ['objective'], highlight: ['objective', 'objectives'] },
    { text: 'Put a drop of immersion oil on the lens', done: (s) => s.oil, lock: ['oil'], highlight: ['oil'] },
    { text: 'Place the dish on the stage', done: (s) => s.dish, lock: ['dish'], highlight: ['dish', 'stage'] },
    { text: 'Start the live scan', done: (s) => s.scanning, lock: ['scan'], highlight: ['scan'] },
  ]),
  { id: 'focus', title: 'Find the cells', body: 'Focus up from the glass until a fine green net appears. These cells are flat: everything lies within 3 micrometres of the glass.', highlight: ['focus'], lock: () => ['focus'], done: (s) => s.lasers[488] && Math.abs(s.z - 1.6) < 1 && inFocusAmount(s) > 0.6 },
  checklist<CS>('tune', 'A sharp, gentle image', 'Thin section, little light, and one whole cell on the screen.', [
    { text: 'Close the pinhole to about 1 AU', done: (s) => s.pinhole <= 1.3, lock: ['pinhole', 'focus'], highlight: ['pinhole'] },
    { text: 'Raise the laser power until the grain goes (10% to 30%)', done: (s) => photons(s) >= 25 && s.laserPower <= 0.3, lock: ['laserPower', 'pinhole', 'focus'], highlight: ['laserPower'] },
    { text: 'Zoom in 2x', done: (s) => s.zoom === 2, lock: ['zoom', 'laserPower', 'focus'], highlight: ['zoom'] },
  ]),
  ask<CS>('where', 'A green net', 'The green fills a fine net of tubes through the cell, and a bright ring around the nucleus.', {
    q: 'Where is the tagged protein right now?',
    options: ['In the Golgi apparatus', 'In the endoplasmic reticulum: the net, which joins onto the envelope around the nucleus', 'In the mitochondria', 'Outside the cell'],
    correct: 1,
    explain: 'Right. The ER is a network of channels, and it is connected to the nuclear envelope.',
  }, ['focus']),
  ask<CS>('held', 'Held back', 'Ribosomes on the rough ER made this protein overnight, at 40 °C.', {
    q: 'At 40 °C this protein folds into the wrong shape. Why does it stay in the ER?',
    options: ['The ER is too small to let it out', 'The ER holds on to proteins that are not folded correctly', 'It is too heavy to move', 'The laser stops it'],
    correct: 1,
    explain: 'Yes. The ER checks proteins and only sends correctly folded ones on. Cooling the dish lets this protein fold, so it all leaves together.',
  }, ['focus']),
  {
    id: 'release', title: 'Release!', body: 'Cool the stage to 32 °C, then turn on the time-lapse and watch the cell. Watch the clock in the corner.',
    highlight: ['temp', 'timelapse'], lock: (s) => (s.temp === 40 ? ['temp', 'focus'] : ['timelapse', 'focus']),
    done: (s) => s.clockMin >= 12,
  },
  { id: 'pause', title: 'Slow down', body: 'Turn the time-lapse off to look closely. (Time keeps passing, just at normal speed.)', highlight: ['timelapse'], lock: () => ['timelapse', 'focus'], done: (s) => !s.timelapse },
  ask<CS>('gather', 'On the move', 'Compare the picture now with the green net you saw before.', {
    q: 'Where has most of the green gone?',
    options: ['Into the nucleus', 'Into a bright patch beside the nucleus', 'It has all faded away', 'Into the cell wall'],
    correct: 1,
    explain: 'Right. Small green dots are still carrying more protein there.',
  }, ['focus']),
  { id: 'marker', title: 'A second label', body: 'Turn on the 640 nm laser. These cells also make a far-red protein that stays in one organelle only. The computer shows it as magenta.', highlight: ['laser'], lock: () => ['laser', 'focus'], done: (s) => s.lasers[640] },
  ask<CS>('overlap', 'Green plus magenta', 'Where green and magenta overlap, the screen shows white.', {
    q: 'The magenta marker labels only the Golgi apparatus. Where is the green protein now?',
    options: ['In the Golgi apparatus, beside the nucleus', 'In the nucleus', 'In the plasma membrane', 'In free ribosomes'],
    correct: 0,
    explain: 'Yes. The protein has moved from the ER to the Golgi, which modifies, sorts and packages it.',
  }, ['focus', 'laser']),
  ask<CS>('carriers', 'Darting dots', 'Look at the small green dots that flicker across the cell.', {
    q: 'What are the small green dots?',
    options: ['Ribosomes', 'Vesicles carrying the protein between organelles', 'Bleached dye', 'Nuclei'],
    correct: 1,
    explain: 'Right. Vesicles carry the protein from the ER to the Golgi, and from the Golgi on to its final place.',
  }, ['focus', 'laser']),
  {
    id: 'watch', title: 'Where next?', body: 'Turn the time-lapse on again and keep watching until about 50 minutes after the release.',
    highlight: ['timelapse'], lock: () => ['timelapse', 'focus', 'laser'], done: (s) => s.clockMin >= 50,
  },
  ask<CS>('final', 'Delivered', 'The Golgi is almost empty again.', {
    q: 'Where has the tagged protein ended up?',
    options: ['Back in the ER', 'In the plasma membrane, the outline of the cell', 'In the nucleus', 'In the mitochondria'],
    correct: 1,
    explain: 'Yes. Vesicles from the Golgi fused with the plasma membrane. This protein stays in the membrane; other proteins are released outside the cell.',
  }, ['focus', 'timelapse']),
  checklist<CS>('shutdown', 'Shut down', 'Leave the microscope clean and safe.', [
    { text: 'Turn off the time-lapse', done: (s) => !s.timelapse, lock: ['timelapse'], highlight: ['timelapse'] },
    { text: 'Stop the live scan', done: (s) => !s.scanning, lock: ['scan'], highlight: ['scan'] },
    { text: 'Take the dish off the stage', done: (s) => !s.dish, lock: ['dish'], highlight: ['dish'] },
    { text: 'Wipe the oil off the lens', done: (s) => !s.oil, lock: ['clean'], highlight: ['clean'] },
    { text: 'Switch the system off', done: (s) => !s.power, lock: ['power'], highlight: ['power'] },
  ]),
]
