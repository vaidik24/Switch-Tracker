import { describe, it, expect } from 'vitest'
import { CS_MICRO_CURRICULUM } from '../src/data/csMicroCurriculum'

describe('CS Micro-Curriculum Dataset', () => {
  it('contains exactly 56 topics (8 weeks x 7 days)', () => {
    expect(CS_MICRO_CURRICULUM).toHaveLength(56)
  })

  it('has unique IDs', () => {
    const ids = new Set(CS_MICRO_CURRICULUM.map(t => t.id))
    expect(ids.size).toBe(56)
  })

  it('covers all 8 weeks with exactly 7 days each', () => {
    for (let w = 1; w <= 8; w++) {
      const weekTopics = CS_MICRO_CURRICULUM.filter(t => t.weekNumber === w)
      expect(weekTopics).toHaveLength(7)
      const days = weekTopics.map(t => t.dayNumber).sort((a, b) => a - b)
      expect(days).toEqual([1, 2, 3, 4, 5, 6, 7])
    }
  })

  it('each topic has actionable deliverable and reasonable estMinutes', () => {
    for (const t of CS_MICRO_CURRICULUM) {
      expect(t.title).toBeTruthy()
      expect(t.estMinutes).toBeGreaterThanOrEqual(15)
      expect(t.estMinutes).toBeLessThanOrEqual(30)
      expect(t.deliverable.length).toBeGreaterThan(30)
    }
  })
})
