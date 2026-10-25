import { CheckCircle2, Circle, Printer, Trophy } from 'lucide-react'
import { PHASES } from './Home'
import { progress, useProgress } from './lib/storage'

// The result card the student screenshots (or prints) for the teacher: name, class, date, every phase's score.
export function ResultCard() {
  const p = useProgress()
  const student = p.student ?? { name: '', group: '' }
  const rows = PHASES.map((ph) => ({ ...ph, st: p.phases[ph.id] }))
  const allDone = rows.every((r) => r.st?.done)
  // Each phase counts equally: the overall mark is the average of the phase percentages (unfinished phases count 0).
  const pctOf = (sc?: { got: number; total: number }) => (sc && sc.total ? Math.round((sc.got / sc.total) * 100) : 0)
  const pct = Math.round(rows.reduce((a, r) => a + (r.st?.done ? pctOf(r.st.score) : 0), 0) / rows.length)
  const finished = p.phases.p8?.data && (p.phases.p8.data as { finishedAt?: number }).finishedAt
  const date = new Date(finished ?? Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <div className="mx-auto grid max-w-2xl gap-3 p-4">
      <div className="card no-print grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 font-bold">Your full name
          <input className="rounded-xl border-2 border-[var(--color-line)] px-3 py-2 font-semibold" value={student.name} maxLength={60}
            onChange={(e) => progress.setStudent({ ...student, name: e.target.value })} placeholder="Type your name" />
        </label>
        <label className="grid gap-1 font-bold">Class
          <input className="rounded-xl border-2 border-[var(--color-line)] px-3 py-2 font-semibold" value={student.group} maxLength={20}
            onChange={(e) => progress.setStudent({ ...student, group: e.target.value })} placeholder="For example 9A" />
        </label>
      </div>

      <div className="card result-card overflow-hidden p-0">
        <div className="bg-[var(--color-primary)] px-5 py-4 text-white">
          <div className="text-sm font-extrabold uppercase tracking-wide opacity-90">Bio Lab result card</div>
          <div className="font-display text-2xl font-bold leading-tight">Lesson 4: Structures and Organelles</div>
          <div className="text-sm font-bold opacity-90">UAE Inspire Science Biology, Grade 9 Advanced, pages 55 to 66</div>
        </div>
        <div className="grid gap-1 border-b border-[var(--color-line)] px-5 py-3 sm:grid-cols-3">
          <div><div className="text-xs font-extrabold uppercase text-[var(--color-muted)]">Name</div><div className="text-lg font-extrabold">{student.name || '(type your name above)'}</div></div>
          <div><div className="text-xs font-extrabold uppercase text-[var(--color-muted)]">Class</div><div className="text-lg font-extrabold">{student.group || '-'}</div></div>
          <div><div className="text-xs font-extrabold uppercase text-[var(--color-muted)]">{finished ? 'Completed' : 'Date'}</div><div className="text-lg font-extrabold">{date}</div></div>
        </div>
        <table className="w-full text-left">
          <thead><tr className="text-xs font-extrabold uppercase text-[var(--color-muted)]"><th className="px-5 py-2">Phase</th><th className="py-2">Status</th><th className="py-2 text-right">Score</th><th className="px-5 py-2 text-right">%</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-[var(--color-line)]">
                <td className="px-5 py-2 font-bold">{r.n}. {r.title}</td>
                <td className="py-2">{r.st?.done
                  ? <span className="inline-flex items-center gap-1 font-extrabold text-[var(--color-ok)]"><CheckCircle2 size={16} /> Done</span>
                  : <span className="inline-flex items-center gap-1 font-bold text-[var(--color-faint)]"><Circle size={16} /> Not finished</span>}</td>
                <td className="py-2 text-right font-bold tabular-nums text-[var(--color-muted)]">{r.st?.score ? `${r.st.score.got} / ${r.st.score.total}` : '-'}</td>
                <td className="px-5 py-2 text-right font-extrabold tabular-nums">{r.st?.done ? `${pctOf(r.st.score)}%` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center gap-3 border-t-2 border-[var(--color-line)] bg-[var(--color-sunk)] px-5 py-4">
          <Trophy className="text-[var(--color-accent)]" size={32} />
          <div className="flex-1">
            <div className="text-xs font-extrabold uppercase text-[var(--color-muted)]">Overall (average of the 9 phases)</div>
            <div className="font-display text-3xl font-bold">{pct}%</div>
          </div>
          <div className={`rounded-full px-3 py-1 text-sm font-extrabold ${allDone ? 'bg-[var(--color-ok-soft)] text-[var(--color-ok)]' : 'bg-[var(--color-accent-soft)]'}`}>{allDone ? 'All 9 phases complete' : 'Not all phases finished'}</div>
        </div>
      </div>

      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold text-[var(--color-muted)]">Take a screenshot of the card and send it to your teacher.</p>
        <button type="button" className="icon-btn" onClick={() => window.print()}><Printer size={18} /> Print</button>
      </div>
    </div>
  )
}
