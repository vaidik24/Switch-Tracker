import { describe, it, expect } from 'vitest'
import { calculateStreak, hasRestDayThisWeek } from '../src/lib/streak'
import type { DailyLog } from '../src/db/db'

describe('streak utility', () => {
  it('returns 0 for empty logs', () => {
    expect(calculateStreak([], '2026-10-26')).toBe(0)
  })

  it('counts streak for consecutive completed days', () => {
    const logs: DailyLog[] = [
      {
        date: '2026-10-26',
        checklistState: {},
        doneForToday: true,
        missReason: null,
        notes: '',
        streak: 1,
        completedAt: '2026-10-26T21:00:00+05:30',
      },
      {
        date: '2026-10-25',
        checklistState: {},
        doneForToday: true,
        missReason: null,
        notes: '',
        streak: 1,
        completedAt: '2026-10-25T21:00:00+05:30',
      },
      {
        date: '2026-10-24',
        checklistState: {},
        doneForToday: true,
        missReason: null,
        notes: '',
        streak: 1,
        completedAt: '2026-10-24T21:00:00+05:30',
      },
    ]

    expect(calculateStreak(logs, '2026-10-26')).toBe(3)
  })

  it('preserves streak if missReason is provided (sick/travel/etc)', () => {
    const logs: DailyLog[] = [
      {
        date: '2026-10-26',
        checklistState: {},
        doneForToday: true,
        missReason: null,
        notes: '',
        streak: 1,
        completedAt: '2026-10-26T21:00:00+05:30',
      },
      {
        date: '2026-10-25',
        checklistState: {},
        doneForToday: false,
        missReason: 'sick',
        notes: '',
        streak: 0,
        completedAt: null,
      },
      {
        date: '2026-10-24',
        checklistState: {},
        doneForToday: true,
        missReason: null,
        notes: '',
        streak: 1,
        completedAt: '2026-10-24T21:00:00+05:30',
      },
    ]

    expect(calculateStreak(logs, '2026-10-26')).toBe(3)
  })

  it('detects rest day used in week', () => {
    const logs: DailyLog[] = [
      {
        date: '2026-10-27',
        checklistState: {},
        doneForToday: false,
        missReason: 'rest day',
        notes: '',
        streak: 0,
        completedAt: null,
      },
    ]

    expect(hasRestDayThisWeek(logs, '2026-10-26')).toBe(true)
    expect(hasRestDayThisWeek(logs, '2026-11-02')).toBe(false)
  })
})
