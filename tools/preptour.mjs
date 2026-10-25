// Captures every step of a prep mid-action, as one contact sheet: node tools/preptour.mjs <out.png> <phase> <section> [prevDone]
import { chromium } from 'playwright'
import sharp from 'sharp'
const [out, phase, section] = process.argv.slice(2)
const n = Number(phase.slice(1))
const phases = Object.fromEntries([...Array(n)].map((_, i) => [`p${i}`, { done: true }]))
phases[phase] = { section }
const b = await chromium.launch()
const p = await b.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: Number(process.env.SCALE ?? 1) })
await p.addInitScript((v) => { if (!sessionStorage.getItem('s')) { sessionStorage.setItem('s', '1'); localStorage.setItem('bio-lab:v1', v) } }, JSON.stringify({ sound: false, phases }))
await p.goto(`http://localhost:5180/#/${phase}`); await p.waitForTimeout(1500)
const shots = []
const grab = async () => shots.push(await p.locator('.prep-bench svg').first().screenshot())
for (let i = 0; i < 20; i++) {
  if (await p.getByRole('button', { name: 'Take it to the microscope' }).count()) break
  const sl = p.locator('.prep-action input[type=range]')
  if (await sl.count()) {
    const max = Number(await sl.getAttribute('max'))
    if (max === 45) { await sl.fill('22'); await p.waitForTimeout(200); await grab(); await sl.fill('0') }
    else { await sl.fill('50'); await p.waitForTimeout(300); await grab(); await sl.fill('100') }
  } else {
    const hot = p.locator('.hot-on').first()
    if (!(await hot.count())) { await p.waitForTimeout(400); continue }
    const box = await hot.boundingBox()
    // Hold steps: press and hold on the object for 2 s.
    const text = await p.locator('.prep-action').innerText()
    if (/hold/i.test(text)) { await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await p.mouse.down(); await p.waitForTimeout(1000); await grab(); await p.waitForTimeout(1000); await p.mouse.up() }
    else { await hot.dispatchEvent('click'); await p.waitForTimeout(450); await grab() }
  }
  await p.waitForTimeout(2900)
}
await b.close()
const w = Number(process.env.TILE ?? 410), h = Math.round(w * 240 / 410), cols = 4, rows = Math.ceil(shots.length / cols)
const tiles = await Promise.all(shots.map((s) => sharp(s).resize(w, h, { fit: 'contain', background: '#fff' }).toBuffer()))
await sharp({ create: { width: cols * (w + 6), height: rows * (h + 6), channels: 3, background: '#fff' } }).composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * (w + 6), top: Math.floor(i / cols) * (h + 6) }))).png().toFile(out)
console.log(out, shots.length, 'steps')
