import type { ReactNode } from 'react'
import type { Bubble } from '../../scope/model'
import type { PrepDef } from '../../lab/PrepRunner'

// Top view of a glass slide on the bench. Children are drawn around the centre (300, 150).
function Bench({ children, label, bubbles = [], cover }: { children?: ReactNode; label: string; bubbles?: Bubble[]; cover?: boolean }) {
  return (
    <svg viewBox="0 0 600 320" className="h-full max-h-[420px] w-full" role="img" aria-label="Slide on the bench">
      <defs>
        <linearGradient id="pg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f3fbff" /><stop offset="1" stopColor="#d6ecf7" /></linearGradient>
        <filter id="ps"><feDropShadow dx="0" dy="4" stdDeviation="5" floodOpacity="0.15" /></filter>
      </defs>
      <rect x="40" y="90" width="520" height="140" rx="8" fill="url(#pg)" stroke="#9cc3d8" strokeWidth="2" filter="url(#ps)" />
      <rect x="50" y="100" width="100" height="120" rx="4" fill="#fff" stroke="#dfe5ec" />
      <text x="100" y="165" textAnchor="middle" fontWeight="800" fontSize="15" fill="#5a6779">{label}</text>
      {children}
      {bubbles.map((b, i) => <circle key={i} cx={300 + b.x * 22} cy={160 - b.y * 18} r={3 + b.r * 9} fill="rgba(255,255,255,0.55)" stroke="#5a6779" strokeWidth="1.5" />)}
      {cover && <rect x="235" y="100" width="130" height="120" rx="2" fill="rgba(214,236,247,0.35)" stroke="#7fb0cc" strokeWidth="1.5" />}
    </svg>
  )
}

const Drop = ({ fill, r = 26 }: { fill: string; r?: number }) => <ellipse cx="300" cy="160" rx={r} ry={r * 0.75} fill={fill} />

export const ONION_PREP: PrepDef = {
  name: 'Onion epidermis wet mount',
  steps: [
    { id: 'cut', tool: 'knife', kind: 'tap', title: 'Cut a piece of onion', body: 'Cut a small square from one of the fleshy layers of an onion. These layers are called scale leaves.' },
    { id: 'water', tool: 'water', kind: 'tap', title: 'Put a drop of water on the slide', body: 'Add one drop of water to the middle of a clean slide. The skin will float flat in it.' },
    { id: 'peel', tool: 'forceps', kind: 'tap', title: 'Peel the thin skin', body: 'Snap the onion piece backwards. With the forceps, peel off the very thin, see-through skin from the inside surface. This is the epidermis: a single layer of cells.' },
    { id: 'lay', tool: 'forceps', kind: 'tap', title: 'Lay it flat', body: 'Lay the skin flat in the drop of water. Make sure it is not folded, or you will look through two layers of cells.' },
    { id: 'iodine', tool: 'iodine', kind: 'timer', seconds: 60, title: 'Stain with iodine', body: 'Add one drop of iodine solution and wait one minute. Onion cells are almost colourless; iodine stains them yellow-brown and makes the nucleus stand out.', tip: 'Iodine stains skin and clothes. Use only one drop.' },
    { id: 'cover', tool: 'coverslip', kind: 'lower', title: 'Lower the coverslip', body: 'Touch one edge of the coverslip to the liquid, then lower it slowly so the liquid pushes the air out.' },
    { id: 'blot', tool: 'blot', kind: 'tap', title: 'Soak up the extra liquid', body: 'Touch blotting paper to the edge of the coverslip to soak up extra stain, so the slide is clean and dry underneath.' },
  ],
  Slide: ({ flags, bubbles }) => (
    <Bench label="Onion" bubbles={bubbles} cover={flags.has('cover')}>
      {flags.has('cut') && !flags.has('lay') && <path d="M470 30 q40 -10 70 20 l-20 40 q-30 -25 -60 -20 z" fill="#f4ecd2" stroke="#d6c58f" strokeWidth="2" />}
      {flags.has('water') && <Drop fill={flags.has('iodine:started') ? 'rgba(214,160,40,0.45)' : 'rgba(120,190,235,0.35)'} r={flags.has('cover') ? 60 : 30} />}
      {flags.has('peel') && !flags.has('lay') && <path d="M420 40 q30 10 40 40 q-30 0 -45 -20 z" fill="rgba(250,245,225,0.85)" stroke="#cbbf98" />}
      {flags.has('lay') && <path d="M282 142 q20 -6 38 2 q4 18 -4 34 q-18 6 -36 -2 q-4 -16 2 -34 z" fill={flags.has('iodine:started') ? 'rgba(200,140,30,0.55)' : 'rgba(250,245,225,0.85)'} stroke="#b9a46a" />}
      {flags.has('blot') && <rect x="372" y="120" width="60" height="80" rx="4" fill="#f4f6f8" stroke="#c9d1da" transform="rotate(8 400 160)" />}
    </Bench>
  ),
  mount: (o) => ({ specimen: 'onion', bubbles: o.bubbles }),
  verdict: (o) => (o.bubbles.length ? <p className="leading-relaxed">You trapped <b>{o.bubbles.length} air bubble{o.bubbles.length > 1 ? 's' : ''}</b>. They will show as dark rings. You can make it again or keep it.</p> : null),
}

