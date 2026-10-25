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
import { CONFOCAL } from '../../instruments/confocal/Confocal'
import { initialConfocal } from '../../instruments/confocal/model'
import { TEM } from '../../instruments/tem/Tem'
import { initialTem } from '../../instruments/tem/model'
import { CONFOCAL_PREP, TEM_PREP } from '../p2/preps'
import { ELODEA_PREP, ReplayPrep } from '../p3/preps'
import { PEPPER_PREP, POTATO_PREP } from './preps'
import { CONFOCAL_MITO_STEPS, ELODEA_100_STEPS, PEPPER_STEPS, POTATO_STEPS, TEM_LEAF_STEPS } from './stations'
import { P5_CARDS, P5_CHECK, P5_SORT } from './content'

const SECTIONS = ['intro', 'elodeaPrep', 'elodea', 'pepperPrep', 'pepper', 'potatoPrep', 'potato', 'confocalPrep', 'confocal', 'temPrep', 'tem', 'sort', 'check', 'done', 'practice'] as const
type Section = (typeof SECTIONS)[number]
const NAMES: Record<Section, string> = {
  intro: 'Processing energy', elodeaPrep: 'Elodea: prepare', elodea: 'Elodea at 1,000x', pepperPrep: 'Red pepper: prepare', pepper: 'Red pepper: observe',
  potatoPrep: 'Potato: prepare', potato: 'Potato: observe', confocalPrep: 'Living cells: stain', confocal: 'Confocal microscope',
  temPrep: 'TEM: prepare', tem: 'Transmission electron microscope', sort: 'Get It?', check: 'Quick check', done: 'Finished', practice: 'Free practice',
}
const COUNTED = SECTIONS.indexOf('done')
const ELODEA_MOUNT: Mount = { specimen: 'elodea', bubbles: [] }
const confocalMito = () => ({ ...initialConfocal(), specimen: 'mito' as const })
const temLeaf = () => ({ ...initialTem(), specimen: 'leaf' as const })
const CONFOCAL_REPLAY = CONFOCAL_PREP.steps.filter((s) => s.id !== 'tubulin' && s.id !== 'actin')

