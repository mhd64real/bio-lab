import { Hot, type PrepDef, type SceneProps } from '../../lab/PrepRunner'
import { BlotPaper, Bottle, Caption, CoverInset, Dropper, mix, Slide, Stage } from './sceneKit'
import { OnionArtScene } from './onionArt'
import { CheekArtScene } from './cheekArt'
import { GramArtScene } from './gramArt'

const WATER: [number, number, number] = [150, 205, 240]
const IODINE: [number, number, number] = [205, 145, 35]
const BLUE: [number, number, number] = [55, 100, 200]

// ---------------------------------------------------------------------------
// Onion epidermis

function OnionBulb() {
  return (
    <g transform="translate(190 262)" filter="url(#sh)">
      {[-14, -6, 2, 10].map((x) => <path key={x} d={`M${x} 82 q${x * 0.4} 16 ${x * 0.9} 26`} stroke="#b98b55" strokeWidth="2" fill="none" />)}
      <path d="M0 -96 C22 -70 88 -56 88 6 C88 62 46 86 0 86 C-46 86 -88 62 -88 6 C-88 -56 -22 -70 0 -96 Z" fill="url(#onionSkin)" stroke="#8a4f1c" strokeWidth="2" />
      {[[-60, -30], [-30, -10], [0, 0], [30, -10], [60, -30]].map(([cx, c], i) => (
        <path key={i} d={`M0 -92 C${cx * 0.6 + c} -50 ${cx * 1.1} 30 ${cx * 0.55} 84`} stroke="#a8652a" strokeWidth="1.6" fill="none" opacity="0.7" />
      ))}
      <path d="M-4 -96 q-8 -22 -2 -34 M2 -96 q6 -20 12 -30 M0 -96 q0 -24 2 -36" stroke="#a37444" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="-34" cy="-30" rx="18" ry="30" fill="#fff" opacity="0.15" />
    </g>
  )
}

function OnionHalf({ notch }: { notch: boolean }) {
  // The cut face: rings of fleshy scale leaves inside the papery skin.
  return (
    <g transform="translate(200 262)" filter="url(#sh)">
      <ellipse rx="92" ry="80" fill="#c98a45" stroke="#8a4f1c" strokeWidth="2" />
      {[84, 72, 60, 48, 36, 24, 12].map((r, i) => (
        <ellipse key={r} rx={r} ry={r * 0.88} cy={i * 1.5} fill={i % 2 ? '#fbf3d8' : 'url(#onionFlesh)'} stroke="#e4d29c" strokeWidth="2" />
      ))}
      {notch && <path d="M40 -42 l22 -10 l8 18 l-22 10 z" fill="#d9c58c" stroke="#bfa766" />}
    </g>
  )
}

function Knife({ x, y, rot }: { x: number; y: number; rot: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} filter="url(#sh)">
      <path d="M0 -9 L150 -9 Q170 -6 176 4 L0 9 Z" fill="#dfe5ec" stroke="#9aa6b5" strokeWidth="1.5" />
      <rect x="-80" y="-10" width="82" height="20" rx="7" fill="#2f3a48" />
      <circle cx="-60" cy="0" r="2.5" fill="#c9d1da" /><circle cx="-30" cy="0" r="2.5" fill="#c9d1da" />
    </g>
  )
}

function Forceps({ x, y, rot, open = 6 }: { x: number; y: number; rot: number; open?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} filter="url(#sh)">
      <path d={`M0 0 L120 ${-open} L122 ${-open + 3} L2 3 Z`} fill="#c9d1da" stroke="#8a96a8" strokeWidth="1.2" />
      <path d={`M0 0 L120 ${open} L122 ${open - 3} L2 -3 Z`} fill="#dfe5ec" stroke="#8a96a8" strokeWidth="1.2" />
    </g>
  )
}

