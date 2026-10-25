// Screenshots of the Phase 4 slicing bench at given knife settings: node tools/sliceshot.mjs <outPrefix> h,tilt ...
import { chromium } from 'playwright'
const [out, ...cuts] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } })
await page.addInitScript(() => localStorage.setItem('bio-lab:v1', JSON.stringify({ sound: false, phases: { p0: { done: true }, p1: { done: true }, p2: { done: true }, p3: { done: true }, p4: { section: 'slice' } } })))
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto('http://localhost:5180/#/p4')
await page.waitForTimeout(1500)
const ranges = page.locator('input[type=range]')
for (const [i, c] of cuts.entries()) {
  const [h, t] = c.split(',').map(Number)
  await ranges.nth(0).fill(String(Math.round(h)))
  await ranges.nth(1).fill(String(Math.round(t)))
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${out}${i}.png` })
}
if (errors.length) console.log(errors.join('\n'))
await browser.close()