export function Phase5() {
  const saved = useProgress().phases.p5
  const [section, setSection] = useState<Section>(() => {
    const s = saved?.section as Section | undefined
    return s && SECTIONS.includes(s) ? s : 'intro'
  })
  const data = (saved?.data ?? {}) as { pepper?: Mount; potato?: Mount; sortFirstTry?: boolean }
  const go = (s: Section) => { setSection(s); progress.updatePhase('p5', { section: s }); window.scrollTo(0, 0) }
  const keep = (patch: Partial<typeof data>, next: Section) => { progress.updatePhase('p5', { data: { ...(progress.get().phases.p5?.data ?? {}), ...patch } }); go(next) }
  const restart = () => { progress.resetPhase('p5'); go('intro') }
  const current: Section = section === 'pepper' && !data.pepper ? 'pepperPrep' : section === 'potato' && !data.potato ? 'potatoPrep' : section
  const index = SECTIONS.indexOf(current)

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <TopBar
        title="Phase 5: Processing energy"
        sub={current === 'done' || current === 'practice' ? NAMES[current] : `${NAMES[current]} (${index + 1} of ${COUNTED})`}
        right={current !== 'intro' && current !== 'done' && current !== 'practice' ? (
          <button type="button" className="icon-btn" onClick={() => { if (confirm('Restart Phase 5 from the beginning?')) restart() }}>
            <RotateCcw size={18} /><span className="hidden md:inline">Restart</span>
          </button>
        ) : null}
      />
      <main className="min-h-0 flex-1">
        {current === 'intro' && <Cards eyebrow="Page 61" cards={P5_CARDS} finish="Start: Elodea chloroplasts" onDone={() => go('elodeaPrep')} />}
        {current === 'elodeaPrep' && (
          <ReplayPrep title="An Elodea leaf wet mount" note={<>You made this slide in Phase 3. This time you will go all the way to <b>1,000x</b> with the oil immersion lens to look at the chloroplasts.</>} steps={ELODEA_PREP.steps} onDone={() => go('elodea')} />
        )}
        {current === 'elodea' && <GuidedScope key="e" steps={ELODEA_100_STEPS} mount={ELODEA_MOUNT} initial={readyScope} label="Elodea" onDone={() => go('pepperPrep')} />}
        {current === 'pepperPrep' && <PrepRunner key="pp" def={PEPPER_PREP} onDone={(m) => keep({ pepper: m }, 'pepper')} />}
        {current === 'pepper' && data.pepper && <GuidedScope key="p" steps={PEPPER_STEPS} mount={data.pepper} initial={readyScope} label="Red pepper" onDone={() => go('potatoPrep')} />}
        {current === 'potatoPrep' && <PrepRunner key="tp" def={POTATO_PREP} onDone={(m) => keep({ potato: m }, 'potato')} />}
        {current === 'potato' && data.potato && <GuidedScope key="t" steps={POTATO_STEPS} mount={data.potato} initial={readyScope} label="Potato" onDone={() => go('confocalPrep')} />}
        {current === 'confocalPrep' && (
          <ReplayPrep
            title="Staining living cells for the confocal"
            note={<>You know this method from Phase 2. This time the two dyes are <b>Hoechst</b> (DNA) and <b>MitoTracker Green</b>, which collects inside working mitochondria.</>}
            steps={CONFOCAL_REPLAY.map((s) => (s.id === 'hoechst' ? { ...s, title: 'Dyes: Hoechst and MitoTracker Green' } : s))}
            onDone={() => go('confocal')}
          />
        )}
        {current === 'confocal' && <GuidedInstrument key="c" inst={CONFOCAL} steps={CONFOCAL_MITO_STEPS} init={confocalMito} label="Confocal" onDone={() => go('temPrep')} />}
        {current === 'temPrep' && <ReplayPrep title="Preparing a leaf for the TEM" sample="a tiny piece of a green leaf" steps={TEM_PREP.steps} onDone={() => go('tem')} />}
        {current === 'tem' && <GuidedInstrument key="tm" inst={TEM} steps={TEM_LEAF_STEPS} init={temLeaf} label="TEM" onDone={() => go('sort')} />}
        {current === 'sort' && (
          <SortTask
            title="Compare mitochondria and chloroplasts"
            intro="Sort each statement: is it true of mitochondria, chloroplasts, or both?"
            categories={['Mitochondrion', 'Chloroplast', 'Both']}
            rows={P5_SORT}
            doneLabel="Next: quick check"
            onDone={(first) => keep({ sortFirstTry: first }, 'check')}
          />
        )}
        {current === 'check' && <Quiz items={P5_CHECK} onDone={(got, total) => {
          const bonus = data.sortFirstTry ? 1 : 0
          progress.updatePhase('p5', { score: { got: got + bonus, total: total + 1 }, done: true }); go('done')
        }} />}
        {current === 'done' && (
          <div className="mx-auto grid max-w-2xl gap-4 p-4">
            <div className="card text-center">
              <Trophy size={44} className="mx-auto mb-2 text-[var(--color-accent)]" />
              <h1 className="mb-2 font-display text-4xl font-bold">Phase 5 complete</h1>
              {saved?.score && <p className="mb-2 text-xl font-bold">Score: {saved.score.got} / {saved.score.total}</p>}
              <p className="mb-5 text-lg leading-relaxed text-[var(--color-muted)]">You saw three kinds of plastids, watched living mitochondria divide, and found a chloroplast and a mitochondrion side by side. Phase 6 follows how cells make and ship proteins.</p>
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
            { name: 'Elodea leaf', mount: ELODEA_MOUNT },
            { name: 'Red pepper skin', mount: data.pepper ?? { specimen: 'pepper', bubbles: [] } },
            { name: 'Potato with iodine', mount: data.potato ?? { specimen: 'potato', bubbles: [] } },
          ]} />
        )}
      </main>
    </div>
  )
}
