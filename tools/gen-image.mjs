// Generate one image with Nano Banana 2.1 at the smallest size (1K).
// Usage: node tools/gen-image.mjs <out.jpg> <aspect> "<prompt>" [ref1.png ref2.png ...]
// The key is read from .env (gitignored) and never printed.
import fs from 'node:fs'

const [out, aspect, prompt, ...refs] = process.argv.slice(2)
if (!out || !aspect || !prompt) { console.error('usage: gen-image.mjs <out.jpg> <aspect> "<prompt>" [refs...]'); process.exit(1) }

const env = Object.fromEntries(fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const key = env.GEMINI_API_KEY
if (!key) { console.error('GEMINI_API_KEY missing from .env'); process.exit(1) }

const input = [{ type: 'text', text: prompt }, ...refs.map((r) => ({ type: 'image', mime_type: 'image/png', data: fs.readFileSync(r).toString('base64') }))]
const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
  method: 'POST',
  headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'gemini-nano-banana-2.1', input, response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: aspect, image_size: '1K' } }),
})
const json = await res.json()
if (!res.ok) { console.error('API error', res.status, JSON.stringify(json).slice(0, 600)); process.exit(1) }

// Take the last image block in the response (the final render; earlier ones are thinking drafts).
let found = null
const walk = (o) => {
  if (!o || typeof o !== 'object') return
  if (o.type === 'image' && typeof o.data === 'string') found = o.data
  for (const v of Object.values(o)) walk(v)
}
walk(json.output_image ?? null)
if (!found) walk(json.steps ?? json)
if (!found) { console.error('no image in response', JSON.stringify(json).slice(0, 600)); process.exit(1) }
fs.writeFileSync(out, Buffer.from(found, 'base64'))
console.log('saved', out, json.usage ? JSON.stringify(json.usage) : '')
