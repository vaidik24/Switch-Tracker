import db from './db'
import type {
  Settings, PlanWeek, LLDHLDItem, Concept,
  Story, Job, Template, ChecklistItem
} from './db'
import { todayIST } from '../lib/dates'

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00+05:30')
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const PLAN_START = '2026-11-11' // Week 1 start

const PLAN_WEEKS: Omit<PlanWeek, never>[] = [
  {
    weekNumber: 0,
    startDate: '2026-11-09',
    endDate: '2026-11-10',
    focusTopic: 'Baseline & Environment Setup',
    dsaGoal: 'Solve 3 medium problems timed; setup spaced repetition',
    jobGoal: 'Zero applications: Target 60 dream companies list only',
    studyGoal: 'Read terminology list end-to-end; configure Telegram reminders',
    completionPct: 0,
    isBaseline: true,
  },
  {
    weekNumber: 1,
    startDate: '2026-11-11',
    endDate: '2026-11-17',
    focusTopic: 'Arrays, Two Pointers, Sliding Window + OS & Node.js',
    dsaGoal: '20-25 problems: arrays, hashing, two pointers, sliding window',
    jobGoal: 'NO APPLICATIONS (Pure Prep): Audit resume & portfolio',
    studyGoal: 'OS: processes, threads, event loop phases, scheduling, memory leaks',
    completionPct: 0,
    isBaseline: false,
  },
  {
    weekNumber: 2,
    startDate: '2026-11-18',
    endDate: '2026-11-24',
    focusTopic: 'Stack, Monotonic Stack, Binary Search, Linked Lists + DBMS',
    dsaGoal: '25 problems: stack, monotonic stack, binary search, linked lists',
    jobGoal: 'NO APPLICATIONS: Polish LinkedIn profile and headline',
    studyGoal: 'DBMS: ACID, B-Tree indexes, isolation levels, transactions, EXPLAIN ANALYZE',
    completionPct: 0,
    isBaseline: false,
  },
  {
    weekNumber: 3,
    startDate: '2026-11-25',
    endDate: '2026-12-01',
    focusTopic: 'Trees, BST, Heaps, Priority Queues + Networks & Auth',
    dsaGoal: '25 problems: binary trees, BST traversal, heaps, top-K',
    jobGoal: 'NO APPLICATIONS: Research hiring managers for Tier A/B targets',
    studyGoal: 'Networks: HTTP/1.1-3, TCP, TLS, WebSockets, JWT, OAuth2 sessions',
    completionPct: 0,
    isBaseline: false,
  },
  {
    weekNumber: 4,
    startDate: '2026-12-02',
    endDate: '2026-12-08',
    focusTopic: 'Graphs (BFS/DFS), Topological Sort, Union Find + LLD 1-3',
    dsaGoal: '25 problems: graph BFS/DFS, cycle detection, topological sort, union find',
    jobGoal: 'Draft STAR stories (Ownership, Dive Deep, Deliver Results)',
    studyGoal: 'OOP, SOLID, Design Patterns, LLD 1-3 (LRU/LFU cache, Rate limiter, Parking lot)',
    completionPct: 0,
    isBaseline: false,
  },
  {
    weekNumber: 5,
    startDate: '2026-12-09',
    endDate: '2026-12-15',
    focusTopic: 'Backtracking, Intervals, Greedy, 1D DP + LLD 4-8',
    dsaGoal: '25 problems: intervals, greedy, 1D dynamic programming',
    jobGoal: 'Complete Project Q&A answers (CRM & AI transcription pipeline)',
    studyGoal: 'LLD 4-8: BookMyShow concurrency, Splitwise, Elevator, In-memory KV store with TTL',
    completionPct: 0,
    isBaseline: false,
  },
  {
    weekNumber: 6,
    startDate: '2026-12-16',
    endDate: '2026-12-22',
    focusTopic: '2D DP, Shortest Path (Dijkstra), Trie + HLD Systems',
    dsaGoal: '20 problems: 2D DP, Dijkstra, Trie',
    jobGoal: 'Prepare tailored outreach templates for top 10 target companies',
    studyGoal: 'HLD Core: Load balancers, CDN, Caching strategies, Partitioning, Kafka & Redis deep dive',
    completionPct: 0,
    isBaseline: false,
  },
  {
    weekNumber: 7,
    startDate: '2026-12-23',
    endDate: '2026-12-29',
    focusTopic: 'Complex System Design (HLD) + Behavioural Mastery',
    dsaGoal: '15 hard/mixed problem drills + spaced revision',
    jobGoal: 'SOFT LAUNCH: First 5 referral asks to trusted colleagues / friends',
    studyGoal: 'HLD Systems: Chat/WhatsApp, Video Upload, Distributed Idempotent Payment/Ledger',
    completionPct: 0,
    isBaseline: false,
  },
  {
    weekNumber: 8,
    startDate: '2026-12-30',
    endDate: '2027-01-10',
    focusTopic: 'Full Timed Mocks + FULL JOB APPLICATION DRIVE',
    dsaGoal: '10 timed mocks (2 problems in 60 min) + revise weak patterns',
    jobGoal: 'FULL OUTREACH DRIVE: 10 referrals/week, 10 recruiter pitches/week, 8 tailored applications',
    studyGoal: 'Full mock interviews aloud, AI debugging scenarios, final interview polish',
    completionPct: 0,
    isBaseline: false,
  },
]

