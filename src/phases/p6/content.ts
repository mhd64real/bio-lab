import { Factory, Layers, Package } from 'lucide-react'
import type { ReadCard } from '../../lab/Cards'
import type { ChoiceQ } from '../../ui/kit'
import type { SortRow } from '../../lab/SortTask'

export const P6_CARDS: ReadCard[] = [
  {
    icon: Factory, title: 'Ribosomes',
    body: [
      'One of the functions of a cell is to produce proteins. The organelles that help manufacture proteins are called ribosomes. Ribosomes are made of two components, RNA and protein, and are not bound by a membrane like other organelles are. The nucleolus is the site of ribosome production.',
      'Cells have many ribosomes, making proteins used by the cell or moved out and used by other cells. Some ribosomes float freely in the cytoplasm; others are bound to another organelle, the endoplasmic reticulum. Free ribosomes make proteins for use within the cytoplasm. Bound ribosomes make proteins that will be bound within membranes or used by other cells.',
    ],
    q: { q: 'Where in the cell are ribosomes made?', options: ['In the Golgi apparatus', 'In the nucleolus', 'In the cell wall', 'In the vesicles'], correct: 1, explain: 'Right. The nucleolus, inside the nucleus, is the site of ribosome production.' },
  },
  {
    icon: Layers, title: 'Endoplasmic reticulum',
    body: [
      'The endoplasmic reticulum (en duh PLAZ mihk • rih TIHK yuh lum), or ER, is a membrane system of folded sacs and interconnected channels where proteins and lipids are made. Its many pleats and folds give a large surface area where cell functions can take place.',
      'Rough ER is the area where ribosomes are attached. It looks bumpy: the bumps are the ribosomes, making proteins for export to other cells.',
      'Smooth ER has no ribosomes attached, but it still does important work. It provides a membrane surface where complex carbohydrates and lipids, including phospholipids, are made. Smooth ER in the liver detoxifies harmful substances.',
    ],
    q: { q: 'What are the bumps on rough ER?', options: ['Nuclear pores', 'Ribosomes', 'Vesicles', 'Drops of lipid'], correct: 1, explain: 'Yes. You will see them lined up along the ER in the electron microscope.' },
  },
  {
    icon: Package, title: 'Golgi apparatus and vesicles',
    body: [
      'After hiking boots are made in a factory, they must be sorted into pairs, boxed and shipped. In the same way, after proteins are made in the ER, some are transferred to the Golgi (GAWL jee) apparatus.',
      'The Golgi apparatus is a flattened stack of membranes that modifies, sorts and packages proteins into sacs called vesicles. Vesicles can then fuse with the plasma membrane to release the proteins to the environment outside the cell.',
    ],
    q: { q: 'What does the Golgi apparatus do with proteins?', options: ['Makes them from instructions', 'Modifies, sorts and packages them into vesicles', 'Breaks them down for energy', 'Stores them forever'], correct: 1, explain: 'Right. Later today you will watch a protein pass through the Golgi in a living cell.' },
  },
]

export const P6_CATEGORIES = ['Ribosome', 'Rough ER', 'Smooth ER', 'Golgi apparatus']
export const P6_SORT: SortRow[] = [
  { text: 'Made of RNA and protein, with no membrane', answer: 'Ribosome' },
  { text: 'Made in the nucleolus', answer: 'Ribosome' },
  { text: 'Some float freely in the cytoplasm', answer: 'Ribosome' },
  { text: 'Looks bumpy because ribosomes are attached', answer: 'Rough ER' },
  { text: 'Where proteins for export to other cells are made', answer: 'Rough ER' },
  { text: 'Makes complex carbohydrates and lipids, including phospholipids', answer: 'Smooth ER' },
  { text: 'Detoxifies harmful substances in liver cells', answer: 'Smooth ER' },
  { text: 'In the TEM: small tubes with no bumps, among dark glycogen', answer: 'Smooth ER' },
  { text: 'A flattened stack of membranes', answer: 'Golgi apparatus' },
  { text: 'Modifies, sorts and packages proteins into vesicles', answer: 'Golgi apparatus' },
  { text: 'In the living cells, the tagged protein crowded here beside the nucleus', answer: 'Golgi apparatus' },
]

export const P6_CHECK: ChoiceQ[] = [
  { q: 'What are ribosomes made of?', options: ['Lipids only', 'RNA and protein', 'DNA and sugar', 'Cellulose'], correct: 1, explain: 'And unlike most organelles, they have no membrane around them.' },
  { q: 'A protein will be used inside the cytoplasm. Which ribosomes make it?', options: ['Ribosomes on the rough ER', 'Free ribosomes in the cytoplasm', 'Ribosomes in the Golgi', 'Ribosomes in the nucleus'], correct: 1, explain: 'Free ribosomes make proteins for use within the cytoplasm; bound ribosomes make proteins for membranes or for export.' },
  { q: 'Why does the ER have so many pleats and folds?', options: ['To make it heavier', 'To give a large surface area where cell functions take place', 'To store water', 'To trap light'], correct: 1, explain: 'More membrane means more room to make proteins and lipids.' },
  { q: 'Which organelle makes lipids, including phospholipids?', options: ['Rough ER', 'Smooth ER', 'Ribosome', 'Vesicle'], correct: 1, explain: 'Smooth ER provides the membrane surface where lipids and complex carbohydrates are made.' },
  { q: 'Liver cells have lots of smooth ER. Why?', options: ['To make starch', 'Smooth ER in the liver detoxifies harmful substances', 'To capture light', 'To make ribosomes'], correct: 1, explain: 'The liver cleans harmful substances out of the blood.' },
  { q: 'What is the route of a protein made for export?', options: ['Golgi, then rough ER, then nucleus', 'Ribosome on rough ER, then ER, then vesicle, then Golgi, then vesicle, then plasma membrane', 'Free ribosome, then mitochondrion, then membrane', 'Smooth ER, then nucleus, then Golgi'], correct: 1, explain: 'This is the route you watched in the living cells: ER, then Golgi, then the cell outline.' },
  { q: 'How does a vesicle release proteins outside the cell?', options: ['It bursts inside the cytoplasm', 'It fuses with the plasma membrane', 'It passes through a nuclear pore', 'It dissolves the cell wall'], correct: 1, explain: 'Its membrane joins the plasma membrane and the contents spill outside.' },
  { q: 'In the living-cell experiment, why were the cells kept at 40 °C at first?', options: ['To kill them', 'At 40 °C the tagged protein folds wrongly and the ER holds on to it, so it all starts from the ER together', 'To make the dye glow', 'Cells only make proteins at 40 °C'], correct: 1, explain: 'Cooling to 32 °C let the protein fold correctly and leave the ER as one wave you could follow.' },
]
