import { ChevronDown, ChevronUp, Droplet, Play, Power, Square, Timer } from 'lucide-react'
import { ShaderView } from '../ShaderView'
import type { CtlProps, Instrument } from '../engine'
import { Group, HoldButton, Slider, ramp } from '../../scope/Controls'
import { CONFOCAL_POST, CONFOCAL_SPECIMEN } from './shaders'
import {
  bleach, confocalReducer, confocalTick, describeConfocal, fov, gainFactor, initialConfocal, LASER_INFO, LASERS, photons, section,
  type ConfocalAction, type ConfocalState,
} from './model'

function ConfocalView({ state: s }: { state: ConfocalState }) {
  const on = s.power && s.dish && s.scanning
  const dry = s.objective === 63 && !s.oil
  return (
    <ShaderView
      label="Confocal image on the monitor"
      specimen={CONFOCAL_SPECIMEN}
      post={CONFOCAL_POST}
      animate={on}
      scale={0.75}
      uniforms={{
        uSpeed: s.timelapse ? 20 : 1,
        uFov: fov(s),
        uZ: s.z,
        uTh: section(s),
        uPsf: s.objective === 63 ? 0.12 : 0.6,
        uCh: [s.lasers[405] ? 1 : 0, s.lasers[488] ? 1 : 0, s.lasers[640] ? 1 : 0],
        uOn: on,
        uBright: 3 * s.laserPower * gainFactor(s) * bleach(s) * (dry ? 0.3 : 1),
        uPhotons: photons(s),
        uHaze: Math.max(0, (s.pinhole - 1) / 4) * (s.objective === 63 ? 1 : 0.3),
        uSoft: (dry ? 9 : 1) + (s.pinhole - 0.5) * 0.6,
        uRange: s.range,
      }}
    />
  )
}

function ConfocalControls({ state: s, act, can, hl }: CtlProps<ConfocalState, ConfocalAction>) {
  const focus = (dir: number) => (dt: number, held: number) => act({ type: 'focus', dz: dir * (0.6 + (s.objective === 63 ? 6 : 25) * ramp(held, 2)) * dt })
  return (
    <div className="ctl-pad">
      <Group title="Lasers" attention={hl('power', 'laser')} locked={!can('power') && !can('laser')}>
        <button type="button" disabled={!can('power')} className={`ctl-btn w-full justify-center ${s.power ? 'ctl-on' : ''}`} onClick={() => act({ type: 'power' })}>
          <Power size={20} /> {s.power ? 'System on' : 'System off'}
        </button>
        <div className="mt-2 grid gap-1.5">
          {LASERS.map((l) => (
            <button key={l} type="button" disabled={!can('laser') || !s.power} onClick={() => act({ type: 'laser', laser: l })}
              className={`ctl-btn w-full ${s.lasers[l] ? 'ctl-on' : ''}`} aria-pressed={s.lasers[l]}>
              <span className="h-3.5 w-3.5 flex-none rounded-full" style={{ background: LASER_INFO[l].colour, opacity: s.lasers[l] ? 1 : 0.35 }} />
              <span className="text-left leading-tight"><b>{LASER_INFO[l].name}</b> <span className="text-sm font-bold text-[var(--color-muted)]">{LASER_INFO[l].target}</span></span>
            </button>
          ))}
        </div>
      </Group>

      <Group title="Objective and sample" attention={hl('objective', 'oil', 'dish', 'clean')} locked={!can('objective') && !can('oil') && !can('dish') && !can('clean')}>
        <div className="grid grid-cols-2 gap-2">
          {([10, 63] as const).map((o) => (
            <button key={o} type="button" disabled={!can('objective') && s.objective !== o} onClick={() => act({ type: 'objective', to: o })}
              className={`ctl-obj ${s.objective === o ? 'ctl-obj-on' : ''}`} style={{ ['--ring' as string]: o === 10 ? 'var(--color-obj10)' : '#64748b' }}>
              <span className="ctl-ring" />{o === 10 ? '10x dry' : '63x oil'}
            </button>
          ))}
        </div>
        <div className="mt-2 grid gap-1.5">
          {!s.dish && <button type="button" disabled={!can('oil') || s.oil || s.objective !== 63} className="ctl-btn w-full justify-center" onClick={() => act({ type: 'oil' })}><Droplet size={18} /> {s.oil ? 'Oil on the lens' : 'Drop of oil on the 63x lens'}</button>}
          <button type="button" disabled={!can('dish')} className="ctl-btn w-full justify-center" onClick={() => act({ type: 'dish' })}>{s.dish ? 'Take the dish off' : 'Place the dish on the stage'}</button>
          {s.oil && !s.dish && can('clean') && <button type="button" className="ctl-btn w-full justify-center" onClick={() => act({ type: 'clean' })}>Wipe the oil off the lens</button>}
        </div>
      </Group>

      <Group title="Scan" attention={hl('scan', 'zoom', 'timelapse', 'focus')} locked={!can('scan') && !can('zoom') && !can('timelapse') && !can('focus')}>
        <button type="button" disabled={!can('scan') || !s.power || !s.dish} className={`ctl-btn w-full justify-center ${s.scanning ? 'ctl-on' : ''}`} onClick={() => act({ type: 'scan' })}>
          {s.scanning ? <><Square size={18} /> Stop live scan</> : <><Play size={18} /> Live scan</>}
        </button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <HoldButton step={focus(1)} label="Focus up" disabled={!can('focus')} className="ctl-fine"><ChevronUp size={20} />Focus up</HoldButton>
          <HoldButton step={focus(-1)} label="Focus down" disabled={!can('focus')} className="ctl-fine"><ChevronDown size={20} />Focus down</HoldButton>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {([1, 2, 4] as const).map((z) => (
            <button key={z} type="button" disabled={!can('zoom')} onClick={() => act({ type: 'zoom', to: z })} className={`ctl-obj ${s.zoom === z ? 'ctl-obj-on' : ''}`} style={{ ['--ring' as string]: 'var(--color-primary)' }}>Zoom {z}x</button>
          ))}
        </div>
        <button type="button" disabled={!can('timelapse')} className={`ctl-btn mt-2 w-full justify-center ${s.timelapse ? 'ctl-on' : ''}`} onClick={() => act({ type: 'timelapse' })}>
          <Timer size={18} /> {s.timelapse ? 'Time-lapse on (20x faster)' : 'Time-lapse off'}
        </button>
      </Group>

      <Group title="Detector" attention={hl('laserPower', 'gain', 'pinhole', 'range')} locked={!can('laserPower') && !can('gain') && !can('pinhole') && !can('range')}>
        <div className="grid gap-1">
          <Slider label="Laser power" value={s.laserPower} onChange={(v) => act({ type: 'laserPower', value: v })} colour="var(--color-danger)" attention={hl('laserPower')} disabled={!can('laserPower')} />
          <Slider label="Detector gain" value={s.gain} onChange={(v) => act({ type: 'gain', value: v })} colour="var(--color-accent)" attention={hl('gain')} disabled={!can('gain')} />
          <Slider label={`Pinhole (${s.pinhole.toFixed(1)} AU)`} value={(s.pinhole - 0.5) / 4.5} onChange={(v) => act({ type: 'pinhole', value: 0.5 + v * 4.5 })} colour="var(--color-primary)" attention={hl('pinhole')} disabled={!can('pinhole')} />
        </div>
        <button type="button" disabled={!can('range')} className={`ctl-btn mt-2 w-full justify-center ${s.range ? 'ctl-on' : ''}`} onClick={() => act({ type: 'range' })}>
          Range indicator {s.range ? 'on' : 'off'}
        </button>
        {s.range && <p className="mt-1.5 text-sm font-bold leading-snug text-[var(--color-muted)]">Red pixels are saturated (too bright to measure). Blue pixels are zero.</p>}
      </Group>
    </div>
  )
}

