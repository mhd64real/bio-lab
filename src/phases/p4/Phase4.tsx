import { useState } from 'react'
import { RotateCcw, Trophy } from 'lucide-react'
import { TopBar, Button } from '../../ui/kit'
import { progress, useProgress } from '../../lib/storage'
import { Quiz } from '../../lab/Quiz'
import { Cards } from '../../lab/Cards'
import { ClozeTask } from '../../lab/ClozeTask'
import { GuidedInstrument } from '../../instruments/engine'
import { CONFOCAL } from '../../instruments/confocal/Confocal'
import { initialConfocal } from '../../instruments/confocal/model'
import { TEM } from '../../instruments/tem/Tem'
import { initialTem } from '../../instruments/tem/model'
import { CONFOCAL_PREP, TEM_PREP } from '../p2/preps'
import { ReplayPrep } from '../p3/preps'
import { SliceBench } from './SliceBench'
import { CONFOCAL_NUC_STEPS, TEM_NUC_STEPS } from './stations'
import { P4_CARDS, P4_CHECK, P4_CLOZE } from './content'

const SECTIONS = ['intro', 'confocalPrep', 'confocal', 'temPrep', 'tem', 'slice', 'cloze', 'check', 'done'] as const
type Section = (typeof SECTIONS)[number]
const NAMES: Record<Section, string> = {
  intro: 'The nucleus', confocalPrep: 'Living cells: stain', confocal: 'Confocal microscope', temPrep: 'TEM: prepare', tem: 'Transmission electron microscope',
  slice: 'Slice a nucleus', cloze: 'Get It?', check: 'Quick check', done: 'Finished',
}
const COUNTED = SECTIONS.indexOf('done')
const confocalNuclei = () => ({ ...initialConfocal(), specimen: 'nuclei' as const })
const temNucleus = () => ({ ...initialTem(), specimen: 'nucleus' as const })
const CONFOCAL_REPLAY = CONFOCAL_PREP.steps.filter((s) => s.id !== 'tubulin' && s.id !== 'actin')

export function Phase4() {
  const saved = useProgress().phases.p4
  const [section, setSection] = useState<Section>(() => {
    const s = saved?.section as Section | undefined
    return s && SECTIONS.includes(s) ? s : 'intro'
  })
  const data = (saved?.data ?? {}) as { sliceFirstTry?: boolean; clozeFirstTry?: boolean }
  const go = (s: Section) => { setSection(s); progress.updatePhase('p4', { section: s }); window.scrollTo(0, 0) }
  const keep = (patch: Partial<typeof data>, next: Section) => { progress.updatePhase('p4', { data: { ...(progress.get().phases.p4?.data ?? {}), ...patch } }); go(next) }
  const restart = () => { progress.resetPhase('p4'); go('intro') }
  const index = SECTIONS.indexOf(section)

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <TopBar
        title="Phase 4: The nucleus"
        sub={section === 'done' ? NAMES.done : `${NAMES[section]} (${index + 1} of ${COUNTED})`}
        right={section !== 'intro' && section !== 'done' ? (
          <button type="button" className="icon-btn" onClick={() => { if (confirm('Restart Phase 4 from the beginning?')) restart() }}>
            <RotateCcw size={18} /><span className="hidden md:inline">Restart</span>
          </button>
        ) : null}
      />
      <main className="min-h-0 flex-1">
        {section === 'intro' && <Cards eyebrow="Page 60" cards={P4_CARDS} finish="Start: living nuclei" onDone={() => go('confocalPrep')} />}
        {section === 'confocalPrep' && (
          <ReplayPrep
            title="Staining living cells for the confocal"
            note={<>You know this method from Phase 2, with two changes. These cells were engineered to make a <b>nuclear pore protein joined to a green fluorescent protein (GFP)</b>, so their pores already glow green. You only add one dye: <b>Hoechst</b>, for DNA.</>}
            steps={CONFOCAL_REPLAY}
            onDone={() => go('confocal')}
          />
        )}
        {section === 'confocal' && <GuidedInstrument key="c" inst={CONFOCAL} steps={CONFOCAL_NUC_STEPS} init={confocalNuclei} label="Confocal" onDone={() => go('temPrep')} />}
        {section === 'temPrep' && <ReplayPrep title="Preparing liver cells for the TEM" sample="a tiny piece of liver, sliced through the middle of its cells" steps={TEM_PREP.steps} onDone={() => go('tem')} />}
        {section === 'tem' && <GuidedInstrument key="t" inst={TEM} steps={TEM_NUC_STEPS} init={temNucleus} label="TEM" onDone={() => go('slice')} />}
        {section === 'slice' && <SliceBench onDone={(first) => keep({ sliceFirstTry: first }, 'cloze')} />}
        {section === 'cloze' && (
          <ClozeTask
            title="Describe the role of the nucleus"
            intro="Complete the description. Tap a blank, then tap a word. Some words are not needed."
            text={P4_CLOZE.text}
            extra={P4_CLOZE.extra}
            doneLabel="Next: quick check"
            onDone={(first) => keep({ clozeFirstTry: first }, 'check')}
          />
        )}
        {section === 'check' && <Quiz items={P4_CHECK} onDone={(got, total) => {
          const bonus = (data.sliceFirstTry ? 1 : 0) + (data.clozeFirstTry ? 1 : 0)
          progress.updatePhase('p4', { score: { got: got + bonus, total: total + 2 }, done: true }); go('done')
        }} />}
        {section === 'done' && (
          <div className="mx-auto grid max-w-2xl gap-4 p-4">
            <div className="card text-center">
              <Trophy size={44} className="mx-auto mb-2 text-[var(--color-accent)]" />
              <h1 className="mb-2 font-display text-4xl font-bold">Phase 4 complete</h1>
              {saved?.score && <p className="mb-2 text-xl font-bold">Score: {saved.score.got} / {saved.score.total}</p>}
              <p className="mb-5 text-lg leading-relaxed text-[var(--color-muted)]">You focused through living nuclei, found a nuclear pore at 44,000x and sliced a nucleus yourself. Phase 5 looks at how cells process energy.</p>
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
