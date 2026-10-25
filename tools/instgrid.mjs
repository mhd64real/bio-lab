// Grid of instrument views for comparing shader states side by side:
// node tools/instgrid.mjs <out.png> <inst> '<base json>' '<patch json>' ...
import { chromium } from 'playwright'
import sharp from 'sharp'

const [out, inst, base, ...patches] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
const tiles = []
for (const p of patches) {
  const s = { ...JSON.parse(base), ...JSON.parse(p) }
  await page.goto(`http://localhost:5180/#/dev/inst?i=${inst}&s=${encodeURIComponent(JSON.stringify(s))}`)
  await page.waitForTimeout(Number(process.env.WAIT ?? 1200))
  tiles.push(await page.locator('canvas').first().screenshot())
}
await browser.close()
const metas = await Promise.all(tiles.map((t) => sharp(t).metadata()))
const w = Math.max(...metas.map((m) => m.width)), h = Math.max(...metas.map((m) => m.height))
const cols = Math.min(2, tiles.length), rows = Math.ceil(tiles.length / cols)
await sharp({ create: { width: cols * (w + 8), height: rows * (h + 8), channels: 3, background: '#fff' } })
  .composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * (w + 8), top: Math.floor(i / cols) * (h + 8) })))
  .png().toFile(out)
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'))
