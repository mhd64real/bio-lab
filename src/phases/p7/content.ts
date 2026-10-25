import { Archive, Recycle } from 'lucide-react'
import type { ReadCard } from '../../lab/Cards'
import type { ChoiceQ } from '../../ui/kit'

export const P7_CARDS: ReadCard[] = [
  {
    icon: Archive, title: 'Vacuoles',
    body: [
      'A factory needs a place to store materials and waste products. Similarly, cells have membrane-bound vesicles called vacuoles for temporary storage of materials within the cytoplasm.',
      'A vacuole, such as the large vacuole of a plant cell, is a sac used to store food, enzymes and other materials needed by the cell. Some vacuoles store waste products.',
      'Animal cells usually do not contain vacuoles. If they do, the vacuoles are much smaller than those in plant cells.',
    ],
    q: { q: 'Which cells usually have one very large vacuole?', options: ['Animal cells', 'Plant cells', 'Bacteria', 'Red blood cells'], correct: 1, explain: 'Right. In a red onion you will see it straight away: it is full of purple sap.' },
  },
  {
    icon: Recycle, title: 'Lysosomes',
    body: [
      'Factories and cells also need cleanup crews. In a cell, these are lysosomes: vesicles that contain substances that digest excess or worn-out organelles and food particles. Lysosomes also digest bacteria and viruses that have entered the cell.',
      'The membrane surrounding a lysosome prevents the digestive enzymes inside from destroying the cell.',
      'Lysosomes can fuse with vacuoles and release their enzymes into them. The enzymes then digest the wastes inside.',
    ],
    q: { q: 'Why don’t a lysosome’s enzymes digest the rest of the cell?', options: ['They only work at night', 'The lysosome’s membrane keeps them inside', 'The cell wall blocks them', 'There are too few of them'], correct: 1, explain: 'Yes. Later you will watch lysosomes fuse with a swallowed bacterium and digest it.' },
  },
]

// Get It? Explain the role of lysosomes in cells.
export const P7_CLOZE = {
  text: 'Lysosomes are the cell’s cleanup crew. They are [vesicles] that contain [digestive] enzymes. They break down [worn-out] organelles and food particles, and they digest [bacteria] and viruses that have entered the cell. The [membrane] around a lysosome keeps the enzymes from destroying the cell. Lysosomes can [fuse] with vacuoles and release their enzymes to digest the [wastes] inside.',
  extra: ['ribosomes', 'light', 'cell wall', 'DNA'],
}

export const P7_CHECK: ChoiceQ[] = [
  { q: 'What is a vacuole?', options: ['A structure that makes proteins', 'A membrane-bound sac for storing materials such as food, enzymes and wastes', 'A kind of chloroplast', 'A hole in the cell wall'], correct: 1, explain: 'Vacuoles are for temporary storage.' },
  { q: 'Why could you see the vacuoles of red onion cells without a stain?', options: ['The microscope added colour', 'They are full of purple sap', 'The cell walls are purple', 'Iodine was added'], correct: 1, explain: 'The purple pigment is dissolved in the water inside the large central vacuole.' },
  { q: 'Salt water was drawn under the coverslip. What happened?', options: ['The cells burst', 'Water left the vacuoles, so the purple part shrank away from the cell wall', 'The cell walls dissolved', 'Nothing changed'], correct: 1, explain: 'The vacuole holds most of the cell’s water. The wall stayed in place while the inside shrank.' },
  { q: 'How do vacuoles in animal cells compare with plant vacuoles?', options: ['They are bigger', 'Animal cells usually have none, or only much smaller ones', 'They are exactly the same', 'They are full of chlorophyll'], correct: 1, explain: 'A big central vacuole is one of the differences between plant and animal cells.' },
  { q: 'What do lysosomes contain?', options: ['DNA', 'Chlorophyll', 'Digestive enzymes', 'Starch'], correct: 2, explain: 'Enzymes that break down worn-out parts, food particles, bacteria and viruses.' },
  { q: 'In the TEM you saw a double membrane wrapped around a mitochondrion. What was happening?', options: ['The mitochondrion was dividing', 'A worn-out mitochondrion was being taken away to be digested by lysosomes', 'It was making a chloroplast', 'It was a nucleus'], correct: 1, explain: 'Lysosomes digest excess or worn-out organelles.' },
  { q: 'Why are macrophages (white blood cells) full of lysosomes?', options: ['They make proteins for export', 'They swallow and digest bacteria', 'They store water', 'They do photosynthesis'], correct: 1, explain: 'You watched lysosomes fuse with a swallowed bacterium and digest it.' },
  { q: 'What happens when a lysosome fuses with a vacuole?', options: ['The vacuole fills with chlorophyll', 'Its enzymes pass into the vacuole and digest the wastes inside', 'The vacuole becomes a nucleus', 'The cell divides'], correct: 1, explain: 'This is how the cell cleans out its stored wastes.' },
]
