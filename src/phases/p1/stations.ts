import { kit } from '../../lab/stepKit'
import type { ObserveStep } from '../../lab/steps'

export const ONION_STEPS: ObserveStep[] = [
  kit.place('onion'),
  kit.clip(),
  kit.centre(),
  kit.coarse(),
  kit.fine(4),
  kit.ask('shape', 'Look at the pattern', 'At 40x total you can see the whole sheet of cells.', {
    q: 'How are the onion cells arranged?',
    options: ['Scattered at random, each on its own', 'Packed side by side in rows, like bricks in a wall', 'In a single long chain', 'In round clumps'],
    correct: 1,
    explain: 'Yes. The cells are joined tightly together in rows, with no gaps between them.',
  }),
  kit.lens(10, 'Turn to the 10x objective. The image stays nearly in focus.'),
  kit.fine(10),
  kit.ask('nucleus', 'Look inside one cell', 'Each cell has a small, darker oval somewhere inside it.', {
    q: 'What is the dark oval in each onion cell?',
    options: ['A chloroplast', 'The nucleus', 'An air bubble', 'A drop of stain'],
    correct: 1,
    explain: 'Right. Iodine stains the nucleus darker than the rest of the cell.',
  }),
  kit.lens(40, 'Turn to the 40x objective for 400x total.'),
  kit.fine(40, 'Sharpen the cell walls with fine focus. At 400x less light gets through, so turn the brightness up or open the iris until the view is clear.', true),
  kit.planes('Turn the fine focus slowly up and down. First get the cell walls sharp, then the nucleus. Notice you cannot get both sharp at the same time.'),
  kit.ask('depth', 'Why not both at once?', 'You just focused on two different things.', {
    q: 'Why can you not get the cell walls and the nucleus sharp at the same time at 400x?',
    options: ['The microscope is broken', 'They sit at slightly different depths in the cell, and at high power only a very thin layer is in focus', 'The nucleus is moving', 'The stain is too dark'],
    correct: 1,
    explain: 'Exactly. A cell is three-dimensional. At 400x the layer in focus is only about a thousandth of a millimetre thick, so you focus up and down through the cell.',
  }),
  kit.ask('wall', 'The outline of each cell', 'Look at the thin lines that separate the cells.', {
    q: 'Which structure forms the firm outline around each onion cell and gives it its box shape?',
    options: ['The nucleus', 'The cytoplasm', 'The cell wall', 'A chloroplast'],
    correct: 2,
    explain: 'Yes. Plant cells have a rigid cell wall outside the plasma membrane. You will study it in Phase 3.',
  }),
  kit.ask('nochloro', 'Something missing', 'Onion bulbs grow under the ground.', {
    q: 'Plant cells can contain green chloroplasts. Why do these onion cells have none?',
    options: ['Chloroplasts are too small to see at 400x', 'The bulb grows underground in the dark, so its cells do not photosynthesise', 'Iodine dissolves chloroplasts', 'Onions are not plants'],
    correct: 1,
    explain: 'Right. Chloroplasts capture light energy, so cells that never get light do not need them. You will see real chloroplasts in elodea leaves in Phase 5.',
  }),
  kit.putAway(false),
]

