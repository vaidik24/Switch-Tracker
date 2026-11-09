import Dexie, { Table } from 'dexie'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type ReviewResult = 'easy' | 'hard' | 'forgot'
export type SolveResult = 'Solved alone' | 'Solved with hints' | 'Failed'
export type ConceptStatus = "Don't know" | 'Can explain' | 'Can explain with example'
export type JobStatus = 'Wishlist' | 'Referral asked' | 'Applied' | 'Online assessment' | 'Interviewing' | 'Offer' | 'Rejected/Closed'
export type JobTier = 'A' | 'B' | 'C' | 'Practice'
export type LLDHLDCategory = 'LLD' | 'HLD'
export type StoryType = 'star' | 'projectQ' | 'numbers'
export type MockType = 'DSA' | 'LLD' | 'HLD' | 'Behavioural' | 'AI-assisted debugging'
export type ChecklistType = 'resume' | 'linkedin' | 'offer'

export type AccountabilityTone = 'hardcore' | 'coach' | 'roast'

export interface Settings {
  id?: number
  theme: 'dark' | 'light'
  planStartDate: string // YYYY-MM-DD
  startDateResetsRemaining: number // default 3
  accountabilityTone: AccountabilityTone // default 'hardcore'
  whyIMustSwitch: string // personal North Star motivation
  nextDayPlanTime: string // default '21:30'
  reminderTimes: string[] // ["08:00","13:30","19:00","22:00"]
  quietHoursStart: string // "23:30"
  quietHoursEnd: string   // "07:00"
  nagIntervalMinutes: number
  weekendLightMode: boolean
  soundEnabled: boolean
  notificationsPermission: NotificationPermission | 'default'
  lastBackupDate: string | null
  onboardingDone: boolean
}

export interface DailyLog {
  date: string // YYYY-MM-DD (PK)
  checklistState: Record<string, boolean> // itemId -> checked
  doneForToday: boolean
  missReason: string | null // sick | travel | work overload | rest day | null
  notes: string
  streak: number
  completedAt: string | null
}

export interface Problem {
  id?: number
  title: string
  url: string
  difficulty: Difficulty
  pattern: string[]     // tags
  dateSolved: string    // YYYY-MM-DD
  timeTaken: number     // minutes
  result: SolveResult
  confidence: number    // 1-5
  notes: string
  language: string
  nextReview: string    // YYYY-MM-DD
  reviewInterval: number // days (current interval in spaced rep)
  reviewCount: number
}

export interface Review {
  id?: number
  problemId: number
  date: string // YYYY-MM-DD
  result: ReviewResult
}

export interface LLDHLDItem {
  id?: number
  category: LLDHLDCategory
  title: string
  stagesState: Record<string, boolean> // stageName -> done
  notes: string
  link: string
  order: number
}

export interface Concept {
  id?: number
  term: string
  category: string
  status: ConceptStatus
  myExplanation: string
  nextReview: string // YYYY-MM-DD
  reviewInterval: number
  reviewCount: number
}

export interface ConceptReview {
  id?: number
  conceptId: number
  date: string
  rating: 1 | 2 | 3 | 4 | 5 // 1-2 = low, 3 = medium, 4-5 = high
}

export interface Story {
  id?: number
  type: StoryType
  title: string
  // STAR fields
  situation: string
  task: string
  action: string
  result: string
  whatIdDoDifferently: string
  // Project Q fields
  questionText: string
  answerScript: string
  practicedAloud: boolean
  practiceCount: number
  // Numbers card
  numbersData: Record<string, string>
}

export interface Job {
  id?: number
  company: string
  tier: JobTier
  role: string
  jobLink: string
  location: string
  expectedSalaryBand: string
  source: string
  contactPerson: string
  contactLinkedIn: string
  dateApplied: string | null // YYYY-MM-DD
  nextFollowUp: string | null // YYYY-MM-DD
  status: JobStatus
  statusHistory: Array<{ status: JobStatus; date: string }>
  notes: string
  order: number // for kanban ordering
}

