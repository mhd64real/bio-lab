// Small instrument sounds, synthesised so there are no audio files. Muted unless the student turns sound on.
import { progress } from './storage'

export type Sound = 'click' | 'switch' | 'clip' | 'crack' | 'drop' | 'ok' | 'tick' | 'slide'

let ctx: AudioContext | null = null
let lastTick = 0

function audio() {
  if (!ctx) {
    try { ctx = new AudioContext() } catch { return null }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(a: AudioContext, freq: number, dur: number, type: OscillatorType, gain: number, when = 0, slide?: number) {
  const t = a.currentTime + when
  const o = a.createOscillator()
  const g = a.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur)
  g.gain.setValueAtTime(gain, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(a.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}

function noise(a: AudioContext, dur: number, gain: number, freq: number, when = 0) {
  const t = a.currentTime + when
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3)
  const src = a.createBufferSource()
  src.buffer = buf
  const f = a.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = freq
  const g = a.createGain()
  g.gain.value = gain
  src.connect(f).connect(g).connect(a.destination)
  src.start(t)
}

export function play(s: Sound) {
  if (!progress.get().sound) return
  const a = audio()
  if (!a) return
  switch (s) {
    case 'click': noise(a, 0.05, 0.5, 2400); tone(a, 1800, 0.04, 'square', 0.03); break
    case 'switch': noise(a, 0.04, 0.6, 1500); tone(a, 120, 0.25, 'sine', 0.04, 0.02); break
    case 'clip': noise(a, 0.06, 0.5, 3200); tone(a, 2600, 0.05, 'triangle', 0.05); break
    case 'crack': noise(a, 0.35, 0.9, 4200); noise(a, 0.2, 0.6, 2000, 0.05); tone(a, 3800, 0.08, 'square', 0.03, 0.02); break
    case 'drop': tone(a, 900, 0.12, 'sine', 0.12, 0, 300); break
    case 'slide': noise(a, 0.12, 0.25, 900); break
    case 'ok': tone(a, 660, 0.12, 'sine', 0.08); tone(a, 990, 0.18, 'sine', 0.07, 0.09); break
    case 'tick': {
      const now = performance.now()
      if (now - lastTick < 70) return
      lastTick = now
      noise(a, 0.02, 0.18, 3000)
      break
    }
  }
}

// Browsers only allow audio after a user gesture; call this from the sound toggle.
export function unlockAudio() { audio() }
