// Generate one short video with Gemini Omni Flash. Usage: node tools/gen-video.mjs <out.mp4> "<prompt>" [first-frame.jpg]
// The key is read from .env (gitignored) and never printed.
import fs from 'node:fs'

const [out, prompt, ref] = process.argv.slice(2)
const env = Object.fromEntries(fs.readFileSync(new URL('../.env', import.meta.url), 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]))
const key = env.GEMINI_API_KEY
const base = 'https://generativelanguage.googleapis.com/v1beta'
const input = [{ type: 'text', text: prompt }]
if (ref) input.push({ type: 'image', mime_type: 'image/jpeg', data: fs.readFileSync(ref).toString('base64') })
const body = { model: 'gemini-omni-1.1-flash', input, response_format: JSON.parse(process.env.FMT ?? '{"type":"video"}') }
if (process.env.BG) body.background = true

let res = await fetch(`${base}/interactions`, { method: 'POST', headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
let json = await res.json()
if (!res.ok) { console.error('API error', res.status, JSON.stringify(json).slice(0, 800)); process.exit(1) }
const strip = (o) => JSON.stringify(o, (k, v) => (typeof v === 'string' && v.length > 200 ? `<${v.length} chars>` : v)).slice(0, 1500)
console.log('first response:', strip(json))
// Poll if the interaction runs in the background.
for (let i = 0; i < 120 && json.status && !['completed', 'failed', 'cancelled'].includes(json.status); i++) {
  await new Promise((r) => setTimeout(r, 5000))
  res = await fetch(`${base}/interactions/${json.id}`, { headers: { 'x-goog-api-key': key } })
  json = await res.json()
  process.stdout.write(`\r${json.status} ${i * 5}s`)
}
let data = null, uri = null
const walk = (o) => {
  if (!o || typeof o !== 'object') return
  if (o.type === 'video') { if (typeof o.data === 'string') data = o.data; if (typeof o.uri === 'string') uri = o.uri }
  for (const v of Object.values(o)) walk(v)
}
walk(json)
if (data) fs.writeFileSync(out, Buffer.from(data, 'base64'))
else if (uri) { const r = await fetch(uri, { headers: { 'x-goog-api-key': key } }); fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())) }
else { console.error('\nno video found:', strip(json)); process.exit(1) }
console.log('\nsaved', out, (fs.statSync(out).size / 1024).toFixed(0) + ' KB', json.usage ? JSON.stringify(json.usage) : '')
