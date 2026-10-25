import { CheckCircle2, Lock, Microscope } from 'lucide-react'
import { SoundToggle } from './ui/kit'
import { devUnlocked, useProgress } from './lib/storage'

export const PHASES = [
  { id: 'p0', n: 0, title: 'Lab orientation', pages: 'Before the lesson', blurb: 'Learn the microscope, prepare a slide, meet the other instruments.', ready: true },
  { id: 'p1', n: 1, title: 'Cell structures', pages: 'Pages 55 to 56', blurb: 'Plant, animal and prokaryotic cells side by side.', ready: true },
  { id: 'p2', n: 2, title: 'Cytoskeleton and centrioles', pages: 'Pages 57 to 58', blurb: 'The framework inside the cell, live under fluorescence.', ready: true },
  { id: 'p3', n: 3, title: 'Appendages and cell walls', pages: 'Pages 58 to 59', blurb: 'Beating cilia, whipping flagella and rigid walls.', ready: true },
  { id: 'p4', n: 4, title: 'The nucleus', pages: 'Page 60', blurb: 'The control centre: living nuclei, a 3D slice, and its envelope seen with electrons.', ready: true },
  { id: 'p5', n: 5, title: 'Processing energy', pages: 'Page 61', blurb: 'Chloroplasts, coloured and starchy plastids, and living mitochondria.', ready: true },
  { id: 'p6', n: 6, title: 'Manufacturing proteins', pages: 'Pages 62 to 63', blurb: 'Ribosomes, ER and Golgi in a liver cell, and a protein shipped live.', ready: true },
  { id: 'p7', n: 7, title: 'Storage and cleanup', pages: 'Pages 63 to 64', blurb: 'Shrinking purple vacuoles, and lysosomes digesting bacteria live.', ready: true },
  { id: 'p8', n: 8, title: 'Organelles at work', pages: 'Pages 64 to 66', blurb: 'Table 1, the cell factory, Check Your Progress, and your result card.', ready: true },
]

export function Home() {
  const { phases } = useProgress()
  return (
    <div className="min-h-full" data-no-finder>
      <header className="topbar">
        <Microscope className="text-[var(--color-primary)]" />
        <div className="flex-1">
          <div className="font-display text-xl font-bold leading-tight">Bio Lab</div>
          <div className="text-sm text-[var(--color-muted)]">Lesson 4: Structures and Organelles</div>
        </div>
        {devUnlocked() && <a href="#/dev/lock" className="icon-btn" title="Dev server only">Tester mode on</a>}
        <SoundToggle />
      </header>
      <main className="mx-auto max-w-5xl p-4">
        <section className="mb-5 mt-2">
          <span className="eyebrow">Grade 9 Advanced Biology</span>
          <h1 className="mt-1 font-display text-4xl font-bold leading-tight">A virtual lab for the whole lesson</h1>
          <p className="mt-2 max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]">
            What are the structures and their functions in prokaryotic and eukaryotic cells? Find out with real lab instruments, one phase at a time.
          </p>
        </section>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PHASES.map((p, i) => {
            const st = phases[p.id]
            // Phases open in order: each one needs the previous phase finished.
            const open = p.ready && (i === 0 || devUnlocked() || !!phases[PHASES[i - 1].id]?.done)
            const done = st?.done
            const inner = (
              <>
                <div className="mb-2 flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-primary-soft)] font-display text-lg font-bold text-[var(--color-primary-strong)]">{p.n}</span>
                  {done ? <CheckCircle2 className="text-[var(--color-ok)]" /> : !open ? <Lock size={18} className="text-[var(--color-faint)]" /> : null}
                </div>
                <div className="font-display text-xl font-bold leading-tight">{p.title}</div>
                <div className="mb-1 text-sm font-bold text-[var(--color-primary)]">{p.pages}</div>
                <p className="leading-snug text-[var(--color-muted)]">{p.blurb}</p>
                {done && st?.score && <p className="mt-2 text-sm font-extrabold">Score {st.score.got} / {st.score.total}</p>}
                {!p.ready && <p className="mt-2 text-sm font-bold text-[var(--color-faint)]">Coming soon</p>}
                {p.ready && !open && <p className="mt-2 text-sm font-bold text-[var(--color-faint)]">Finish Phase {p.n - 1} first</p>}
                {open && !done && st?.section && st.section !== 'welcome' && <p className="mt-2 text-sm font-extrabold text-[var(--color-accent)]">In progress</p>}
              </>
            )
            return (
              <li key={p.id}>
                {open ? (
                  <a href={`#/${p.id}`} className="card block h-full text-inherit no-underline hover:border-[var(--color-primary)]">{inner}</a>
                ) : (
                  <div className="card h-full opacity-70">{inner}</div>
                )}
              </li>
            )
          })}
        </ol>
        {Object.values(phases).some((ph) => ph?.done) && (
          <a href="#/result" className="card mt-4 flex items-center justify-between text-inherit no-underline hover:border-[var(--color-primary)]">
            <span><span className="block font-display text-xl font-bold">Your result card</span><span className="text-[var(--color-muted)]">Scores for every phase, ready to screenshot for your teacher.</span></span>
            <span className="btn btn-primary">Open</span>
          </a>
        )}
      </main>
    </div>
  )
}
