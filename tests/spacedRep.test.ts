import { describe, it, expect } from 'vitest'
import {
  scheduleAfterSolve,
  scheduleAfterReview,
  scheduleNeetCodeAfterSolve,
  scheduleNeetCodeAfterReview,
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

describe('NeetCode 150 spacedRep rules', () => {
  it('schedules alone at +7 days', () => {
    const sched = scheduleNeetCodeAfterSolve('2026-11-15', 'alone')
    expect(sched.nextReview).toBe('2026-11-22')
    expect(sched.reviewInterval).toBe(7)
    expect(sched.reviewCount).toBe(0)
  })

  it('schedules hints at +2 days', () => {
    const sched = scheduleNeetCodeAfterSolve('2026-11-15', 'hints')
    expect(sched.nextReview).toBe('2026-11-17')
    expect(sched.reviewInterval).toBe(2)
    expect(sched.reviewCount).toBe(0)
  })

  it('schedules failed at +1 day (tomorrow)', () => {
    const sched = scheduleNeetCodeAfterSolve('2026-11-15', 'failed')
    expect(sched.nextReview).toBe('2026-11-16')
    expect(sched.reviewInterval).toBe(1)
    expect(sched.reviewCount).toBe(0)
  })

  it('handles review results for NeetCode: easy advances, hard repeats in +2, forgot resets to +1', () => {
    // Review after hints (started at 2)
    let sched = scheduleNeetCodeAfterReview('2026-11-17', 'easy', 2, 0)
    expect(sched.reviewInterval).toBe(7)
    expect(sched.nextReview).toBe('2026-11-24')

    // Next review easy -> 14 days
    sched = scheduleNeetCodeAfterReview('2026-11-24', 'easy', 7, 1)
    expect(sched.reviewInterval).toBe(14)
    expect(sched.nextReview).toBe('2026-12-08')

    // Next review hard -> 2 days
    sched = scheduleNeetCodeAfterReview('2026-12-08', 'hard', 14, 2)
    expect(sched.reviewInterval).toBe(2)
    expect(sched.nextReview).toBe('2026-12-10')

    // Next review forgot -> resets to 1 day
    sched = scheduleNeetCodeAfterReview('2026-12-10', 'forgot', 2, 3)
    expect(sched.reviewInterval).toBe(1)
    expect(sched.nextReview).toBe('2026-12-11')
    expect(sched.reviewCount).toBe(0)
  })
})
