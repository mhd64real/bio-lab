// Drives the whole of Phase 1 with real inputs. Usage: node tools/walk1.mjs [fromSection]
import { chromium } from 'playwright'
import { focusSteady } from './lib/focus.mjs'

const from = process.argv[2] ?? 'intro'
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.addInitScript((sec) => {
  if (sessionStorage.getItem('seeded')) return
  sessionStorage.setItem('seeded', '1')
  localStorage.setItem('bio-lab:v1', JSON.stringify({ sound: false, phases: { p0: { done: true }, p1: { section: sec } } }))
}, from)
await page.goto('http://localhost:5180/#/p1')
await page.waitForTimeout(1500)

const S = () => page.evaluate(() => window.__scope)
const sub = async () => (await page.locator('header .text-sm').first().innerText())
const shot = (n) => page.screenshot({ path: `shots/p1-${n}.png` })
const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(50) }
const btn = (name) => page.getByRole('button', { name })

async function answer() {
  const choices = page.locator('.choice:enabled')
  for (let i = 0; i < 6; i++) {
    const n = await choices.count()
    for (let k = 0; k < n; k++) {
      const c = choices.nth(k)
      if (await c.isEnabled() && !(await c.getAttribute('class')).includes('choice-wrong')) { await c.click(); break }
    }
    await page.waitForTimeout(120)
    if (await page.locator('.choice-right').count()) return
  }
}

async function prep(label) {
  for (let i = 0; i < 40; i++) {
    if (await btn('Take it to the microscope').count()) { await shot(`${label}-result`); await btn('Take it to the microscope').click(); await page.waitForTimeout(600); return }
    const slider = page.locator('.prep-action input[type=range]')
    if (await slider.count()) {
      const lowering = (await slider.getAttribute('max')) === '45'
      for (let v = 1; v <= 30; v++) { await slider.fill(String(lowering ? Math.round(45 - 1.5 * v) : Math.round(v * 3.34))); await page.waitForTimeout(30) }
    } else if (await btn('Press and hold').count()) {
      const b = await btn('Press and hold').boundingBox()
      await page.mouse.move(b.x + 20, b.y + 10); await page.mouse.down(); await page.waitForTimeout(5000); await page.mouse.up()
    } else if (await btn('Do it').isEnabled().catch(() => false)) {
      await page.locator('.hot-on').first().dispatchEvent('click')
      await page.waitForTimeout(150)
      if (await page.locator('.prep-action .tabular-nums').count()) await page.waitForTimeout(2800)
    }
    await page.waitForTimeout(800)
  }
  throw new Error('prep stuck: ' + label)
}

async function focusTo(target, up, down, tol) { return focusSteady(S, hold, target, up, down, tol) }
async function centre(tol) {
  for (let i = 0; i < 80; i++) {
    const s = await S()
    if (Math.hypot(s.stageX, s.stageY) <= tol) return
    if (Math.abs(s.stageX) > tol / 2) await hold(s.stageX > 0 ? 'ArrowLeft' : 'ArrowRight', 60)
    if (Math.abs(s.stageY) > tol / 2) await hold(s.stageY > 0 ? 'ArrowDown' : 'ArrowUp', 60)
  }
}
const FOCUS = { 4: 15000, 10: 15006, 40: 14997.5, 100: 15001.5 }

