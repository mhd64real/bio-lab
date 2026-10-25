// Walks through Phase 0 "observe" with real inputs and screenshots key moments.
import { chromium } from 'playwright'

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.addInitScript(() => localStorage.setItem('bio-lab:v1', JSON.stringify({ sound: false, phases: { p0: { section: 'observe', data: { mount: { specimen: 'letter-e', bubbles: [{ x: 1.2, y: 0.9, r: 0.3 }] } } } } })))
await page.goto('http://localhost:5180/#/p0')
await page.waitForTimeout(2000)
const S = () => page.evaluate(() => window.__scope)
const title = () => page.locator('.station-guide h2').first().innerText()
const next = async () => { await page.getByRole('button', { name: /Next step|Finish/ }).click(); await page.waitForTimeout(150) }
const hold = async (key, ms) => { await page.keyboard.down(key); await page.waitForTimeout(ms); await page.keyboard.up(key); await page.waitForTimeout(60) }
const shot = (n) => page.screenshot({ path: `shots/walk-${n}.png` })
const log = async (msg) => { const s = await S(); console.log(msg.padEnd(28), '|', await title(), '| z', s.stageZ.toFixed(1), 'x', s.stageX.toFixed(2), 'y', s.stageY.toFixed(2), 'obj', s.objective) }

async function focusTo(target, key = ']', keyDown = '[', tol = 1) {
  for (let i = 0; i < 80; i++) {
    const s = await S(); const d = target - s.stageZ
    if (Math.abs(d) <= tol) return
    await hold(d > 0 ? key : keyDown, Math.min(1500, Math.max(30, Math.abs(d) * (key === ']' ? 12 : 0.15))))
  }
}
async function centreTo(tx, ty, tol) {
  for (let i = 0; i < 60; i++) {
    const s = await S(); const dx = tx - s.stageX, dy = ty - s.stageY
    if (Math.hypot(dx, dy) <= tol) return
    if (Math.abs(dx) > tol / 2) await hold(dx > 0 ? 'ArrowRight' : 'ArrowLeft', 60)
    if (Math.abs(dy) > tol / 2) await hold(dy > 0 ? 'ArrowUp' : 'ArrowDown', 60)
  }
}

await page.keyboard.press('l'); await log('lamp'); await next()
await page.locator('input[type=range]').first().fill('70'); await log('brightness'); await next()
await page.keyboard.press('1'); await log('4x'); await next()
await page.getByRole('button', { name: 'Place slide on stage' }).click(); await page.waitForTimeout(100); await next()
await page.getByRole('button', { name: 'Clip the slide in' }).click(); await page.waitForTimeout(100); await shot('01-clipped'); await next()
await centreTo(0, 0, 0.5); await log('centred'); await next()
await focusTo(14800, 'PageUp', 'PageDown', 250); await log('coarse'); await shot('02-coarse'); await next()
await focusTo(15000, ']', '[', 15); await log('fine4'); await shot('03-fine4'); await next()
await page.locator('input[type=range]').nth(1).fill('55'); await page.waitForTimeout(100); await log('iris'); await shot('04-iris'); await next()
await page.getByRole('button', { name: /upside down and backwards/ }).click(); await next()
await hold('ArrowRight', 200); await page.getByRole('button', { name: /^B\s*Left$/ }).click().catch(async () => { await page.locator('.choice', { hasText: 'Left' }).click() }); await next()
await centreTo(0, 0, 0.2); await log('centre2'); await next()
await page.keyboard.press('2'); await log('10x'); await shot('05-10x'); await next()
await focusTo(15006, ']', '[', 2); await log('fine10'); await next()
await centreTo(-0.45, 0.1, 0.06); await log('ink edge'); await shot('06-edge10'); console.log('  title now', await title())
await next()
await page.keyboard.press('3'); await log('40x'); await shot('07-40x-blur'); await next()
await focusTo(14997.5, ']', '[', 0.6); await page.locator('input[type=range]').first().fill('85'); await page.waitForTimeout(150); await log('fine40'); await shot('08-40x')
console.log('view:', await page.locator('.station-view').innerText())
await next()
await page.locator('.choice', { hasText: 'long, flat fibres' }).click(); await next()
await page.keyboard.press('1'); await hold('PageDown', 2500)
await page.getByRole('button', { name: 'Take the slide off' }).click(); await page.keyboard.press('l'); await page.waitForTimeout(150)
await log('putaway')
await page.getByRole('button', { name: 'Finish' }).click(); await page.waitForTimeout(400)
console.log('after finish:', (await page.locator('header').innerText()).replace(/\n/g, ' | '))
// Prep bench with a fast coverslip drop.
const p2 = await browser.newPage({ viewport: { width: 1366, height: 768 } })
await p2.addInitScript(() => localStorage.setItem('bio-lab:v1', JSON.stringify({ sound: false, phases: { p0: { section: 'prep' } } })))
await p2.goto('http://localhost:5180/#/p0'); await p2.waitForTimeout(800)
await p2.locator('svg circle.attention-svg').click({ force: true }); await p2.waitForTimeout(100)
await p2.locator('svg g.cursor-pointer').first().click({ force: true }); await p2.waitForTimeout(100)
await p2.locator('svg g.cursor-pointer').first().click({ force: true }); await p2.waitForTimeout(100)
await p2.screenshot({ path: 'shots/prep-cover.png' })
await p2.locator('input[aria-label="Lower the coverslip"]').fill('0')
await p2.waitForTimeout(200)
await p2.screenshot({ path: 'shots/prep-result.png' })
console.log('prep result:', await p2.locator('.station-guide').innerText())
if (errors.length) console.log('ERRORS', errors)
await browser.close()
