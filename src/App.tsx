import { useEffect, useState } from 'react'
import { OpticsLab } from './dev/OpticsLab'
import { InstrumentLab } from './dev/InstrumentLab'
import { Home } from './Home'
import { Phase0 } from './phases/p0/Phase0'
import { Phase1 } from './phases/p1/Phase1'
import { Phase2 } from './phases/p2/Phase2'
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
  return <Home />
}
