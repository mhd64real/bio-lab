// Cut objects out of a magenta-background sprite sheet into transparent WebP files.
// Usage: node tools/cutout.mjs <sheet.jpg> <outDir> name1:maxPx name2:maxPx ...
// Objects are found as connected regions, ordered top-to-bottom then left-to-right
// (rows are grouped when their vertical centres are within 15% of the image height).
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const [sheet, outDir, ...specs] = process.argv.slice(2)
fs.mkdirSync(outDir, { recursive: true })
const { data, info } = await sharp(sheet).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height
const rgba = Buffer.alloc(W * H * 4)

// Key colour: sample the corners.
const px = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i + 1], data[i + 2]] }
const corners = [px(2, 2), px(W - 3, 2), px(2, H - 3), px(W - 3, H - 3)]
const key = [0, 1, 2].map((c) => corners.reduce((s, p) => s + p[c], 0) / 4)

const km = Math.min(key[0], key[2]) - key[1]
const alpha = new Float32Array(W * H)
for (let i = 0, j = 0; i < W * H; i++, j += 3) {
  const r = data[j], g = data[j + 1], b = data[j + 2]
  // Magenta-ness: how much red and blue both exceed green, compared with the key.
  const m = Math.min(r, b) - g
  alpha[i] = 1 - Math.max(0, Math.min(1, (m - km * 0.18) / (km * 0.5)))
}
// Choke the matte by one pixel: edge pixels are a blend with the background.
const choked = new Float32Array(W * H)
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = y * W + x
  let a = alpha[i]
  if (x > 0) a = Math.min(a, alpha[i - 1] * 0.5 + a * 0.5)
  if (x < W - 1) a = Math.min(a, alpha[i + 1] * 0.5 + a * 0.5)
  if (y > 0) a = Math.min(a, alpha[i - W] * 0.5 + a * 0.5)
  if (y < H - 1) a = Math.min(a, alpha[i + W] * 0.5 + a * 0.5)
  choked[i] = a
}
for (let i = 0, j = 0; i < W * H; i++, j += 3) {
  let r = data[j], g = data[j + 1], b = data[j + 2]
  // Despill everywhere: no object here is genuinely magenta, so any red+blue excess over green is spill
  // (it also clears the tint seen through clear plastic and glass).
  const excess = Math.min(r, b) - g
  if (excess > 0) { r -= excess; b -= excess }
  let a = choked[i]
  if (a > 0.98) a = 1
  rgba[i * 4] = r; rgba[i * 4 + 1] = g; rgba[i * 4 + 2] = b; rgba[i * 4 + 3] = Math.round(Math.max(0, a) * 255)
}

// Connected components on alpha > 40%.
const lab = new Int32Array(W * H).fill(-1)
const boxes = []
for (let s = 0; s < W * H; s++) {
  if (lab[s] !== -1 || rgba[s * 4 + 3] < 100) continue
  const id = boxes.length
  let x0 = W, y0 = H, x1 = 0, y1 = 0, n = 0
  const st = [s]; lab[s] = id
  while (st.length) {
    const p = st.pop(), x = p % W, y = (p / W) | 0
    n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y
    for (const q of [p - 1, p + 1, p - W, p + W]) {
      if (q < 0 || q >= W * H || lab[q] !== -1) continue
      if (Math.abs((q % W) - x) > 1) continue
      if (rgba[q * 4 + 3] >= 100) { lab[q] = id; st.push(q) }
    }
  }
  boxes.push({ x0, y0, x1, y1, n })
}
// Merge small fragments (root hairs etc.) into the nearest big object.
const big = boxes.filter((b) => b.n > W * H * 0.004)
for (const b of boxes) {
  if (big.includes(b) || b.n < 30) continue
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2
  let best = null, bd = Infinity
  for (const g of big) { const d = Math.hypot(cx - (g.x0 + g.x1) / 2, cy - (g.y0 + g.y1) / 2); if (d < bd) { bd = d; best = g } }
  if (best && bd < Math.max(W, H) * 0.25) { best.x0 = Math.min(best.x0, b.x0); best.y0 = Math.min(best.y0, b.y0); best.x1 = Math.max(best.x1, b.x1); best.y1 = Math.max(best.y1, b.y1) }
}
big.sort((a, b) => {
  const ay = (a.y0 + a.y1) / 2, by = (b.y0 + b.y1) / 2
  return Math.abs(ay - by) < H * 0.15 ? a.x0 - b.x0 : ay - by
})
if (big.length !== specs.length) console.warn(`found ${big.length} objects, expected ${specs.length}`)

const full = sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
const fullBuf = await full.png().toBuffer()
for (let k = 0; k < Math.min(big.length, specs.length); k++) {
  const [name, maxPx] = specs[k].split(':')
  const b = big[k], pad = 6
  const left = Math.max(0, b.x0 - pad), top = Math.max(0, b.y0 - pad)
  const width = Math.min(W, b.x1 + pad + 1) - left, height = Math.min(H, b.y1 + pad + 1) - top
  const out = path.join(outDir, `${name}.webp`)
  const meta = await sharp(fullBuf).extract({ left, top, width, height })
    .resize({ width: Number(maxPx), height: Number(maxPx), fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90, effort: 6 }).toFile(out)
  console.log(out, `${meta.width}x${meta.height}`, `${(meta.size / 1024).toFixed(1)} KB`)
}
