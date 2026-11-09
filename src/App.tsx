import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from './store/useAppStore'
import Today from './pages/Today'
import Plan from './pages/Plan'
import DSATracker from './pages/DSATracker'
import LLDHLDPage from './pages/LLDHLDPage'
import Concepts from './pages/Concepts'
import Stories from './pages/Stories'
import Jobs from './pages/Jobs'
import Mocks from './pages/Mocks'
import ChecklistsPage from './pages/ChecklistsPage'
import WeeklyReview from './pages/WeeklyReview'
import Settings from './pages/Settings'
import QuickAddProblem from './components/QuickAddProblem'
import NotificationBanner from './components/NotificationBanner'
import { useReminderEngine } from './hooks/useReminderEngine'

const NAV_ITEMS = [
  { to: '/', icon: '🏠', label: 'Today' },
  { to: '/plan', icon: '📅', label: 'Plan' },
  { to: '/dsa', icon: '💻', label: 'DSA' },
  { to: '/lld-hld', icon: '🏗️', label: 'Design' },
  { to: '/concepts', icon: '🧠', label: 'Concepts' },
  { to: '/stories', icon: '📖', label: 'Stories' },
  { to: '/jobs', icon: '💼', label: 'Jobs' },
  { to: '/mocks', icon: '🎤', label: 'Mocks' },
  { to: '/checklists', icon: '✅', label: 'Lists' },
  { to: '/review', icon: '📊', label: 'Review' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
]

function AppContent() {
  const { theme } = useAppStore()
  const { showQuickAdd, setShowQuickAdd } = useAppStore()
  const location = useLocation()
  useReminderEngine()

  // Update document class when theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto relative">
      {/* Notification Banner */}
      <NotificationBanner />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-24 pt-safe">
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/plan" element={<Plan />} />
          <Route path="/dsa" element={<DSATracker />} />
          <Route path="/lld-hld" element={<LLDHLDPage />} />
          <Route path="/concepts" element={<Concepts />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/mocks" element={<Mocks />} />
          <Route path="/checklists" element={<ChecklistsPage />} />
          <Route path="/review" element={<WeeklyReview />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto z-40 pb-safe
                      bg-surface-100/80 dark:bg-surface-100/90 backdrop-blur-xl
                      border-t border-white/5">
        <div className="flex overflow-x-auto no-scrollbar px-1 py-1 gap-0.5">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              aria-label={item.label}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Floating Quick Add Button */}
      <button
        onClick={() => setShowQuickAdd(true)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full
                   bg-gradient-to-br from-brand-500 to-purple-600
                   shadow-lg shadow-brand-900/50 flex items-center justify-center
                   text-white text-2xl transition-transform active:scale-95
                   hover:shadow-xl hover:shadow-brand-900/60"
        aria-label="Quick add solved problem"
        title="Quick add problem (N)"
      >
        ＋
      </button>

      {/* Quick Add Modal */}
      {showQuickAdd && (
        <QuickAddProblem onClose={() => setShowQuickAdd(false)} />
      )}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
