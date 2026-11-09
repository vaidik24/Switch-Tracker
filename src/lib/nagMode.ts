import { timeToMinutes, nowIST } from './dates'
import type { Settings, DailyLog } from '../db/db'

export interface NagState {
  shouldNag: boolean
  reason: string
  remainingTasks: string[]
}

/**
 * Nag mode: after the evening reminder, if any must-do task is unchecked,
 * fire every N minutes until:
 * - All tasks checked
 * - "Done for today" pressed
 * - Snooze active
 * - Quiet hours
 */
export function shouldNag(
  settings: Settings,
  todayLog: DailyLog | undefined,
  remainingTasks: string[],
  snoozedUntil: Date | null
): NagState {
  const { hour, minute } = nowIST()
  const currentMins = hour * 60 + minute

  // Check quiet hours
  const quietStart = timeToMinutes(settings.quietHoursStart)
  const quietEnd = timeToMinutes(settings.quietHoursEnd) // next day
  const inQuietHours =
    currentMins >= quietStart || currentMins < quietEnd

  if (inQuietHours) {
    return { shouldNag: false, reason: 'quiet hours', remainingTasks }
  }

  // Already done
  if (todayLog?.doneForToday) {
    return { shouldNag: false, reason: 'already done', remainingTasks: [] }
  }

  // No remaining tasks
  if (remainingTasks.length === 0) {
    return { shouldNag: false, reason: 'all tasks complete', remainingTasks: [] }
  }

  // Snoozed
  if (snoozedUntil && new Date() < snoozedUntil) {
    return { shouldNag: false, reason: 'snoozed', remainingTasks }
  }

  // Evening check: after 7 PM IST
  const eveningThreshold = 19 * 60 // 7 PM
  if (currentMins >= eveningThreshold) {
    return {
      shouldNag: true,
      reason: `${remainingTasks.length} task${remainingTasks.length > 1 ? 's' : ''} remaining`,
      remainingTasks,
    }
  }

  return { shouldNag: false, reason: 'not nag time yet', remainingTasks }
}

/**
 * Build notification text for nag mode.
 */
export function buildNagMessage(remainingTasks: string[]): string {
  const count = remainingTasks.length
  if (count === 0) return "All done for today! Great work 💪"

  const taskList = remainingTasks.slice(0, 3).join(', ')
  const extra = count > 3 ? ` and ${count - 3} more` : ''
  return `Hey Vaidik! ${count} task${count > 1 ? 's' : ''} left today: ${taskList}${extra}. You've got this! 🎯`
}

/**
 * Build reminder times as minute-of-day values from settings.
 */
export function getReminderMinutes(settings: Settings): number[] {
  return settings.reminderTimes.map(timeToMinutes)
}

/**
 * Check if current time matches a scheduled reminder time (±1 min).
 */
export function isReminderTime(settings: Settings): { match: boolean; time: string } {
  const { hour, minute } = nowIST()
  const currentMins = hour * 60 + minute

  for (const time of settings.reminderTimes) {
    const targetMins = timeToMinutes(time)
    if (Math.abs(currentMins - targetMins) <= 1) {
      return { match: true, time }
    }
  }
  return { match: false, time: '' }
}

/**
 * Send a browser notification (requires permission).
 */
export async function sendNotification(title: string, body: string, tag = 'tracker-reminder'): Promise<void> {
  if (!('Notification' in window)) return
  if (Notification.permission !== 'granted') return

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(title, {
        body,
        tag,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        requireInteraction: false,
        actions: [
          { action: 'open', title: 'Open Today' },
          { action: 'snooze', title: 'Snooze 1h' },
        ],
      } as NotificationOptions)
    } else {
      new Notification(title, { body, tag, icon: '/icons/icon-192.png' })
    }
  } catch (e) {
    console.warn('Notification failed:', e)
  }
}

/**
 * Request notification permission with a reason.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  return await Notification.requestPermission()
}
