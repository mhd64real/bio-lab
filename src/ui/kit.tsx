import { useState, type ReactNode } from 'react'
import { Check, Home, Volume2, VolumeX, X } from 'lucide-react'
import { progress, useProgress } from '../lib/storage'
import { play, unlockAudio } from '../lib/sound'

export function Button({ children, onClick, variant = 'primary', disabled, className = '', type = 'button' }: { children: ReactNode; onClick?: () => void; variant?: 'primary' | 'soft' | 'ghost' | 'danger'; disabled?: boolean; className?: string; type?: 'button' | 'submit' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn btn-${variant} ${className}`}>
      {children}
    </button>
  )
}

export function SoundToggle() {
  const { sound } = useProgress()
  return (
    <button
      type="button"
      className="icon-btn"
      aria-pressed={sound}
      aria-label={sound ? 'Sound on. Turn sound off' : 'Sound off. Turn sound on'}
      title={sound ? 'Sound on' : 'Sound off'}
      onClick={() => { unlockAudio(); progress.setSound(!sound) }}
    >
      {sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
      <span className="hidden sm:inline">{sound ? 'Sound on' : 'Muted'}</span>
    </button>
  )
}

export function TopBar({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <header className="topbar">
      <a href="#/" className="icon-btn" aria-label="All phases"><Home size={20} /><span className="hidden sm:inline">Phases</span></a>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-lg font-bold leading-tight">{title}</div>
        {sub && <div className="truncate text-sm text-[var(--color-muted)]">{sub}</div>}
      </div>
      {right}
      <SoundToggle />
    </header>
  )
}

export interface ChoiceQ {
  q: string
  options: string[]
  correct: number
  explain: string
}

// A multiple choice question. In "until correct" mode the student keeps trying; otherwise the first answer counts.
export function Choice({ item, onDone, untilCorrect = false }: { item: ChoiceQ; onDone: (firstTryCorrect: boolean) => void; untilCorrect?: boolean }) {
  const [picked, setPicked] = useState<number[]>([])
  const first = picked[0]
  const solved = untilCorrect ? picked.includes(item.correct) : picked.length > 0
  const pick = (i: number) => {
    if (solved || picked.includes(i)) return
    const next = [...picked, i]
    setPicked(next)
    const finished = untilCorrect ? i === item.correct : true
    play(i === item.correct ? 'ok' : 'click')
    if (finished) onDone(next[0] === item.correct)
  }
  return (
    <div>
      <p className="mb-3 text-lg font-bold leading-snug">{item.q}</p>
      <div className="grid gap-2">
        {item.options.map((o, i) => {
          const was = picked.includes(i)
          const right = i === item.correct
          const show = was || (solved && right)
          const tone = show ? (right ? 'choice-right' : 'choice-wrong') : ''
          return (
            <button key={i} type="button" className={`choice ${tone}`} onClick={() => pick(i)} disabled={solved && !was && !right}>
              <span className="choice-mark">{show ? (right ? <Check size={16} /> : <X size={16} />) : String.fromCharCode(65 + i)}</span>
              <span>{o}</span>
            </button>
          )
        })}
      </div>
      {picked.length > 0 && (
        <p className={`mt-3 rounded-xl p-3 text-[0.95rem] leading-snug ${(untilCorrect ? solved : first === item.correct) ? 'bg-[var(--color-ok-soft)]' : 'bg-[var(--color-danger-soft)]'}`}>
          {!solved ? 'Not quite. Try again.' : item.explain}
        </p>
      )}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}