function PeelInset({ p }: { p: number }) {
  // The onion piece seen up close: the inner skin is peeled off from left to right as a see-through ribbon.
  const L = 190, x0 = -95
  const peeled = p * L
  const bx = x0 + peeled // where the skin is still attached
  const tipX = x0 + peeled * 0.35, tipY = -peeled * 0.48
  const ribbon = `M${bx} -2 Q${bx - peeled * 0.25} -10 ${tipX} ${tipY} L${tipX + 10} ${tipY + 12} Q${bx - peeled * 0.18} 2 ${bx} 6 Z`
  return (
    <g transform="translate(560 170)">
      <circle r="120" fill="#fff" stroke="#d6dee8" strokeWidth="3" filter="url(#sh)" />
      <g clipPath="url(#insetClip)">
        <rect x="-110" y="4" width="220" height="56" rx="8" fill="#f8efcf" stroke="#e1cd8f" strokeWidth="2" />
        {[20, 34, 48].map((y) => <path key={y} d={`M-104 ${y} H104`} stroke="#ecdcaa" strokeWidth="2" />)}
        {/* skin still attached on the right */}
        <rect x={bx} y="-2" width={95 - bx} height="8" fill="rgba(225,240,252,0.9)" stroke="#9bb8cf" strokeWidth="1" />
        {p > 0.02 && (
          <g>
            <path d={ribbon} fill="rgba(225,240,252,0.85)" stroke="#8fb0c9" strokeWidth="1.5" />
            {Array.from({ length: Math.floor(peeled / 14) }, (_, i) => {
              const t = (i + 0.5) / Math.max(1, Math.floor(peeled / 14))
              const x = bx + (tipX - bx) * t, y = tipY * t
              return <circle key={i} cx={x + 4} cy={y + 3} r="2.2" fill="none" stroke="#a9c3d6" strokeWidth="0.8" />
            })}
            <g transform={`translate(${tipX + 4} ${tipY + 6}) scale(1.5)`}><Forceps x={0} y={0} rot={-125} open={2} /></g>
          </g>
        )}
      </g>
      <text y="98" textAnchor="middle" fontSize="12.5" fontWeight="900" fill="#5a6779">So thin you can see through it</text>
      <text y="-98" textAnchor="middle" fontSize="13" fontWeight="900" fill="#5a6779">close-up</text>
    </g>
  )
}

export function OnionScene({ flags, active, progress, angle, bubbles }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const stained = has('iodine') ? 1 : active === 'iodine' && has('iodine:started') ? progress : 0
  const liquid = mix(WATER, IODINE, stained, 0.4 + 0.15 * stained)
  return (
    <Stage label="Bench with an onion, knife, forceps, slide and stains">
      <rect x="40" y="150" width="310" height="240" rx="20" fill="url(#wood)" filter="url(#sh)" />
      {[175, 215, 300, 350].map((y) => <path key={y} d={`M60 ${y} q140 -10 270 4`} stroke="#d4a46b" strokeWidth="1.5" fill="none" opacity="0.6" />)}

      <Hot id={['cut', 'piece']} ring={{ cx: 195, cy: 262, r: 112 }}>
        {has('cut') ? <OnionHalf notch={has('piece')} /> : <OnionBulb />}
        <rect x="80" y="150" width="240" height="230" fill="transparent" />
      </Hot>
      {has('cut') && <path d="M60 190 C60 150 120 140 130 175 Z" fill="#c98a45" stroke="#8a4f1c" transform="translate(-10 0)" opacity="0.9" />}
      <Knife x={has('cut') ? 110 : 120} y={has('cut') ? 405 : 412} rot={has('cut') ? -6 : 0} />
      {has('piece') && !has('peel') && <path d="M282 330 q16 -8 32 0 l-4 18 q-12 -6 -24 0 z" fill="#f8efcf" stroke="#d6c58f" strokeWidth="1.5" />}

      <BlotPaper x={392} y={96} stain={has('blot') ? liquid : undefined} />
      <Hot id="peel"><Forceps x={360} y={330} rot={-14} /></Hot>
      <Hot id="iodine" ring={{ cx: 744, cy: 96, r: 52 }}><Bottle x={744} y={92} colour="#b5761a" label="IODINE" /></Hot>
      <Hot id="water" ring={{ cx: 780, cy: 230, r: 40 }}>{active !== 'water' && <Dropper x={780} y={238} bulb="#3a9fe0" liquid="rgba(150,205,240,0.8)" />}</Hot>

      <Hot id={['lay', 'blot']} ring={{ cx: 630, cy: 400, r: 70 }}>
        <Slide x={600} y={400} label="Onion" bubbles={bubbles} cover={has('cover')}>
          {has('water') && <ellipse rx={has('cover') ? 46 : 26} ry={has('cover') ? 40 : 19} fill={liquid} />}
          {has('lay') && <path d="M-16 -14 q16 -5 32 2 q4 14 -2 28 q-16 5 -30 -2 q-4 -14 0 -28 z" fill={mix([250, 245, 228], IODINE, stained, 0.85)} stroke="#c9b37a" strokeWidth="1.2" />}
          {has('blot') && <rect x="46" y="-34" width="34" height="68" rx="3" fill="#fbfbf7" stroke="#d9dde3" />}
        </Slide>
      </Hot>
      {active === 'water' && <Dropper x={630} y={300} bulb="#3a9fe0" liquid="rgba(150,205,240,0.8)" drip={progress} />}
      {active === 'iodine' && <Dropper x={630} y={300} bulb="#b5761a" liquid="rgba(205,145,35,0.85)" drip={has('iodine:started') ? 1 - (1 - progress) * 0.0 : 0} />}

      {(active === 'peel' || (has('peel') && !has('lay'))) && <PeelInset p={has('peel') ? 1 : progress} />}
      {active === 'cover' && <CoverInset x={560} y={170} angle={angle} liquid={liquid} />}
      {active === 'cut' && <Caption x={195} y={140}>A whole onion bulb</Caption>}
      {active === 'piece' && <Caption x={200} y={140}>Each ring is a fleshy scale leaf</Caption>}
    </Stage>
  )
}

