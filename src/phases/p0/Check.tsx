import type { ChoiceQ } from '../../ui/kit'
import { Quiz } from '../../lab/Quiz'

export const CHECK: ChoiceQ[] = [
  {
    q: 'Which objective lens do you always start with?',
    options: ['40x, to see the most detail', '10x, because it is in the middle', '4x, the lowest power', 'Any of them'],
    correct: 2,
    explain: 'Start on 4x: it shows the widest view, is easiest to focus, and sits far from the slide.',
  },
  {
    q: 'The eyepiece magnifies 10x and the objective is 40x. What is the total magnification?',
    options: ['50x', '40x', '400x', '4,000x'],
    correct: 2,
    explain: 'Multiply them: 10 x 40 = 400x.',
  },
  {
    q: 'Why must you never use the coarse focus knob with the 40x objective?',
    options: ['It makes the image too bright', 'The lens sits about half a millimetre from the slide, so the slide can be pushed into it and crack', 'Coarse focus does not work at 40x', 'It switches the lamp off'],
    correct: 1,
    explain: 'At 40x the gap is tiny. Fine focus only.',
  },
  {
    q: 'The letter in the eyepiece is upside down and backwards. Why?',
    options: ['The slide was put on wrong', 'The lenses turn the image through 180 degrees', 'The mirror is broken', 'Light travels upside down'],
    correct: 1,
    explain: 'The objective and eyepiece turn the image around, so things also move the opposite way when you move the slide.',
  },
  {
    q: 'The image is sharp but pale and washed out. What should you adjust?',
    options: ['Close the iris diaphragm a little', 'Turn the coarse focus knob', 'Switch to 40x', 'Take the slide off'],
    correct: 0,
    explain: 'Closing the iris diaphragm a little adds contrast.',
  },
  {
    q: 'Which microscope lets you watch a living cell move?',
    options: ['Transmission electron microscope', 'Scanning electron microscope', 'Light microscope', 'None of them'],
    correct: 2,
    explain: 'Light (and fluorescence) microscopes work with living cells. Electron microscopes need dead, dried specimens in a vacuum.',
  },
  {
    q: 'You lower the coverslip by dropping it flat onto the water. What will you see in the microscope?',
    options: ['A clearer image', 'Dark-edged circles: trapped air bubbles', 'A coloured image', 'Nothing changes'],
    correct: 1,
    explain: 'Lower the coverslip at an angle so the water pushes the air out.',
  },
]

export function Check({ onDone }: { onDone: (got: number, total: number) => void }) {
  return <Quiz items={CHECK} onDone={onDone} />
}
