import { ask, checklist, type Step } from '../../instruments/engine'
import { bleach, confocalGood, inFocusAmount, peak, photons, type ConfocalState } from '../../instruments/confocal/model'
import { focusOk, MAGS, type TemState } from '../../instruments/tem/model'

type CS = ConfocalState
type TS = TemState

export const CONFOCAL_STEPS: Step<CS>[] = [
  checklist<CS>('lasers', 'Switch on the lasers', 'A confocal microscope makes its own light with lasers: one colour for each dye.', [
    { text: 'Switch the system on', done: (s) => s.power, lock: ['power'], highlight: ['power'] },
    { text: 'Turn on the 405 nm laser (nucleus)', done: (s) => s.lasers[405], lock: ['laser'], highlight: ['laser'] },
    { text: 'Turn on the 488 nm laser (microtubules)', done: (s) => s.lasers[488], lock: ['laser'], highlight: ['laser'] },
    { text: 'Turn on the 640 nm laser (microfilaments)', done: (s) => s.lasers[640], lock: ['laser'], highlight: ['laser'] },
  ]),
  checklist<CS>('sample', 'Put the dish on the microscope', 'This microscope is inverted: the lens is under the stage and looks up through the glass bottom of the dish, so the cells can stay in their liquid.', [
    { text: 'Choose the 63x oil objective', done: (s) => s.objective === 63, lock: ['objective'], highlight: ['objective', 'objectives'] },
    { text: 'Put a drop of immersion oil on the lens', done: (s) => s.oil, lock: ['oil'], highlight: ['oil'] },
    { text: 'Place the dish on the stage', done: (s) => s.dish, lock: ['dish'], highlight: ['dish', 'stage'] },
  ]),
  { id: 'scan', title: 'Start scanning', body: 'Press Live scan. Mirrors sweep a laser spot across the cells point by point, and a detector measures the glow from each point. The computer builds the picture from these measurements.', highlight: ['scan', 'monitor'], lock: () => ['scan'], done: (s) => s.scanning },
  { id: 'focus', title: 'Find the cells', body: 'Use the focus buttons to move the focus up through the glass into the cells. They are only a few micrometres thick, so go slowly once something appears.', tip: 'The readout shows the height of the focus above the glass, in micrometres (um).', highlight: ['focus'], lock: () => ['focus'], done: (s) => inFocusAmount(s) > 0.6 },
  {
    id: 'pinhole', title: 'The pinhole', body: 'The cells look hazy and soft. Slowly close the pinhole to about 1 AU and watch what happens.',
    tip: 'The pinhole is a tiny hole in front of the detector. It only lets through light from the thin slice that is in focus.',
    highlight: ['pinhole'], lock: () => ['pinhole', 'focus'],
    done: (s) => s.pinhole <= 1.3,
  },
  ask<CS>('whyPinhole', 'Why so sharp?', 'Compare the image with the pinhole open and closed.', {
    q: 'Why did the image get sharper when you closed the pinhole?',
    options: ['It lets in more light', 'It blocks the glow from above and below the focus, leaving one thin slice of the cell', 'It makes the laser stronger', 'It magnifies the image'],
    correct: 1,
    explain: 'Right. That is what "confocal" means: only light from the plane in focus reaches the detector, so you see a clean optical slice through the cell.',
  }, ['focus']),
  { id: 'power', title: 'Just enough laser light', body: 'The image is grainy because the laser is very weak. Raise the laser power to between 10% and 30%. Do not go higher: strong laser light harms living cells and fades the dyes.', highlight: ['laserPower'], lock: () => ['laserPower', 'focus'], done: (s) => photons(s) >= 25 && s.laserPower <= 0.3 },
  checklist<CS>('gain', 'Set the brightness with the gain', 'Gain makes the detector more sensitive without adding more laser light.', [
    { text: 'Turn on the range indicator', done: (s) => s.range, lock: ['range'], highlight: ['range'] },
    { text: 'Adjust the gain: no red pixels, but not too dark', done: (s) => peak(s) >= 0.55 && peak(s) <= 1.15, lock: ['gain'], highlight: ['gain'] },
    { text: 'Turn the range indicator off again', done: (s) => !s.range, lock: ['range'], highlight: ['range'] },
  ]),
  { id: 'good', title: 'A clear picture', body: 'Fine-tune the focus until the green fibres are sharp. Then look at the whole cell.', highlight: ['focus'], lock: () => ['focus', 'gain'], done: (s) => confocalGood(s) },
  ask<CS>('cytoskeleton', 'The cytoskeleton', 'The green and magenta fibres are the cytoskeleton: a network of long, thin protein fibres inside the cytoplasm.', {
    q: 'What does the cytoskeleton do?',
    options: ['It stores the cell’s DNA', 'It forms a framework for the cell and anchors the organelles', 'It makes energy from food', 'It is a hard wall outside the membrane'],
    correct: 1,
    explain: 'Yes. Organelles do not float freely: the cytoskeleton supports the cell and holds them in place, and it helps the cell move.',
  }, ['focus']),
  ask<CS>('microtubules', 'The green fibres', 'The green fibres are microtubules. Look at where they start.', {
    q: 'Where do the microtubules come from?',
    options: ['They are scattered at random', 'They spread out from one bright point beside the nucleus', 'They only lie along the cell edge', 'They come from outside the cell'],
    correct: 1,
    explain: 'Right. They grow out from the centrosome, which contains the centrioles. You will see a centriole up close with the electron microscope next.',
  }, ['focus']),
  checklist<CS>('watch', 'Watch them live', 'These cells are alive. Zoom in and record a time-lapse so you can see slow changes sped up.', [
    { text: 'Zoom in 4x', done: (s) => s.zoom === 4, lock: ['zoom'], highlight: ['zoom'] },
    { text: 'Turn on time-lapse', done: (s) => s.timelapse, lock: ['timelapse'], highlight: ['timelapse'] },
  ]),
  ask<CS>('dynamic', 'What are they doing?', 'Watch the ends of the green microtubules for a few seconds.', {
    q: 'What do the microtubules do?',
    options: ['Nothing, they are fixed in place', 'They keep growing longer and then suddenly shrinking back', 'They spin around the nucleus', 'They leave the cell'],
    correct: 1,
    explain: 'Exactly. Microtubules rapidly assemble and disassemble. This lets the cell rebuild its skeleton and move things around inside it.',
  }, ['zoom', 'timelapse', 'focus']),
  ask<CS>('microfilaments', 'The magenta fibres', 'Look at the magenta microfilaments, especially at the edge of the cell.', {
    q: 'Microfilaments are thin protein threads. Where are they brightest, and what does that suggest?',
    options: ['Inside the nucleus: they store information', 'Along the moving edge of the cell: they shape the cell and help it move', 'In the centrosome: they make microtubules', 'Nowhere: they are not visible'],
    correct: 1,
    explain: 'Right. A mesh of microfilaments under the membrane pushes the ruffling edge forward and holds the cell in shape.',
  }, ['zoom', 'timelapse', 'focus']),
  {
    id: 'bleach', title: 'Too much light', body: 'Turn off the time-lapse, then push the laser power to 100% for a few seconds and watch the image.',
    highlight: ['laserPower', 'timelapse'], lock: (s) => (s.timelapse ? ['timelapse'] : ['laserPower']),
    done: (_, seen) => seen.has('bleachSeen'),
  },
  ask<CS>('whyLow', 'Fading', 'The glow faded while the laser was strong.', {
    q: 'Why do scientists use the weakest laser light that still gives a clear image?',
    options: ['To save electricity', 'Strong light destroys the dye molecules (bleaching) and damages the living cells', 'Strong light changes the colours', 'The microscope gets too hot'],
    correct: 1,
    explain: 'Yes. Bleached dye can never glow again, and intense light can kill the cells you are trying to watch.',
  }, ['laserPower']),
  { id: 'lower', title: 'Back to safe power', body: 'Lower the laser power to 30% or less.', highlight: ['laserPower'], lock: () => ['laserPower'], done: (s) => s.laserPower <= 0.3 && bleach(s) > 0 },
  checklist<CS>('shutdown', 'Shut down', 'Leave the microscope clean and safe.', [
    { text: 'Stop the live scan', done: (s) => !s.scanning, lock: ['scan'], highlight: ['scan'] },
    { text: 'Take the dish off the stage', done: (s) => !s.dish, lock: ['dish'], highlight: ['dish'] },
    { text: 'Wipe the oil off the lens', done: (s) => !s.oil, lock: ['clean'], highlight: ['clean'] },
    { text: 'Switch the system off', done: (s) => !s.power, lock: ['power'], highlight: ['power'] },
  ]),
]

