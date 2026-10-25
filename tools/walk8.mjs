// Drives Phase 8 end to end. Usage: node tools/walk8.mjs [fromSection]
import { chromium } from 'playwright'
const from = process.argv[2] ?? 'intro'
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1366, height: 900 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
await page.addInitScript((sec) => {
  if (sessionStorage.getItem('s')) return
  sessionStorage.setItem('s', '1')
  const done = (got, total) => ({ done: true, score: { got, total } })
  localStorage.setItem('bio-lab:v1', JSON.stringify({ sound: false, phases: { p0: done(9, 10), p1: done(8, 8), p2: done(8, 9), p3: done(9, 9), p4: done(9, 10), p5: done(8, 9), p6: done(10, 10), p7: done(9, 9), p8: { section: sec } } }))
}, from)
await page.goto('http://localhost:5180/#/p8'); await page.waitForTimeout(1000)
const log = (...a) => console.log(...a)
const btn = (n) => page.getByRole('button', { name: n })
const shot = (n) => page.screenshot({ path: `shots/p8-${n}.png`, fullPage: true })
const sub = async () => page.locator('header .text-sm').first().innerText()
const content = await import('../src/phases/p8/content.ts').catch(() => null)
async function match(pairs, wrongFirst) {
  if (wrongFirst) { await btn(pairs[0].left).first().click(); await page.getByRole('button', { name: pairs[1].right }).click() ; await btn(pairs[1].left).first().click(); await page.getByRole('button', { name: pairs[0].right }).click() }
  for (const [i, p] of pairs.entries()) { if (wrongFirst && i < 2) continue; await btn(p.left).first().click(); await page.getByRole('button', { name: p.right }).click() }
  await btn('Check answers').click(); await page.waitForTimeout(200)
  if (wrongFirst) { await shot('match-wrong'); for (const i of [0, 1]) await btn(pairs[i].left).first().click(); for (const i of [0, 1]) { await btn(pairs[i].left).first().click(); await page.getByRole('button', { name: pairs[i].right }).click() } await btn('Check answers').click() }
}
async function sort(rows) {
  const r = page.locator('.card > .grid > div')
  for (let k = 0; k < await r.count(); k++) { const t = await r.nth(k).innerText(); const row = rows.find((x) => t.startsWith(x.text)); await r.nth(k).getByRole('button', { name: row.answer, exact: true }).click() }
  await btn('Check answers').click()
}
const C = content
for (let i = 0; i < 20; i++) {
  const w = await sub(); log('section:', w)
  if (w.startsWith('Organelles at work')) { for (let k = 0; k < 4; k++) { const c = page.locator('.choice'); if (await c.count()) { await c.nth(1).click(); await page.waitForTimeout(150) } const b = page.getByRole('button', { name: /^Next$|Start:/ }); if (!(await b.count())) break; await b.click(); await page.waitForTimeout(200) } }
  else if (w.startsWith('Build Table 1')) { await match(C.TABLE_PAIRS, true); await btn('See your Table 1').click() }
  else if (w.startsWith('Your Table 1')) { await shot('table'); await btn('Next: the cell factory').click() }
  else if (w.startsWith('The cell factory')) { await match(C.FACTORY_PAIRS, false); await btn('Next: the production line').click() }
  else if (w.startsWith('A protein')) { for (const s of C.PROTEIN_ROUTE) await btn(s).click(); await shot('route'); await btn('Check order').click(); await btn('Next: sort by cell type').click() }
  else if (w.startsWith('Sort by cell type')) { await sort(C.TYPE_ROWS); await btn('See your concept map').click() }
  else if (w.startsWith('Your concept map')) { await shot('map'); await btn('Next: Get It?').click() }
  else if (w.startsWith('Get It')) { for (const r of C.REASONS) if (r.supports) await btn(r.text).click(); await btn('Check', { exact: true }).click(); await shot('getit'); await btn('Next: Check Your Progress').click() }
  else if (w.startsWith('The ER')) { for (const x of ['membrane', 'protein', 'surface area', 'ribosomes', 'export', 'lipids', 'detoxifies']) await btn(x).first().click(); await btn('Check answers').click(); await btn('Next: plant and animal cells').click() }
  else if (w.startsWith('Plant and animal')) { await sort(C.COMPARE_ROWS); await btn('Next: the last questions').click() }
  else if (w.startsWith('Check Your Progress')) { for (let q = 0; q < 6; q++) { await page.locator('.choice').nth(1).click(); await page.waitForTimeout(80); await btn(/Next question|See my result/).click(); await page.waitForTimeout(120) } }
  else if (w.startsWith('Result card')) { await page.getByPlaceholder('Type your name').fill('Test Student'); await page.getByPlaceholder('For example 9A').fill('9A'); await shot('result'); break }
  await page.waitForTimeout(250)
}
log('errors:', errors.slice(0, 5))
await browser.close()
