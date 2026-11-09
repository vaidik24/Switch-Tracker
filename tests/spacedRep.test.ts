import { describe, it, expect } from 'vitest'
import {
  scheduleAfterSolve,
  scheduleAfterReview,
  isDueForReview,
  daysUntilReview,
} from '../src/lib/spacedRep'

describe('spacedRep utility', () => {
  it('schedules +1 day after initial solve', () => {
    const sched = scheduleAfterSolve('2026-10-26', 'Solved alone')
    expect(sched.nextReview).toBe('2026-10-27')
    expect(sched.reviewInterval).toBe(1)
    expect(sched.reviewCount).toBe(0)
  })

  it('advances intervals on easy review: 1 -> 3 -> 7 -> 14 -> 28', () => {
    let sched = scheduleAfterReview('2026-10-27', 'easy', 1, 0, 'Solved alone')
    expect(sched.reviewInterval).toBe(3)
    expect(sched.nextReview).toBe('2026-10-30')
    expect(sched.reviewCount).toBe(1)

    sched = scheduleAfterReview('2026-10-30', 'easy', 3, 1, 'Solved alone')
    expect(sched.reviewInterval).toBe(7)
    expect(sched.nextReview).toBe('2026-11-06')

    sched = scheduleAfterReview('2026-11-06', 'easy', 7, 2, 'Solved alone')
    expect(sched.reviewInterval).toBe(14)
    expect(sched.nextReview).toBe('2026-11-20')

    sched = scheduleAfterReview('2026-11-20', 'easy', 14, 3, 'Solved alone')
    expect(sched.reviewInterval).toBe(28)
    expect(sched.nextReview).toBe('2026-12-18')
  })

  it('maintains interval on hard review', () => {
    const sched = scheduleAfterReview('2026-10-30', 'hard', 3, 1, 'Solved alone')
    expect(sched.reviewInterval).toBe(3)
    expect(sched.nextReview).toBe('2026-11-02')
  })

  it('resets to 1 day on forgot review', () => {
    const sched = scheduleAfterReview('2026-11-06', 'forgot', 7, 2, 'Solved alone')
    expect(sched.reviewInterval).toBe(1)
    expect(sched.nextReview).toBe('2026-11-07')
    expect(sched.reviewCount).toBe(0)
  })

  it('checks if due for review properly', () => {
    expect(isDueForReview('2026-10-26', '2026-10-26')).toBe(true)
    expect(isDueForReview('2026-10-25', '2026-10-26')).toBe(true) // overdue
    expect(isDueForReview('2026-10-27', '2026-10-26')).toBe(false)
  })

  it('calculates days until review', () => {
    expect(daysUntilReview('2026-10-29', '2026-10-26')).toBe(3)
    expect(daysUntilReview('2026-10-24', '2026-10-26')).toBe(-2) // 2 days overdue
  })
})
