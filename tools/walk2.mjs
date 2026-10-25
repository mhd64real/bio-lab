// Drives Phase 2 end to end with real inputs. Usage: node tools/walk2.mjs [fromSection]
import { chromium } from 'playwright'
const from = process.argv[2] ?? 'intro'
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.addInitScript((sec) => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', '1'); localStorage.setItem('bio-lab:v1', JSON.stringify({ sound: false, phases: { p0: { done: true }, p1: { done: true }, p2: { section: sec } } })) } }, from)
await page.goto('http://localhost:5180/#/p2'); await page.waitForTimeout(1200)
const S = () => page.evaluate(() => window.__inst)
const btn = (n) => page.getByRole('button', { name: n })
const click = async (n) => { const b = btn(n).first(); if (await b.count() && await b.isEnabled()) { await b.click(); await page.waitForTimeout(120); return true } return false }
const shot = (n) => page.screenshot({ path: `shots/p2-${n}.png` })
const sub = async () => page.locator('header .text-sm').first().innerText()
async function holdBtn(name, ms) { const b = btn(name).first(); await b.scrollIntoViewIfNeeded(); const box = await b.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); await page.waitForTimeout(80) }
async function slider(label, v) { const el = page.locator('label', { hasText: label }).locator('input[type=range]'); await el.fill(String(Math.round(v * 100))); await page.waitForTimeout(80) }
async function answer() {
  for (let i = 0; i < 6; i++) {
    const c = page.locator('.choice:enabled:not(.choice-wrong)')
    if (!(await c.count())) return
    await c.first().click(); await page.waitForTimeout(120)
    if (await page.locator('.choice-right').count()) return
  }
}
async function prep(tag) {
  for (let i = 0; i < 40; i++) {
    if (await btn('Take it to the microscope').count()) { await btn('Take it to the microscope').click(); await page.waitForTimeout(500); return }
    const slider = page.locator('.prep-action input[type=range]')
    if (await slider.count()) { for (let v = 1; v <= 25; v++) { await slider.fill(String(v * 4)); await page.waitForTimeout(25) } if (i === 6) await shot(`${tag}-video`) }
    else if (await btn('Do it').isEnabled().catch(() => false)) {
      await page.locator('.hot-on').first().dispatchEvent('click'); await page.waitForTimeout(150)
      if (await page.locator('.prep-action .tabular-nums').count()) await page.waitForTimeout(2800)
    }
    await page.waitForTimeout(800)
    if (i === 2) await shot(`${tag}-mid`)
  }
  throw new Error('prep stuck ' + tag)
}
async function confocalFocus(target) {
  for (let i = 0; i < 80; i++) { const s = await S(); const d = target - s.z; if (Math.abs(d) < 0.15) return; await holdBtn(d > 0 ? 'Focus up' : 'Focus down', Math.min(1200, Math.max(40, Math.abs(d) * 180))) }
}
async function station(kind) {
  let tries = 0
  for (let i = 0; i < 160; i++) {
    const h2 = page.locator('.station-guide h2').first()
    if (!(await page.locator('.station-view').count())) return
    const title = await h2.innerText()
    if (title !== globalThis.__last) { console.log('  step:', title); globalThis.__last = title }
    const s = await S()
    // Checklists: try the current task's control.
    const now = page.locator('li', { hasText: 'Now:' })
    if (await now.count()) {
      const t = await now.innerText()
      if (kind === 'c') {
        if (t.includes('system on')) await click(/System off/)
        else if (t.includes('405')) await click(/405 nm/)
        else if (t.includes('488')) await click(/488 nm/)
        else if (t.includes('640')) await click(/640 nm/)
        else if (t.includes('63x')) await click(/63x oil/)
        else if (t.includes('immersion oil')) await click(/Drop of oil/)
        else if (t.includes('Place the dish')) await click(/Place the dish/)
        else if (t.includes('range indicator off')) await click(/Range indicator on/)
        else if (t.includes('range indicator')) await click(/Range indicator off/)
        else if (t.includes('gain')) { for (let g = 0.3; g < 1; g += 0.05) { if (await page.locator('label', { hasText: 'Detector gain' }).locator('input').isDisabled()) break; await slider('Detector gain', g); const x = await S(); const p = 3 * x.laserPower * Math.pow(2, (x.gain - 0.5) * 8); if (p >= 0.6 && p <= 1.1) break } }
        else if (t.includes('Zoom in 4x')) await click('Zoom 4x')
        else if (t.includes('time-lapse')) await click(/Time-lapse off/)
        else if (t.includes('Stop the live')) await click(/Stop live scan/)
        else if (t.includes('Take the dish off')) await click(/Take the dish off/)
        else if (t.includes('Wipe')) await click(/Wipe the oil/)
        else if (t.includes('system off')) await click(/System on/)
      } else {
        if (t.includes('Clip the grid')) await click(/Clip the grid/)
        else if (t.includes('airlock') && t.includes('Push')) await click(/Push the holder/)
        else if (t.includes('Pump')) { await click(/Pump the airlock/); await page.waitForTimeout(5600) }
        else if (t.includes('Insert')) await click(/Insert fully/)
        else if (t.includes('high tension')) await click(/HT off/)
        else if (t.includes('beam on')) await click(/Beam off/)
        else if (t.includes('false colour off')) await click(/False colour on/)
        else if (t.includes('beam off')) await click(/Beam on/)
        else if (t.includes('Withdraw')) await click(/Withdraw/)
      }
      if (tries > 2) console.log('    task:', t)
      await page.waitForTimeout(250)
    } else if (await page.locator('.station-guide .choice').count()) {
      if (kind === 't' && title === 'Count them') await shot('tem-100k')
      await answer()
    } else if (kind === 'c') {
      if (title === 'Start scanning') await click(/Live scan/)
      else if (title === 'Find the cells') { await confocalFocus(0.9); await shot('confocal-found') }
      else if (title === 'Just enough laser light') await slider('Laser power', 0.15)
      else if (title === 'The pinhole') { await shot('confocal-pinhole-open'); await slider('Pinhole', 0.1) }
      else if (title === 'A clear picture') { await confocalFocus(0.9); await shot('confocal-good') }
      else if (title === 'Too much light') { if (s.timelapse) await click(/Time-lapse on/); await slider('Laser power', 1); await page.waitForTimeout(2500); await shot('confocal-bleach') }
      else if (title === 'Back to safe power') await slider('Laser power', 0.15)
    } else {
      const move = async (tx, ty, tol) => { for (let k = 0; k < 60; k++) { const x = await S(); const f = 60000 / [500, 2000, 5000, 15000, 40000, 100000][x.mag]; const dx = tx - x.x, dy = ty - x.y; if (Math.hypot(dx, dy) <= tol) return; const ms = (d) => Math.min(900, Math.max(40, Math.abs(d) / f * 2500)); if (Math.abs(dx) > tol / 2) await holdBtn(dx > 0 ? 'Move right' : 'Move left', ms(dx)); if (Math.abs(dy) > tol / 2) await holdBtn(dy > 0 ? 'Move up' : 'Move down', ms(dy)) } }
      const focus = async () => { for (let k = 0; k < 60; k++) { const x = await S(); const f = 60000 / [500, 2000, 5000, 15000, 40000, 100000][x.mag]; if (Math.abs(x.defocus) * 1.2e-4 < f * 0.004) return; await holdBtn(x.defocus > 0 ? 'Focus down' : 'Focus up', Math.min(900, Math.max(30, Math.abs(x.defocus) / (f * 2000) * 300))) } }
      const magTo = async (m) => { for (let k = 0; k < 6; k++) { const x = await S(); if (x.mag === m) return; await click(x.mag < m ? 'Higher magnification' : 'Lower magnification') } }
      if (title === 'Find a cell') { await shot('tem-500'); await move(0, 0, 5) }
      else if (title === 'Zoom in on the cell') { await magTo(1); await move(0, 0, 3); await shot('tem-2000') }
      else if (title === 'Focus') { await magTo(2); await focus() }
      else if (title === 'Find the centrosome') await move(2.0, 0.6, 0.7)
      else if (title === 'Closer') { for (const m of [3, 4]) { await magTo(m); await move(2.0, 0.6, 0.2); await focus() } await shot('tem-40k') }
      else if (title === 'The ring') { await move(2.0, 0.6, 0.05); await magTo(5); await move(2.0, 0.6, 0.04); await focus() }
      else if (title === 'Colour') { await click(/False colour off/); await shot('tem-false') }
    }
    const next = btn(/Next step|Finish/)
    if (await next.count() && await next.isEnabled()) { await next.click(); await page.waitForTimeout(200); tries = 0 }
    else if ((await next.count()) === 0 && await page.locator('.station-guide button', { hasText: /fresh area|undamaged/ }).count()) { await slider(kind === 'c' ? 'Laser power' : 'Brightness', 0.15); await page.locator('.station-guide button', { hasText: /fresh area|undamaged/ }).click() }
    else if (++tries < 6) { continue }
    else { const x = await S(); console.log(`  stuck at "${title}"`, JSON.stringify(x).slice(0, 300), await page.locator('.station-view').innerText()); await shot(`stuck-${kind}`); throw new Error('stuck') }
  }
}
for (let i = 0; i < 14; i++) {
  const w = await sub(); console.log('section:', w)
  if (w.startsWith('The cytoskeleton')) { for (let k = 0; k < 3; k++) { if (await page.locator('.choice').count()) await answer(); await page.getByRole('button', { name: /^Next$|Start:/ }).click(); await page.waitForTimeout(200) } }
  else if (w.startsWith('Living cells')) await prep('cprep')
  else if (w.startsWith('Confocal')) await station('c')
  else if (w.startsWith('Electron microscope: prepare')) await prep('tprep')
  else if (w.startsWith('Electron microscope')) await station('t')
  else if (w.startsWith('Get It')) {
    const ans = { 'Long, hollow': 'Microtubules', 'Thin protein threads': 'Microfilaments', 'rigid skeleton': 'Microtubules', 'shape': 'Microfilaments', 'move substances': 'Microtubules', 'whole cell': 'Microfilaments', 'Rapidly': 'Both', 'centrioles': 'Microtubules', 'Part of': 'Both', 'ruffling': 'Microfilaments' }
    const rows = page.locator('.card > .grid > div')
    for (let r = 0; r < await rows.count(); r++) { const t = await rows.nth(r).innerText(); const k = Object.keys(ans).find((x) => t.includes(x)); await rows.nth(r).getByRole('button', { name: ans[k], exact: true }).click() }
    await btn('Check answers').click(); await btn('Next: quick check').click(); await page.waitForTimeout(200)
  } else if (w.startsWith('Quick check')) { for (let q = 0; q < 8; q++) { await page.locator('.choice').nth(1).click(); await page.waitForTimeout(80); await btn(/Next question|See my result/).click(); await page.waitForTimeout(120) } }
  else if (w.startsWith('Finished')) { await shot('done'); break }
}
console.log('errors:', errors.slice(0, 5))
await browser.close()
