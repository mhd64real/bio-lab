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
import { ClozeTask } from '../../lab/ClozeTask'
import { FreePractice } from '../../lab/FreePractice'
import { GuidedInstrument } from '../../instruments/engine'
import { CONFOCAL } from '../../instruments/confocal/Confocal'
import { initialConfocal } from '../../instruments/confocal/model'
import { TEM } from '../../instruments/tem/Tem'
import { initialTem } from '../../instruments/tem/model'
import { TEM_PREP } from '../p2/preps'
import { ReplayPrep } from '../p3/preps'
import { LYSO_PREP, RED_ONION_PREP } from './preps'
import { CONFOCAL_LYSO_STEPS, RED_ONION_STEPS, TEM_LYSO_STEPS, TEM_VACUOLE_STEPS } from './stations'
import { P7_CARDS, P7_CHECK, P7_CLOZE } from './content'

const SECTIONS = ['intro', 'onionPrep', 'onion', 'temPrep', 'temLeaf', 'temLyso', 'confocalPrep', 'confocal', 'cloze', 'check', 'done', 'practice'] as const
type Section = (typeof SECTIONS)[number]
const NAMES: Record<Section, string> = {
  intro: 'Storage and cleanup', onionPrep: 'Red onion: prepare', onion: 'Red onion: observe', temPrep: 'TEM: prepare',
  temLeaf: 'TEM: a plant vacuole', temLyso: 'TEM: lysosomes', confocalPrep: 'Living cells: feed and stain', confocal: 'Confocal microscope',
  cloze: 'Get It?', check: 'Quick check', done: 'Finished', practice: 'Free practice',
}
const COUNTED = SECTIONS.indexOf('done')
const temLeaf = () => ({ ...initialTem(), specimen: 'leaf' as const })
const temMacro = () => ({ ...initialTem(), specimen: 'macrophage' as const })
const confocalLyso = () => ({ ...initialConfocal(), specimen: 'lyso' as const })

export function Phase7() {
  const saved = useProgress().phases.p7
  const [section, setSection] = useState<Section>(() => {
    const s = saved?.section as Section | undefined
    return s && SECTIONS.includes(s) ? s : 'intro'
  })
  const data = (saved?.data ?? {}) as { onion?: Mount; clozeFirstTry?: boolean }
  const go = (s: Section) => { setSection(s); progress.updatePhase('p7', { section: s }); window.scrollTo(0, 0) }
  const keep = (patch: Partial<typeof data>, next: Section) => { progress.updatePhase('p7', { data: { ...(progress.get().phases.p7?.data ?? {}), ...patch } }); go(next) }
  const restart = () => { progress.resetPhase('p7'); go('intro') }
  const current: Section = section === 'onion' && !data.onion ? 'onionPrep' : section
  const index = SECTIONS.indexOf(current)

  return (
    <div className="flex min-h-full flex-col lg:h-full">
      <TopBar
        title="Phase 7: Storage and cleanup"
        sub={current === 'done' || current === 'practice' ? NAMES[current] : `${NAMES[current]} (${index + 1} of ${COUNTED})`}
        right={current !== 'intro' && current !== 'done' && current !== 'practice' ? (
          <button type="button" className="icon-btn" onClick={() => { if (confirm('Restart Phase 7 from the beginning?')) restart() }}>
            <RotateCcw size={18} /><span className="hidden md:inline">Restart</span>
          </button>
        ) : null}
      />
      <main className="min-h-0 flex-1">
        {current === 'intro' && <Cards eyebrow="Pages 63 to 64" cards={P7_CARDS} finish="Start: red onion cells" onDone={() => go('onionPrep')} />}
        {current === 'onionPrep' && <PrepRunner key="op" def={RED_ONION_PREP} onDone={(m) => keep({ onion: { ...m, variant: 0 } }, 'onion')} />}
        {current === 'onion' && data.onion && <GuidedScope key="o" steps={RED_ONION_STEPS} mount={data.onion} initial={readyScope} label="Red onion" onDone={() => go('temPrep')} />}
        {current === 'temPrep' && (
          <ReplayPrep
            title="Preparing two grids for the TEM"
            note={<>You know this method from Phase 2. This time you make <b>two grids</b>: a tiny piece of <b>leaf</b>, to see a plant vacuole, and a pellet of <b>white blood cells</b>, to look for lysosomes.</>}
            steps={TEM_PREP.steps}
            onDone={() => go('temLeaf')}
          />
        )}
        {current === 'temLeaf' && <GuidedInstrument key="tl" inst={TEM} steps={TEM_VACUOLE_STEPS} init={temLeaf} label="TEM: leaf" onDone={() => go('temLyso')} />}
        {current === 'temLyso' && <GuidedInstrument key="tm" inst={TEM} steps={TEM_LYSO_STEPS} init={temMacro} label="TEM: white blood cell" onDone={() => go('confocalPrep')} />}
        {current === 'confocalPrep' && <PrepRunner key="lp" def={LYSO_PREP} onDone={() => go('confocal')} />}
        {current === 'confocal' && <GuidedInstrument key="c" inst={CONFOCAL} steps={CONFOCAL_LYSO_STEPS} init={confocalLyso} label="Confocal" onDone={() => go('cloze')} />}
        {current === 'cloze' && (
          <ClozeTask
            title="Get It? Explain the role of lysosomes in cells"
            intro="Complete the explanation. Tap a blank, then tap a word. Some words are not needed."
            text={P7_CLOZE.text}
            extra={P7_CLOZE.extra}
            doneLabel="Next: quick check"
            onDone={(first) => keep({ clozeFirstTry: first }, 'check')}
          />
        )}
        {current === 'check' && <Quiz items={P7_CHECK} onDone={(got, total) => {
          const bonus = data.clozeFirstTry ? 1 : 0
          progress.updatePhase('p7', { score: { got: got + bonus, total: total + 1 }, done: true }); go('done')
        }} />}
        {current === 'done' && (
          <div className="mx-auto grid max-w-2xl gap-4 p-4">
            <div className="card text-center">
              <Trophy size={44} className="mx-auto mb-2 text-[var(--color-accent)]" />
              <h1 className="mb-2 font-display text-4xl font-bold">Phase 7 complete</h1>
              {saved?.score && <p className="mb-2 text-xl font-bold">Score: {saved.score.got} / {saved.score.total}</p>}
              <p className="mb-5 text-lg leading-relaxed text-[var(--color-muted)]">You shrank the purple vacuoles of red onion cells with salt water, found a plant vacuole and a cell’s lysosomes with electrons, and watched lysosomes digest bacteria in a living white blood cell. Phase 8 puts all the organelles together.</p>
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
            { name: 'Red onion in water', mount: { ...(data.onion ?? { specimen: 'redonion', bubbles: [] }), variant: 0 } },
          ]} />
        )}
      </main>
    </div>
  )
}