export const ONION_PREP: PrepDef = {
  name: 'Onion epidermis wet mount',
  // Experiment branch: generated photo sprites. The code-drawn OnionScene stays for comparison.
  Scene: OnionArtScene,
  steps: [
    { id: 'cut', kind: 'tap', action: 'Tap the onion to cut it in half', title: 'Cut the onion', body: 'Cut the onion bulb in half with the knife. Inside you can see rings: each ring is a fleshy layer called a scale leaf.' },
    { id: 'piece', kind: 'tap', action: 'Tap one of the rings to cut a piece out', title: 'Cut out a small piece', body: 'Cut a small square from one of the fleshy scale leaves, about the size of your fingernail.' },
    { id: 'water', kind: 'tap', action: 'Tap the water dropper', title: 'A drop of water on the slide', body: 'Put one drop of water in the middle of a clean slide. The onion skin will lie flat in it.' },
    { id: 'peel', kind: 'drag', action: 'Drag to peel the skin off', title: 'Peel the thin skin', body: 'Snap the piece backwards. On the inside surface is a very thin skin, the epidermis. Grip its edge with the forceps and peel it off slowly. It is only one cell thick.' },
    { id: 'lay', kind: 'tap', action: 'Tap the slide to lay the skin in the drop', title: 'Lay it flat', body: 'Lay the skin flat in the drop. If it folds, you will look through two layers of cells at once.' },
    { id: 'iodine', kind: 'timer', seconds: 60, action: 'Tap the iodine bottle', title: 'Stain with iodine', body: 'Add one drop of iodine solution and wait one minute. Onion cells are almost colourless; iodine stains them yellow-brown and makes the nucleus stand out.', tip: 'Iodine stains skin and clothes. One drop is enough.' },
    { id: 'cover', kind: 'lower', action: 'Lower the coverslip', title: 'Lower the coverslip', body: 'Touch one edge of the coverslip to the liquid, then lower it slowly so the liquid pushes the air out.' },
    { id: 'blot', kind: 'tap', action: 'Tap the slide to blot the extra liquid', title: 'Soak up the extra liquid', body: 'Touch blotting paper to the edge of the coverslip to soak up the extra stain.' },
  ],
  mount: (o) => ({ specimen: 'onion', bubbles: o.bubbles }),
  verdict: (o) => (o.bubbles.length ? <p className="leading-relaxed">You trapped <b>{o.bubbles.length} air bubble{o.bubbles.length > 1 ? 's' : ''}</b>. They will show as dark rings. You can make it again or keep it.</p> : null),
}

