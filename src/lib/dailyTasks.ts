export interface DailyChecklistItem {
  id: string
  label: string
  icon: string
  mins: number
}

// Baseline / Environment setup items (for Week 0 before official start)
export const BASELINE_ITEMS: DailyChecklistItem[] = [
  { id: 'base-env', label: 'Setup IDE, LeetCode & notes workspace', icon: '⚙️', mins: 20 },
  { id: 'base-medium', label: 'Solve 2-3 baseline medium problems (calibrate timing)', icon: '⏱️', mins: 60 },
  { id: 'base-curriculum', label: 'Review CS & NeetCode 150 8-week syllabus', icon: '📖', mins: 20 },
  { id: 'base-companies', label: 'Shortlist 60 dream Tier-A/B companies (zero applications)', icon: '🏢', mins: 30 },
  { id: 'base-telegram', label: 'Verify Telegram bot & test notification connection', icon: '📱', mins: 5 },
]

// Weekday must-do items
export const WEEKDAY_ITEMS: DailyChecklistItem[] = [
  { id: 'dsa-new', label: 'DSA: Daily NeetCode problems', icon: '💡', mins: 45 },
  { id: 'dsa-revision', label: 'DSA: 1 revision problem', icon: '🔄', mins: 20 },
  { id: 'topic-study', label: 'Topic of the week (CS micro-learning)', icon: '📚', mins: 45 },
  { id: 'story-practice', label: 'Story / project answer practice', icon: '🎭', mins: 15 },
]

// Weekend must-do items (High-leverage sprint)
export const WEEKEND_ITEMS: DailyChecklistItem[] = [
  { id: 'mock-90', label: '90-min timed mock (2 DSA problems)', icon: '⏱️', mins: 90 },
  { id: 'design-exercise', label: 'System design or LLD exercise', icon: '🏗️', mins: 60 },
  { id: 'dsa-revision', label: 'DSA: Spaced revision problem', icon: '🔄', mins: 20 },
]

export function getDailyChecklistItems(
  isWeekendDay: boolean,
  weekendLightMode: boolean,
  isBaselineDay: boolean = false
): DailyChecklistItem[] {
  if (isBaselineDay) {
    return BASELINE_ITEMS
  }
  if (isWeekendDay) {
    if (weekendLightMode) {
      return WEEKEND_ITEMS.slice(0, 2)
    }
    return WEEKEND_ITEMS
  }
  return WEEKDAY_ITEMS
}
