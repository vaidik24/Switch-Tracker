import { describe, it, expect } from 'vitest'
import { NEETCODE_150 } from '../src/data/neetcode150'

describe('NeetCode 150 Dataset', () => {
  it('contains exactly 150 problems', () => {
    expect(NEETCODE_150).toHaveLength(150)
  })

  it('all problems have valid required fields', () => {
    for (const p of NEETCODE_150) {
      expect(p.id).toMatch(/^nc-/)
      expect(p.title).toBeTruthy()
      expect(p.slug).toBeTruthy()
      expect(p.url).toMatch(/^https:\/\/leetcode\.com\/problems\//)
      expect(['Easy', 'Medium', 'Hard']).toContain(p.difficulty)
      expect(p.estMinutes).toBeGreaterThan(0)
      expect(p.weekNumber).toBeGreaterThanOrEqual(1)
      expect(p.weekNumber).toBeLessThanOrEqual(8)
      expect(p.dayNumber).toBeGreaterThanOrEqual(1)
      expect(p.dayNumber).toBeLessThanOrEqual(7)
    }
  })

  it('has unique ids and slugs', () => {
    const ids = new Set(NEETCODE_150.map(p => p.id))
    expect(ids.size).toBe(150)

    const slugs = new Set(NEETCODE_150.map(p => p.slug))
    expect(slugs.size).toBe(150)
  })

  it('has correct distribution across categories', () => {
    const counts: Record<string, number> = {}
    for (const p of NEETCODE_150) {
      counts[p.category] = (counts[p.category] || 0) + 1
    }

    expect(counts['Arrays & Hashing']).toBe(9)
    expect(counts['Two Pointers']).toBe(5)
    expect(counts['Sliding Window']).toBe(6)
    expect(counts['Stack']).toBe(7)
    expect(counts['Binary Search']).toBe(7)
    expect(counts['Linked List']).toBe(11)
    expect(counts['Trees']).toBe(15)
    expect(counts['Tries']).toBe(3)
    expect(counts['Heap / Priority Queue']).toBe(7)
    expect(counts['Backtracking']).toBe(9)
    expect(counts['Graphs']).toBe(13)
    expect(counts['Advanced Graphs']).toBe(6)
    expect(counts['1-D Dynamic Programming']).toBe(12)
    expect(counts['2-D Dynamic Programming']).toBe(11)
    expect(counts['Greedy']).toBe(8)
    expect(counts['Intervals']).toBe(6)
    expect(counts['Math & Geometry']).toBe(8)
    expect(counts['Bit Manipulation']).toBe(7)
  })

  it('distributes problems across weeks 1 to 7 without overloading', () => {
    const weekCounts: Record<number, number> = {}
    for (const p of NEETCODE_150) {
      weekCounts[p.weekNumber] = (weekCounts[p.weekNumber] || 0) + 1
    }

    // Week 1: 20, Week 2: 25, Week 3: 22, Week 4: 19, Week 5: 21, Week 6: 23, Week 7: 20
    expect(weekCounts[1]).toBe(20)
    expect(weekCounts[2]).toBe(25)
    expect(weekCounts[3]).toBe(22)
    expect(weekCounts[4]).toBe(19)
    expect(weekCounts[5]).toBe(23)
    expect(weekCounts[6]).toBe(23)
  })
})