const LLD_ITEMS: Omit<LLDHLDItem, 'id'>[] = [
  'Parking lot',
  'LRU and LFU cache',
  'Rate limiter (token bucket, sliding window)',
  'BookMyShow seat booking with concurrency',
  'Splitwise',
  'Elevator system',
  'Notification service',
  'In-memory key-value store with TTL',
].map((title, i) => ({
  category: 'LLD' as const,
  title,
  stagesState: {},
  notes: '',
  link: '',
  order: i,
}))

const HLD_ITEMS: Omit<LLDHLDItem, 'id'>[] = [
  'URL shortener',
  'Distributed rate limiter',
  'Notification system',
  'Chat/WhatsApp-style messaging',
  'News feed',
  'Payment or wallet system (idempotency, ledger)',
  'File storage or video upload',
  'My own audio transcription pipeline',
].map((title, i) => ({
  category: 'HLD' as const,
  title,
  stagesState: {},
  notes: '',
  link: '',
  order: i,
}))

const CONCEPTS_DATA: Array<{ term: string; category: string }> = [
  // Distributed systems
  { term: 'CAP and PACELC', category: 'Distributed systems' },
  { term: 'Consistency models (strong, eventual, read-your-writes)', category: 'Distributed systems' },
  { term: 'Idempotency and idempotency keys', category: 'Distributed systems' },
  { term: 'At-least-once vs exactly-once delivery', category: 'Distributed systems' },
  { term: 'Retries with exponential backoff and jitter', category: 'Distributed systems' },
  { term: 'Circuit breaker', category: 'Distributed systems' },
  { term: 'Bulkhead', category: 'Distributed systems' },
  { term: 'Backpressure', category: 'Distributed systems' },
  { term: 'Rate limiting algorithms', category: 'Distributed systems' },
  { term: 'Consistent hashing', category: 'Distributed systems' },
  { term: 'Sharding vs partitioning', category: 'Distributed systems' },
  { term: 'Leader-follower replication', category: 'Distributed systems' },
  { term: 'Outbox pattern', category: 'Distributed systems' },
  { term: 'Saga', category: 'Distributed systems' },
  { term: 'CQRS', category: 'Distributed systems' },
  { term: 'Event sourcing', category: 'Distributed systems' },
  { term: 'Dead-letter queue', category: 'Distributed systems' },
  // Databases
  { term: 'ACID vs BASE', category: 'Databases' },
  { term: 'Isolation levels and anomalies', category: 'Databases' },
  { term: 'MVCC', category: 'Databases' },
  { term: 'B-tree indexes', category: 'Databases' },
  { term: 'Composite index and leftmost prefix rule', category: 'Databases' },
  { term: 'Covering index', category: 'Databases' },
  { term: 'EXPLAIN ANALYZE', category: 'Databases' },
  { term: 'N+1 problem', category: 'Databases' },
  { term: 'Connection pooling', category: 'Databases' },
  { term: 'Deadlocks', category: 'Databases' },
  { term: 'Optimistic vs pessimistic locking', category: 'Databases' },
  { term: 'Postgres row level security', category: 'Databases' },
  { term: 'JSONB', category: 'Databases' },
  { term: 'pgvector', category: 'Databases' },
  // Messaging and caching
  { term: 'Kafka topics, partitions, consumer groups, offsets, ordering', category: 'Messaging & Caching' },
  { term: 'RabbitMQ vs SQS', category: 'Messaging & Caching' },
  { term: 'Redis data structures, TTL, eviction', category: 'Messaging & Caching' },
  { term: 'Cache-aside, write-through, write-behind', category: 'Messaging & Caching' },
  { term: 'Cache stampede', category: 'Messaging & Caching' },
  { term: 'CDN', category: 'Messaging & Caching' },
  { term: 'L4 vs L7 load balancing', category: 'Messaging & Caching' },
  // Node.js and backend
  { term: 'Event loop phases', category: 'Node.js & Backend' },
  { term: 'Microtasks vs macrotasks', category: 'Node.js & Backend' },
  { term: 'Streams and backpressure', category: 'Node.js & Backend' },
  { term: 'worker_threads vs cluster vs child processes', category: 'Node.js & Backend' },
  { term: 'Memory leaks and profiling', category: 'Node.js & Backend' },
  { term: 'Graceful shutdown', category: 'Node.js & Backend' },
  { term: 'REST pagination, versioning, error models', category: 'Node.js & Backend' },
  { term: 'gRPC basics', category: 'Node.js & Backend' },
  { term: 'OpenAPI', category: 'Node.js & Backend' },
  // Reliability
  { term: 'Logs, metrics, traces', category: 'Reliability' },
  { term: 'OpenTelemetry', category: 'Reliability' },
  { term: 'SLI, SLO, SLA', category: 'Reliability' },
  { term: 'Alerting', category: 'Reliability' },
  { term: 'Blue-green and canary deploys', category: 'Reliability' },
  { term: 'Docker and Kubernetes basics', category: 'Reliability' },
  { term: 'CI/CD', category: 'Reliability' },
  { term: 'Twelve-factor app', category: 'Reliability' },
  { term: 'FinOps', category: 'Reliability' },
  // AI engineering
  { term: 'RAG', category: 'AI Engineering' },
  { term: 'Embeddings and vector search', category: 'AI Engineering' },
  { term: 'Structured outputs and tool calling', category: 'AI Engineering' },
  { term: 'Prompt versioning and evaluation', category: 'AI Engineering' },
  { term: 'Latency and token cost trade-offs', category: 'AI Engineering' },
  { term: 'Guardrails and fallback models', category: 'AI Engineering' },
  { term: 'Queue-based batch inference', category: 'AI Engineering' },
  { term: 'MCP', category: 'AI Engineering' },
  // Core CS
  { term: 'OS: processes, threads, scheduling, deadlocks, memory', category: 'Core CS' },
  { term: 'DBMS: normalisation, joins, transactions', category: 'Core CS' },
  { term: 'Networks: HTTP/1.1, 2, 3, TCP, TLS, DNS, WebSockets', category: 'Core CS' },
  { term: 'Auth: JWT, OAuth2, sessions', category: 'Core CS' },
  { term: 'OOP and SOLID, design patterns', category: 'Core CS' },
]

