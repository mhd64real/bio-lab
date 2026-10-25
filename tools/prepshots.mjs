// Steps through one prep, screenshotting mid-step and after each step. Usage: node tools/prepshots.mjs onionPrep onion
import { chromium } from 'playwright'
const [section, tag] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
await page.addInitScript((sec) => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', '1'); localStorage.setItem('bio-lab:v1', JSON.stringify({ sound: false, phases: { p0: { done: true }, p1: { section: sec } } })) } }, section)
await page.goto('http://localhost:5180/#/p1'); await page.waitForTimeout(1200)
for (let i = 0; i < 20; i++) {
  if (await page.getByRole('button', { name: 'Take it to the microscope' }).count()) { await page.screenshot({ path: `shots/prep-${tag}-end.png` }); break }
  const title = await page.locator('.station-guide h2').first().innerText()
  const slider = page.locator('.prep-action input[type=range]')
  if (await slider.count()) {
    const max = Number(await slider.getAttribute('max'))
    const lowering = max === 45
    for (let v = 1; v <= 10; v++) { await slider.fill(String(lowering ? Math.round(45 - 4.5 * v) : v * 10)); await page.waitForTimeout(40); if (v === 5) await page.screenshot({ path: `shots/prep-${tag}-${i}-mid.png` }) }
  } else if (await page.getByRole('button', { name: 'Press and hold' }).count()) {
    const b = await page.getByRole('button', { name: 'Press and hold' }).boundingBox()
    await page.mouse.move(b.x + 20, b.y + 10); await page.mouse.down(); await page.waitForTimeout(2500); await page.screenshot({ path: `shots/prep-${tag}-${i}-mid.png` }); await page.waitForTimeout(2500); await page.mouse.up()
  } else {
    await page.screenshot({ path: `shots/prep-${tag}-${i}-before.png` })
    const hot = page.locator('.hot-on').first()
    for (let k = 0; k < 3; k++) { if (await page.getByRole('button', { name: 'Do it' }).isEnabled().catch(() => false)) { await hot.dispatchEvent('click'); await page.waitForTimeout(120) } }
    await page.waitForTimeout(1400)
  }
  await page.waitForTimeout(900)
  console.log(i, title)
}
console.log('errors', errors)
await browser.close()