// ---------------------------------------------------------------------------
// Cheek cells

function Swab({ x, y, rot, cells = 0 }: { x: number; y: number; rot: number; cells?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} filter="url(#sh)">
      <rect x="0" y="-3.5" width="170" height="7" rx="3.5" fill="#f4f6f8" stroke="#c9d1da" />
      <ellipse cx="-4" cy="0" rx="18" ry="11" fill="#fff" stroke="#d6dee8" strokeWidth="1.5" />
      {Array.from({ length: Math.round(cells * 10) }, (_, i) => <circle key={i} cx={-14 + (i * 7) % 22} cy={-6 + ((i * 5) % 12)} r="2" fill="#efe6d6" stroke="#d8cbb2" strokeWidth="0.6" />)}
    </g>
  )
}

function ScrapeInset({ p }: { p: number }) {
  const sx = -50 + Math.sin(p * Math.PI * 4) * 40
  return (
    <g transform="translate(560 170)">
      <circle r="120" fill="#fff" stroke="#d6dee8" strokeWidth="3" filter="url(#sh)" />
      <g clipPath="url(#insetClip)">
        <path d="M-130 40 q30 -12 60 0 t60 0 t60 0 t60 0 V140 H-130 Z" fill="#f2a8a8" />
        <path d="M-130 40 q30 -12 60 0 t60 0 t60 0 t60 0" stroke="#e08a8a" strokeWidth="3" fill="none" />
        {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={-110 + i * 16} cy={44 + (i % 3) * 3} r="3" fill="#fbe9e4" stroke="#e7b5ad" strokeWidth="0.8" />)}
        <Swab x={sx} y={22} rot={-35} cells={p} />
      </g>
      <text y="96" textAnchor="middle" fontSize="12.5" fontWeight="900" fill="#5a6779">Lining of the cheek: loose cells rub off</text>
      <text y="-98" textAnchor="middle" fontSize="13" fontWeight="900" fill="#5a6779">close-up</text>
    </g>
  )
}

