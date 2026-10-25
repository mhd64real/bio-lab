import { Waves, CircleDot, Square, Shield } from 'lucide-react'
import type { ReadCard } from '../../lab/Cards'
import type { ChoiceQ } from '../../ui/kit'
import type { SortRow } from '../../lab/SortTask'

export const P3_CARDS: ReadCard[] = [
  {
    icon: Waves, title: 'Cilia and flagella',
    body: [
      'Some eukaryotic cell surfaces have structures called cilia and flagella that project outside the plasma membrane.',
      'Cilia (singular: cilium) are short, numerous projections that look like hairs. Their motion is similar to the motion of oars in a rowboat.',
      'Flagella (singular: flagellum) are longer and less numerous than cilia. They move with a whiplike motion.',
    ],
    q: { q: 'Which projections are short and numerous, moving like oars?', options: ['Flagella', 'Cilia', 'Cell walls', 'Microfilaments'], correct: 1, explain: 'Right: cilia. Flagella are longer and fewer, and whip.' },
  },
  {
    icon: CircleDot, title: 'Built from microtubules',
    body: [
      'Cilia and flagella are composed of microtubules arranged in a 9 + 2 configuration: nine pairs of microtubules surround two single microtubules.',
      'Cells with flagella typically have one or two. Both structures are used for movement, but cilia are also found on cells that stay in place.',
    ],
    q: { q: 'What does "9 + 2" describe?', options: ['9 cells and 2 nuclei', 'Nine pairs of microtubules around two single microtubules', '9 cilia per flagellum', 'The size of a cilium'], correct: 1, explain: 'Yes. You will see it with the electron microscope at the end of this phase.' },
  },
  {
    icon: Square, title: 'The plant cell wall',
    body: [
      'The cell wall is a thick, rigid mesh of fibres that surrounds the outside of the plasma membrane of plant cells. It protects the cell and gives it support.',
      'Plant cell walls are made of a carbohydrate called cellulose, which makes them inflexible. Rigid walls let plants stand at all heights, from blades of grass to redwood trees.',
    ],
  },
]

export const P3_WALL_CARDS: ReadCard[] = [
  {
    icon: Shield, title: 'Bacteria have walls too',
    body: [
      'Prokaryotes, such as bacteria, also have a cell wall. Its jobs are like the plant cell wall’s: it protects the cell, helps keep its shape and gives it support.',
      'But prokaryotic cell walls are not made of cellulose. They are made of peptidoglycan, a combination of disaccharides (sugars) and peptide fragments. All prokaryotes have peptidoglycan in their cell walls.',
    ],
    q: { q: 'In your Gram stain in Phase 1, the yogurt bacteria stayed purple. Which part of them held the purple dye?', options: ['A cellulose wall', 'A thick peptidoglycan cell wall', 'The nucleus', 'Chloroplasts'], correct: 1, explain: 'Right. Bacteria with a thick peptidoglycan wall trap crystal violet and stay purple; that is what the Gram stain tests.' },
  },
]

export const P3_SORT: SortRow[] = [
  { text: 'Made of cellulose', answer: 'Plant' },
  { text: 'Made of peptidoglycan', answer: 'Prokaryote' },
  { text: 'Protects the cell', answer: 'Both' },
  { text: 'Gives the cell support', answer: 'Both' },
  { text: 'Helps maintain the cell’s shape', answer: 'Both' },
  { text: 'Surrounds the outside of the plasma membrane', answer: 'Both' },
  { text: 'Lets plants stand tall, from grass to redwood trees', answer: 'Plant' },
  { text: 'A combination of disaccharides and peptide fragments', answer: 'Prokaryote' },
  { text: 'You saw it around the Elodea cells', answer: 'Plant' },
  { text: 'Held the crystal violet in your Gram stain', answer: 'Prokaryote' },
]

export const P3_CHECK: ChoiceQ[] = [
  { q: 'How do cilia move?', options: ['With a whiplike motion', 'Like oars in a rowboat', 'They do not move', 'By spinning'], correct: 1, explain: 'Cilia row; flagella whip.' },
  { q: 'Which is true of flagella?', options: ['Short and numerous', 'Longer and less numerous than cilia; a cell typically has one or two', 'Only found in plants', 'Made of cellulose'], correct: 1, explain: 'Like the single flagellum of your Euglena.' },
  { q: 'What is the microtubule arrangement in cilia and flagella?', options: ['9 triplets', '9 + 2: nine pairs around two singles', '2 + 2', 'No microtubules'], correct: 1, explain: 'You counted it in the TEM.' },
  { q: 'Why did you need phase contrast to see the living pond cells?', options: ['They were moving too fast', 'They are colourless; phase contrast makes them visible without staining', 'To make them bigger', 'To kill them'], correct: 1, explain: 'Stains would kill living cells.' },
  { q: 'The windpipe cells do not move. What do their cilia do?', options: ['Nothing', 'Sweep mucus with dust and germs out of the airways', 'Make the cells swim', 'Digest food'], correct: 1, explain: 'Cilia are also found on stationary cells.' },
  { q: 'What is a plant cell wall made of?', options: ['Peptidoglycan', 'Cellulose', 'Protein only', 'Fat'], correct: 1, explain: 'Cellulose makes it rigid.' },
  { q: 'What is a prokaryotic cell wall made of?', options: ['Cellulose', 'Peptidoglycan', 'Chitin', 'Glass'], correct: 1, explain: 'All prokaryotes have peptidoglycan in their walls.' },
  { q: 'Why must tissue for the SEM be dried in a critical point dryer and coated with gold?', options: ['To colour it', 'So the cilia are not crushed by drying, and so the surface conducts and gives a sharp image in the vacuum', 'To keep it alive', 'To make it heavier'], correct: 1, explain: 'Both steps protect the fine surface detail.' },
]
