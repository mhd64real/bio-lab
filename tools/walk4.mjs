// Drives Phase 4 end to end with real inputs. Usage: node tools/walk4.mjs [fromSection]
import { chromium } from 'playwright'
const from = process.argv[2] ?? 'intro'
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.addInitScript((sec) => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', '1'); localStorage.setItem('bio-lab:v1', JSON.stringify({ sound: false, phases: { p0: { done: true }, p1: { done: true }, p2: { done: true }, p3: { done: true }, p4: { section: sec } } })) } }, from)
await page.goto('http://localhost:5180/#/p4'); await page.waitForTimeout(1200)
const log = (...a) => console.log(...a)
const btn = (n) => page.getByRole('button', { name: n })
const click = async (n) => { const b = btn(n).first(); if (await b.count() && await b.isEnabled()) { await b.click(); await page.waitForTimeout(120); return true } return false }
const shot = (n) => page.screenshot({ path: `shots/p4-${n}.png` })
const sub = async () => page.locator('header .text-sm').first().innerText()
async function holdBtn(name, ms) { const b = btn(name).first(); await b.scrollIntoViewIfNeeded(); const box = await b.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); await page.waitForTimeout(60) }
async function slider(label, v) { const el = page.locator('label', { hasText: label }).locator('input[type=range]'); if (await el.isDisabled()) return; await el.fill(String(Math.round(v * 100))); await page.waitForTimeout(80) }
async function answer() {
  for (let i = 0; i < 6; i++) {
    const c = page.locator('.station-guide .choice:enabled:not(.choice-wrong), main .card .choice:enabled:not(.choice-wrong)')
    if (!(await c.count())) return
    await c.first().click(); await page.waitForTimeout(120)
    if (await page.locator('.choice-right').count()) return
  }
}
const S = () => page.evaluate(() => window.__inst)
const NUC = { pore: { x: -0.075, y: -3.687 }, nucleolus: { x: 1.2, y: 0.8 } }
async function station(kind) {
  let tries = 0
  for (let i = 0; i < 220; i++) {
    if (!(await page.locator('.station-view').count())) return
    const title = await page.locator('.station-guide h2').first().innerText()
    if (title !== globalThis.__i) { log('  step:', title); globalThis.__i = title }
    const now = page.locator('li', { hasText: 'Now:' })
    const fovOf = (x) => 60000 / [500, 2000, 5000, 15000, 44000, 100000][x.mag]
    const move = async (tx, ty, tol) => { for (let k = 0; k < 60; k++) { const x = await S(); const f = fovOf(x); const dx = tx - x.x, dy = ty - x.y; if (Math.hypot(dx, dy) <= tol) return; const ms = (d) => Math.min(900, Math.max(40, Math.abs(d) / f * 2500)); if (Math.abs(dx) > tol / 2) await holdBtn(dx > 0 ? 'Move right' : 'Move left', ms(dx)); if (Math.abs(dy) > tol / 2) await holdBtn(dy > 0 ? 'Move up' : 'Move down', ms(dy)) } }
    const magTo = async (m) => { for (let k = 0; k < 6; k++) { const x = await S(); if (x.mag === m) return; await click(x.mag < m ? 'Higher magnification' : 'Lower magnification') } }
    const focusTem = async () => { for (let k = 0; k < 60; k++) { const x = await S(); const f = fovOf(x); if (Math.abs(x.defocus) * 1.2e-4 < f * 0.004) return; await holdBtn(x.defocus > 0 ? 'Focus down' : 'Focus up', Math.min(900, Math.max(30, Math.abs(x.defocus) / (f * 2000) * 300))) } }
    const focusZ = async (target, tol = 0.15) => { for (let k = 0; k < 80; k++) { const s = await S(); const d = target - s.z; if (Math.abs(d) < tol) return; await holdBtn(d > 0 ? 'Focus up' : 'Focus down', Math.min(1200, Math.max(40, Math.abs(d) * 180))) } }
    if (await now.count()) {
      const t = await now.innerText()
      if (kind === 'c') {
        if (t.includes('system on')) await click(/System off/)
        else if (t.includes('405')) await click(/405 nm/)
        else if (t.includes('488')) await click(/488 nm/)
        else if (t.includes('63x')) await click(/63x oil/)
        else if (t.includes('immersion oil')) await click(/Drop of oil/)
        else if (t.includes('Place the dish')) await click(/Place the dish/)
        else if (t.includes('live scan') && t.includes('Start')) await click(/Live scan/)
        else if (t.includes('pinhole')) await slider('Pinhole', 0.1)
        else if (t.includes('laser power')) await slider('Laser power', 0.18)
        else if (t.includes('Zoom in 4x')) await click('Zoom 4x')
        else if (t.includes('Stop the live')) await click(/Stop live scan/)
        else if (t.includes('Take the dish off')) await click(/Take the dish off/)
        else if (t.includes('Wipe')) await click(/Wipe the oil/)
        else if (t.includes('system off')) await click(/System on/)
      } else {
        if (t.includes('Clip the grid')) await click(/Clip the grid/)
        else if (t.includes('Push')) await click(/Push the holder/)
        else if (t.includes('Pump')) { await click(/Pump the airlock/); await page.waitForTimeout(5600) }
        else if (t.includes('Insert')) await click(/Insert fully/)
        else if (t.includes('high tension')) await click(/HT off/)
        else if (t.includes('beam on')) await click(/Beam off/)
        else if (t.includes('beam off')) await click(/Beam on/)
        else if (t.includes('lowest magnification')) await magTo(0)
        else if (t.includes('Withdraw')) await click(/Withdraw/)
      }
      await page.waitForTimeout(200)
    } else if (await page.locator('.station-guide .choice').count()) {
      if (title === 'The blue glow') await shot('confocal-middle')
      if (title === 'Pores face-on') await shot('confocal-top')
      if (title === 'Two lines') await shot('tem-44000')
      if (title === 'A factory inside the factory') await shot('tem-nucleolus')
      if (title === 'Dark and pale') await shot('tem-5000')
      await answer()
    } else if (kind === 'c') {
      if (title === 'Find the nuclei') await focusZ(3)
      else if (title === 'The middle of the nucleus') await focusZ(4.5)
      else if (title === 'Near the top') await focusZ(7.1)
    } else {
      if (title === 'Find a cell') await move(0, 0, 5)
      else if (title === 'The cell') { await magTo(1); await move(0, 0, 2) }
      else if (title === 'The nucleus') { await magTo(2); await move(0, 0, 2); await focusTem() }
      else if (title === 'The nucleolus') { await move(NUC.nucleolus.x, NUC.nucleolus.y, 0.4); await magTo(3); await move(NUC.nucleolus.x, NUC.nucleolus.y, 0.3); await focusTem() }
      else if (title === 'The edge of the nucleus') await move(NUC.pore.x, NUC.pore.y, 0.5)
      else if (title.startsWith('44,000x')) { await slider('Brightness', 0.2); await move(NUC.pore.x, NUC.pore.y, 0.2); await magTo(4); await move(NUC.pore.x, NUC.pore.y, 0.15); await focusTem() }
    }
    const next = btn(/Next step|Finish/)
    if (await next.count() && await next.isEnabled()) { await next.click(); await page.waitForTimeout(200); tries = 0 }
    else if (++tries > 8) { log('  stuck', title, JSON.stringify(await S()).slice(0, 300), await page.locator('.station-view').innerText()); await shot(`stuck-${kind}`); throw new Error('stuck') }
  }
}
async function slice() {
  const r = page.locator('input[type=range]')
  const set = async (h, t) => { await r.nth(1).fill(String(t)); await r.nth(0).fill(String(h)); await page.waitForTimeout(1100) }
  await set(62, 0); await shot('slice-1')
  await set(32, 0); await shot('slice-2')
  await set(95, 0); await shot('slice-3')
  await answer(); await shot('slice-q')
  await btn(/Next: the role/).click(); await page.waitForTimeout(300)
}
async function cloze() {
  const words = ['managing', 'DNA', 'proteins', 'nucleolus', 'double', 'nuclear pores', 'Chromatin']
  for (const w of words) await page.getByRole('button', { name: w, exact: true }).click()
  await shot('cloze'); await btn('Check answers').click(); await btn('Next: quick check').click(); await page.waitForTimeout(200)
}
for (let i = 0; i < 20; i++) {
  const w = await sub(); log('section:', w)
  if (w.startsWith('The nucleus (')) { for (let k = 0; k < 4; k++) { if (await page.locator('.choice').count()) await answer(); const b = page.getByRole('button', { name: /^Next$|Start:|Next:/ }); if (!(await b.count())) break; await b.click(); await page.waitForTimeout(200) } }
  else if (w.includes('prepare') || w.includes('stain')) { await click(/Run the preparation/); await page.waitForTimeout(4500); await click('Take it to the microscope'); await page.waitForTimeout(400) }
  else if (w.startsWith('Confocal')) await station('c')
  else if (w.startsWith('Transmission')) await station('t')
  else if (w.startsWith('Slice')) await slice()
  else if (w.startsWith('Get It')) await cloze()
  else if (w.startsWith('Quick check')) { for (let q = 0; q < 8; q++) { const c = page.locator('.choice'); const qt = await page.locator('main .card p').first().innerText(); await c.nth(qt.includes('How many membranes') ? 2 : 1).click(); await page.waitForTimeout(80); await btn(/Next question|See my result/).click(); await page.waitForTimeout(120) } }
  else if (w.startsWith('Finished')) { await shot('done'); break }
}
log('errors:', errors.slice(0, 5))
await browser.close()
