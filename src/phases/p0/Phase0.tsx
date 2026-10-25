import { useState } from 'react'
import { Hand, Keyboard, MousePointer2, Microscope, RotateCcw, Trophy } from 'lucide-react'
import { TopBar, Button } from '../../ui/kit'
import { progress, useProgress } from '../../lib/storage'
import type { Mount } from '../../scope/model'
import { PartsTour } from './PartsTour'
import { PrepBench } from './PrepBench'
import { Observe } from './Observe'
import { Instruments } from './Instruments'
import { Check } from './Check'

const SECTIONS = ['welcome', 'parts', 'prep', 'observe', 'instruments', 'check', 'done'] as const
type Section = (typeof SECTIONS)[number]
const NAMES: Record<Section, string> = {
  welcome: 'Welcome', parts: 'Meet the microscope', prep: 'Prepare a slide', observe: 'Use the microscope',
  instruments: 'Other microscopes', check: 'Quick check', done: 'Finished',
}

function Welcome({ onStart }: { onStart: () => void }) {
  return (
    <div className="mx-auto grid max-w-3xl gap-4 p-4">
      <div className="card">
        <span className="eyebrow">Phase 0, Lab orientation</span>
        <h1 className="mb-3 mt-1 font-display text-4xl font-bold leading-tight">Welcome to the lab</h1>
        <p className="mb-3 text-lg leading-relaxed">
          In this lab you will learn the whole lesson <b>Structures and Organelles</b> by using real scientific instruments: a light microscope, a fluorescence microscope and two electron microscopes.
        </p>
        <p className="mb-5 text-lg leading-relaxed">
          They behave like the real thing. If a step is skipped, you will see exactly what a scientist would see: darkness, blur, or a cracked slide. This orientation teaches you how to use them before the lesson starts.
        </p>
        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          {[
            { icon: <Hand />, t: 'Touch', d: 'Tap and drag the parts of the microscope, or use the big buttons.' },
            { icon: <MousePointer2 />, t: 'Mouse', d: 'Click and drag knobs. Scroll on the eyepiece to fine focus.' },
            { icon: <Keyboard />, t: 'Keyboard', d: 'Arrows move the slide, PgUp/PgDn coarse, [ and ] fine, 1 2 3 lenses, L lamp.' },
          ].map((x) => (
            <div key={x.t} className="rounded-xl bg-[var(--color-sunk)] p-3">
              <div className="mb-1 flex items-center gap-2 font-display text-lg font-bold text-[var(--color-primary)]">{x.icon}{x.t}</div>
              <p className="text-[0.95rem] leading-snug">{x.d}</p>
            </div>
          ))}
        </div>
        <p className="mb-5 text-[var(--color-muted)]">Sound is off. You can turn it on with the button in the top corner.</p>
        <Button onClick={onStart}><Microscope size={20} /> Start the orientation</Button>
      </div>
    </div>
  )
}

function Done({ score, onRestart }: { score?: { got: number; total: number }; onRestart: () => void }) {
  return (
    <div className="mx-auto grid max-w-2xl gap-4 p-4">
      <div className="card text-center">
        <Trophy size={44} className="mx-auto mb-2 text-[var(--color-accent)]" />
        <h1 className="mb-2 font-display text-4xl font-bold">Orientation complete</h1>
        {score && <p className="mb-2 text-xl font-bold">Quick check: {score.got} / {score.total}</p>}
        <p className="mb-5 text-lg leading-relaxed text-[var(--color-muted)]">You can now use the light microscope on your own. Phase 1 starts the lesson itself.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button variant="ghost" onClick={onRestart}><RotateCcw size={18} /> Do it again</Button>
          <a href="#/" className="btn btn-primary">Back to phases</a>
        </div>
      </div>
    </div>
  )
}

export function Phase0() {
  const saved = useProgress().phases.p0
  const [section, setSectionState] = useState<Section>(() => {
    const s = saved?.section as Section | undefined
    return s && SECTIONS.includes(s) ? s : 'welcome'
  })
  const [mount, setMount] = useState<Mount | null>(() => (saved?.data?.mount as Mount | undefined) ?? null)
  const go = (s: Section) => { setSectionState(s); progress.updatePhase('p0', { section: s }); window.scrollTo(0, 0) }

  // The observe section needs a slide; without one (e.g. storage was cleared) go back to the bench.
  const current: Section = section === 'observe' && !mount ? 'prep' : section
  const index = SECTIONS.indexOf(current)

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <TopBar
        title="Phase 0: Lab orientation"
        sub={`${NAMES[current]} (${Math.min(index + 1, 6)} of 6)`}
        right={current !== 'welcome' && current !== 'done' ? (
          <button type="button" className="icon-btn" onClick={() => { if (confirm('Restart the orientation from the beginning?')) { progress.resetPhase('p0'); setMount(null); go('welcome') } }}>
            <RotateCcw size={18} /><span className="hidden md:inline">Restart</span>
          </button>
        ) : null}
      />
      <main className="min-h-0 flex-1">
        {current === 'welcome' && <Welcome onStart={() => go('parts')} />}
        {current === 'parts' && <PartsTour onDone={() => go('prep')} />}
        {current === 'prep' && <PrepBench onDone={(m) => { setMount(m); progress.updatePhase('p0', { data: { mount: m } }); go('observe') }} />}
        {current === 'observe' && mount && <Observe mount={mount} onStep={(i) => progress.updatePhase('p0', { step: i })} onDone={() => go('instruments')} />}
        {current === 'instruments' && <Instruments onDone={() => go('check')} />}
        {current === 'check' && <Check onDone={(got, total) => { progress.updatePhase('p0', { score: { got, total }, done: true }); go('done') }} />}
        {current === 'done' && <Done score={saved?.score} onRestart={() => { progress.resetPhase('p0'); setMount(null); go('welcome') }} />}
      </main>
    </div>
  )
}
