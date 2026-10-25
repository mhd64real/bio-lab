import { chromium } from 'playwright'
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2 })
await page.goto('http://localhost:5180/#/dev/optics?obj=40&b=0.75&iris=0.55')
await page.waitForTimeout(1500)
const r = await page.evaluate(async () => {
  const c = document.querySelector('canvas')
  const gl = c.getContext('webgl2')
  // Redraw by forcing resize-free re-render: read back pixels to force GPU sync.
  const px = new Uint8Array(4)
  const times = []
  for (let i = 0; i < 20; i++) {
    const t = performance.now()
    window.dispatchEvent(new Event('bio-redraw'))
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
    times.push(performance.now() - t)
  }
  return { w: c.width, times }
})
console.log(r.w, r.times.map((t) => t.toFixed(1)).join(' '))
await browser.close()
