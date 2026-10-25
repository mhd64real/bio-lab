// Drives Phase 5 end to end with real inputs. Usage: node tools/walk5.mjs [fromSection]
import { chromium } from 'playwright'
import { focusSteady } from './lib/focus.mjs'
const from = process.argv[2] ?? 'intro'
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.addInitScript((sec) => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', '1'); localStorage.setItem('bio-lab:v1', JSON.stringify({ sound: false, phases: { p0: { done: true }, p1: { done: true }, p2: { done: true }, p3: { done: true }, p4: { done: true }, p5: { section: sec, data: { pepper: { specimen: 'pepper', bubbles: [] }, potato: { specimen: 'potato', bubbles: [] } } } } })) } }, from)
await page.goto('http://localhost:5180/#/p5'); await page.waitForTimeout(1200)
const log = (...a) => console.log(...a)
const btn = (n) => page.getByRole('button', { name: n })
const click = async (n) => { const b = btn(n).first(); if (await b.count() && await b.isEnabled()) { await b.click(); await page.waitForTimeout(120); return true } return false }
const shot = (n) => page.screenshot({ path: `shots/p5-${n}.png` })
const sub = async () => page.locator('header .text-sm').first().innerText()
const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(40) }
async function holdBtn(name, ms) { const b = btn(name).first(); await b.scrollIntoViewIfNeeded(); const box = await b.boundingBox(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); await page.waitForTimeout(60) }
async function slider(label, v) { const el = page.locator('label', { hasText: label }).locator('input[type=range]'); if (await el.isDisabled()) return; await el.fill(String(Math.round(v * 100))); await page.waitForTimeout(80) }
async function answer() {
  for (let i = 0; i < 6; i++) {
    const c = page.locator('.station-guide .choice:enabled:not(.choice-wrong), main > div .choice:enabled:not(.choice-wrong)')
    if (!(await c.count())) return
    await c.first().click(); await page.waitForTimeout(120)
    if (await page.locator('.choice-right').count()) return
  }
}
async function prep(tag) {
  for (let i = 0; i < 40; i++) {
    if (await btn('Take it to the microscope').count()) { await shot(`${tag}-end`); await btn('Take it to the microscope').click(); await page.waitForTimeout(500); return }
    const sl = page.locator('.prep-action input[type=range]')
    if (await sl.count()) {
      const lowering = (await sl.getAttribute('max')) === '45'
      for (let v = 1; v <= 30; v++) { await sl.fill(String(lowering ? Math.round(45 - 1.5 * v) : Math.round(v * 3.34))); await page.waitForTimeout(30); if (v === 15) await shot(`${tag}-${i}-mid`) }
    } else if (await btn('Do it').isEnabled().catch(() => false)) {
      await page.locator('.hot-on').first().dispatchEvent('click'); await page.waitForTimeout(150)
      if (await page.locator('.prep-action .tabular-nums').count()) await page.waitForTimeout(2800)
    }
    await page.waitForTimeout(800)
  }
  throw new Error('prep stuck ' + tag)
}
// ---------- light microscope ----------
const SC = () => page.evaluate(() => window.__scope)
const FOCUS = { 4: 15000, 10: 15006, 40: 14997.5, 100: 15001.5 }
async function focusTo(target, up, down, tol) { return focusSteady(SC, hold, target, up, down, tol) }
async function stageTo(tx, ty, tol) {
  for (let i = 0; i < 80; i++) {
    const s = await SC(); const fov = { 4: 4.5, 10: 1.8, 40: 0.45 }[s.objective]
    const dx = tx - s.stageX, dy = ty - s.stageY
    if (Math.hypot(dx, dy) <= tol) return
    const ms = (d) => Math.min(500, Math.max(30, Math.abs(d) / (fov * 0.3) * 1000))
    if (Math.abs(dx) > tol / 2) await hold(dx > 0 ? 'ArrowRight' : 'ArrowLeft', ms(dx))
    if (Math.abs(dy) > tol / 2) await hold(dy > 0 ? 'ArrowUp' : 'ArrowDown', ms(dy))
  }
}
async function chase(kind, tol, seconds) {
  const end = Date.now() + seconds * 1000
  do {
    const pts = await page.evaluate((k) => window.__swim(k), kind)
    const s = await SC()
    let best = pts[0], bd = 1e9
    for (const p of pts) { const d = Math.hypot(p[0] + s.stageX, p[1] + s.stageY); if (d < bd) { bd = d; best = p } }
    await stageTo(-best[0], -best[1], tol)
  } while (Date.now() < end)
}
async function lightStation(tag) {
  let tries = 0
  for (let i = 0; i < 200; i++) {
    if (!(await page.locator('.station-view').count())) return
    const title = await page.locator('.station-guide h2').first().innerText()
    if (title !== globalThis.__l) { log('  step:', title); globalThis.__l = title }
    const s = await SC()
    const now = page.locator('li', { hasText: 'Now:' })
    if (await now.count()) {
      await page.keyboard.press('1')
      if ((await SC()).stageZ >= 12000) await hold('PageDown', 2600)
      await click('Take the slide off')
      await click(/Wipe the 100x lens/)
      const t2 = await now.innerText().catch(() => '')
      if (t2.includes('lamp')) await page.keyboard.press('l')
    }
    else if (title === 'Place the slide') await click('Place slide on stage')
    else if (title === 'Clip it in') await click('Clip the slide in')
    else if (title === 'Line up the specimen') await stageTo(0, 0, 0.5)
    else if (title === 'Find it with coarse focus') await focusTo(14850, 'PageUp', 'PageDown', 200, 0.15)
    else if (title.startsWith('Sharpen') || title.startsWith('Fine focus')) {
      await focusTo(FOCUS[s.objective], ']', '[', s.objective >= 40 ? 0.4 : 3, 12)
      if (title.includes('light')) { await slider('Brightness', s.objective === 100 ? 1 : 0.85); await slider('Iris diaphragm', s.objective === 100 ? 0.85 : 0.6) }
      await shot(`${tag}-${s.objective}`)
    }
    else if (title.startsWith('Switch to')) await page.keyboard.press({ '4x': '1', '10x': '2', '40x': '3', '100x': '4' }[title.split(' ').pop()])
    else if (title === 'Add a drop of immersion oil') await click('Add a drop of immersion oil')
    else if (title === 'Close the iris a little') await slider('Iris diaphragm', 0.4)
    else if (title === 'Phase contrast') { await click(/Condenser: Brightfield/); await shot(`${tag}-phase10`) }
    else if (title === 'Find a Paramecium') await chase('para', 0.05, 0)
    else if (title === 'Follow it') { await chase('para', 0.03, 6); await shot(`${tag}-track`) }
    else if (title === 'Find a Euglena') await chase('eug', 0.04, 0)
    else if (await page.locator('.station-guide .choice').count()) { if (title === 'The whip') { await chase('eug', 0.02, 0); await shot(`${tag}-euglena`) } await answer() }
    const next = btn(/Next step|Finish/)
    if (await next.isEnabled()) { await next.click(); await page.waitForTimeout(200); tries = 0 }
    else if (++tries > 8) { log('  stuck', title, JSON.stringify(await SC()).slice(0, 250), await page.locator('.station-view').innerText()); await shot(`stuck-${tag}`); throw new Error('stuck') }
    else if (title.startsWith('Switch to')) { const t = await page.evaluate(() => window.__swim('para')); void t }
  }
}
// ---------- instruments ----------
const S = () => page.evaluate(() => window.__inst)
const LEAF = { chloroplast: { x: 0, y: 8 }, mito: { x: 4.4035, y: 7.6767 } }
async function instStation(kind) {
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
        else if (t.includes('time-lapse')) await click(/Time-lapse on/)
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
      if (title === 'Green threads') await shot('confocal-mito')
      if (title === 'Stacks') await shot('tem-chloroplast')
      if (title === 'An energy generator') await shot('tem-mito')
      if (title === 'Around the edge') await shot('tem-cell')
      await answer()
    } else if (kind === 'c') {
      if (title === 'Find the cells') await focusZ(1.5)
      else if (title === 'Speed up time') { await click(/Time-lapse off/); await page.waitForTimeout(4600) }
    } else {
      if (title === 'Find a leaf cell') await move(0, 0, 5)
      else if (title === 'A leaf cell') { await magTo(1); await move(0, 0, 2) }
      else if (title === 'One chloroplast') { await move(LEAF.chloroplast.x, LEAF.chloroplast.y, 1); await magTo(3); await move(LEAF.chloroplast.x, LEAF.chloroplast.y, 0.4); await focusTem() }
      else if (title === 'Its neighbour') await move(LEAF.mito.x, LEAF.mito.y, 0.4)
      else if (title.startsWith('44,000x')) { await slider('Brightness', 0.2); await magTo(4); await move(LEAF.mito.x, LEAF.mito.y, 0.15); await focusTem() }
    }
    const next = btn(/Next step|Finish/)
    if (await next.count() && await next.isEnabled()) { await next.click(); await page.waitForTimeout(200); tries = 0 }
    else if (++tries > 8) { log('  stuck', title, JSON.stringify(await S()).slice(0, 300), await page.locator('.station-view').innerText()); await shot(`stuck-${kind}`); throw new Error('stuck') }
  }
}
for (let i = 0; i < 24; i++) {
  const w = await sub(); log('section:', w)
  if (w.startsWith('Processing energy')) { for (let k = 0; k < 4; k++) { if (await page.locator('.choice').count()) await answer(); const b = page.getByRole('button', { name: /^Next$|Start:|Next:/ }); if (!(await b.count())) break; await b.click(); await page.waitForTimeout(200) } }
  else if (w.startsWith('Elodea: prepare') || w.startsWith('Living cells') || w.startsWith('TEM: prepare')) { await click(/Run the preparation/); await page.waitForTimeout(4500); await click('Take it to the microscope'); await page.waitForTimeout(400) }
  else if (w.startsWith('Elodea at')) await lightStation('elodea')
  else if (w.startsWith('Red pepper: prepare')) await prep('pepperprep')
  else if (w.startsWith('Red pepper: observe')) await lightStation('pepper')
  else if (w.startsWith('Potato: prepare')) await prep('potatoprep')
  else if (w.startsWith('Potato: observe')) await lightStation('potato')
  else if (w.startsWith('Confocal')) await instStation('c')
  else if (w.startsWith('Transmission')) await instStation('t')
  else if (w.startsWith('Get It')) {
    const ans = { 'Converts fuel': 'Mitochondrion', 'Captures light': 'Chloroplast', 'folded inner': 'Mitochondrion', 'thylakoids': 'Chloroplast', 'chlorophyll': 'Chloroplast', 'outer and an inner': 'Both', 'plant cells': 'Both', 'animal cells': 'Mitochondrion', 'plastid': 'Chloroplast', 'divide': 'Mitochondrion' }
    const rows = page.locator('.card > .grid > div')
    for (let r = 0; r < await rows.count(); r++) { const t = await rows.nth(r).innerText(); const k = Object.keys(ans).find((x) => t.includes(x)); await rows.nth(r).getByRole('button', { name: ans[k], exact: true }).click() }
    await btn('Check answers').click(); await btn('Next: quick check').click(); await page.waitForTimeout(200)
  } else if (w.startsWith('Quick check')) { for (let q = 0; q < 8; q++) { await page.locator('.choice').nth(1).click(); await page.waitForTimeout(80); await btn(/Next question|See my result/).click(); await page.waitForTimeout(120) } }
  else if (w.startsWith('Finished')) { await shot('done'); break }
}
log('errors:', errors.slice(0, 5))
await browser.close()
