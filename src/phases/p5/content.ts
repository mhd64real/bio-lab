import { Battery, Leaf, Palette } from 'lucide-react'
import type { ReadCard } from '../../lab/Cards'
import type { ChoiceQ } from '../../ui/kit'
import type { SortRow } from '../../lab/SortTask'

export const P5_CARDS: ReadCard[] = [
  {
    icon: Battery, title: 'Mitochondria',
    body: [
      'Cells have energy generators called mitochondria (singular: mitochondrion), which convert fuel (mainly sugars) into usable energy.',
      'A mitochondrion has an outer membrane and a highly folded inner membrane that provides a large surface area for breaking the bonds in sugar molecules. The energy produced is stored in the bonds of other molecules and later used by the cell.',
    ],
    q: { q: 'Why is the inner membrane of a mitochondrion highly folded?', options: ['To make it stronger', 'To give a large surface area for breaking the bonds in sugar molecules', 'To store water', 'To let light in'], correct: 1, explain: 'Right. More membrane means more room for the reactions that release energy.' },
  },
  {
    icon: Leaf, title: 'Chloroplasts',
    body: [
      'In addition to mitochondria, plants and some other eukaryotic cells contain chloroplasts: organelles that capture light energy and convert it to chemical energy through photosynthesis.',
      'Inside the inner membrane are many small, disk-shaped compartments called thylakoids. They trap energy from sunlight in a pigment called chlorophyll, which gives leaves and stems their green colour.',
    ],
    q: { q: 'Where is the light energy trapped inside a chloroplast?', options: ['In the cell wall', 'In chlorophyll, in the disk-shaped thylakoids', 'In the nucleus', 'In the outer membrane only'], correct: 1, explain: 'Yes. You will see the thylakoids stacked up in the TEM.' },
  },
  {
    icon: Palette, title: 'Plastids',
    body: [
      'Chloroplasts belong to a group of plant organelles called plastids, some of which are used for storage. Some plastids store starches or lipids.',
      'Others, such as chromoplasts, contain red, orange or yellow pigments that trap light energy and give colour to plant structures such as flowers and leaves.',
    ],
    q: { q: 'Which plastids give a red pepper its colour?', options: ['Chloroplasts', 'Chromoplasts', 'Mitochondria', 'Nuclei'], correct: 1, explain: 'Right. You will look for them in a few minutes.' },
  },
]

export const P5_SORT: SortRow[] = [
  { text: 'Converts fuel (mainly sugars) into usable energy', answer: 'Mitochondrion' },
  { text: 'Captures light energy and converts it to chemical energy', answer: 'Chloroplast' },
  { text: 'Has a highly folded inner membrane', answer: 'Mitochondrion' },
  { text: 'Contains disk-shaped thylakoids', answer: 'Chloroplast' },
  { text: 'Contains chlorophyll', answer: 'Chloroplast' },
  { text: 'Surrounded by an outer and an inner membrane', answer: 'Both' },
  { text: 'Found in plant cells', answer: 'Both' },
  { text: 'Found in animal cells', answer: 'Mitochondrion' },
  { text: 'A kind of plastid', answer: 'Chloroplast' },
  { text: 'You watched it divide in a living cell', answer: 'Mitochondrion' },
]

export const P5_CHECK: ChoiceQ[] = [
  { q: 'What do mitochondria do?', options: ['Capture light', 'Convert fuel (mainly sugars) into usable energy', 'Store starch', 'Make ribosomes'], correct: 1, explain: 'They are the cell’s energy generators.' },
  { q: 'What does photosynthesis do?', options: ['Breaks down starch', 'Converts light energy into chemical energy', 'Makes DNA', 'Moves the cell'], correct: 1, explain: 'It happens in chloroplasts.' },
  { q: 'What gives leaves and stems their green colour?', options: ['Chromoplasts', 'Chlorophyll in the chloroplasts', 'Starch', 'The cell wall'], correct: 1, explain: 'Chlorophyll sits in the thylakoid membranes.' },
  { q: 'The potato cells were full of grains that turned blue-black with iodine. What were they?', options: ['Chloroplasts', 'Starch-storing plastids', 'Nuclei', 'Air bubbles'], correct: 1, explain: 'Some plastids are used for storage, like these.' },
  { q: 'Why does a potato have starch-storing plastids but almost no chloroplasts?', options: ['It is not a plant', 'It grows underground in the dark; it stores food made by the green leaves', 'Iodine destroyed them', 'Chloroplasts are too small to see'], correct: 1, explain: 'No light, no photosynthesis: the leaves make the sugar, the tuber stores it as starch.' },
  { q: 'Which statement is true of plant cells?', options: ['They have chloroplasts instead of mitochondria', 'They have both chloroplasts and mitochondria', 'They have neither', 'They only have chromoplasts'], correct: 1, explain: 'You saw both side by side in the leaf cell in the TEM.' },
  { q: 'Why were the Elodea chloroplasts moving?', options: ['They swim with flagella', 'The cytoplasm flows around the cell and carries them (cytoplasmic streaming)', 'The light pushed them', 'They were dividing'], correct: 1, explain: 'Streaming moves organelles and materials around big plant cells.' },
  { q: 'In the living cells, what were the mitochondria doing?', options: ['Nothing: they are fixed in place', 'Moving, dividing and joining together again', 'Leaving the cell', 'Turning into chloroplasts'], correct: 1, explain: 'Mitochondria are constantly on the move, which only the confocal on living cells can show.' },
]
