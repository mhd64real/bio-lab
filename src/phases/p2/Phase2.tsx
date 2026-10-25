import { useState } from 'react'
import { RotateCcw, Trophy } from 'lucide-react'
import { TopBar, Button } from '../../ui/kit'
import { progress, useProgress } from '../../lib/storage'
import { PrepRunner } from '../../lab/PrepRunner'
import { Quiz } from '../../lab/Quiz'
import { Cards } from '../../lab/Cards'
import { SortTask } from '../../lab/SortTask'
import { GuidedInstrument } from '../../instruments/engine'
import { CONFOCAL } from '../../instruments/confocal/Confocal'
import { TEM } from '../../instruments/tem/Tem'
import { CONFOCAL_PREP, TEM_PREP } from './preps'
import { CONFOCAL_STEPS, TEM_STEPS } from './stations'
import { P2_CARDS, P2_CHECK, P2_SORT } from './content'

const SECTIONS = ['intro', 'confocalPrep', 'confocal', 'temPrep', 'tem', 'sort', 'check', 'done'] as const
type Section = (typeof SECTIONS)[number]
const NAMES: Record<Section, string> = {
  intro: 'The cytoskeleton', confocalPrep: 'Living cells: stain', confocal: 'Confocal microscope', temPrep: 'Electron microscope: prepare',
  tem: 'Electron microscope', sort: 'Get It?', check: 'Quick check', done: 'Finished',
}

export function Phase2() {
  const saved = useProgress().phases.p2
  const [section, setSection] = useState<Section>(() => {
    const s = saved?.section as Section | undefined
    return s && SECTIONS.includes(s) ? s : 'intro'
  })
  const go = (s: Section) => { setSection(s); progress.updatePhase('p2', { section: s }); window.scrollTo(0, 0) }
  const restart = () => { progress.resetPhase('p2'); go('intro') }
  const index = SECTIONS.indexOf(section)
  const data = (saved?.data ?? {}) as { sortFirstTry?: boolean }

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <TopBar
        title="Phase 2: Cytoskeleton and centrioles"
        sub={section === 'done' ? NAMES.done : `${NAMES[section]} (${index + 1} of ${SECTIONS.length - 1})`}
        right={section !== 'intro' ? (
          <button type="button" className="icon-btn" onClick={() => { if (confirm('Restart Phase 2 from the beginning?')) restart() }}>
            <RotateCcw size={18} /><span className="hidden md:inline">Restart</span>
          </button>
        ) : null}
      />
      <main className="min-h-0 flex-1">
        {section === 'intro' && <Cards eyebrow="Pages 57 to 58" cards={P2_CARDS} finish="Start: stain living cells" onDone={() => go('confocalPrep')} />}
        {section === 'confocalPrep' && <PrepRunner key="cp" def={CONFOCAL_PREP} onDone={() => go('confocal')} />}
        {section === 'confocal' && <GuidedInstrument key="c" inst={CONFOCAL} steps={CONFOCAL_STEPS} label="Confocal" onDone={() => go('temPrep')} />}
        {section === 'temPrep' && <PrepRunner key="tp" def={TEM_PREP} onDone={() => go('tem')} />}
        {section === 'tem' && <GuidedInstrument key="t" inst={TEM} steps={TEM_STEPS} label="TEM" onDone={() => go('sort')} />}
        {section === 'sort' && (
          <SortTask
            title="Summarize the structure and function of the cytoskeleton"
            intro="Sort each statement: is it true of microtubules, microfilaments, or both?"
            categories={['Microtubules', 'Microfilaments', 'Both']}
            rows={P2_SORT}
            doneLabel="Next: quick check"
            onDone={(first) => { progress.updatePhase('p2', { data: { ...data, sortFirstTry: first } }); go('check') }}
          />
        )}
        {section === 'check' && <Quiz items={P2_CHECK} onDone={(got, total) => {
          // The Get It? sort counts as one more mark when it was right on the first check.
          const bonus = data.sortFirstTry ? 1 : 0
          progress.updatePhase('p2', { score: { got: got + bonus, total: total + 1 }, done: true }); go('done')
        }} />}
        {section === 'done' && (
          <div className="mx-auto grid max-w-2xl gap-4 p-4">
            <div className="card text-center">
              <Trophy size={44} className="mx-auto mb-2 text-[var(--color-accent)]" />
              <h1 className="mb-2 font-display text-4xl font-bold">Phase 2 complete</h1>
              {saved?.score && <p className="mb-2 text-xl font-bold">Score: {saved.score.got} / {saved.score.total}</p>}
              <p className="mb-5 text-lg leading-relaxed text-[var(--color-muted)]">You watched the cytoskeleton working in living cells and saw the 9 triplets of a centriole with electrons. Phase 3 looks at cilia, flagella and cell walls.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="ghost" onClick={restart}><RotateCcw size={18} /> Do it again</Button>
                <a href="#/" className="btn btn-primary">Back to phases</a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
