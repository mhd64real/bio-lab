import { FreePractice as Practice } from '../../lab/FreePractice'

const SLIDES = [{ name: 'Letter e', mount: { specimen: 'letter-e' as const, bubbles: [] } }]

export function FreePractice({ onBack }: { onBack: () => void }) {
  return <Practice slides={SLIDES} onBack={onBack} />
}
