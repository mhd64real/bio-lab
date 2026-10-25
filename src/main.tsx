import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { ActionFinder } from './ui/ActionFinder'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <ActionFinder />
  </StrictMode>,
)