export function CheekScene({ flags, active, progress, angle, bubbles }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const stained = has('stain') ? 1 : active === 'stain' && has('stain:started') ? progress : 0
  const liquid = mix(WATER, BLUE, stained, 0.35 + 0.15 * stained)
  const smear = has('smear') ? 1 : active === 'smear' ? progress : 0
  const swabOut = has('open')
  const swabGone = has('bin')
  return (
    <Stage label="Bench with a swab, disinfectant, methylene blue and a slide">
      <Hot id="open" ring={{ cx: 165, cy: 150, r: 100 }}>
        <g transform="translate(70 130) rotate(-8)" filter="url(#sh)">
          <rect width="200" height="44" rx="6" fill={swabOut ? '#eef1f5' : '#ffffff'} stroke="#c9d1da" strokeDasharray={swabOut ? '6 4' : undefined} />
          <text x="100" y="27" textAnchor="middle" fontSize="13" fontWeight="900" fill="#5a6779">{swabOut ? 'opened' : 'STERILE SWAB'}</text>
        </g>
      </Hot>
      {swabOut && !swabGone && active !== 'scrape' && active !== 'smear' && <Swab x={110} y={240} rot={-4} cells={has('scrape') ? 1 : 0} />}

      <Hot id="bin" ring={{ cx: 140, cy: 370, r: 70 }}>
        <g transform="translate(140 370)" filter="url(#sh)">
          <rect x="-46" y="-50" width="92" height="104" rx="10" fill="rgba(245,190,200,0.55)" stroke="#d98b98" strokeWidth="2" />
          <rect x="-50" y="-60" width="100" height="16" rx="4" fill="#d93f45" />
          <rect x="-32" y="-12" width="64" height="26" rx="3" fill="#fff" />
          <text y="5" textAnchor="middle" fontSize="9" fontWeight="900" fill="#d93f45">DISINFECTANT</text>
          {swabGone && <rect x="-8" y="-90" width="5" height="120" rx="2.5" fill="#f4f6f8" stroke="#c9d1da" transform="rotate(12)" />}
        </g>
      </Hot>

      <BlotPaper x={392} y={96} stain={has('blot') ? liquid : undefined} />
      <Hot id="stain" ring={{ cx: 744, cy: 96, r: 52 }}><Bottle x={744} y={92} colour="#2f5fc4" label="METH. BLUE" /></Hot>

      <Hot id={['blot']} ring={{ cx: 630, cy: 400, r: 70 }}>
        <Slide x={600} y={400} label="Cheek" bubbles={bubbles} cover={has('cover')}>
          {smear > 0 && <ellipse rx={8 + 30 * smear} ry={6 + 12 * smear} fill={mix([235, 228, 214], BLUE, stained, 0.75)} />}
          {has('stain:started') && <ellipse rx={has('cover') ? 46 : 28} ry={has('cover') ? 40 : 20} fill={liquid} />}
          {has('blot') && <rect x="46" y="-34" width="34" height="68" rx="3" fill="#fbfbf7" stroke="#d9dde3" />}
        </Slide>
      </Hot>
      {active === 'smear' && <Swab x={600 + (smear - 0.5) * 70} y={386} rot={-28} cells={1 - smear * 0.6} />}
      {active === 'stain' && <Dropper x={630} y={300} bulb="#2f5fc4" liquid="rgba(55,100,200,0.85)" drip={has('stain:started') ? 1 : 0} />}
      {active === 'scrape' && <ScrapeInset p={progress} />}
      {active === 'cover' && <CoverInset x={560} y={170} angle={angle} liquid={liquid} />}
    </Stage>
  )
}

export const CHEEK_PREP: PrepDef = {
  name: 'Cheek cell smear',
  Scene: CheekArtScene,
  steps: [
    { id: 'open', kind: 'tap', action: 'Tap the swab packet to open it', title: 'Open a sterile swab', body: 'Take a new, sterile cotton swab from its packet. Never use a swab that has touched anything else.' },
    { id: 'scrape', kind: 'drag', action: 'Drag to rub the inside of your cheek', title: 'Rub the inside of your cheek', body: 'Gently rub the swab on the inside of your cheek. The lining of your mouth sheds cells all the time, so they come off easily and it does not hurt.' },
    { id: 'smear', kind: 'drag', action: 'Drag to roll the swab across the slide', title: 'Smear it on the slide', body: 'Roll the swab across the middle of the slide to leave a thin, even smear of cells.' },
    { id: 'bin', kind: 'tap', action: 'Tap the disinfectant jar', title: 'Dispose of the swab', body: 'Put the used swab straight into the disinfectant. Anything that has been in a mouth is treated as a biological hazard.' },
    { id: 'stain', kind: 'timer', seconds: 60, action: 'Tap the methylene blue bottle', title: 'Stain with methylene blue', body: 'Add one drop of methylene blue and wait one minute. The stain is taken up most by the nucleus, so it shows up dark blue.' },
    { id: 'cover', kind: 'lower', action: 'Lower the coverslip', title: 'Lower the coverslip', body: 'Touch one edge to the liquid and lower the coverslip slowly.' },
    { id: 'blot', kind: 'tap', action: 'Tap the slide to blot the extra stain', title: 'Soak up the extra stain', body: 'Touch blotting paper to the edge of the coverslip.' },
  ],
  mount: (o) => ({ specimen: 'cheek', bubbles: o.bubbles }),
  verdict: (o) => (o.bubbles.length ? <p className="leading-relaxed">You trapped <b>{o.bubbles.length} air bubble{o.bubbles.length > 1 ? 's' : ''}</b>. You can make it again or keep it.</p> : null),
}

// ---------------------------------------------------------------------------
// Gram stain

const decolour = (held: number) => (held < 2.5 ? -1 : held > 9 ? 1 : 0)

