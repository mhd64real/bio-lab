import { useState } from 'react'
import { Microscope, RotateCcw, Trophy } from 'lucide-react'
import { TopBar, Button } from '../../ui/kit'
import { progress, useProgress } from '../../lib/storage'
import type { Mount } from '../../scope/model'
import { PrepRunner } from '../../lab/PrepRunner'
import { GuidedScope } from '../../lab/GuidedScope'
import { readyScope } from '../../lab/stepKit'
import { Quiz } from '../../lab/Quiz'
import { Cards } from '../../lab/Cards'
import { SortTask } from '../../lab/SortTask'
import { FreePractice } from '../../lab/FreePractice'
import { GuidedInstrument } from '../../instruments/engine'
import { SEM } from '../../instruments/sem/Sem'
import { TEM } from '../../instruments/tem/Tem'
import { initialTem } from '../../instruments/tem/model'
import { TEM_PREP } from '../p2/preps'
import { ELODEA_PREP, POND_PREP, ReplayPrep, SEM_PREP } from './preps'
import { ELODEA_STEPS, POND_STEPS, SEM_STEPS, TEM_CILIA_STEPS } from './stations'
import { P3_CARDS, P3_CHECK, P3_SORT, P3_WALL_CARDS } from './content'

const SECTIONS = ['intro', 'pondPrep', 'pond', 'elodeaPrep', 'elodea', 'walls', 'semPrep', 'sem', 'temPrep', 'tem', 'sort', 'check', 'done', 'practice'] as const
type Section = (typeof SECTIONS)[number]
const NAMES: Record<Section, string> = {
  intro: 'Cilia, flagella and walls', pondPrep: 'Pond water: prepare', pond: 'Pond water: observe', elodeaPrep: 'Elodea: prepare', elodea: 'Elodea: observe',
  walls: 'Prokaryote walls', semPrep: 'SEM: prepare', sem: 'Scanning electron microscope', temPrep: 'TEM: prepare', tem: 'Transmission electron microscope',
  sort: 'Get It?', check: 'Quick check', done: 'Finished', practice: 'Free practice',
}
const COUNTED = SECTIONS.indexOf('done')
const temCilia = () => ({ ...initialTem(), specimen: 'cilia' as const })

export function Phase3() {
  const saved = useProgress().phases.p3
  const [section, setSection] = useState<Section>(() => {
    const s = saved?.section as Section | undefined
    return s && SECTIONS.includes(s) ? s : 'intro'
  })
  const data = (saved?.data ?? {}) as { pond?: Mount; elodea?: Mount; sortFirstTry?: boolean }
  const go = (s: Section) => { setSection(s); progress.updatePhase('p3', { section: s }); window.scrollTo(0, 0) }
  const keep = (patch: Partial<typeof data>, next: Section) => { progress.updatePhase('p3', { data: { ...(progress.get().phases.p3?.data ?? {}), ...patch } }); go(next) }
  const restart = () => { progress.resetPhase('p3'); go('intro') }
  const current: Section = section === 'pond' && !data.pond ? 'pondPrep' : section === 'elodea' && !data.elodea ? 'elodeaPrep' : section
  const index = SECTIONS.indexOf(current)

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <TopBar
        title="Phase 3: Appendages and cell walls"
        sub={current === 'done' || current === 'practice' ? NAMES[current] : `${NAMES[current]} (${index + 1} of ${COUNTED})`}
        right={current !== 'intro' && current !== 'done' && current !== 'practice' ? (
          <button type="button" className="icon-btn" onClick={() => { if (confirm('Restart Phase 3 from the beginning?')) restart() }}>
            <RotateCcw size={18} /><span className="hidden md:inline">Restart</span>
          </button>
        ) : null}
      />
      <main className="min-h-0 flex-1">
        {current === 'intro' && <Cards eyebrow="Pages 58 to 59" cards={P3_CARDS} finish="Start: pond water" onDone={() => go('pondPrep')} />}
        {current === 'pondPrep' && <PrepRunner key="pp" def={POND_PREP} onDone={(m) => keep({ pond: m }, 'pond')} />}
        {current === 'pond' && data.pond && <GuidedScope key="p" steps={POND_STEPS} mount={data.pond} initial={readyScope} label="Pond water" onDone={() => go('elodeaPrep')} />}
        {current === 'elodeaPrep' && <PrepRunner key="ep" def={ELODEA_PREP} onDone={(m) => keep({ elodea: m }, 'elodea')} />}
        {current === 'elodea' && data.elodea && <GuidedScope key="e" steps={ELODEA_STEPS} mount={data.elodea} initial={readyScope} label="Elodea" onDone={() => go('walls')} />}
        {current === 'walls' && <Cards eyebrow="Page 59" cards={P3_WALL_CARDS} finish="Next: the scanning electron microscope" onDone={() => go('semPrep')} />}
        {current === 'semPrep' && <PrepRunner key="sp" def={SEM_PREP} onDone={() => go('sem')} />}
        {current === 'sem' && <GuidedInstrument key="s" inst={SEM} steps={SEM_STEPS} label="SEM" onDone={() => go('temPrep')} />}
        {current === 'temPrep' && <ReplayPrep title="Preparing windpipe lining for the TEM" sample="the lining of the windpipe, sliced across just below the cilia tips" steps={TEM_PREP.steps} onDone={() => go('tem')} />}
        {current === 'tem' && <GuidedInstrument key="t" inst={TEM} steps={TEM_CILIA_STEPS} init={temCilia} label="TEM" onDone={() => go('sort')} />}
        {current === 'sort' && (
          <SortTask
            title="Compare and contrast the cell walls of prokaryotic and eukaryotic cells"
            intro="Sort each statement: is it true of plant cell walls, prokaryote cell walls, or both?"
            categories={['Plant', 'Prokaryote', 'Both']}
            rows={P3_SORT}
            doneLabel="Next: quick check"
            onDone={(first) => keep({ sortFirstTry: first }, 'check')}
          />
        )}
        {current === 'check' && <Quiz items={P3_CHECK} onDone={(got, total) => {
          const bonus = data.sortFirstTry ? 1 : 0
          progress.updatePhase('p3', { score: { got: got + bonus, total: total + 1 }, done: true }); go('done')
        }} />}
        {current === 'done' && (
          <div className="mx-auto grid max-w-2xl gap-4 p-4">
            <div className="card text-center">
              <Trophy size={44} className="mx-auto mb-2 text-[var(--color-accent)]" />
              <h1 className="mb-2 font-display text-4xl font-bold">Phase 3 complete</h1>
              {saved?.score && <p className="mb-2 text-xl font-bold">Score: {saved.score.got} / {saved.score.total}</p>}
              <p className="mb-5 text-lg leading-relaxed text-[var(--color-muted)]">You followed swimming cells, saw cilia from above and in cross-section, and compared plant and bacterial walls. Phase 4 looks at the nucleus.</p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="ghost" onClick={restart}><RotateCcw size={18} /> Do it again</Button>
                <Button variant="soft" onClick={() => go('practice')}><Microscope size={18} /> Free practice</Button>
                <a href="#/" className="btn btn-primary">Back to phases</a>
              </div>
            </div>
          </div>
        )}
        {current === 'practice' && saved?.done && (
          <FreePractice onBack={() => go('done')} slides={[
            { name: 'Pond water (living)', mount: data.pond ?? { specimen: 'pond', bubbles: [] } },
            { name: 'Elodea leaf', mount: data.elodea ?? { specimen: 'elodea', bubbles: [] } },
          ]} />
        )}
      </main>
    </div>
  )
}