const near = (s: TS, x: number, y: number, r: number) => Math.hypot(s.x - x, s.y - y) <= r
const CX = 2.0, CY = 0.6 // the centrosome of the cell at the centre of the grid square

export const TEM_STEPS: Step<TS>[] = [
  checklist<TS>('load', 'Into the vacuum', 'The grid has to go into the column, where almost all the air has been pumped out. It goes in through an airlock so the vacuum is never lost.', [
    { text: 'Clip the grid into the holder tip', done: (s) => s.holder !== 'out', lock: ['load'], highlight: ['load', 'holder'] },
    { text: 'Push the holder into the airlock', done: (s) => s.holder === 'airlock' || s.holder === 'in', lock: ['toAirlock'], highlight: ['toAirlock', 'holder'] },
    { text: 'Pump the air out of the airlock', done: (s) => s.airlock >= 1 || s.holder === 'in', lock: ['pump', 'insert'], highlight: ['pump'] },
    { text: 'Insert the holder fully', done: (s) => s.holder === 'in', lock: ['insert'], highlight: ['insert', 'holder'] },
  ]),
  checklist<TS>('beam', 'Make the beam', 'Electrons are given off by a hot filament at the top and accelerated down the column.', [
    { text: 'Switch on the high tension (120 kV)', done: (s) => s.ht, lock: ['ht'], highlight: ['ht', 'gun'] },
    { text: 'Switch the beam on', done: (s) => s.beam, lock: ['beam'], highlight: ['beam', 'leftPanel'] },
  ]),
  { id: 'find', title: 'Find a cell', body: 'At 500x you can see the copper grid bars (black) and many cell slices in each square. Move the stage until the cell in the middle of a square is in the centre of the screen.', highlight: ['stage'], lock: () => ['stage', 'brightness'], done: (s) => s.mag === 0 && near(s, 0, 0, 7) },
  ask<TS>('bars', 'Why black?', 'Look at the thick black bars.', {
    q: 'Why are the copper grid bars completely black?',
    options: ['They are painted black', 'Thick metal stops all the electrons, so none reach the camera there', 'The camera is broken there', 'They are holes'],
    correct: 1,
    explain: 'Right. In a TEM, dark means electrons were blocked. That is also why heavy metal stains make cell parts look dark.',
  }, ['stage']),
  { id: 'mag2', title: 'Zoom in on the cell', body: 'Increase the magnification to 2,000x and centre the cell. The big round shape is the nucleus.', highlight: ['mag', 'stage'], lock: () => ['mag', 'stage'], done: (s) => s.mag === 1 && near(s, 0, 0, 4) },
  { id: 'mag5', title: 'Focus', body: 'Go to 5,000x and focus. In focus, edges are crisp; out of focus they get blurry with bright halos.', highlight: ['mag', 'focus'], lock: () => ['mag', 'focus', 'stage'], done: (s) => s.mag === 2 && focusOk(s) },
  { id: 'centrosome', title: 'Find the centrosome', body: 'Look beside the nucleus for a fuzzy grey patch where thin lines (microtubules) meet. Move the stage to centre it.', highlight: ['stage'], lock: () => ['stage', 'focus'], done: (s) => s.mag >= 2 && near(s, CX, CY, 0.9) },
  { id: 'mag40', title: 'Closer', body: 'Increase the magnification step by step to 40,000x. Re-centre the dense spot if it drifts off, and focus again.', highlight: ['mag', 'stage', 'focus'], lock: () => ['mag', 'stage', 'focus'], done: (s) => s.mag === 4 && near(s, CX, CY, 0.25) && focusOk(s) },
  ask<TS>('two', 'Two centrioles', 'There are two centrioles here, lying at right angles to each other. One looks like a ring, the other like a striped rectangle.', {
    q: 'Why do the two centrioles look so different?',
    options: ['They are different organelles', 'They are both cylinders, but the slice cut one across (a ring) and the other along its length (stripes)', 'One is damaged', 'One is a microfilament'],
    correct: 1,
    explain: 'Exactly. A thin slice shows a 2D cut through a 3D object, so the same shape can look like a ring or a rectangle depending on the angle.',
  }, ['stage', 'focus']),
  { id: 'mag100', title: 'The ring', body: 'Centre the ring-shaped centriole precisely, go to 100,000x and focus carefully.', tip: 'Keep the brightness below 80%: a concentrated beam at this magnification can burn the section.', highlight: ['mag', 'stage', 'focus'], lock: () => ['mag', 'stage', 'focus', 'brightness'], done: (s) => MAGS[s.mag] === 100000 && near(s, CX, CY, 0.06) && focusOk(s) },
  ask<TS>('count', 'Count them', 'The ring is made of small groups of hollow tubes.', {
    q: 'How is the wall of a centriole built?',
    options: ['From 4 single tubes', 'From 9 groups of 3 microtubules each', 'From 2 thick rods', 'From microfilaments'],
    correct: 1,
    explain: 'Right: 9 triplets of microtubules. Each little ring is one hollow microtubule, cut across, about 25 nanometres wide. Centrioles help organise the cell during cell division.',
  }, ['stage', 'focus']),
  ask<TS>('hollow', 'Hollow cylinders', 'Each microtubule in the ring has a pale centre.', {
    q: 'What does the pale centre of each tiny ring tell you about microtubules?',
    options: ['They are solid rods', 'They are hollow cylinders', 'They are filled with DNA', 'They are holes in the section'],
    correct: 1,
    explain: 'Yes. Your textbook describes microtubules as long, hollow protein cylinders, and here you can see the hollow in cross-section.',
  }, ['stage', 'focus']),
  { id: 'colour', title: 'Colour', body: 'Turn on false colour.', highlight: ['falseColour'], lock: () => ['falseColour'], done: (s) => s.falseColour },
  ask<TS>('falseColour', 'Where does the colour come from?', 'Your textbook shows a "Color-enhanced TEM" of centrioles.', {
    q: 'Where does the colour in a "color-enhanced TEM" come from?',
    options: ['The cells were that colour', 'The stains are coloured', 'A computer adds it afterwards; electrons have no colour', 'The electron beam is golden'],
    correct: 2,
    explain: 'Right. The real image only shows dark and light: where electrons were blocked or passed. Colour is painted on to make structures easier to see.',
  }, ['falseColour']),
  ask<TS>('compare', 'Two microscopes, two jobs', 'Think about the confocal and the electron microscope together.', {
    q: 'Which statement is true?',
    options: ['The TEM can watch microtubules growing in a living cell', 'The confocal shows living, moving cells; the TEM shows much finer detail, but only in dead, sliced cells', 'Both show living cells', 'The confocal shows more detail than the TEM'],
    correct: 1,
    explain: 'Exactly. Scientists use both: the confocal to see what living cells do, and the TEM to see what the parts are made of.',
  }),
  checklist<TS>('shutdown', 'Finish', 'Leave the electron microscope ready for the next person.', [
    { text: 'Turn false colour off', done: (s) => !s.falseColour, lock: ['falseColour'], highlight: ['falseColour'] },
    { text: 'Switch the beam off', done: (s) => !s.beam, lock: ['beam'], highlight: ['beam'] },
    { text: 'Withdraw the holder', done: (s) => s.holder !== 'in' && s.holder !== 'airlock', lock: ['withdraw'], highlight: ['withdraw', 'holder'] },
  ]),
]
