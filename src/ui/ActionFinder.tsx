import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowUp } from 'lucide-react'

// Finds the student's next action when it is off screen. Every guided action in the lab is marked the same
// way: highlighted controls and objects (.attention, prep tap targets .hot-on, photo hotspots .hotspot-lit,
// SVG targets .attention-svg) and the forward button of a screen (an enabled primary button). If none of
// them can be seen for a moment, a small "Next action" button appears at the edge of the screen; it never
// scrolls by itself, so the student keeps time to read the step. Tapping it scrolls to the target and flashes it.
const HIGHLIGHTS = '.attention, .hot-on, .hotspot-lit, .attention-svg'
const FORWARD = 'button.btn-primary:not(:disabled), a.btn-primary'
const WAIT_MS = 1500

// How much of an element can actually be seen: inside the window and inside every scrolling box around it.
function visibleArea(el: Element) {
  let r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return { area: 0, total: 0, rect: r }
  const total = r.width * r.height
  let top = Math.max(r.top, 0), left = Math.max(r.left, 0)
  let bottom = Math.min(r.bottom, window.innerHeight), right = Math.min(r.right, window.innerWidth)
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const cs = getComputedStyle(p)
    if (cs.overflowX === 'visible' && cs.overflowY === 'visible') continue
    const pr = p.getBoundingClientRect()
    top = Math.max(top, pr.top); left = Math.max(left, pr.left)
    bottom = Math.min(bottom, pr.bottom); right = Math.min(right, pr.right)
  }
  const area = Math.max(0, bottom - top) * Math.max(0, right - left)
  r = el.getBoundingClientRect()
  return { area, total, rect: r }
}
// Seen well enough to notice: a good part of it, or at least a thumb-sized piece.
const seen = (el: Element) => { const v = visibleArea(el); return v.total > 0 && (v.area >= v.total * 0.35 || v.area >= 900) }
const rendered = (el: Element) => { const r = el.getBoundingClientRect(); return r.width > 0 || r.height > 0 }

export function ActionFinder() {
  const [target, setTarget] = useState<{ el: Element; dir: 'up' | 'down' } | null>(null)
  const hiddenSince = useRef<number | null>(null)
  const lastEl = useRef<Element | null>(null)
  useEffect(() => {
    const id = window.setInterval(() => {
      // Pages where the student chooses freely (the home page) opt out.
      if (document.querySelector('[data-no-finder]')) { hiddenSince.current = null; setTarget(null); return }
      const marks = [...document.querySelectorAll(HIGHLIGHTS)].filter(rendered)
      const forward = [...document.querySelectorAll(FORWARD)].filter(rendered)
      const all = [...marks, ...forward]
      // Nothing to point at, or something to do is already in view: no button.
      if (!all.length || all.some(seen)) { hiddenSince.current = null; setTarget(null); return }
      const el = marks[0] ?? forward[0]
      if (el !== lastEl.current) { lastEl.current = el; hiddenSince.current = performance.now() }
      hiddenSince.current ??= performance.now()
      if (performance.now() - hiddenSince.current < WAIT_MS) { setTarget(null); return }
      const r = el.getBoundingClientRect()
      const dir = r.top < window.innerHeight / 2 ? 'up' : 'down'
      setTarget((t) => (t && t.el === el && t.dir === dir ? t : { el, dir }))
    }, 300)
    return () => clearInterval(id)
  }, [])
  if (!target) return null
  const go = () => {
    const el = target.el
    el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    el.classList.add('cta-flash')
    window.setTimeout(() => el.classList.remove('cta-flash'), 1600)
    setTarget(null)
  }
  const Arrow = target.dir === 'up' ? ArrowUp : ArrowDown
  return (
    <button type="button" onClick={go} className={`action-finder ${target.dir === 'up' ? 'action-finder-up' : ''}`}>
      <Arrow size={18} /> Next action
    </button>
  )
}
