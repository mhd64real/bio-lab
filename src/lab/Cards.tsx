import { useState } from 'react'
import { ArrowLeft, type LucideIcon } from 'lucide-react'
import { Button, Choice, type ChoiceQ } from '../ui/kit'

export interface ReadCard { icon: LucideIcon; title: string; body: string[]; q?: ChoiceQ }

// Short reading cards; a card with a question must be answered correctly before moving on.
export function Cards({ eyebrow, cards, finish, onDone }: { eyebrow: string; cards: ReadCard[]; finish: string; onDone: () => void }) {
  const [i, setI] = useState(0)
  const [solved, setSolved] = useState<Set<number>>(new Set())
  const card = cards[i]
  const Icon = card.icon
  const ok = !card.q || solved.has(i)
  return (
    <div className="mx-auto grid max-w-3xl gap-4 p-4">
      <div className="flex gap-2">{cards.map((_, k) => <span key={k} className={`h-2 flex-1 rounded-full ${k <= i ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-line)]'}`} />)}</div>
      <div className="card">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="mb-3 mt-1 flex items-center gap-3 font-display text-3xl font-bold leading-tight"><Icon className="text-[var(--color-primary)]" size={30} /> {card.title}</h2>
        {card.body.map((p) => <p key={p} className="mb-3 text-lg leading-relaxed">{p}</p>)}
        {card.q && <div className="mt-4 rounded-2xl bg-[var(--color-sunk)] p-4"><Choice key={i} item={card.q} untilCorrect onDone={() => setSolved(new Set(solved).add(i))} /></div>}
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0}><ArrowLeft size={18} /> Back</Button>
        <Button onClick={() => (i + 1 < cards.length ? setI(i + 1) : onDone())} disabled={!ok}>{i + 1 < cards.length ? 'Next' : finish}</Button>
      </div>
    </div>
  )
}
