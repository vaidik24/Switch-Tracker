import { addDays, diffDays } from './dates'
import type { PlanWeek } from '../db/db'

/**
 * Shift all future plan weeks (weeks with startDate >= afterDate) by N days.
 * Returns a new array of modified plan weeks (does not mutate originals).
 */
export function shiftPlanByDays(
  planWeeks: PlanWeek[],
  afterDate: string,
  days: number
): PlanWeek[] {
  return planWeeks.map(week => {
    if (week.startDate >= afterDate) {
      return {
        ...week,
        startDate: addDays(week.startDate, days),
        endDate: addDays(week.endDate, days),
      }
    }
    return week
  })
}

/**
 * Completely resets and aligns all 8 plan weeks starting from a new start date.
 * Week 0 (Baseline): 2 days prior to newStartDate.
 * Weeks 1 through 7: 7 days each.
 * Week 8: 12 days to cover full mocks and interview drive.
 */
export function recalculatePlanWeeksFromNewStart(
  planWeeks: PlanWeek[],
  newStartDate: string
): PlanWeek[] {
  const sorted = [...planWeeks].sort((a, b) => a.weekNumber - b.weekNumber)
  
  return sorted.map(week => {
    if (week.weekNumber === 0) {
      return {
        ...week,
        startDate: addDays(newStartDate, -2),
        endDate: addDays(newStartDate, -1),
      }
    }

    const weekOffset = week.weekNumber - 1
    const weekStart = addDays(newStartDate, weekOffset * 7)
    // Week 8 is extended to 12 days for mock rounds and outreach
    const weekDuration = week.weekNumber === 8 ? 11 : 6
    const weekEnd = addDays(weekStart, weekDuration)

    return {
      ...week,
      startDate: weekStart,
      endDate: weekEnd,
    }
  })
}

/**
 * Given a date, return which plan week it falls into (or null).
 */
export function getPlanWeekForDate(planWeeks: PlanWeek[], date: string): PlanWeek | null {
  return planWeeks.find(w => date >= w.startDate && date <= w.endDate) ?? null
}