function Burner({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} filter="url(#sh)">
      <ellipse cx="0" cy="70" rx="44" ry="12" fill="#3b4655" />
      <rect x="-9" y="-30" width="18" height="100" rx="3" fill="#8a96a8" />
      <rect x="-12" y="30" width="24" height="10" rx="2" fill="#5a6779" />
      {lit && (
        <g className="flame">
          <path d="M0 -110 C16 -80 14 -48 0 -32 C-14 -48 -16 -80 0 -110 Z" fill="#7cc4ff" opacity="0.55" />
          <path d="M0 -78 C8 -62 7 -46 0 -36 C-7 -46 -8 -62 0 -78 Z" fill="#2f7fe0" opacity="0.85" />
        </g>
      )}
    </g>
  )
}

function WashBottle({ x, y, squirt }: { x: number; y: number; squirt: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} filter="url(#sh)">
      <rect x="-26" y="-10" width="52" height="80" rx="14" fill="rgba(220,238,250,0.95)" stroke="#86b4cf" strokeWidth="2" />
      <rect x="-8" y="-24" width="16" height="16" rx="3" fill="#3a9fe0" />
      <path d="M0 -24 L0 -40 L-60 -60" stroke="#3a9fe0" strokeWidth="4" fill="none" strokeLinecap="round" />
      <text y="38" textAnchor="middle" fontSize="9" fontWeight="900" fill="#2f6f99">WATER</text>
      {squirt && <path d="M-60 -60 Q-140 -40 -250 150" stroke="rgba(120,190,235,0.8)" strokeWidth="4" fill="none" strokeDasharray="10 6" />}
    </g>
  )
}

function smearColour(flags: Set<string>, active: string | null, p: number, held: number | undefined) {
  const cream: [number, number, number] = [236, 230, 218]
  const violet: [number, number, number] = [92, 40, 160]
  const dark: [number, number, number] = [70, 28, 125]
  const pink: [number, number, number] = [214, 90, 140]
  const has = (f: string) => flags.has(f)
  if (has('safranin')) return mix(held !== undefined && held > 9 ? pink : violet, pink, 0.35, 0.85)
  if (active === 'safranin' && has('safranin:started')) return mix(dark, pink, p * 0.35, 0.85)
  if (has('alcohol')) return mix(dark, cream, held !== undefined ? Math.min(1, held / 12) : 0.3, 0.85)
  if (active === 'alcohol') return mix(dark, cream, p * 0.8, 0.85)
  if (has('gramIodine')) return mix(dark, dark, 0, 0.88)
  if (active === 'gramIodine' && has('gramIodine:started')) return mix(violet, dark, p, 0.88)
  if (has('crystal')) return mix(violet, violet, 0, 0.85)
  if (active === 'crystal' && has('crystal:started')) return mix(cream, violet, p, 0.85)
  return mix(cream, cream, 0, 0.9)
}