export const CONFOCAL: Instrument<ConfocalState, ConfocalAction> = {
  name: 'Confocal microscope',
  photo: 'confocal/instrument',
  init: initialConfocal,
  reduce: confocalReducer,
  tick: confocalTick,
  keyOf: (a) => a.type,
  describe: describeConfocal,
  readout: (s) => [`${s.objective}x`, `z ${s.z.toFixed(1)} um`, `field ${Math.round(fov(s))} um`],
  flags: (p, n) => {
    const f: string[] = []
    if (p.pinhole !== n.pinhole) f.push('pinholeMoved')
    if (n.pinhole > 3.5 && n.scanning) f.push('pinholeOpen')
    if (n.pinhole < 1.3 && n.scanning) f.push('pinholeClosed')
    if (n.laserPower > 0.9 && n.scanning && bleach(n) < 0.85) f.push('bleachSeen')
    if (n.timelapse && n.scanning) f.push('timelapseSeen')
    return f
  },
  trouble: (s) => (s.scanning && bleach(s) < 0.35
    ? {
        title: 'The dyes are bleached',
        body: 'Strong laser light has destroyed the fluorescent dye molecules in this area, so it can no longer glow. This cannot be undone. Lower the laser power, then move the stage to a fresh area of the dish.',
        lock: ['laserPower'],
        highlight: ['laserPower'],
        fix: { label: 'Move to a fresh area', action: { type: 'newField' }, ready: s.laserPower <= 0.3 },
      }
    : null),
  View: ConfocalView,
  Controls: ConfocalControls,
  parts: [
    { id: 'lasers', name: 'Laser unit', job: 'Holds the lasers. Each laser makes one colour of light that excites one dye.', x: 23, y: 79, act: { type: 'power' } },
    { id: 'scanhead', name: 'Scan head', job: 'Mirrors sweep the laser spot across the sample, point by point. The pinhole sits in here.', x: 25, y: 55 },
    { id: 'stage', name: 'Stage', job: 'Holds the dish. On an inverted microscope the lens is underneath, looking up through the glass bottom.', x: 47, y: 37, act: { type: 'dish' } },
    { id: 'objectives', name: 'Objectives (below the stage)', job: 'The lenses point up at the dish from underneath.', x: 45, y: 47 },
    { id: 'monitor', name: 'Monitor', job: 'The image is built by the computer, one point at a time, and shown here.', x: 79, y: 42, act: { type: 'scan' } },
  ],
}
