import { useState } from 'react'
import { Microscope, RotateCcw, Trophy } from 'lucide-react'
import { TopBar, Button } from '../../ui/kit'
import { progress, useProgress } from '../../lib/storage'
import type { Mount } from '../../scope/model'
import { PrepRunner } from '../../lab/PrepRunner'
import { GuidedScope } from '../../lab/GuidedScope'
import { readyScope } from '../../lab/stepKit'
import { Quiz } from '../../lab/Quiz'
import { FreePractice } from '../../lab/FreePractice'
import { Intro } from './Intro'
import { Compare } from './Compare'
import { ONION_PREP, CHEEK_PREP, GRAM_PREP } from './preps'
import { ONION_STEPS, CHEEK_STEPS, YOGURT_STEPS } from './stations'
import { P1_CHECK } from './check'

const SECTIONS = ['intro', 'onionPrep', 'onionScope', 'cheekPrep', 'cheekScope', 'yogurtPrep', 'yogurtScope', 'compare', 'check', 'done', 'practice'] as const
type Section = (typeof SECTIONS)[number]
const NAMES: Record<Section, string> = {
  intro: 'Cell structures', onionPrep: 'Plant cell: prepare', onionScope: 'Plant cell: observe', cheekPrep: 'Animal cell: prepare',
  cheekScope: 'Animal cell: observe', yogurtPrep: 'Prokaryotes: Gram stain', yogurtScope: 'Prokaryotes: observe', compare: 'Compare the cells',
  check: 'Quick check', done: 'Finished', practice: 'Free practice',
}
const COUNTED = SECTIONS.indexOf('done')

export function Phase1() {
  const saved = useProgress().phases.p1
  const [section, setSectionState] = useState<Section>(() => {
    const s = saved?.section as Section | undefined
    return s && SECTIONS.includes(s) ? s : 'intro'
  })
  const mounts = (saved?.data ?? {}) as Partial<Record<'onion' | 'cheek' | 'yogurt', Mount>>
  const go = (s: Section) => { setSectionState(s); progress.updatePhase('p1', { section: s }); window.scrollTo(0, 0) }
  const keep = (key: 'onion' | 'cheek' | 'yogurt', m: Mount, next: Section) => {
    progress.updatePhase('p1', { data: { ...(progress.get().phases.p1?.data ?? {}), [key]: m } })
    go(next)
  }
  // A scope section needs its slide; if storage lost it, go back to making it.
  const fallback: Partial<Record<Section, [Section, Mount | undefined]>> = {
    onionScope: ['onionPrep', mounts.onion], cheekScope: ['cheekPrep', mounts.cheek], yogurtScope: ['yogurtPrep', mounts.yogurt],
  }
  const fb = fallback[section]
  const current: Section = fb && !fb[1] ? fb[0] : section
  const index = SECTIONS.indexOf(current)
  const restart = () => { progress.resetPhase('p1'); go('intro') }

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <TopBar
        title="Phase 1: Cell structures"
        sub={current === 'practice' || current === 'done' ? NAMES[current] : `${NAMES[current]} (${index + 1} of ${COUNTED})`}
        right={current !== 'intro' && current !== 'done' && current !== 'practice' ? (
          <button type="button" className="icon-btn" onClick={() => { if (confirm('Restart Phase 1 from the beginning?')) restart() }}>
            <RotateCcw size={18} /><span className="hidden md:inline">Restart</span>
          </button>
        ) : null}
      />
      <main className="min-h-0 flex-1">
        {current === 'intro' && <Intro onDone={() => go('onionPrep')} />}
        {current === 'onionPrep' && <PrepRunner key="onion" def={ONION_PREP} onDone={(m) => keep('onion', m, 'onionScope')} />}
        {current === 'onionScope' && mounts.onion && <GuidedScope key="onion" steps={ONION_STEPS} mount={mounts.onion} initial={readyScope} label="Plant cell" onDone={() => go('cheekPrep')} />}
        {current === 'cheekPrep' && <PrepRunner key="cheek" def={CHEEK_PREP} onDone={(m) => keep('cheek', m, 'cheekScope')} />}
        {current === 'cheekScope' && mounts.cheek && <GuidedScope key="cheek" steps={CHEEK_STEPS} mount={mounts.cheek} initial={readyScope} label="Animal cell" onDone={() => go('yogurtPrep')} />}
        {current === 'yogurtPrep' && <PrepRunner key="yogurt" def={GRAM_PREP} onDone={(m) => keep('yogurt', m, 'yogurtScope')} />}
        {current === 'yogurtScope' && mounts.yogurt && <GuidedScope key="yogurt" steps={YOGURT_STEPS} mount={mounts.yogurt} initial={readyScope} label="Prokaryotes" onDone={() => go('compare')} />}
        {current === 'compare' && <Compare onDone={() => go('check')} />}
        {current === 'check' && <Quiz items={P1_CHECK} onDone={(got, total) => { progress.updatePhase('p1', { score: { got, total }, done: true }); go('done') }} />}
        {current === 'done' && (
          <div className="mx-auto grid max-w-2xl gap-4 p-4">
            <div className="card text-center">
              <Trophy size={44} className="mx-auto mb-2 text-[var(--color-accent)]" />
              <h1 className="mb-2 font-display text-4xl font-bold">Phase 1 complete</h1>
              {saved?.score && <p className="mb-2 text-xl font-bold">Quick check: {saved.score.got} / {saved.score.total}</p>}
              <p className="mb-5 text-lg leading-relaxed text-[var(--color-muted)]">You have seen a plant cell, an animal cell and prokaryotic cells with your own eyes. Phase 2 looks at the framework inside the cell.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="ghost" onClick={restart}><RotateCcw size={18} /> Do it again</Button>
                <Button variant="soft" onClick={() => go('practice')}><Microscope size={18} /> Free practice</Button>
                <a href="#/" className="btn btn-primary">Back to phases</a>
              </div>
            </div>
          </div>
        )}
        {current === 'practice' && saved?.done && (
          <FreePractice
            onBack={() => go('done')}
            slides={[
              { name: 'Onion epidermis (iodine)', mount: mounts.onion ?? { specimen: 'onion', bubbles: [] } },
              { name: 'Cheek cells (methylene blue)', mount: mounts.cheek ?? { specimen: 'cheek', bubbles: [] } },
              { name: 'Yogurt bacteria (Gram stain)', mount: mounts.yogurt ?? { specimen: 'yogurt', bubbles: [] } },
            ]}
          />
        )}
      </main>
    </div>
  )
}
