import { Network, Microscope, Atom } from 'lucide-react'
import type { ReadCard } from '../../lab/Cards'
import type { ChoiceQ } from '../../ui/kit'
import type { SortRow } from '../../lab/SortTask'

export const P2_CARDS: ReadCard[] = [
  {
    icon: Network, title: 'Organelles do not float',
    body: [
      'At one time, scientists thought that organelles floated in a sea of cytoplasm. Cell biologists have since discovered that they do not float freely.',
      'Instead, they are supported by the cytoskeleton: a supporting network of long, thin protein fibres that form a framework for the cell and provide an anchor for the organelles. The cytoskeleton also helps cells move.',
    ],
    q: { q: 'What is the cytoskeleton?', options: ['A hard shell outside the cell', 'A network of long, thin protein fibres inside the cell', 'The liquid inside the nucleus', 'A type of organelle that makes energy'], correct: 1, explain: 'Right: a framework of protein fibres in the cytoplasm.' },
  },
  {
    icon: Atom, title: 'Two kinds of fibre',
    body: [
      'Microtubules are long, hollow protein cylinders. They form a rigid skeleton for the cell and help move substances around inside it.',
      'Microfilaments are thin protein threads. They help give the cell its shape and enable the whole cell, or parts of it, to move.',
      'Both rapidly assemble and disassemble and slide past one another, which allows cells and organelles to move.',
    ],
    q: { q: 'Which fibres are long, hollow cylinders?', options: ['Microfilaments', 'Microtubules', 'Both', 'Neither'], correct: 1, explain: 'Yes: microtubules are hollow; microfilaments are thin, solid threads.' },
  },
  {
    icon: Microscope, title: 'Centrioles, and two new microscopes',
    body: [
      'Groups of microtubules form centrioles: organelles that function during cell division. They are found in the cytoplasm of animal cells and most protists, usually near the nucleus.',
      'Microtubules are only about 25 nanometres wide, far too thin to see properly with a light microscope. So you will use two new instruments: a confocal microscope to watch the cytoskeleton in living cells, and a transmission electron microscope to see what a centriole is made of.',
    ],
  },
]

export const P2_SORT: SortRow[] = [
  { text: 'Long, hollow protein cylinders', answer: 'Microtubules' },
  { text: 'Thin protein threads', answer: 'Microfilaments' },
  { text: 'Form a rigid skeleton for the cell', answer: 'Microtubules' },
  { text: 'Help give the cell its shape', answer: 'Microfilaments' },
  { text: 'Help move substances within the cell', answer: 'Microtubules' },
  { text: 'Enable the whole cell or parts of it to move', answer: 'Microfilaments' },
  { text: 'Rapidly assemble and disassemble', answer: 'Both' },
  { text: 'Make up centrioles', answer: 'Microtubules' },
  { text: 'Part of the cytoskeleton', answer: 'Both' },
  { text: 'Brightest along the ruffling edge of your living cell', answer: 'Microfilaments' },
]

export const P2_CHECK: ChoiceQ[] = [
  { q: 'What is the cytoskeleton?', options: ['A sea of cytoplasm', 'A supporting network of long, thin protein fibres', 'The cell wall', 'A large vacuole'], correct: 1, explain: 'It is a framework of protein fibres that anchors the organelles.' },
  { q: 'Which describes microtubules?', options: ['Thin protein threads that shape the cell', 'Long, hollow protein cylinders that form a rigid skeleton', 'Fat droplets', 'Strands of DNA'], correct: 1, explain: 'Microtubules are hollow cylinders; microfilaments are thin threads.' },
  { q: 'What allows cells and organelles to move?', options: ['The cell wall pushes them', 'Microtubules and microfilaments rapidly assemble, disassemble and slide past one another', 'The nucleus spins', 'Water currents'], correct: 1, explain: 'That is the textbook’s explanation, and what you saw in the time-lapse.' },
  { q: 'What are centrioles made of, and when do they work?', options: ['Microfilaments, during digestion', 'Microtubules, during cell division', 'DNA, during growth', 'Membranes, during photosynthesis'], correct: 1, explain: 'Centrioles are 9 triplets of microtubules and function in cell division.' },
  { q: 'Why could the confocal microscope show the microtubules moving?', options: ['It uses electrons', 'It images living cells using laser light and fluorescent dyes', 'It slices the cells', 'It uses a vacuum'], correct: 1, explain: 'Laser light and dyes work on living cells, so you can watch them change.' },
  { q: 'Why must cells for the TEM be killed, dried and put in resin?', options: ['To make them colourful', 'Electrons only travel in a vacuum, which a living, wet cell cannot survive', 'To make them grow', 'To keep them warm'], correct: 1, explain: 'Fixing, removing water and embedding let the cell survive the vacuum as a thin plastic slice.' },
  { q: 'In a TEM image, why do stained membranes look dark?', options: ['They are painted black', 'Heavy metal stains block electrons from reaching the camera', 'They glow', 'They are holes'], correct: 1, explain: 'Dark means electrons were stopped by heavy atoms such as osmium, uranium and lead.' },
  { q: 'What does closing the pinhole of a confocal microscope do?', options: ['Makes the image brighter', 'Blocks out-of-focus light so you see one thin optical slice', 'Changes the laser colour', 'Turns the laser off'], correct: 1, explain: 'Only light from the plane in focus gets through.' },
]