export const CHEEK_STEPS: ObserveStep[] = [
  kit.place('cheek cell'),
  kit.clip(),
  kit.centre(),
  kit.coarse(),
  kit.fine(4),
  kit.lens(10, 'Turn to the 10x objective.'),
  kit.fine(10),
  kit.ask('arrangement', 'Compare with the onion', 'Think back to the onion cells.', {
    q: 'How are cheek cells different from onion cells?',
    options: ['They are in neat rows too', 'They are flat, irregular shapes, scattered on their own or in small groups', 'They are much bigger and square', 'They are green'],
    correct: 1,
    explain: 'Yes. Cheek cells come loose from the lining of your mouth, and without a rigid wall each one takes a soft, irregular shape.',
  }),
  kit.lens(40, 'Turn to the 40x objective for 400x total.'),
  kit.fine(40, 'Sharpen with fine focus and fix the light until the view is clear.', true),
  kit.ask('nucleus', 'The dark blue centre', 'Each cell has a small dark blue oval near the middle.', {
    q: 'What is the dark blue oval in each cheek cell?',
    options: ['The nucleus', 'A vacuole', 'A cell wall', 'A bacterium'],
    correct: 0,
    explain: 'Right. Methylene blue stains the nucleus most strongly. The pale blue around it is cytoplasm.',
  }),
  kit.ask('nowall', 'What holds it together?', 'Look at the edge of a cell. It is thin and sometimes folded.', {
    q: 'Onion cells have a cell wall. What is the outer boundary of a cheek cell?',
    options: ['A thicker cell wall', 'A flexible plasma membrane, with no cell wall', 'A capsule', 'Nothing at all'],
    correct: 1,
    explain: 'Exactly. Animal cells have only a flexible plasma membrane, which is why the cells fold and have irregular shapes.',
  }),
  kit.ask('dots', 'Tiny dots', 'Some cells are covered in very small dark dots.', {
    q: 'The tiny dots on some cheek cells are much smaller than the nucleus. What could they be?',
    options: ['Bacteria that live in your mouth', 'Extra nuclei', 'Chloroplasts', 'Holes in the cell'],
    correct: 0,
    explain: 'Yes. Your mouth is home to many bacteria, which are prokaryotic cells. They are so small you need the 100x lens to see their shape, which is the next slide.',
  }),
  kit.putAway(false),
]

export const YOGURT_STEPS: ObserveStep[] = [
  kit.place('yogurt'),
  kit.clip(),
  kit.centre(),
  kit.coarse('Raise the stage with coarse focus until the smear appears. At 40x total it is only a faint purple haze.'),
  kit.fine(4),
  kit.lens(10, 'Turn to the 10x objective.'),
  kit.fine(10),
  kit.lens(40, 'Turn to the 40x objective.'),
  kit.fine(40, 'Sharpen with fine focus and fix the light.', true),
  kit.ask('specks', 'What can you see?', 'Look closely at the purple specks.', {
    q: 'At 400x, what do the bacteria look like?',
    options: ['Clear cells with a nucleus inside', 'Tiny purple specks, too small to see their shape properly', 'Long green threads', 'Nothing at all'],
    correct: 1,
    explain: 'Right. Bacteria are about one thousandth of a millimetre wide. To see their shape you need the 100x oil immersion lens: 1,000x total.',
  }),
  kit.oil(),
  kit.lens(100, 'Turn the 100x oil immersion lens (white ring) into the oil.'),
  kit.fine(100, 'Use only fine focus. The 100x lens has the least light of all, so turn the brightness up and open the iris.', true),
  kit.ask('shapes', 'Two kinds of bacteria', 'Look at the shapes of the purple cells.', {
    q: 'What shapes do the yogurt bacteria have?',
    options: ['All perfectly round and single', 'Rods, and chains of tiny spheres', 'Squares in rows', 'Long branching threads'],
    correct: 1,
    explain: 'Yes. Yogurt is made by two bacteria: Lactobacillus (rods) and Streptococcus (chains of spheres, called cocci).',
  }),
  kit.ask('nonucleus', 'No nucleus', 'Compare these with the cheek and onion cells.', {
    q: 'Unlike onion and cheek cells, these bacteria have no nucleus. What kind of cell are they?',
    options: ['Eukaryotic', 'Prokaryotic', 'Plant', 'Animal'],
    correct: 1,
    explain: 'Right. Prokaryotic cells have no nucleus and no membrane-bound organelles. Their DNA lies free in the cytoplasm.',
  }),
  kit.ask('size', 'How small?', 'A cheek cell is about 60 micrometres across. A yogurt bacterium is about 1 micrometre wide.', {
    q: 'About how many of these bacteria would fit side by side across one cheek cell?',
    options: ['About 2', 'About 60', 'About 6,000', 'About 6 million'],
    correct: 1,
    explain: 'Yes: 60 divided by 1 is about 60. Prokaryotic cells are much smaller than most eukaryotic cells.',
  }),
  kit.putAway(true, true),
]