export const CHEEK_PREP: PrepDef = {
  name: 'Cheek cell smear',
  steps: [
    { id: 'scrape', tool: 'swab', kind: 'tap', title: 'Scrape your cheek', body: 'Gently rub a clean cotton swab on the inside of your cheek. Cells from the lining of your mouth come away all the time, so this does not hurt.' },
    { id: 'smear', tool: 'swab', kind: 'tap', title: 'Smear it on the slide', body: 'Roll the swab in the middle of the slide to leave a thin, even smear of cells.' },
    { id: 'bin', tool: 'bin', kind: 'tap', title: 'Dispose of the swab', body: 'Put the used swab straight into the disinfectant. Anything that has been in a mouth is treated as a biological hazard.' },
    { id: 'stain', tool: 'methylene', kind: 'timer', seconds: 60, title: 'Stain with methylene blue', body: 'Add one drop of methylene blue and wait one minute. The stain is taken up most by the nucleus, so it shows up dark blue.' },
    { id: 'cover', tool: 'coverslip', kind: 'lower', title: 'Lower the coverslip', body: 'Touch one edge to the liquid and lower the coverslip slowly.' },
    { id: 'blot', tool: 'blot', kind: 'tap', title: 'Soak up the extra stain', body: 'Touch blotting paper to the edge of the coverslip.' },
  ],
  Slide: ({ flags, bubbles }) => (
    <Bench label="Cheek" bubbles={bubbles} cover={flags.has('cover')}>
      {flags.has('scrape') && !flags.has('bin') && <g transform="translate(430 40) rotate(20)"><rect width="110" height="8" rx="4" fill="#e8edf2" stroke="#c9d1da" /><ellipse cx="0" cy="4" rx="12" ry="9" fill="#fff" stroke="#c9d1da" /></g>}
      {flags.has('smear') && <ellipse cx="300" cy="160" rx="48" ry="26" fill={flags.has('stain:started') ? 'rgba(60,110,200,0.35)' : 'rgba(230,225,215,0.7)'} />}
      {flags.has('stain:started') && <Drop fill="rgba(60,110,200,0.3)" r={flags.has('cover') ? 60 : 30} />}
      {flags.has('blot') && <rect x="372" y="120" width="60" height="80" rx="4" fill="#f4f6f8" stroke="#c9d1da" transform="rotate(8 400 160)" />}
    </Bench>
  ),
  mount: (o) => ({ specimen: 'cheek', bubbles: o.bubbles }),
  verdict: (o) => (o.bubbles.length ? <p className="leading-relaxed">You trapped <b>{o.bubbles.length} air bubble{o.bubbles.length > 1 ? 's' : ''}</b>. You can make it again or keep it.</p> : null),
}

// Decolourising time decides the result: too short leaves everything purple, too long washes the purple out.
const decolour = (held: number) => (held < 2.5 ? -1 : held > 9 ? 1 : 0)

