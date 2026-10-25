import { Factory, Scale } from 'lucide-react'
import type { ReadCard } from '../../lab/Cards'
import type { ChoiceQ } from '../../ui/kit'
import type { SortRow } from '../../lab/SortTask'
import type { MatchPair } from '../../lab/MatchTask'
import type { Reason } from '../../lab/ClaimTask'

export const P8_CARDS: ReadCard[] = [
  {
    icon: Scale, title: 'Comparing cells',
    body: [
      'Table 1 summarizes, compares and contrasts the structures of plant cells and animal cells. Plant cells contain chlorophyll: they can capture energy from the Sun and transform it into a usable form of chemical energy. This is one of the main distinctions between plant cells and animal cells.',
      'Animal cells usually do not contain vacuoles; if they do, the vacuoles are much smaller than in plant cells. Animal cells also do not have cell walls. Cell walls give plant cells protection and support.',
      'Many structures are found in both. The nucleus controls the activities of both plant and animal cells, the plasma membrane plays a vital role in maintaining homeostasis in both, and in both the ribosomes are the site of protein synthesis.',
    ],
    q: { q: 'Which is one of the main distinctions between plant and animal cells?', options: ['Only plant cells have a nucleus', 'Plant cells contain chlorophyll and can capture energy from the Sun', 'Only animal cells have ribosomes', 'Animal cells have cell walls'], correct: 1, explain: 'Right: chloroplasts, with their chlorophyll. You watched them stream around Elodea cells.' },
  },
  {
    icon: Factory, title: 'Organelles at work',
    body: [
      'The structures of a cell work together. Take protein synthesis. It begins in the nucleus with the information in DNA. That information is copied and transferred to another genetic molecule called RNA. RNA, and ribosomes made in the nucleolus, leave the nucleus through the pores of the nuclear membrane, and together they manufacture proteins.',
      'Each protein made on the rough ER has a job: it might become part of the plasma membrane, be released from the cell, or be transported to other organelles. Other ribosomes float freely in the cytoplasm and also make proteins.',
      'Most proteins made on the ER are sent to the Golgi apparatus, which packages them in vesicles and transports them to other organelles or out of the cell. Other organelles use these proteins: lysosomes use enzymes to digest food and waste, and mitochondria use enzymes to produce a usable form of energy.',
      'Like the parts of a factory, each organelle has a specific job, and the health of the cell depends on all of them working together.',
    ],
    q: { q: 'Where does protein synthesis begin?', options: ['In the Golgi apparatus', 'In the nucleus, with the information in DNA', 'In the lysosomes', 'In the cell wall'], correct: 1, explain: 'Yes. In Phase 6 you followed a protein from there all the way out of the cell.' },
  },
]

// Table 1, Summary of Cell Structures, with where the student saw each one in this lab.
export interface TableRow { structure: string; fn: string; type: string; seen: string }
export const TABLE1: TableRow[] = [
  { structure: 'Cell wall', fn: 'An inflexible barrier that provides support and protects the plant cell', type: 'Plant cells, fungi cells and some prokaryotes', seen: 'Onion cells (Phase 1); bacteria walls (Phase 3)' },
  { structure: 'Centrioles', fn: 'Organelles that occur in pairs and are important for cell division', type: 'Animal cells and most protist cells', seen: 'The centrosome in the TEM (Phase 2)' },
  { structure: 'Chloroplasts', fn: 'A double-membrane organelle with thylakoids containing chlorophyll, where photosynthesis takes place', type: 'Plant cells and some protist cells', seen: 'Elodea at 1,000x and a leaf in the TEM (Phase 5)' },
  { structure: 'Cilia', fn: 'Projections from cell surfaces that aid in locomotion and feeding; also used to sweep substances along surfaces', type: 'Some animal cells, protist cells and prokaryotes', seen: 'Paramecium, and the windpipe lining in the TEM (Phase 3)' },
  { structure: 'Cytoskeleton', fn: 'A framework for the cell within the cytoplasm', type: 'All eukaryotic cells', seen: 'Microtubules and microfilaments in living cells (Phase 2)' },
  { structure: 'Endoplasmic reticulum', fn: 'A highly folded membrane that is the site of protein synthesis', type: 'All eukaryotic cells', seen: 'Liver cell in the TEM; living cells (Phase 6)' },
  { structure: 'Flagella', fn: 'Projections that aid in locomotion and feeding', type: 'Some animal cells, prokaryotes and some plant cells', seen: 'Euglena (Phase 3)' },
  { structure: 'Golgi apparatus', fn: 'A flattened stack of tubular membranes that modifies proteins and packages them for distribution outside the cell', type: 'All eukaryotic cells', seen: 'Liver cell in the TEM; living cells (Phase 6)' },
  { structure: 'Lysosome', fn: 'A vesicle that contains digestive enzymes for the breakdown of excess or worn-out cellular substances', type: 'Animal cells; rare in plant cells', seen: 'White blood cells in the TEM and the confocal (Phase 7)' },
  { structure: 'Mitochondria', fn: 'A membrane-bound organelle that makes energy available to the rest of the cell', type: 'All eukaryotic cells', seen: 'Living cells and a leaf in the TEM (Phase 5)' },
  { structure: 'Nucleus', fn: 'The control center of the cell that contains coded directions for the production of proteins and cell division', type: 'All eukaryotic cells', seen: 'Onion and cheek cells (Phase 1); nuclear pores (Phase 4)' },
  { structure: 'Plasma membrane', fn: 'A flexible boundary that controls the movement of substances into and out of the cell', type: 'All cells', seen: 'Cheek cells (Phase 1); a protein delivered to it (Phase 6)' },
  { structure: 'Ribosome', fn: 'Organelle that is the site of protein synthesis', type: 'All cells', seen: 'On the rough ER in the liver TEM (Phase 6)' },
  { structure: 'Vacuole', fn: 'A membrane-bound vesicle for the temporary storage of materials', type: 'Plant cells: one large; rarely animal cells: a few small', seen: 'Red onion and a leaf in the TEM (Phase 7)' },
]
export const TABLE_PAIRS: MatchPair[] = TABLE1.map((r) => ({ left: r.structure, right: r.fn }))

