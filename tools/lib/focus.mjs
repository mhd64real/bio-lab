// Focus the light microscope with the keyboard the way the controls now behave: a key press nudges the stage,
// holding waits 0.25 s and then moves at a steady speed (see coarseStep and fineStep in src/scope/Controls.tsx).
const DOF = { 4: 55, 10: 8.5, 40: 1, 100: 0.45 }
export async function focusSteady(get, hold, target, up, down, tol) {
  for (let i = 0; i < 150; i++) {
    const s = await get()
    const fine = up === ']'
    const nudge = fine ? DOF[s.objective] * 0.6 : 150
    const speed = fine ? DOF[s.objective] * 4 : 2000
    const d = target - s.stageZ
    if (Math.abs(d) <= Math.max(tol, nudge * 0.6)) return
    const key = d > 0 ? up : down
    await hold(key, Math.abs(d) < nudge * 1.6 ? 30 : 250 + ((Math.abs(d) - nudge) / speed) * 1000 * 0.85)
  }
}