export function GramScene({ flags, active, progress }: SceneProps) {
  const has = (f: string) => flags.has(f)
  const smear = has('smear') ? 1 : active === 'smear' ? progress : 0
  const colour = smearColour(flags, active, progress, undefined)
  const pouring = (id: string) => active === id && (has(`${id}:started`) || (id === 'alcohol' && progress > 0))
  const bottles: { id: string; x: number; colour: string; label: string }[] = [
    { id: 'crystal', x: 270, colour: '#6b2fb3', label: 'CRYSTAL VIOLET' },
    { id: 'gramIodine', x: 370, colour: '#8a5a12', label: "GRAM'S IODINE" },
    { id: 'alcohol', x: 470, colour: '#b9c3cf', label: 'ALCOHOL' },
    { id: 'safranin', x: 570, colour: '#d6336c', label: 'SAFRANIN' },
  ]
  return (
    <Stage label="Staining bench with burner, stains, wash bottle and a slide on a rack">
      <rect x="240" y="300" width="420" height="150" rx="14" fill="#5a6779" filter="url(#sh)" />
      <rect x="252" y="312" width="396" height="126" rx="8" fill="#46515f" />
      {[345, 395].map((y) => <rect key={y} x="262" y={y} width="376" height="6" rx="3" fill="#c9d1da" />)}
      <Hot id={['water', 'blot']} ring={{ cx: 450, cy: 370, r: 70 }}>
        <Slide x={420} y={370} label="Yogurt">
          {has('water') && !has('dry') && <ellipse rx={smear > 0 ? 30 : 18} ry={smear > 0 ? 14 : 12} fill="rgba(150,205,240,0.45)" />}
          {smear > 0 && <ellipse rx={10 + 36 * smear} ry={6 + 10 * smear} fill={colour} />}
          {has('blot') && <rect x="-60" y="-46" width="120" height="30" rx="3" fill="#fbfbf7" stroke="#d9dde3" />}
        </Slide>
      </Hot>

      <Hot id="smear" ring={{ cx: 110, cy: 330, r: 60 }}>
        <g transform="translate(110 330)" filter="url(#sh)">
          <path d="M-40 -30 L40 -30 L32 40 L-32 40 Z" fill="#fff" stroke="#c9d1da" strokeWidth="2" />
          <ellipse cy="-30" rx="40" ry="8" fill="#fbf8f1" stroke="#c9d1da" />
          <text y="12" textAnchor="middle" fontSize="11" fontWeight="900" fill="#5a6779">YOGURT</text>
        </g>
      </Hot>
      <g transform={active === 'smear' ? `translate(${400 + Math.sin(progress * 12) * 20} ${360 + Math.cos(progress * 12) * 6}) rotate(-60)` : 'translate(130 170) rotate(-20)'}>
        <rect x="0" y="-4" width="110" height="8" rx="4" fill="#b07a2a" />
        <path d="M0 0 L-38 0" stroke="#9aa6b5" strokeWidth="2" />
        <circle cx="-44" cy="0" r="6" fill="none" stroke="#9aa6b5" strokeWidth="2" />
      </g>

      <Hot id="dry" ring={{ cx: 110, cy: 90, r: 46 }}>
        <g transform="translate(110 90)" filter="url(#sh)">
          <circle r="34" fill="#fff" stroke="#c9d1da" strokeWidth="3" />
          <line x1="0" y1="0" x2="0" y2="-24" stroke="#17212e" strokeWidth="3" strokeLinecap="round" transform={`rotate(${active === 'dry' ? progress * 360 : 0})`} />
          <line x1="0" y1="0" x2="14" y2="0" stroke="#17212e" strokeWidth="3" strokeLinecap="round" />
          <text y="52" textAnchor="middle" fontSize="11" fontWeight="800" fill="#8a96a8">air dry</text>
        </g>
      </Hot>

      {bottles.map((b) => {
        const pour = pouring(b.id)
        return (
          <Hot key={b.id} id={b.id} ring={{ cx: b.x, cy: 92, r: 50 }}>
            <Bottle x={b.x} y={pour ? 150 : 92} colour={b.colour} label={b.label} tilt={pour ? (b.x < 450 ? 70 : -70) : 0} />
            {pour && <path d={`M${b.x + (b.x < 450 ? 40 : -40)} 168 Q${(b.x + 450) / 2} 220 450 360`} stroke={b.colour} strokeWidth="5" fill="none" opacity="0.8" strokeDasharray="12 6" />}
          </Hot>
        )
      })}

      <Hot id={['rinse1', 'rinse2', 'rinse3', 'rinse4']} ring={{ cx: 740, cy: 120, r: 60 }}>
        <WashBottle x={740} y={110} squirt={active?.startsWith('rinse') === true && progress > 0} />
      </Hot>
      <Hot id="fix" ring={{ cx: 720, cy: 300, r: 70 }}>
        <Burner x={720} y={340} lit />
        {active === 'fix' && (
          <g transform={`translate(${680 + ((progress * 3) % 1) * 80} 210)`}>
            <rect x="-40" y="-10" width="80" height="20" rx="3" fill="url(#glass)" stroke="#9cc3d8" />
            <path d="M40 0 L90 -16" stroke="#5a6779" strokeWidth="4" />
          </g>
        )}
      </Hot>
      <BlotPaper x={110} y={440} />
    </Stage>
  )
}

