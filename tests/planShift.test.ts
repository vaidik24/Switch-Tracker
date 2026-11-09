import { describe, it, expect } from 'vitest'
import { shiftPlanByDays, getPlanWeekForDate, recalculatePlanWeeksFromNewStart } from '../src/lib/planShift'
import type { PlanWeek } from '../src/db/db'

describe('planShift utility', () => {
  const dummyWeeks: PlanWeek[] = [
    {
      weekNumber: 0,
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      focusTopic: 'Baseline',
      dsaGoal: '3 problems',
      jobGoal: 'No applications',
      studyGoal: 'Terminology',
      completionPct: 0,
      isBaseline: true,
    },
    {
      weekNumber: 1,
      startDate: '2026-10-26',
      endDate: '2026-11-01',
      focusTopic: 'DSA Fundamentals',
      dsaGoal: '15 problems',
      jobGoal: 'No applications',
      studyGoal: 'OOP principles',
      completionPct: 0,
      isBaseline: false,
    },
    {
      weekNumber: 2,
      startDate: '2026-11-02',
      endDate: '2026-11-08',
      focusTopic: 'Trees & Graphs',
      dsaGoal: '15 problems',
      jobGoal: 'No applications',
      studyGoal: 'Concurrency',
      completionPct: 0,
      isBaseline: false,
    },
    {
      weekNumber: 3,
      startDate: '2026-11-09',
      endDate: '2026-11-15',
      focusTopic: 'LLD Basics',
      dsaGoal: '15 problems',
      jobGoal: 'No applications',
      studyGoal: 'Design patterns',
      completionPct: 0,
      isBaseline: false,
    },
  ]

  it('shifts future weeks by specified days without modifying past weeks', () => {
    const shifted = shiftPlanByDays(dummyWeeks, '2026-11-02', 3)

    expect(shifted[1].startDate).toBe('2026-10-26')
    expect(shifted[1].endDate).toBe('2026-11-01')

    expect(shifted[2].startDate).toBe('2026-11-05')
    expect(shifted[2].endDate).toBe('2026-11-11')

    expect(shifted[3].startDate).toBe('2026-11-12')
    expect(shifted[3].endDate).toBe('2026-11-18')
  })

  it('recalculates entire plan cleanly starting from a new start date (e.g. 11 Nov 2026)', () => {
    const recalced = recalculatePlanWeeksFromNewStart(dummyWeeks, '2026-11-11')

    // Week 0 baseline (2 days before)
    expect(recalced[0].startDate).toBe('2026-11-09')
    expect(recalced[0].endDate).toBe('2026-11-10')

    // Week 1 (7 days)
    expect(recalced[1].startDate).toBe('2026-11-11')
    expect(recalced[1].endDate).toBe('2026-11-17')

    // Week 2 (7 days)
    expect(recalced[2].startDate).toBe('2026-11-18')
    expect(recalced[2].endDate).toBe('2026-11-24')

    // Week 3 (7 days)
    expect(recalced[3].startDate).toBe('2026-11-25')
    expect(recalced[3].endDate).toBe('2026-12-01')
  })

  it('correctly finds the plan week for a given date', () => {
    const w1 = getPlanWeekForDate(dummyWeeks, '2026-10-28')
    expect(w1?.weekNumber).toBe(1)

    const w2 = getPlanWeekForDate(dummyWeeks, '2026-11-05')
    expect(w2?.weekNumber).toBe(2)

    const none = getPlanWeekForDate(dummyWeeks, '2026-12-31')
    expect(none).toBeNull()
  })
})
