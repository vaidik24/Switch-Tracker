import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  // UI state
  showQuickAdd: boolean
  setShowQuickAdd: (v: boolean) => void

  // Snooze state
  snoozedUntil: number | null // timestamp
  snoozeReminders: (minutes?: number) => void
  clearSnooze: () => void

  // Notification
  lastNagAt: number | null
  setLastNagAt: (t: number) => void

  // Theme
  theme: 'dark' | 'light'
  toggleTheme: () => void
  setTheme: (t: 'dark' | 'light') => void

  // Undo delete
  deletedItem: { type: string; data: unknown; id: number } | null
  setDeletedItem: (item: { type: string; data: unknown; id: number } | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      showQuickAdd: false,
      setShowQuickAdd: (v) => set({ showQuickAdd: v }),

      snoozedUntil: null,
      snoozeReminders: (minutes = 60) =>
        set({ snoozedUntil: Date.now() + minutes * 60 * 1000 }),
      clearSnooze: () => set({ snoozedUntil: null }),

      lastNagAt: null,
      setLastNagAt: (t) => set({ lastNagAt: t }),

      theme: 'dark',
      toggleTheme: () =>
        set(s => {
          const t = s.theme === 'dark' ? 'light' : 'dark'
          document.documentElement.classList.toggle('dark', t === 'dark')
          return { theme: t }
        }),
      setTheme: (t) => {
        document.documentElement.classList.toggle('dark', t === 'dark')
        set({ theme: t })
      },

      deletedItem: null,
      setDeletedItem: (item) => set({ deletedItem: item }),
    }),
    {
      name: 'tracker-ui-state',
      partialize: (s) => ({ theme: s.theme, snoozedUntil: s.snoozedUntil }),
    }
  )
)
