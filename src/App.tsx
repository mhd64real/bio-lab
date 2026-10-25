import { useEffect, useState } from 'react'
import { OpticsLab } from './dev/OpticsLab'
import { Home } from './Home'
import { Phase0 } from './phases/p0/Phase0'

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
  if (hash.startsWith('#/dev/optics')) return <OpticsLab key={hash} />
  if (hash.startsWith('#/p0')) return <Phase0 />
  return <Home />
}
