import { useEffect, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ChevronUp, DoorOpen, Minus, Plus, Wind, Zap } from 'lucide-react'
import { ShaderView } from '../ShaderView'
import type { CtlProps, Instrument } from '../engine'
import { Group, HoldButton, Slider, ramp } from '../../scope/Controls'
import { SEM_POST, SEM_SPECIMEN } from './shaders'
import { describeSem, initialSem, SEM_MAGS, semBlur, semFov, semReducer, semTick, type SemAction, type SemState } from './model'

const SLOW_FRAME = 4 // seconds per slow-scan frame

function SemView({ state: s }: { state: SemState }) {
  const on = s.chamber === 'vacuum' && s.stub && s.beam
  const [scanY, setScanY] = useState(-1)
  useEffect(() => {
    if (!on || s.scan !== 'slow') { setScanY(-1); return }
    let raf = 0
    const loop = () => { setScanY(Math.min(1, (performance.now() / 1000 - s.scanStarted) / SLOW_FRAME) % 1.0001); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [on, s.scan, s.scanStarted])
  const fov = semFov(s)
  const bar = [1, 2, 5, 10, 20, 50, 100, 200].find((n) => n > fov * 0.18) ?? 200
  return (
    <div className="relative h-full">
      <ShaderView
        label="Scanning electron microscope image"
        specimen={SEM_SPECIMEN}
        post={SEM_POST}
        animate={on}
        uniforms={{
          uFov: fov,
          uStage: [s.x, s.y],
          uOn: on,
          uBlurPx: (semBlur(s) / fov) * 700,
          uBright: s.brightness,
          uContrast: s.contrast,
          uPhotons: s.scan === 'slow' ? 220 : 14,
          uHighKv: s.kv === 20,
          uScanY: scanY >= 1 ? -1 : scanY,
        }}
      />
      {on && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-start gap-1" style={{ width: 'min(70%, 520px)' }}>
          <div className="h-1.5 rounded-full bg-white shadow" style={{ width: `${(bar / fov) * 100}%` }} />
          <span className="rounded bg-black/50 px-1.5 text-sm font-extrabold text-white">{bar} um</span>
        </div>
      )}
    </div>
  )
}

function SemControls({ state: s, act, can, hl }: CtlProps<SemState, SemAction>) {
  const f = semFov(s)
  const focus = (dir: number) => (dt: number, held: number) => act({ type: 'focus', dz: dir * (40 + 900 * ramp(held, 2)) * dt })
  const move = (dx: number, dy: number) => (dt: number, held: number) => { const v = f * (0.25 + ramp(held, 1.5)) * dt; act({ type: 'stage', dx: dx * v, dy: dy * v }) }
  const status = { vacuum: 'Chamber at high vacuum', venting: `Letting air in ${Math.round(s.progress * 100)}%`, vented: s.door ? 'Chamber open' : 'Chamber at air pressure, door closed', pumping: `Pumping ${Math.round(s.progress * 100)}%` }[s.chamber]
  return (
    <div className="ctl-pad">
      <Group title="Chamber" attention={hl('vent', 'door', 'stub', 'pump')} locked={!['vent', 'door', 'stub', 'pump'].some(can)}>
        <p className="mb-2 text-sm font-extrabold text-[var(--color-muted)]">{status}{s.stub ? ', stub on the stage' : ''}</p>
        {(s.chamber === 'venting' || s.chamber === 'pumping') && <div className="mb-2 h-2 overflow-hidden rounded-full bg-[var(--color-sunk)]"><div className="h-full bg-[var(--color-primary)]" style={{ width: `${s.progress * 100}%` }} /></div>}
        <div className="grid grid-cols-2 gap-1.5">
          <button type="button" disabled={!can('vent') || s.chamber !== 'vacuum'} className="ctl-btn justify-center" onClick={() => act({ type: 'vent' })}><Wind size={18} /> Vent</button>
          <button type="button" disabled={!can('door') || s.chamber !== 'vented'} className="ctl-btn justify-center" onClick={() => act({ type: 'door' })}><DoorOpen size={18} /> {s.door ? 'Close door' : 'Open door'}</button>
          <button type="button" disabled={!can('stub') || !s.door} className="ctl-btn justify-center" onClick={() => act({ type: 'stub' })}>{s.stub ? 'Remove stub' : 'Mount stub'}</button>
          <button type="button" disabled={!can('pump') || s.chamber !== 'vented' || s.door} className="ctl-btn justify-center" onClick={() => act({ type: 'pump' })}>Pump</button>
        </div>
      </Group>

      <Group title="Beam" attention={hl('kv', 'beam')} locked={!can('kv') && !can('beam')}>
        <div className="grid grid-cols-2 gap-2">
          {([5, 20] as const).map((k) => (
            <button key={k} type="button" disabled={!can('kv')} onClick={() => act({ type: 'kv', to: k })} className={`ctl-obj ${s.kv === k ? 'ctl-obj-on' : ''}`} style={{ ['--ring' as string]: 'var(--color-primary)' }}>{k} kV</button>
          ))}
        </div>
        <button type="button" disabled={!can('beam') || s.chamber !== 'vacuum'} className={`ctl-btn mt-2 w-full justify-center ${s.beam ? 'ctl-on' : ''}`} onClick={() => act({ type: 'beam' })}><Zap size={18} /> {s.beam ? 'Beam on' : 'Beam off'}</button>
      </Group>

      <Group title="Scan" attention={hl('scan', 'mag', 'focus')} locked={!can('scan') && !can('mag') && !can('focus')}>
        <div className="grid grid-cols-2 gap-2">
          {(['fast', 'slow'] as const).map((m) => (
            <button key={m} type="button" disabled={!can('scan')} onClick={() => act({ type: 'scan', to: m, now: performance.now() / 1000 })} className={`ctl-obj ${s.scan === m ? 'ctl-obj-on' : ''}`} style={{ ['--ring' as string]: 'var(--color-primary)' }}>{m === 'fast' ? 'Fast scan' : 'Slow scan'}</button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button type="button" aria-label="Lower magnification" disabled={!can('mag') || s.mag === 0} className="ctl-btn justify-center px-3" onClick={() => act({ type: 'mag', to: s.mag - 1 })}><Minus size={18} /></button>
          <span className="flex-1 text-center font-display text-xl font-bold tabular-nums">{SEM_MAGS[s.mag].toLocaleString('en-US')}x</span>
          <button type="button" aria-label="Higher magnification" disabled={!can('mag') || s.mag === SEM_MAGS.length - 1} className="ctl-btn justify-center px-3" onClick={() => act({ type: 'mag', to: s.mag + 1 })}><Plus size={18} /></button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <HoldButton step={focus(1)} label="Focus up" disabled={!can('focus')} className="ctl-fine"><ChevronUp size={20} />Focus</HoldButton>
          <HoldButton step={focus(-1)} label="Focus down" disabled={!can('focus')} className="ctl-fine"><ChevronDown size={20} />Focus</HoldButton>
        </div>
      </Group>

      <Group title="Image" attention={hl('brightness', 'contrast')} locked={!can('brightness') && !can('contrast')}>
        <Slider label="Brightness" value={s.brightness} onChange={(v) => act({ type: 'brightness', value: v })} colour="var(--color-accent)" attention={hl('brightness')} disabled={!can('brightness')} />
        <Slider label="Contrast" value={s.contrast} onChange={(v) => act({ type: 'contrast', value: v })} colour="var(--color-primary)" attention={hl('contrast')} disabled={!can('contrast')} />
      </Group>

      <Group title="Stage" attention={hl('stage')} locked={!can('stage')}>
        <div className="ctl-dpad">
          <span /><HoldButton step={move(0, 1)} label="Move up" disabled={!can('stage')}><ArrowUp size={20} /></HoldButton><span />
          <HoldButton step={move(-1, 0)} label="Move left" disabled={!can('stage')}><ArrowLeft size={20} /></HoldButton>
          <span className="grid place-items-center text-xs font-bold text-[var(--color-faint)]">move<br />stage</span>
          <HoldButton step={move(1, 0)} label="Move right" disabled={!can('stage')}><ArrowRight size={20} /></HoldButton>
          <span /><HoldButton step={move(0, -1)} label="Move down" disabled={!can('stage')}><ArrowDown size={20} /></HoldButton><span />
        </div>
      </Group>
    </div>
  )
}

export const SEM: Instrument<SemState, SemAction> = {
  name: 'Scanning electron microscope',
  photo: 'p3/sem',
  init: initialSem,
  reduce: semReducer,
  tick: semTick,
  keyOf: (a) => a.type,
  describe: describeSem,
  readout: (s) => [`${SEM_MAGS[s.mag].toLocaleString('en-US')}x`, `${s.kv} kV`, s.chamber === 'vacuum' ? 'vacuum' : 'air'],
  flags: (_, n) => (n.scan === 'slow' && performance.now() / 1000 - n.scanStarted > SLOW_FRAME ? ['slowFrame'] : []),
  View: SemView,
  Controls: SemControls,
  parts: [
    { id: 'column', name: 'Electron column', job: 'Makes a very fine beam of electrons and steers it back and forth across the surface, line by line.', x: 38, y: 20 },
    { id: 'chamber', name: 'Specimen chamber', job: 'The stub sits on a stage in here. The air is pumped out before the beam is switched on.', x: 40, y: 46, act: { type: 'door' } },
    { id: 'detector', name: 'Detector', job: 'Counts the electrons knocked out of the surface at each point. More electrons, brighter pixel.', x: 28, y: 36 },
    { id: 'monitors', name: 'Monitors', job: 'The image is built up point by point as the beam scans.', x: 68, y: 42, act: { type: 'beam' } },
  ],
}