export interface InterviewRound {
  id?: number
  jobId: number
  date: string // YYYY-MM-DD
  type: string
  topicsAsked: string
  howItWent: string
  feedback: string
}

export interface Contact {
  id?: number
  jobId: number | null
  name: string
  company: string
  relationship: string
  messageSentDate: string | null // YYYY-MM-DD
  replied: boolean
  followUpCount: number
  nextFollowUp: string | null // YYYY-MM-DD
  notes: string
}

export interface Template {
  id?: number
  type: 'referral' | 'recruiter-email' | 'linkedin-note' | 'follow-up' | 'salary-reply' | 'custom'
  name: string
  subject: string
  body: string
  isDefault: boolean
}

export interface MockLog {
  id?: number
  date: string // YYYY-MM-DD
  type: MockType
  withWhom: string
  durationMinutes: number
  score: number // 1-5
  wentWell: string
  toFix: string
  notes: string
}

export interface WeeklyReview {
  weekStartDate: string // YYYY-MM-DD (PK)
  problemsSolved: number
  patternsCovered: string[]
  tasksCompletedPct: number
  applicationsSent: number
  streak: number
  missedItems: string[]
  whatWorked: string
  whatSlipped: string
  planForNextWeek: string
  createdAt: string
}

export interface PlanWeek {
  weekNumber: number // 0-8 (PK)
  startDate: string  // YYYY-MM-DD
  endDate: string    // YYYY-MM-DD
  focusTopic: string
  dsaGoal: string
  jobGoal: string
  studyGoal: string
  completionPct: number
  isBaseline: boolean
}

export interface ChecklistItem {
  id?: number
  listType: ChecklistType
  title: string
  done: boolean
  order: number
  notes: string
}

export interface OfferComparison {
  id?: number
  company: string
  jobId: number | null
  baseSalary: number
  variableBonus: number
  joiningBonus: number
  rsus: number
  vestingYears: number
  noticePeriodDays: number
  location: string
  notes: string
}

export interface OutboxItem {
  id?: number
  entity: string
  recordId: string
  action: 'upsert' | 'delete'
  data: any
  updatedAt: string
}

export interface SyncMeta {
  key: string
  value: string
}

// ─── Dexie DB ─────────────────────────────────────────────────────────────────

class TrackerDB extends Dexie {
  settings!: Table<Settings>
  dailyLogs!: Table<DailyLog>
  problems!: Table<Problem>
  reviews!: Table<Review>
  lldHldItems!: Table<LLDHLDItem>
  concepts!: Table<Concept>
  conceptReviews!: Table<ConceptReview>
  stories!: Table<Story>
  jobs!: Table<Job>
  interviewRounds!: Table<InterviewRound>
  contacts!: Table<Contact>
  templates!: Table<Template>
  mockLogs!: Table<MockLog>
  weeklyReviews!: Table<WeeklyReview>
  planWeeks!: Table<PlanWeek>
  checklistItems!: Table<ChecklistItem>
  offerComparisons!: Table<OfferComparison>
  outbox!: Table<OutboxItem>
  syncMeta!: Table<SyncMeta>

  constructor() {
    super('TrackerDB')

    this.version(1).stores({
      settings:        '++id',
      dailyLogs:       'date',
      problems:        '++id, date, difficulty, nextReview, dateSolved',
      reviews:         '++id, problemId, date',
      lldHldItems:     '++id, category',
      concepts:        '++id, category, nextReview',
      conceptReviews:  '++id, conceptId, date',
      stories:         '++id, type',
      jobs:            '++id, status, tier, nextFollowUp',
      interviewRounds: '++id, jobId, date',
      contacts:        '++id, jobId',
      templates:       '++id, type',
      mockLogs:        '++id, date',
      weeklyReviews:   'weekStartDate',
      planWeeks:       'weekNumber',
      checklistItems:  '++id, listType',
      offerComparisons:'++id',
    })

    this.version(2).stores({
      outbox:          '++id, entity, recordId, action',
      syncMeta:        'key',
    })
  }
}

export const db = new TrackerDB()
export default db
