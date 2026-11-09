import { addDays } from './dates'
import type { SolveResult, ReviewResult } from '../db/db'

export interface SpacedRepSchedule {
  nextReview: string
  reviewInterval: number
  reviewCount: number
}

// Intervals in days for first-time scheduling after solve
const INITIAL_INTERVALS = [1, 3, 7, 14]

/**
 * Calculate first review schedule after solving a problem.
 * Hints or Failed: start at +1 day. Solved alone: +1 day (same).
 */
export function scheduleAfterSolve(
  dateSolved: string,
  result: SolveResult
): SpacedRepSchedule {
  const interval = 1 // Always start at +1 regardless of result
  return {
    nextReview: addDays(dateSolved, interval),
    reviewInterval: interval,
    reviewCount: 0,
  }
}

/**
 * Calculate next review after a review session.
 * - easy:   advance to next interval in sequence
 * - hard:   stay at current interval
 * - forgot: reset to +1 day
 */
export function scheduleAfterReview(
  reviewDate: string,
  result: ReviewResult,
  currentInterval: number,
  reviewCount: number,
  originalResult: SolveResult
): SpacedRepSchedule {
  let nextInterval: number
  let nextCount = reviewCount + 1

  if (result === 'forgot') {
    // Full reset
    nextInterval = 1
    nextCount = 0
  } else if (result === 'hard') {
    // Stay at current interval
    nextInterval = currentInterval
  } else {
    // easy: advance
    // Find where we are in the sequence and move up
    const currentIdx = INITIAL_INTERVALS.indexOf(currentInterval)
    if (currentIdx === -1 || currentIdx >= INITIAL_INTERVALS.length - 1) {
      // Beyond defined sequence: double the interval (max 60 days)
      nextInterval = Math.min(currentInterval * 2, 60)
    } else {
      nextInterval = INITIAL_INTERVALS[currentIdx + 1]
    }
  }

  return {
    nextReview: addDays(reviewDate, nextInterval),
    reviewInterval: nextInterval,
    reviewCount: nextCount,
  }
}

/**
 * Returns true if a problem is due for review today or overdue.
 */
export function isDueForReview(nextReview: string, today: string): boolean {
  return nextReview <= today
}

/**
 * Returns how many days until the next review (negative = overdue).
 */
export function daysUntilReview(nextReview: string, today: string): number {
  const a = new Date(today + 'T00:00:00+05:30').getTime()
  const b = new Date(nextReview + 'T00:00:00+05:30').getTime()
  return Math.round((b - a) / 86400000)
}