async function station(label) {
  for (let i = 0; i < 60; i++) {
    if (!(await page.locator('.station-view').count()) || !(await page.locator('.station-guide h2').count())) return
    const title = await page.locator('.station-guide h2').first().innerText()
    const s = await S()
    if (title === 'Place the slide') await btn('Place slide on stage').click()
    else if (title === 'Clip it in') await btn('Clip the slide in').click()
    else if (title === 'Line up the specimen') await centre(0.5)
    else if (title === 'Find it with coarse focus') await focusTo(14850, 'PageUp', 'PageDown', 200, 0.15)
    else if (title.startsWith('Sharpen') || title.startsWith('Fine focus')) {
      await focusTo(FOCUS[s.objective], ']', '[', s.objective >= 40 ? 0.4 : 3, 12)
      if (title.includes('light')) { await page.locator('input[type=range]').first().fill(s.objective === 100 ? '100' : '85'); await page.locator('input[type=range]').nth(1).fill(s.objective === 100 ? '85' : '60') }
    }
    else if (title.startsWith('Switch to')) await page.keyboard.press({ '4x': '1', '10x': '2', '40x': '3', '100x': '4' }[title.split(' ').pop()])
    else if (title === 'Focus through the cell') { await focusTo(FOCUS[40] - 3, ']', '[', 0.4, 12); await focusTo(FOCUS[40], ']', '[', 0.4, 12) }
    else if (title === 'Add a drop of immersion oil') await btn('Add a drop of immersion oil').click()
    else if (title === 'Put the microscope away') {
      // Try every put-away action each round; the lock only lets the right one through.
      for (let j = 0; j < 8; j++) {
        await page.keyboard.press('1')
        if ((await S()).stageZ >= 12000) await hold('PageDown', 2600)
        if (await btn('Take the slide off').count()) await btn('Take the slide off').click()
        if (await btn(/Wipe the 100x lens/).isEnabled().catch(() => false)) await btn(/Wipe the 100x lens/).click()
        await page.keyboard.press('1')
        if (label === 'yogurt' && (await S()).lampOn && (await S()).slide === 'none' && !(await S()).lensOily) await page.keyboard.press('l')
        await page.waitForTimeout(100)
        if (await btn(/Next step|Finish/).isEnabled()) break
      }
    }
    else if (await page.locator('.choice').count()) await answer()
    await page.waitForTimeout(150)
    const next = btn(/Next step|Finish/)
    if (await next.isDisabled()) { const t = await S(); console.log(`  stuck at "${title}" z=${t.stageZ.toFixed(1)} obj=${t.objective} view="${await page.locator('.station-view').innerText()}"`); await shot(`${label}-stuck`); throw new Error('stuck') }
    if (title.startsWith('Focus through') || title.startsWith('Fine focus')) await shot(`${label}-${title.slice(0, 5)}-${s.objective}`)
    await next.click(); await page.waitForTimeout(200)
  }
}

const order = ['intro', 'onionPrep', 'onionScope', 'cheekPrep', 'cheekScope', 'yogurtPrep', 'yogurtScope', 'compare', 'check']
for (let i = 0; i < 20; i++) {
  const where = await sub()
  console.log('section:', where)
  if (where.startsWith('Cell structures')) {
    for (let k = 0; k < 3; k++) { if (await page.locator('.choice').count()) await answer(); await page.getByRole('button', { name: /^Next$|Start: onion/ }).click(); await page.waitForTimeout(200) }
  } else if (where.startsWith('Plant cell: prepare')) await prep('onion')
  else if (where.startsWith('Plant cell: observe')) await station('onion')
  else if (where.startsWith('Animal cell: prepare')) await prep('cheek')
  else if (where.startsWith('Animal cell: observe')) await station('cheek')
  else if (where.startsWith('Prokaryotes: Gram')) await prep('yogurt')
  else if (where.startsWith('Prokaryotes: observe')) await station('yogurt')
  else if (where.startsWith('Compare')) {
    for (let c = 0; c < 3; c++) {
      await shot(`compare-${c}`)
      // Solve find tasks by trying every part until the task advances.
      for (let t = 0; t < 8; t++) {
        if (await btn(/^Next:/).count()) break
        const parts = page.locator('.cell-part')
        const n = await parts.count()
        const task = async () => (await page.locator('text=/Task \\d+ of/').count()) ? await page.locator('text=/Task \\d+ of/').innerText() : 'done'
        const before = await task()
        for (let k = n - 1; k >= 0; k--) { await parts.nth(k).dispatchEvent('click'); await page.waitForTimeout(30); if ((await task()) !== before) break }
      }
      await btn(/^Next:/).click(); await page.waitForTimeout(300)
    }
    const answers = { Nucleus: [0, 1], 'Cell membrane': [0, 1, 2], Cytoplasm: [0, 1, 2], Ribosomes: [0, 1, 2], Mitochondria: [0, 1], Chloroplasts: [1], 'Central vacuole': [1], 'Cell wall': [1, 2], Centrioles: [0], Capsule: [2] }
    for (const [name, cols] of Object.entries(answers)) for (const c of cols) await page.getByRole('button', { name: `${name} in ${['Animal cell', 'Plant cell', 'Prokaryotic cell'][c]}` }).click()
    await btn('Check answers').click(); await shot('sort'); await btn('Next: quick check').click(); await page.waitForTimeout(300)
  } else if (where.startsWith('Quick check')) {
    for (let q = 0; q < 9; q++) { await page.locator('.choice').nth(1).click(); await page.waitForTimeout(100); await page.getByRole('button', { name: /Next question|See my result/ }).click(); await page.waitForTimeout(150) }
  } else if (where.startsWith('Finished')) { await shot('done'); break }
  else { await page.waitForTimeout(500) }
}
console.log('errors:', errors)
await browser.close()
