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
import { initialConfocal } from '../../instruments/confocal/model'
import { TEM } from '../../instruments/tem/Tem'
import { initialTem } from '../../instruments/tem/model'
import { TEM_PREP } from '../p2/preps'
import { ReplayPrep } from '../p3/preps'
import { TRANSFECT_PREP } from './preps'
import { ShipBench } from './ShipBench'
import { CONFOCAL_TRAFFIC_STEPS, TEM_LIVER_STEPS } from './stations'
import { P6_CARDS, P6_CATEGORIES, P6_CHECK, P6_SORT } from './content'

const SECTIONS = ['intro', 'temPrep', 'tem', 'confocalPrep', 'confocal', 'ship', 'sort', 'check', 'done'] as const
type Section = (typeof SECTIONS)[number]
const NAMES: Record<Section, string> = {
  intro: 'Manufacturing proteins', temPrep: 'TEM: prepare', tem: 'Transmission electron microscope', confocalPrep: 'Living cells: new genes',
  confocal: 'Confocal microscope', ship: 'Ship a protein', sort: 'Get It?', check: 'Quick check', done: 'Finished',
}
const COUNTED = SECTIONS.indexOf('done')
const temLiver = () => ({ ...initialTem(), specimen: 'liver' as const })
const confocalTraffic = () => ({ ...initialConfocal(), specimen: 'traffic' as const })

export function Phase6() {
  const saved = useProgress().phases.p6
  const [section, setSection] = useState<Section>(() => {
    const s = saved?.section as Section | undefined
    return s && SECTIONS.includes(s) ? s : 'intro'
  })
  const data = (saved?.data ?? {}) as { shipFirstTry?: boolean; sortFirstTry?: boolean }
  const go = (s: Section) => { setSection(s); progress.updatePhase('p6', { section: s }); window.scrollTo(0, 0) }
  const keep = (patch: Partial<typeof data>, next: Section) => { progress.updatePhase('p6', { data: { ...(progress.get().phases.p6?.data ?? {}), ...patch } }); go(next) }
  const restart = () => { progress.resetPhase('p6'); go('intro') }
  const index = SECTIONS.indexOf(section)

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <TopBar
        title="Phase 6: Manufacturing proteins"
        sub={section === 'done' ? NAMES.done : `${NAMES[section]} (${index + 1} of ${COUNTED})`}
        right={section !== 'intro' ? (
          <button type="button" className="icon-btn" onClick={() => { if (confirm('Restart Phase 6 from the beginning?')) restart() }}>
            <RotateCcw size={18} /><span className="hidden md:inline">Restart</span>
          </button>
        ) : null}
      />
      <main className="min-h-0 flex-1">
        {section === 'intro' && <Cards eyebrow="Pages 62 to 63" cards={P6_CARDS} finish="Start: a liver cell in the TEM" onDone={() => go('temPrep')} />}
        {section === 'temPrep' && <ReplayPrep title="Preparing liver for the TEM" sample="a tiny piece of liver" steps={TEM_PREP.steps} onDone={() => go('tem')} />}
        {section === 'tem' && <GuidedInstrument key="tm" inst={TEM} steps={TEM_LIVER_STEPS} init={temLiver} label="TEM" onDone={() => go('confocalPrep')} />}
        {section === 'confocalPrep' && <PrepRunner key="tf" def={TRANSFECT_PREP} onDone={() => go('confocal')} />}
        {section === 'confocal' && <GuidedInstrument key="c" inst={CONFOCAL} steps={CONFOCAL_TRAFFIC_STEPS} init={confocalTraffic} label="Confocal" onDone={() => go('ship')} />}
        {section === 'ship' && <ShipBench onDone={(first) => keep({ shipFirstTry: first }, 'sort')} />}
        {section === 'sort' && (
          <SortTask
            title="Ribosomes, ER and Golgi"
            intro="Sort each statement into the structure it describes."
            categories={P6_CATEGORIES}
            rows={P6_SORT}
            doneLabel="Next: quick check"
            onDone={(first) => keep({ sortFirstTry: first }, 'check')}
          />
        )}
        {section === 'check' && <Quiz items={P6_CHECK} onDone={(got, total) => {
          const bonus = (data.shipFirstTry ? 1 : 0) + (data.sortFirstTry ? 1 : 0)
          progress.updatePhase('p6', { score: { got: got + bonus, total: total + 2 }, done: true }); go('done')
        }} />}
        {section === 'done' && (
          <div className="mx-auto grid max-w-2xl gap-4 p-4">
            <div className="card text-center">
              <Trophy size={44} className="mx-auto mb-2 text-[var(--color-accent)]" />
              <h1 className="mb-2 font-display text-4xl font-bold">Phase 6 complete</h1>
              {saved?.score && <p className="mb-2 text-xl font-bold">Score: {saved.score.got} / {saved.score.total}</p>}
              <p className="mb-5 text-lg leading-relaxed text-[var(--color-muted)]">You found ribosomes on the rough ER, the smooth ER and the Golgi in a liver cell, then watched a protein travel from the ER through the Golgi to the cell membrane in a living cell. Phase 7 looks at storage and cleanup: vacuoles and lysosomes.</p>
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
