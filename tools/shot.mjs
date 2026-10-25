// Screenshot helper: node tools/shot.mjs <out.png> <hash> [width] [height]
import { chromium } from 'playwright'

const [out, hash = '', w = '1000', h = '1000'] = process.argv.slice(2)
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 })
if (process.env.STORE) await page.addInitScript((v) => localStorage.setItem('bio-lab:v1', v), process.env.STORE)
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))
await page.goto(`http://localhost:5180/${hash}`)
await page.waitForTimeout(Number(process.env.WAIT ?? 1500))
await page.screenshot({ path: out })
if (errors.length) console.log('ERRORS:\n' + errors.join('\n'))
await browser.close()
