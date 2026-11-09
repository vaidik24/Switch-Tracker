import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import db from '../db/db'
import { useAppStore } from '../store/useAppStore'
import { shouldNag, buildNagMessage, isReminderTime, sendNotification } from '../lib/nagMode'
import { todayIST } from '../lib/dates'

const TICK_INTERVAL = 60_000 // check every 1 minute

export function useReminderEngine() {
  const { snoozedUntil, setLastNagAt, lastNagAt } = useAppStore()
  const lastNagRef = useRef<number | null>(lastNagAt)

  const settings = useLiveQuery(() => db.settings.toArray().then(r => r[0]))
  const todayLog = useLiveQuery(() => db.dailyLogs.get(todayIST()))

  useEffect(() => {
    lastNagRef.current = lastNagAt
  }, [lastNagAt])

  useEffect(() => {
    if (!settings) return

    const tick = async () => {
      const today = todayIST()

      // Count remaining tasks from today's log
      const log = await db.dailyLogs.get(today)
      const checklist = log?.checklistState ?? {}
      const totalKeys = Object.keys(checklist)
      const remaining = totalKeys.filter(k => !checklist[k])

      const snoozedUntilDate = snoozedUntil ? new Date(snoozedUntil) : null
      const nagState = shouldNag(settings, log, remaining, snoozedUntilDate)

      // Check if it's a scheduled reminder time
      const reminderCheck = isReminderTime(settings)
      if (reminderCheck.match && nagState.remainingTasks.length > 0 && !log?.doneForToday) {
        const title = "⏰ Tracker Reminder"
        const body = buildNagMessage(nagState.remainingTasks)
        await sendNotification(title, body, 'scheduled-reminder')
      }

      // Nag mode: check if enough time has passed since last nag
      if (nagState.shouldNag) {
        const now = Date.now()
        const nagIntervalMs = (settings.nagIntervalMinutes ?? 30) * 60 * 1000
        const timeSinceLastNag = now - (lastNagRef.current ?? 0)

        if (timeSinceLastNag >= nagIntervalMs) {
          const title = "🔔 Tasks still pending!"
          const body = buildNagMessage(nagState.remainingTasks)
          await sendNotification(title, body, 'nag-reminder')
          lastNagRef.current = now
          setLastNagAt(now)
        }
      }

      // Update tab title with remaining count
      if (remaining.length > 0 && !log?.doneForToday) {
        document.title = `(${remaining.length}) Job Switch Tracker`
      } else {
        document.title = 'Job Switch Tracker'
      }
    }

    tick() // run immediately
    const interval = setInterval(tick, TICK_INTERVAL)
    return () => clearInterval(interval)
  }, [settings, snoozedUntil, setLastNagAt])
}
