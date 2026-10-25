import { useEffect, useState } from 'react'
import { OpticsLab } from './dev/OpticsLab'
import { InstrumentLab } from './dev/InstrumentLab'
import { Home } from './Home'
import { Phase0 } from './phases/p0/Phase0'
import { Phase1 } from './phases/p1/Phase1'
import { Phase2 } from './phases/p2/Phase2'
import { Phase3 } from './phases/p3/Phase3'
import { Phase4 } from './phases/p4/Phase4'
import { Phase5 } from './phases/p5/Phase5'
import { Phase6 } from './phases/p6/Phase6'
import { Phase7 } from './phases/p7/Phase7'
import { Phase8 } from './phases/p8/Phase8'
import { ResultCard } from './ResultCard'
import { TopBar } from './ui/kit'
import { devUnlocked, progress, setDevUnlocked } from './lib/storage'

function useHash() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => setHash(location.hash)
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return hash
}

export function App() {
  const hash = useHash()
  if (import.meta.env.DEV && (hash === '#/dev/unlock' || hash === '#/dev/lock')) {
    setDevUnlocked(hash === '#/dev/unlock')
    location.hash = '#/'
    return null
  }
  if (hash.startsWith('#/dev/optics')) return <OpticsLab key={hash} />
  if (import.meta.env.DEV && hash.startsWith('#/dev/inst')) return <InstrumentLab key={hash} />
  if (hash.startsWith('#/p0')) return <Phase0 />
  // A phase opened by link still needs the one before it finished.
  if (hash.startsWith('#/p1')) return progress.get().phases.p0?.done || devUnlocked() ? <Phase1 /> : <Home />
  if (hash.startsWith('#/p2')) return progress.get().phases.p1?.done || devUnlocked() ? <Phase2 /> : <Home />
  if (hash.startsWith('#/p3')) return progress.get().phases.p2?.done || devUnlocked() ? <Phase3 /> : <Home />
  if (hash.startsWith('#/p4')) return progress.get().phases.p3?.done || devUnlocked() ? <Phase4 /> : <Home />
  if (hash.startsWith('#/p5')) return progress.get().phases.p4?.done || devUnlocked() ? <Phase5 /> : <Home />
  if (hash.startsWith('#/p6')) return progress.get().phases.p5?.done || devUnlocked() ? <Phase6 /> : <Home />
  if (hash.startsWith('#/p7')) return progress.get().phases.p6?.done || devUnlocked() ? <Phase7 /> : <Home />
  if (hash.startsWith('#/p8')) return progress.get().phases.p7?.done || devUnlocked() ? <Phase8 /> : <Home />
  if (hash.startsWith('#/result')) return <div className="min-h-full"><TopBar title="Result card" sub="Lesson 4: Structures and Organelles" /><ResultCard /></div>
  return <Home />
}
