import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ChevronDown, ChevronUp, Minus, Palette, Plus, Power, Zap } from 'lucide-react'
import { ShaderView } from '../ShaderView'
import type { CtlProps, Instrument } from '../engine'
import { Group, HoldButton, Slider, ramp } from '../../scope/Controls'
import { TEM_POST, TEM_SPECIMEN } from './shaders'
import { defocusBlur, describeTem, imageBrightness, initialTem, MAGS, scaleBar, temFov, temReducer, temTick, type TemAction, type TemState } from './model'

function TemView({ state: s }: { state: TemState }) {
  const sb = scaleBar(s)
  const live = s.beam && s.ht
  return (
    <div className="relative h-full">
      <ShaderView
        label="Electron microscope camera image"
        specimen={TEM_SPECIMEN}
        post={TEM_POST}
        animate={live}
        uniforms={{
          uFov: temFov(s),
          uStage: [s.x, s.y],
          uBurn: s.burnAt ? [s.burnAt.x, s.burnAt.y, 1] : [0, 0, 0],
          uBright: imageBrightness(s),
          uBlurPx: (defocusBlur(s) / temFov(s)) * 700,
          uDefocusSign: s.defocus < 0 ? 1 : -1,
          uSpecimen: s.holder === 'in',
          uFalse: s.falseColour,
          uSpec: s.specimen === 'cilia' ? 1 : 0,
        }}
      />
      {live && s.holder === 'in' && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-start gap-1" style={{ width: 'min(70%, 520px)' }}>
          <div className="h-1.5 rounded-full bg-white shadow" style={{ width: `${sb.frac * 100}%` }} />
          <span className="rounded bg-black/50 px-1.5 text-sm font-extrabold text-white">{sb.label}</span>
        </div>
      )}
    </div>
  )
}

function TemControls({ state: s, act, can, hl }: CtlProps<TemState, TemAction>) {
  const f = temFov(s)
  const focus = (dir: number) => (dt: number, held: number) => act({ type: 'focus', dz: dir * f * (800 + 6000 * ramp(held, 2)) * dt })
  const move = (dx: number, dy: number) => (dt: number, held: number) => { const v = f * (0.25 + ramp(held, 1.5)) * dt; act({ type: 'stage', dx: dx * v, dy: dy * v }) }
  const holderLabel = { out: 'Holder empty', loaded: 'Grid loaded in the holder', airlock: s.airlock >= 1 ? 'Airlock at vacuum' : s.airlock > 0 ? `Pumping airlock ${Math.round(s.airlock * 100)}%` : 'Holder in the airlock (air)', in: 'Holder in the column' }[s.holder]
  return (
    <div className="ctl-pad">
      <Group title="Specimen holder" attention={hl('load', 'toAirlock', 'pump', 'insert', 'withdraw')} locked={!['load', 'toAirlock', 'pump', 'insert', 'withdraw'].some(can)}>
        <p className="mb-2 text-sm font-extrabold text-[var(--color-muted)]">{holderLabel}</p>
        {s.holder === 'airlock' && s.airlock > 0 && s.airlock < 1 && <div className="mb-2 h-2 overflow-hidden rounded-full bg-[var(--color-sunk)]"><div className="h-full bg-[var(--color-primary)]" style={{ width: `${s.airlock * 100}%` }} /></div>}
        <div className="grid gap-1.5">
          {s.holder === 'out' && <button type="button" disabled={!can('load')} className="ctl-btn w-full justify-center" onClick={() => act({ type: 'load' })}>Clip the grid into the holder tip</button>}
          {s.holder === 'loaded' && <button type="button" disabled={!can('toAirlock')} className="ctl-btn w-full justify-center" onClick={() => act({ type: 'toAirlock' })}>Push the holder into the airlock</button>}
          {s.holder === 'airlock' && (
            <>
              <button type="button" disabled={!can('pump') || s.airlock > 0} className="ctl-btn w-full justify-center" onClick={() => act({ type: 'pump' })}>{s.airlock > 0 ? 'Pumping...' : 'Pump the airlock'}</button>
              <button type="button" disabled={!can('insert')} className="ctl-btn w-full justify-center" onClick={() => act({ type: 'insert' })}>Insert fully into the column</button>
            </>
          )}
          {(s.holder === 'in' || s.holder === 'airlock') && can('withdraw') && <button type="button" className="ctl-btn w-full justify-center" onClick={() => act({ type: 'withdraw' })}>Withdraw the holder</button>}
        </div>
      </Group>

      <Group title="Electron beam" attention={hl('ht', 'beam', 'brightness')} locked={!can('ht') && !can('beam') && !can('brightness')}>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" disabled={!can('ht')} className={`ctl-btn justify-center ${s.ht ? 'ctl-on' : ''}`} onClick={() => act({ type: 'ht' })}><Power size={18} /> {s.ht ? '120 kV on' : 'HT off'}</button>
          <button type="button" disabled={!can('beam') || !s.ht} className={`ctl-btn justify-center ${s.beam ? 'ctl-on' : ''}`} onClick={() => act({ type: 'beam' })}><Zap size={18} /> {s.beam ? 'Beam on' : 'Beam off'}</button>
        </div>
        <div className="mt-2"><Slider label="Brightness" value={s.brightness} onChange={(v) => act({ type: 'brightness', value: v })} colour="var(--color-accent)" attention={hl('brightness')} disabled={!can('brightness')} /></div>
      </Group>

      <Group title="Magnification and focus" attention={hl('mag', 'focus')} locked={!can('mag') && !can('focus')}>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Lower magnification" disabled={!can('mag') || s.mag === 0} className="ctl-btn justify-center px-3" onClick={() => act({ type: 'mag', to: s.mag - 1 })}><Minus size={18} /></button>
          <span className="flex-1 text-center font-display text-xl font-bold tabular-nums">{MAGS[s.mag].toLocaleString('en-US')}x</span>
          <button type="button" aria-label="Higher magnification" disabled={!can('mag') || s.mag === MAGS.length - 1} className="ctl-btn justify-center px-3" onClick={() => act({ type: 'mag', to: s.mag + 1 })}><Plus size={18} /></button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <HoldButton step={focus(1)} label="Focus up" disabled={!can('focus')} className="ctl-fine"><ChevronUp size={20} />Focus</HoldButton>
          <HoldButton step={focus(-1)} label="Focus down" disabled={!can('focus')} className="ctl-fine"><ChevronDown size={20} />Focus</HoldButton>
        </div>
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

      <Group title="Display" attention={hl('falseColour')} locked={!can('falseColour')}>
        <button type="button" disabled={!can('falseColour')} className={`ctl-btn w-full justify-center ${s.falseColour ? 'ctl-on' : ''}`} onClick={() => act({ type: 'falseColour' })}>
          <Palette size={18} /> {s.falseColour ? 'False colour on' : 'False colour off'}
        </button>
      </Group>
    </div>
  )
}