export const GRAM_PREP: PrepDef = {
  name: 'Gram stain of yogurt bacteria',
  steps: [
    { id: 'water', tool: 'water', kind: 'tap', title: 'A small drop of water', body: 'Put one small drop of water in the middle of a clean slide.' },
    { id: 'smear', tool: 'loop', kind: 'tap', title: 'Make a thin smear', body: 'Touch the loop to the yogurt, mix a tiny amount into the drop and spread it into a thin film. Thin is important: in a thick smear the bacteria pile up on top of each other.' },
    { id: 'dry', tool: 'blot', kind: 'timer', seconds: 300, title: 'Let it air dry', body: 'Leave the smear to dry completely in the air. This takes about five minutes.' },
    { id: 'fix', tool: 'flame', kind: 'repeat', times: 3, title: 'Heat-fix the smear', body: 'Pass the slide quickly through the flame three times, smear side up. The heat kills the bacteria and sticks them to the glass so they do not wash off.', tip: 'Quick passes only. Too much heat distorts the cells.' },
    { id: 'crystal', tool: 'crystal', kind: 'timer', seconds: 60, title: 'Crystal violet', body: 'Cover the smear with crystal violet for one minute. Every bacterium turns purple.' },
    { id: 'rinse1', tool: 'rinse', kind: 'tap', title: 'Rinse', body: 'Rinse gently with water.' },
    { id: 'gramIodine', tool: 'gramIodine', kind: 'timer', seconds: 60, title: "Gram's iodine", body: "Cover with Gram's iodine for one minute. It locks the purple dye inside the cell wall." },
    { id: 'rinse2', tool: 'rinse', kind: 'tap', title: 'Rinse', body: 'Rinse gently with water.' },
    { id: 'alcohol', tool: 'alcohol', kind: 'hold', window: [2.5, 9], title: 'Decolourise with alcohol', body: 'Drip alcohol over the slide until the purple stops running off. Hold for about 5 seconds, then let go.', tip: 'This is the step that decides the result. Bacteria with a thick cell wall keep the purple; the others lose it.' },
    { id: 'rinse3', tool: 'rinse', kind: 'tap', title: 'Rinse straight away', body: 'Rinse with water at once to stop the alcohol.' },
    { id: 'safranin', tool: 'safranin', kind: 'timer', seconds: 60, title: 'Safranin', body: 'Cover with safranin for one minute. Anything that lost the purple is now stained pink.' },
    { id: 'rinse4', tool: 'rinse', kind: 'tap', title: 'Rinse', body: 'Rinse gently with water.' },
    { id: 'blot', tool: 'blot', kind: 'tap', title: 'Blot dry', body: 'Press the slide gently between blotting paper. Do not rub. There is no coverslip: you will put a drop of oil straight on the smear at the microscope.' },
  ],
  Slide: ({ flags }) => {
    const colour = flags.has('safranin:started') ? 'rgba(150,60,170,0.5)' : flags.has('crystal:started') ? 'rgba(107,47,179,0.55)' : flags.has('smear') ? 'rgba(235,230,220,0.85)' : 'transparent'
    return (
      <Bench label="Yogurt">
        {flags.has('water') && !flags.has('dry') && <Drop fill="rgba(120,190,235,0.35)" r={22} />}
        {flags.has('smear') && <ellipse cx="300" cy="160" rx="70" ry="30" fill={colour} />}
        {flags.has('fix') && !flags.has('crystal:started') && <text x="300" y="250" textAnchor="middle" fontSize="13" fontWeight="800" fill="#e8590c">heat-fixed</text>}
        {flags.has('blot') && <rect x="230" y="40" width="140" height="40" rx="4" fill="#f4f6f8" stroke="#c9d1da" />}
      </Bench>
    )
  },
  mount: (o) => ({ specimen: 'yogurt', bubbles: [], variant: decolour(o.held.alcohol ?? 5) }),
  verdict: (o) => {
    const v = decolour(o.held.alcohol ?? 5)
    if (v === 0) return null
    return v > 0
      ? <p className="leading-relaxed">You decolourised for <b>{(o.held.alcohol ?? 0).toFixed(1)} seconds</b>, too long. The alcohol washed the purple out of the bacteria, so they will look pink even though they keep crystal violet in a proper stain. You can stain a new slide, or look at this one and see the mistake.</p>
      : <p className="leading-relaxed">You decolourised for only <b>{(o.held.alcohol ?? 0).toFixed(1)} seconds</b>, too short. Purple dye is left in the background as well, so the slide looks purple all over. You can stain a new slide, or look at this one.</p>
  },
}