export const GRAM_PREP: PrepDef = {
  name: 'Gram stain of yogurt bacteria',
  Scene: GramArtScene,
  steps: [
    { id: 'water', kind: 'tap', action: 'Tap the slide to add a small drop of water', title: 'A small drop of water', body: 'Put one small drop of water in the middle of a clean slide.' },
    { id: 'smear', kind: 'drag', action: 'Drag to spread a thin smear', title: 'Make a thin smear', body: 'Touch the loop to the yogurt, mix a tiny amount into the drop and spread it into a thin film. Thin is important: in a thick smear the bacteria pile up on top of each other.' },
    { id: 'dry', kind: 'timer', seconds: 300, action: 'Tap the clock to let it dry', title: 'Let it air dry', body: 'Leave the smear to dry completely in the air. This takes about five minutes.' },
    { id: 'fix', kind: 'repeat', times: 3, action: 'Tap the burner to pass the slide through the flame', title: 'Heat-fix the smear', body: 'Pass the slide quickly through the flame three times, smear side up. The heat kills the bacteria and sticks them to the glass so they do not wash off.', tip: 'Quick passes only. Too much heat distorts the cells.' },
    { id: 'crystal', kind: 'timer', seconds: 60, action: 'Tap the crystal violet', title: 'Crystal violet', body: 'Cover the smear with crystal violet for one minute. Every bacterium turns purple.' },
    { id: 'rinse1', kind: 'tap', action: 'Tap the wash bottle', title: 'Rinse', body: 'Rinse gently with water.' },
    { id: 'gramIodine', kind: 'timer', seconds: 60, action: "Tap the Gram's iodine", title: "Gram's iodine", body: "Cover with Gram's iodine for one minute. It locks the purple dye inside the cell wall." },
    { id: 'rinse2', kind: 'tap', action: 'Tap the wash bottle', title: 'Rinse', body: 'Rinse gently with water.' },
    { id: 'alcohol', kind: 'hold', action: 'Press and hold the alcohol bottle', title: 'Decolourise with alcohol', body: 'Drip alcohol over the slide until the purple stops running off. Hold for about 5 seconds, then let go.', tip: 'This is the step that decides the result. Bacteria with a thick cell wall keep the purple; the others lose it.' },
    { id: 'rinse3', kind: 'tap', action: 'Tap the wash bottle straight away', title: 'Rinse straight away', body: 'Rinse with water at once to stop the alcohol.' },
    { id: 'safranin', kind: 'timer', seconds: 60, action: 'Tap the safranin', title: 'Safranin', body: 'Cover with safranin for one minute. Anything that lost the purple is now stained pink.' },
    { id: 'rinse4', kind: 'tap', action: 'Tap the wash bottle', title: 'Rinse', body: 'Rinse gently with water.' },
    { id: 'blot', kind: 'tap', action: 'Tap the slide to blot it dry', title: 'Blot dry', body: 'Press the slide gently between blotting paper. Do not rub. There is no coverslip: you will put a drop of oil straight on the smear at the microscope.' },
  ],
  mount: (o) => ({ specimen: 'yogurt', bubbles: [], variant: decolour(o.held.alcohol ?? 5) }),
  verdict: (o) => {
    const v = decolour(o.held.alcohol ?? 5)
    if (v === 0) return null
    return v > 0
      ? <p className="leading-relaxed">You decolourised for <b>{(o.held.alcohol ?? 0).toFixed(1)} seconds</b>, too long. The alcohol washed the purple out of the bacteria, so they will look pink even though they keep crystal violet in a proper stain. You can stain a new slide, or look at this one and see the mistake.</p>
      : <p className="leading-relaxed">You decolourised for only <b>{(o.held.alcohol ?? 0).toFixed(1)} seconds</b>, too short. Purple dye is left in the background as well, so the slide looks purple all over. You can stain a new slide, or look at this one.</p>
  },
}