// Check Your Progress 3: the parts of a cell compared with a car factory's production line.
export const FACTORY_PAIRS: MatchPair[] = [
  { left: 'Nucleus', right: 'Head office: keeps the master plans for every car and decides what gets built' },
  { left: 'Ribosomes', right: 'Assembly workers who join the parts together, following the plans' },
  { left: 'Rough ER', right: 'The assembly line, where the workers sit and the new cars move along' },
  { left: 'Golgi apparatus', right: 'Finishing department: paints, checks, sorts and packs the cars for shipping' },
  { left: 'Vesicles', right: 'Delivery trucks that carry finished cars between buildings and out of the factory' },
  { left: 'Plasma membrane', right: 'The factory gates and fence, which control what comes in and goes out' },
  { left: 'Mitochondria', right: 'The power station that supplies energy to every machine' },
  { left: 'Vacuole', right: 'The storeroom for materials and waste' },
  { left: 'Lysosomes', right: 'The cleanup and recycling crew' },
  { left: 'Cytoskeleton', right: 'The steel frame that holds the building up' },
]
export const PROTEIN_ROUTE = [
  'DNA in the nucleus holds the information for making the protein',
  'The information is copied into RNA',
  'RNA and ribosomes leave the nucleus through the nuclear pores',
  'A ribosome on the rough ER makes the protein',
  'A vesicle carries the protein to the Golgi apparatus',
  'The Golgi modifies the protein and packages it into a vesicle',
  'The vesicle fuses with the plasma membrane and releases the protein outside the cell',
]

// Check Your Progress 6: categorize the structures of Table 1 by cell type.
export const TYPE_CATEGORIES = ['All cells', 'All eukaryotic cells', 'Plants, not animals', 'Animals, not plants', 'Some cells of several kinds']
export const TYPE_ROWS: SortRow[] = [
  { text: 'Plasma membrane', answer: 'All cells' },
  { text: 'Ribosome', answer: 'All cells' },
  { text: 'Nucleus', answer: 'All eukaryotic cells' },
  { text: 'Mitochondria', answer: 'All eukaryotic cells' },
  { text: 'Endoplasmic reticulum', answer: 'All eukaryotic cells' },
  { text: 'Golgi apparatus', answer: 'All eukaryotic cells' },
  { text: 'Cytoskeleton', answer: 'All eukaryotic cells' },
  { text: 'Cell wall', answer: 'Plants, not animals' },
  { text: 'Chloroplasts', answer: 'Plants, not animals' },
  { text: 'One large central vacuole', answer: 'Plants, not animals' },
  { text: 'Centrioles', answer: 'Animals, not plants' },
  { text: 'Lysosomes (rare in plants)', answer: 'Animals, not plants' },
  { text: 'Cilia', answer: 'Some cells of several kinds' },
  { text: 'Flagella', answer: 'Some cells of several kinds' },
]

