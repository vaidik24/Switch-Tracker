/**
 * Date utilities for Asia/Kolkata (IST, UTC+5:30) timezone.
 * Never use UTC for "today". Always use IST.
 */

export const TZ = 'Asia/Kolkata'

/** Returns today's date as YYYY-MM-DD in IST */
export function todayIST(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ })
}

/** Returns the current IST hour and minute as { hour, minute } */
export function nowIST(): { hour: number; minute: number; date: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: 'numeric',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0')
  const date = `${parts.find(p => p.type === 'year')?.value}-${parts.find(p => p.type === 'month')?.value}-${parts.find(p => p.type === 'day')?.value}`
  return { hour: get('hour'), minute: get('minute'), date }
}

/** Parses a YYYY-MM-DD string and returns a Date at midnight IST */
export function parseISTDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+05:30`)
}

/** Adds days to a YYYY-MM-DD string, returns YYYY-MM-DD */
export function addDays(dateStr: string, days: number): string {
  const d = parseISTDate(dateStr)
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString('en-CA', { timeZone: TZ })
}

/** Returns difference in calendar days (b - a), both YYYY-MM-DD */
export function diffDays(a: string, b: string): number {
  const da = parseISTDate(a).getTime()
  const db = parseISTDate(b).getTime()
  return Math.round((db - da) / 86400000)
}

/** Formats YYYY-MM-DD to a human-readable string like "Sun, 26 Oct" */
export function formatDateShort(dateStr: string): string {
  return parseISTDate(dateStr).toLocaleDateString('en-IN', {
    timeZone: TZ,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** Formats YYYY-MM-DD to "Sunday, 26 October 2025" */
export function formatDateLong(dateStr: string): string {
  return parseISTDate(dateStr).toLocaleDateString('en-IN', {
    timeZone: TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Returns weekday name (0=Sun ... 6=Sat) for a YYYY-MM-DD */
export function getWeekday(dateStr: string): number {
  return parseISTDate(dateStr).getDay()
}

/** Returns true if the date is a weekend (Sat=6 or Sun=0) */
export function isWeekend(dateStr: string): boolean {
  const d = getWeekday(dateStr)
  return d === 0 || d === 6
}

/** Returns the Monday of the ISO week for a given date */
export function weekStart(dateStr: string): string {
  const d = parseISTDate(dateStr)
  const day = d.getDay() === 0 ? 7 : d.getDay() // treat Sunday as 7
  d.setDate(d.getDate() - (day - 1))
  return d.toLocaleDateString('en-CA', { timeZone: TZ })
}

/** Returns a range of dates [start, end] inclusive as YYYY-MM-DD[] */
export function dateRange(start: string, end: string): string[] {
  const dates: string[] = []
  let cur = start
  while (cur <= end) {
    dates.push(cur)
    cur = addDays(cur, 1)
  }
  return dates
}

/** Given plan start date and today, return { weekNumber, dayNumber } */
export function getPlanWeekDay(planStart: string, today: string): { weekNumber: number; dayNumber: number } {
  const totalDays = diffDays(planStart, today)
  if (totalDays < 0) return { weekNumber: 0, dayNumber: 0 }
  return {
    weekNumber: Math.floor(totalDays / 7) + 1,
    dayNumber: (totalDays % 7) + 1,
  }
}

/** HH:MM string to total minutes */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/** Total minutes to HH:MM */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0')
  const m = (mins % 60).toString().padStart(2, '0')
  return `${h}:${m}`
}