export const TEM: Instrument<TemState, TemAction> = {
  name: 'Transmission electron microscope',
  photo: 'tem/instrument',
  init: initialTem,
  reduce: temReducer,
  tick: temTick,
  keyOf: (a) => a.type,
  describe: describeTem,
  readout: (s) => [`${MAGS[s.mag].toLocaleString('en-US')}x`, s.holder === 'in' ? 'vacuum' : s.holder === 'airlock' ? 'airlock' : 'no holder'],
  flags: (p, n) => {
    const f: string[] = []
    if (n.falseColour && !p.falseColour) f.push('falseOn')
    if (!n.falseColour && p.falseColour) f.push('falseOff')
    return f
  },
  trouble: (s) => (s.burnAt
    ? {
        title: 'The beam burned a hole',
        body: 'A concentrated electron beam at high magnification heats the thin plastic section until it bubbles and breaks. Spread the beam (lower the brightness), then move to an undamaged area of the section.',
        lock: ['brightness'],
        highlight: ['brightness'],
        fix: { label: 'Move to an undamaged area', action: { type: 'newArea' }, ready: s.brightness <= 0.6 },
      }
    : null),
  View: TemView,
  Controls: TemControls,
  parts: [
    { id: 'gun', name: 'Electron gun', job: 'At the top: a hot filament gives off electrons, and 120 000 volts accelerate them down the column.', x: 51, y: 7 },
    { id: 'column', name: 'Column and magnetic lenses', job: 'The electrons travel down a tube with almost all the air pumped out. Magnetic coils act as lenses.', x: 51, y: 25 },
    { id: 'holder', name: 'Specimen holder and airlock', job: 'The grid sits in the tip of this rod. It enters the vacuum through an airlock.', x: 35, y: 40, act: { type: 'toAirlock' } },
    { id: 'chamber', name: 'Viewing chamber and camera', job: 'Electrons that pass through the section form the image here, where a camera records it.', x: 51, y: 70 },
    { id: 'leftPanel', name: 'Beam controls', job: 'High tension, beam and brightness.', x: 36, y: 64, act: { type: 'beam' } },
    { id: 'rightPanel', name: 'Magnification and focus', job: 'Knobs for magnification, focus and the stage.', x: 63, y: 64 },
    { id: 'monitor', name: 'Monitor', job: 'Shows the camera image.', x: 69, y: 50 },
  ],
}
