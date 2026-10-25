import { CircleDot, Factory, Layers } from 'lucide-react'
import type { ReadCard } from '../../lab/Cards'
import type { ChoiceQ } from '../../ui/kit'

export const P4_CARDS: ReadCard[] = [
  {
    icon: Factory, title: 'Controlling cell activities',
    body: [
      'Just as a factory needs a manager to direct and oversee the tasks carried out in the factory, a cell needs an organelle to direct the cell processes.',
      'The nucleus is the cell’s managing structure. It contains most of the cell’s DNA, which stores information used to make proteins for cell growth, function and reproduction.',
    ],
    q: { q: 'What does the DNA in the nucleus store?', options: ['Energy for the cell', 'Information used to make proteins for growth, function and reproduction', 'Water', 'Waste'], correct: 1, explain: 'Right. The nucleus directs the cell by holding these instructions.' },
  },
  {
    icon: CircleDot, title: 'The nucleolus',
    body: [
      'Within the nucleus is the site of ribosome production, called the nucleolus.',
      'Site means location: the nucleolus is the place where ribosomes are made.',
    ],
    q: { q: 'What is made in the nucleolus?', options: ['DNA', 'Ribosomes', 'The cell wall', 'Chloroplasts'], correct: 1, explain: 'Yes: the nucleolus is the site of ribosome production.' },
  },
  {
    icon: Layers, title: 'The nuclear envelope and chromatin',
    body: [
      'The nucleus is surrounded by a double membrane called the nuclear envelope. It is similar to the plasma membrane, except that it has nuclear pores that allow larger substances to move in and out of the nucleus.',
      'Chromatin, which is DNA attached to protein, is spread throughout the nucleus.',
    ],
    q: { q: 'How is the nuclear envelope different from the plasma membrane?', options: ['It is made of cellulose', 'It is a double membrane with nuclear pores that let larger substances in and out', 'It has no membrane', 'It is outside the cell wall'], correct: 1, explain: 'Right. You will see the pores twice today: glowing green in living cells, and as gaps in the envelope in the TEM.' },
  },
]

export const P4_CLOZE = {
  text: 'The nucleus is the cell’s [managing] structure. It contains most of the cell’s [DNA], which stores information used to make [proteins] for cell growth, function and reproduction. Ribosomes are made in the [nucleolus]. The nucleus is surrounded by a [double] membrane called the nuclear envelope, and [nuclear pores] let larger substances move in and out. [Chromatin], DNA attached to protein, is spread throughout the nucleus.',
  extra: ['cellulose', 'single', 'cell wall', 'water'],
}

export const P4_CHECK: ChoiceQ[] = [
  { q: 'What is the role of the nucleus?', options: ['It makes energy from food', 'It is the managing structure: its DNA holds the information that directs the cell', 'It stores water', 'It moves the cell'], correct: 1, explain: 'Like the manager of a factory.' },
  { q: 'Where are ribosomes produced?', options: ['In the nuclear pores', 'In the nucleolus', 'In the cell wall', 'In the cytoplasm only'], correct: 1, explain: 'The nucleolus is the site of ribosome production.' },
  { q: 'How many membranes make up the nuclear envelope?', options: ['None', 'One', 'Two: it is a double membrane', 'Nine'], correct: 2, explain: 'You saw the two lines in the TEM at 44,000x.' },
  { q: 'What do nuclear pores do?', options: ['Make ribosomes', 'Let larger substances move in and out of the nucleus', 'Store DNA', 'Make the nucleus move'], correct: 1, explain: 'Pores are openings through both membranes of the envelope.' },
  { q: 'What is chromatin?', options: ['A kind of sugar', 'DNA attached to protein, spread throughout the nucleus', 'The nuclear envelope', 'A stain'], correct: 1, explain: 'The darkest, most tightly packed chromatin lined the envelope in the TEM.' },
  { q: 'With the Hoechst DNA dye, why did the nucleoli look like dark holes?', options: ['They are empty', 'They contain little DNA; they are busy making ribosomes', 'The laser could not reach them', 'They are air bubbles'], correct: 1, explain: 'Hoechst only glows where there is DNA.' },
  { q: 'Why did the green pores form a ring at the middle of the nucleus, but a sheet of dots near its top?', options: ['The pores moved', 'The thin optical section cut across the side of the envelope at the middle, but skimmed along its top surface', 'The laser changed colour', 'The cell divided'], correct: 1, explain: 'The same idea as slicing the model: where you cut a 3D shape changes what you see.' },
  { q: 'Why were both microscopes needed?', options: ['They show the same thing', 'The confocal shows living nuclei; the TEM shows finer detail, like the double membrane, but only in dead, sliced cells', 'The TEM shows living cells', 'The confocal shows more detail'], correct: 1, explain: 'Each instrument answers a different question.' },
]
