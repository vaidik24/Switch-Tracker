import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import db from '../db/db'
import { todayIST } from '../lib/dates'
import { buildNagMessage } from '../lib/nagMode'

export default function NotificationBanner() {
  const { snoozedUntil } = useAppStore()

  const today = todayIST()
  const todayLog = useLiveQuery(() => db.dailyLogs.get(today))

  if (todayLog?.doneForToday) return null

  const checklist = todayLog?.checklistState ?? {}
  const remaining = Object.entries(checklist)
    .filter(([, v]) => !v)
    .map(([k]) => k)

  const { hour } = (() => {
    const p = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false,
    }).formatToParts(new Date())
    return { hour: parseInt(p.find(x => x.type === 'hour')?.value ?? '0') }
  })()

  const isSnoozed = snoozedUntil ? Date.now() < snoozedUntil : false

  // Only show banner after 7 PM with remaining tasks, not snoozed
  if (hour < 19 || remaining.length === 0 || isSnoozed) return null

  return (
    <div className="sticky top-0 z-50 bg-red-600 px-4 py-2.5 flex items-center justify-between
                    shadow-lg shadow-red-900/50 animate-fade-in">
      <p className="text-white text-sm font-semibold">
        🔔 {remaining.length} task{remaining.length > 1 ? 's' : ''} left today
      </p>
      <a href="/" className="text-white/80 text-xs font-medium underline">View Today</a>
    </div>
  )
}
