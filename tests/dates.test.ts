import { describe, it, expect } from 'vitest'
import {
  todayIST,
  parseISTDate,
  addDays,
  diffDays,
  formatDateShort,
  formatDateLong,
  getWeekday,
  isWeekend,
  weekStart,
  dateRange,
  getPlanWeekDay,
  timeToMinutes,
  minutesToTime,
} from '../src/lib/dates'

describe('dates utility', () => {
  it('returns valid todayIST in YYYY-MM-DD format', () => {
    const today = todayIST()
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('correctly calculates addDays and diffDays', () => {
    const start = '2026-10-26'
    const next = addDays(start, 5)
    expect(next).toBe('2026-10-31')
    expect(diffDays(start, next)).toBe(5)
    expect(diffDays(next, start)).toBe(-5)
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
  })

  it('determines weekends correctly', () => {
    // 2026-10-26 is Monday
    expect(getWeekday('2026-10-26')).toBe(1)
    expect(isWeekend('2026-10-26')).toBe(false)
    // 2026-10-31 is Saturday
    expect(getWeekday('2026-10-31')).toBe(6)
    expect(isWeekend('2026-10-31')).toBe(true)
    // 2026-11-01 is Sunday
    expect(getWeekday('2026-11-01')).toBe(0)
    expect(isWeekend('2026-11-01')).toBe(true)
  })

  it('computes weekStart (Monday of week)', () => {
    // 2026-10-28 is Wednesday -> Monday is 2026-10-26
    expect(weekStart('2026-10-28')).toBe('2026-10-26')
    // 2026-11-01 is Sunday -> Monday is 2026-10-26
    expect(weekStart('2026-11-01')).toBe('2026-10-26')
  })

  it('creates date ranges correctly', () => {
    const range = dateRange('2026-10-26', '2026-10-28')
    expect(range).toEqual(['2026-10-26', '2026-10-27', '2026-10-28'])
  })

  it('computes getPlanWeekDay correctly', () => {
    const planStart = '2026-10-26'
    expect(getPlanWeekDay(planStart, '2026-10-26')).toEqual({ weekNumber: 1, dayNumber: 1 })
    expect(getPlanWeekDay(planStart, '2026-10-27')).toEqual({ weekNumber: 1, dayNumber: 2 })
    expect(getPlanWeekDay(planStart, '2026-11-02')).toEqual({ weekNumber: 2, dayNumber: 1 })
    expect(getPlanWeekDay(planStart, '2026-10-20')).toEqual({ weekNumber: 0, dayNumber: 0 })
  })

  it('converts time strings and minutes', () => {
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('21:00')).toBe(1260)
    expect(minutesToTime(570)).toBe('09:30')
    expect(minutesToTime(1260)).toBe('21:00')
  })
})