const PROJECT_QUESTIONS: Omit<Story, 'id'>[] = [
  { type: 'projectQ', title: 'Architecture overview', questionText: 'Draw the architecture; where are the queues and what happens on failure?', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'projectQ', title: 'Idempotency', questionText: 'How do you guarantee a call or meeting is not processed twice (idempotency)?', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'projectQ', title: 'Pyannote/Whisper cost & FinOps', questionText: 'What does Pyannote or Faster-Whisper cost to run and how did the FinOps cron decide when to scale?', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'projectQ', title: 'Worker crash & retries', questionText: 'What happens when a worker crashes mid-job; retries and poison messages?', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'projectQ', title: 'Why Supabase/Node-Cron vs Kafka/SQS', questionText: 'Why Supabase and Node-Cron instead of Kafka, SQS or BullMQ; what changes at 10x scale?', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'projectQ', title: 'WhatsApp session auth', questionText: 'How is WhatsApp session auth state secured in the database?', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'projectQ', title: 'Bitrix24 entity mapping', questionText: 'How were communications mapped to Bitrix24 entities and mismatches handled?', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'projectQ', title: 'Accuracy/WER & Gemini eval', questionText: 'What accuracy or word error rate did you see and how were Gemini outputs evaluated?', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'projectQ', title: 'Monitoring & alerts', questionText: 'What would you monitor and what alerts would you set?', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'projectQ', title: 'Hardest bug & lessons', questionText: 'Hardest bug and lessons.', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
]

const STAR_STORIES: Omit<Story, 'id'>[] = [
  { type: 'star', title: 'Ownership', questionText: 'Ownership', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'star', title: 'Dive Deep', questionText: 'Dive Deep', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'star', title: 'Bias for Action', questionText: 'Bias for Action', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'star', title: 'Deliver Results', questionText: 'Deliver Results', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'star', title: 'Customer Focus', questionText: 'Customer Focus', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
  { type: 'star', title: 'Disagree and Commit', questionText: 'Disagree and Commit', answerScript: '', practicedAloud: false, practiceCount: 0, situation: '', task: '', action: '', result: '', whatIdDoDifferently: '', numbersData: {} },
]

const NUMBERS_STORY: Omit<Story, 'id'> = {
  type: 'numbers',
  title: 'Numbers I Must Remember',
  questionText: '',
  answerScript: '',
  practicedAloud: false,
  practiceCount: 0,
  situation: '',
  task: '',
  action: '',
  result: '',
  whatIdDoDifferently: '',
  numbersData: {
    'Audio hours per day': '',
    'Avg call processing latency': '',
    'Cost per call (approx)': '',
    'System uptime %': '',
    'Number of workers': '',
    'Active users/companies': '',
    'Meetings per day': '',
    'Word Error Rate (WER) %': '',
  },
}

const COMPANIES: Omit<Job, 'id'>[] = [
  // Tier A
  ...['Amazon','Microsoft','Atlassian','Adobe','Uber','Walmart Global Tech','Flipkart','Intuit'].map((c,i) => ({
    company: c, tier: 'A' as const, role: 'Software Engineer', jobLink: '', location: 'India',
    expectedSalaryBand: '', source: '', contactPerson: '', contactLinkedIn: '',
    dateApplied: null, nextFollowUp: null, status: 'Wishlist' as const,
    statusHistory: [{ status: 'Wishlist' as const, date: todayIST() }],
    notes: '', order: i,
  })),
  // Tier B
  ...['Razorpay','PhonePe','Swiggy','Zomato','CRED','Postman','Meesho','Zepto','Visa','Mastercard'].map((c,i) => ({
    company: c, tier: 'B' as const, role: 'Software Engineer', jobLink: '', location: 'India',
    expectedSalaryBand: '', source: '', contactPerson: '', contactLinkedIn: '',
    dateApplied: null, nextFollowUp: null, status: 'Wishlist' as const,
    statusHistory: [{ status: 'Wishlist' as const, date: todayIST() }],
    notes: '', order: i + 10,
  })),
  // Tier C
  ...['Freshworks','Zoho','Salesforce India','Exotel','Yellow.ai','Observe.AI'].map((c,i) => ({
    company: c, tier: 'C' as const, role: 'Software Engineer', jobLink: '', location: 'India',
    expectedSalaryBand: '', source: '', contactPerson: '', contactLinkedIn: '',
    dateApplied: null, nextFollowUp: null, status: 'Wishlist' as const,
    statusHistory: [{ status: 'Wishlist' as const, date: todayIST() }],
    notes: '', order: i + 20,
  })),
]

const TEMPLATES: Omit<Template, 'id'>[] = [
  {
    type: 'referral',
    name: 'Referral Request',
    subject: '',
    body: `Hi {Name}, I'm Vaidik, a software engineer at Almashines (1.9 yrs, Node.js and distributed workers). I built an AI pipeline that auto-processes 150+ calls and 20+ meetings a day into our CRM. I noticed {Company} is hiring for {Role} ({Link}). Would you be open to referring me? I can send a short summary and my resume. Thanks for considering.`,
    isDefault: true,
  },
  {
    type: 'recruiter-email',
    name: 'Recruiter Email',
    subject: 'SDE backend engineer (1.9 yrs, Node.js, AI pipelines) for {Role} at {Company}',
    body: `Hi {Name},\n\nI'm Vaidik Pandya, a backend engineer with 1.9 years at Almashines building AI pipelines that process 150+ calls and 20+ meetings daily into CRM. My stack: Node.js, TypeScript, Supabase, Python workers, WhatsApp API.\n\nI'm exploring backend/fullstack SDE roles at {Company} — specifically {Role}. May I send my resume?\n\nThanks,\nVaidik`,
    isDefault: true,
  },
  {
    type: 'linkedin-note',
    name: 'LinkedIn Connection Note',
    subject: '',
    body: `Hi {Name} — I'm Vaidik, backend SDE (Node.js + AI pipelines at Almashines). Exploring roles at {Company}. Would love to connect!`,
    isDefault: true,
  },
  {
    type: 'follow-up',
    name: 'Follow-up (5-7 days)',
    subject: 'Re: {Role} at {Company}',
    body: `Hi {Name}, just following up on my message from last week regarding the {Role} role at {Company}. Happy to share my resume or a quick summary if helpful. Thanks!`,
    isDefault: true,
  },
  {
    type: 'salary-reply',
    name: 'Salary Expectation Reply',
    subject: '',
    body: `Thanks for asking! I'm looking at a CTC in the range of [X–Y LPA] based on the role scope and market, but I'm flexible and keen to understand the full package. Happy to discuss further.`,
    isDefault: true,
  },
]

const RESUME_CHECKLIST: Omit<ChecklistItem, 'id'>[] = [
  { listType: 'resume', title: 'Rewrite all bullets with scale/impact numbers', done: false, order: 0, notes: '' },
  { listType: 'resume', title: 'Remove "Soft Skills" section', done: false, order: 1, notes: '' },
  { listType: 'resume', title: 'Remove Markup/Style (HTML, CSS) from skills', done: false, order: 2, notes: '' },
  { listType: 'resume', title: 'Add relocation/work-from-office preference line', done: false, order: 3, notes: '' },
  { listType: 'resume', title: 'Add 2-3 line professional summary at top', done: false, order: 4, notes: '' },
  { listType: 'resume', title: 'Create tailored version for each Tier A company', done: false, order: 5, notes: '' },
  { listType: 'resume', title: 'Proofread for typos and grammar', done: false, order: 6, notes: '' },
  { listType: 'resume', title: 'ATS check (upload to Jobscan or similar)', done: false, order: 7, notes: '' },
]

const LINKEDIN_CHECKLIST: Omit<ChecklistItem, 'id'>[] = [
  { listType: 'linkedin', title: 'Update headline: backend SDE + AI pipelines + open to work', done: false, order: 0, notes: '' },
  { listType: 'linkedin', title: 'Write compelling About section (300 chars hook + story)', done: false, order: 1, notes: '' },
  { listType: 'linkedin', title: 'Add Featured: project write-up or demo link', done: false, order: 2, notes: '' },
  { listType: 'linkedin', title: 'Update Skills section (pin top 3)', done: false, order: 3, notes: '' },
  { listType: 'linkedin', title: 'Enable Open to Work (recruiters only)', done: false, order: 4, notes: '' },
  { listType: 'linkedin', title: 'Post 1 technical post every 1-2 weeks', done: false, order: 5, notes: '' },
  { listType: 'linkedin', title: 'Request 2-3 recommendations from colleagues', done: false, order: 6, notes: '' },
]

const DEFAULT_SETTINGS: Omit<Settings, 'id'> = {
  theme: 'dark',
  planStartDate: '2026-11-11',
  startDateResetsRemaining: 3,
  accountabilityTone: 'hardcore',
  whyIMustSwitch: 'To escape career stagnation, command a top-tier compensation (35L+), and master engineering at scale.',
  nextDayPlanTime: '21:30',
  reminderTimes: ['08:00', '13:30', '19:00', '22:00'],
  quietHoursStart: '23:30',
  quietHoursEnd: '07:00',
  nagIntervalMinutes: 30,
  weekendLightMode: false,
  soundEnabled: false,
  notificationsPermission: 'default',
  lastBackupDate: null,
  onboardingDone: false,
}

export async function seedDatabase() {
  const existingSettings = await db.settings.toArray()
  
  if (existingSettings.length > 0) {
    const current = existingSettings[0]
    const updates: Partial<Settings> = {}
    if (current.startDateResetsRemaining === undefined) updates.startDateResetsRemaining = 3
    if (!current.accountabilityTone) updates.accountabilityTone = 'hardcore'
    if (!current.whyIMustSwitch) updates.whyIMustSwitch = DEFAULT_SETTINGS.whyIMustSwitch
    if (!current.nextDayPlanTime) updates.nextDayPlanTime = '21:30'
    if (!current.planStartDate || current.planStartDate < '2026-11-01') {
      updates.planStartDate = '2026-11-11'
      // Refresh plan weeks to new 2-month schedule
      await db.planWeeks.clear()
      await db.planWeeks.bulkAdd(PLAN_WEEKS)
    }
    if (Object.keys(updates).length > 0 && current.id) {
      await db.settings.update(current.id, updates)
    }
    return
  }

  console.log('Seeding database with 2-month hardcore prep plan...')

  await db.transaction('rw', [
    db.settings, db.planWeeks, db.lldHldItems, db.concepts,
    db.stories, db.jobs, db.templates, db.checklistItems
  ], async () => {
    await db.settings.add(DEFAULT_SETTINGS)
    await db.planWeeks.bulkAdd(PLAN_WEEKS)
    await db.lldHldItems.bulkAdd([...LLD_ITEMS, ...HLD_ITEMS])
    await db.concepts.bulkAdd(
      CONCEPTS_DATA.map(c => ({
        ...c,
        status: "Don't know" as const,
        myExplanation: '',
        nextReview: todayIST(),
        reviewInterval: 1,
        reviewCount: 0,
      }))
    )
    await db.stories.bulkAdd([...PROJECT_QUESTIONS, ...STAR_STORIES, NUMBERS_STORY])
    await db.jobs.bulkAdd(COMPANIES)
    await db.templates.bulkAdd(TEMPLATES)
    await db.checklistItems.bulkAdd([...RESUME_CHECKLIST, ...LINKEDIN_CHECKLIST])
  })

  console.log('Database seeded!')
}