// Get It? Infer: justify the statement.
export const CLAIM = 'Cells are the most important units in all living organisms.'
export const REASONS: Reason[] = [
  { text: 'All living organisms are made of one or more cells.', supports: true, why: 'Whether an organism is one bacterium or a whole tree, it is built of cells.' },
  { text: 'Every job of life, such as making proteins, releasing energy and clearing wastes, is done inside cells by their organelles.', supports: true, why: 'You watched these jobs happen in living cells.' },
  { text: 'Cells are the largest structures in an organism.', supports: false, why: 'Tissues and organs are much larger. Cells are the smallest units that are alive.' },
  { text: 'The smallest organisms, such as bacteria, are single cells that carry out every life process.', supports: true, why: 'One cell can be a whole organism.' },
  { text: 'Only animals are made of cells.', supports: false, why: 'Plants, fungi, protists and bacteria are made of cells too.' },
  { text: 'A cell stays healthy only when all its organelles work together, like the parts of a factory.', supports: true, why: 'This is how the textbook ends the lesson.' },
  { text: 'Organelles can survive and do their jobs on their own, outside a cell.', supports: false, why: 'Organelles depend on the rest of the cell. The cell is the smallest unit that can live.' },
  { text: 'New cells come only from cells that already exist.', supports: true, why: 'Every cell in your body came from earlier cells: cells are the units that life is passed on in.' },
]

// Check Your Progress 2: summarize the role of the endoplasmic reticulum.
export const ER_CLOZE = {
  text: 'The endoplasmic reticulum is a [membrane] system of folded sacs and interconnected channels. It is the site of [protein] and lipid synthesis, and its many folds give a large [surface area]. Rough ER has [ribosomes] attached, which make proteins for [export] to other cells. Smooth ER makes complex carbohydrates and [lipids], and in the liver it [detoxifies] harmful substances.',
  extra: ['chlorophyll', 'DNA', 'starch', 'light'],
}

// Check Your Progress 4: compare the structures found in plant and animal cells.
export const COMPARE_ROWS: SortRow[] = [
  { text: 'Cell wall', answer: 'Plant cells only' },
  { text: 'Chloroplasts', answer: 'Plant cells only' },
  { text: 'One large central vacuole', answer: 'Plant cells only' },
  { text: 'Centrioles', answer: 'Animal cells only' },
  { text: 'Nucleus', answer: 'Both' },
  { text: 'Mitochondria', answer: 'Both' },
  { text: 'Plasma membrane', answer: 'Both' },
  { text: 'Ribosomes', answer: 'Both' },
  { text: 'Endoplasmic reticulum', answer: 'Both' },
  { text: 'Golgi apparatus', answer: 'Both' },
]

// Check Your Progress 1, 4 (relate structure to function) and 5.
export const P8_CHECK: ChoiceQ[] = [
  { q: 'Q1. Identify the role of the nucleus in a eukaryotic cell.', options: ['It releases energy from sugar', 'It is the control center: its DNA holds the coded directions for making proteins and for cell division', 'It packages proteins into vesicles', 'It stores water and wastes'], correct: 1, explain: 'The nucleus manages the cell, like the head office of a factory.' },
  { q: 'Q4. Plant cells have cell walls; animal cells do not. How does this relate to what each cell does?', options: ['Animal cells need walls to move', 'The stiff wall supports and protects a plant cell, which cannot move away and must hold its shape', 'Walls make proteins', 'Walls capture sunlight'], correct: 1, explain: 'You saw the walls keep their shape when the red onion cells lost water.' },
  { q: 'Q4. Why do plant cells have chloroplasts but animal cells do not?', options: ['Animal cells are too small', 'Plants make their own food from sunlight by photosynthesis; animals get food by eating', 'Chloroplasts are only needed for cell division', 'Animal cells have them inside the nucleus'], correct: 1, explain: 'Structure fits function: chloroplasts capture light energy.' },
  { q: 'Q4. A plant cell has one large vacuole, an animal cell a few small ones or none. What does the large vacuole do for the plant cell?', options: ['Digests bacteria', 'Stores water, food, enzymes and wastes, and presses the cytoplasm against the wall', 'Makes ribosomes', 'Controls cell division'], correct: 1, explain: 'When it lost water in salt, the inside of the cell shrank away from the wall.' },
  { q: 'Q5. A caterpillar turns into a butterfly inside its pupa. How might lysosomes be involved?', options: ['They make the wings out of light', 'Their enzymes break down caterpillar cells and tissues that are no longer needed, freeing materials to build the butterfly', 'They store food for the butterfly', 'They are not involved'], correct: 1, explain: 'A good hypothesis: lysosomes digest worn-out or unneeded cell parts, and the materials are reused.' },
  { q: 'Which statement about plant and animal cells is true?', options: ['They share no organelles', 'They contain many of the same organelles, while some are unique to plant cells or to animal cells', 'Animal cells have more organelles of every kind', 'Only plant cells have mitochondria'], correct: 1, explain: 'This is the lesson summary: many shared organelles, a few unique to each.' },
]
