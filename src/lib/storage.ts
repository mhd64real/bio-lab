// Progress lives in this browser only. Every access is guarded: storage can be blocked or empty.
import { useSyncExternalStore } from 'react'

const KEY = 'bio-lab:v1'

export interface PhaseProgress {
  section?: string
  step?: number
  done?: boolean
  score?: { got: number; total: number }
  data?: Record<string, unknown>
}

export interface Progress {
  sound: boolean
  phases: Record<string, PhaseProgress>
  // Typed by the student on the result card, kept in this browser only.
  student?: { name: string; group: string }
}

const fresh = (): Progress => ({ sound: false, phases: {} })

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh()
    const p = JSON.parse(raw) as Progress
    return { ...fresh(), ...p, phases: p.phases ?? {} }
  } catch {
    return fresh()
  }
}

let current = load()
const listeners = new Set<() => void>()

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(current)) } catch { /* storage unavailable: keep in memory */ }
  listeners.forEach((l) => l())
}

export const progress = {
  get: () => current,
  setSound(on: boolean) { current = { ...current, sound: on }; save() },
  updatePhase(id: string, patch: Partial<PhaseProgress>) {
    current = { ...current, phases: { ...current.phases, [id]: { ...current.phases[id], ...patch } } }
    save()
  },
  setStudent(student: { name: string; group: string }) { current = { ...current, student }; save() },
  resetPhase(id: string) {
    const phases = { ...current.phases }
    delete phases[id]
    current = { ...current, phases }
    save()
  },
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
}

export function useProgress() {
  return useSyncExternalStore(progress.subscribe, progress.get, progress.get)
}

// Dev server only: open every built phase without finishing the ones before it.
// Turn on with #/dev/unlock, off with #/dev/lock. Never active in the public build.
const DEV_KEY = 'bio-lab:dev-unlock'
export function devUnlocked() {
  if (!import.meta.env.DEV) return false
  try { return localStorage.getItem(DEV_KEY) === '1' } catch { return false }
}
export function setDevUnlocked(on: boolean) {
  try { if (on) localStorage.setItem(DEV_KEY, '1'); else localStorage.removeItem(DEV_KEY) } catch { /* ignore */ }
}
