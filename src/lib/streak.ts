import type { DailyLog } from '../db/db'
import { diffDays } from './dates'

/**
 * Calculate current streak from an array of daily logs.
 * Streak = consecutive days where doneForToday = true OR had a valid miss reason.
 * A valid miss reason is: sick | travel | work overload (rest day counts separately).
 * Two consecutive misses → streak resets.
 */
export function calculateStreak(
  logs: DailyLog[],
  today: string
): number {
  if (logs.length === 0) return 0

  // Sort descending by date
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date))

  let streak = 0
  let expectedDate = today

  for (const log of sorted) {
    const diff = diffDays(log.date, expectedDate)
    if (diff > 1) break // gap of more than 1 day → streak broken

    const isComplete = log.doneForToday || (
      log.missReason !== null &&
      log.missReason !== undefined &&
      log.missReason !== ''
    )

    if (log.date === expectedDate && isComplete) {
      streak++
      expectedDate = log.date
      // Move back one day
      const d = new Date(expectedDate + 'T00:00:00+05:30')
      d.setDate(d.getDate() - 1)
      expectedDate = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    } else if (log.date === expectedDate && !isComplete) {
      // This day had no completion; for yesterday or earlier this breaks streak
      break
    } else {
      break
    }
  }

  return streak
}

/**
 * Returns true if a rest day has been used this week (Sun-Sat).
 */
export function hasRestDayThisWeek(logs: DailyLog[], weekStartDate: string): boolean {
  const weekEnd = new Date(weekStartDate + 'T00:00:00+05:30')
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndStr = weekEnd.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })

  return logs.some(
    log => log.date >= weekStartDate && log.date <= weekEndStr && log.missReason === 'rest day'
  )
}
