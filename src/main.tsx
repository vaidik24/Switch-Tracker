import './index.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { seedDatabase } from './db/seed'

// Apply saved theme immediately to prevent flash
const saved = localStorage.getItem('tracker-ui-state')
if (saved) {
  try {
    const { state } = JSON.parse(saved)
    if (state?.theme === 'light') {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
  } catch {}
}

import { initSyncEngine } from './lib/syncEngine'

// Seed DB on first run
seedDatabase().catch(console.error)
// Start background sync listeners
initSyncEngine()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
