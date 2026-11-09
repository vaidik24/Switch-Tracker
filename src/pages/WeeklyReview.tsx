import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import db from '../db/db'
import type { WeeklyReview } from '../db/db'
import { todayIST, formatDateLong, weekStart } from '../lib/dates'

export default function WeeklyReview() {
  const today = todayIST()
  const thisWeekStart = weekStart(today)
  const [worked, setWorked] = useState('')
  const [slipped, setSlipped] = useState('')
  const [nextWeekPlan, setNextWeekPlan] = useState('')
  const [saving, setSaving] = useState(false)

  const reviews = useLiveQuery(() =>
    db.weeklyReviews.orderBy('weekStartDate').reverse().toArray()
  )
  const existing = reviews?.find(r => r.weekStartDate === thisWeekStart)

  const problems = useLiveQuery(() => db.problems.toArray())
  const logs = useLiveQuery(() => db.dailyLogs.toArray())
  const jobs = useLiveQuery(() => db.jobs.toArray())

  // Auto-compute this week's stats
  const thisWeekProblems = problems?.filter(p =>
    p.dateSolved >= thisWeekStart && p.dateSolved <= today
  ).length ?? 0

  const thisWeekLogs = logs?.filter(l => l.date >= thisWeekStart && l.date <= today) ?? []
  const completedDays = thisWeekLogs.filter(l => l.doneForToday).length
  const totalDays = thisWeekLogs.length
  const completionPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0

  const thisWeekApplications = jobs?.filter(j =>
    j.dateApplied && j.dateApplied >= thisWeekStart && j.dateApplied <= today
  ).length ?? 0

  const streak = logs?.filter(l => l.doneForToday).length ?? 0

  async function saveReview() {
    setSaving(true)
    await db.weeklyReviews.put({
      weekStartDate: thisWeekStart,
      problemsSolved: thisWeekProblems,
      patternsCovered: [],
      tasksCompletedPct: completionPct,
      applicationsSent: thisWeekApplications,
      streak,
      missedItems: [],
      whatWorked: worked,
      whatSlipped: slipped,
      planForNextWeek: nextWeekPlan,
      createdAt: new Date().toISOString(),
    })
    setSaving(false)
  }

  return (
    <div className="px-4 py-4 animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold gradient-text">Weekly Review</h1>
        <p className="text-xs text-gray-500 mt-1">Week of {formatDateLong(thisWeekStart)}</p>
      </div>

      {/* Auto stats */}
      <div className="card p-4 mb-4">
        <h2 className="section-header">This Week's Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Problems solved', value: thisWeekProblems, icon: '💻' },
            { label: 'Tasks completion', value: `${completionPct}%`, icon: '✅' },
            { label: 'Applications sent', value: thisWeekApplications, icon: '📨' },
            { label: 'Total streak days', value: streak, icon: '🔥' },
          ].map(s => (
            <div key={s.label} className="bg-surface-200/60 rounded-xl p-3">
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-100 mt-0.5">
                <span className="mr-1">{s.icon}</span>{s.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Reflection */}
      <div className="card p-4 mb-4 space-y-3">
        <h2 className="section-header">Reflection</h2>
        <div>
          <label className="block text-xs text-gray-500 mb-1">✅ What worked this week?</label>
          <textarea
            className="textarea text-sm"
            rows={3}
            placeholder="What habits, approaches or techniques helped?"
            value={worked || existing?.whatWorked || ''}
            onChange={e => setWorked(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">⚠️ What slipped?</label>
          <textarea
            className="textarea text-sm"
            rows={3}
            placeholder="What didn't go as planned? Why?"
            value={slipped || existing?.whatSlipped || ''}
            onChange={e => setSlipped(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">📅 Plan for next week</label>
          <textarea
            className="textarea text-sm"
            rows={3}
            placeholder="3 things you'll do differently or focus on..."
            value={nextWeekPlan || existing?.planForNextWeek || ''}
            onChange={e => setNextWeekPlan(e.target.value)}
          />
        </div>
        <button onClick={saveReview} disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving...' : '💾 Save Review'}
        </button>
      </div>

      {/* Past reviews */}
      {(reviews?.length ?? 0) > 1 && (
        <div>
          <h2 className="section-header">Past Reviews</h2>
          <div className="space-y-2">
            {reviews?.filter(r => r.weekStartDate !== thisWeekStart).map(r => (
              <div key={r.weekStartDate} className="card p-3">
                <p className="text-xs font-medium text-gray-400">{formatDateLong(r.weekStartDate)}</p>
                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                  <span>💻 {r.problemsSolved}</span>
                  <span>✅ {r.tasksCompletedPct}%</span>
                  <span>📨 {r.applicationsSent}</span>
                </div>
                {r.whatWorked && <p className="text-xs text-gray-500 mt-1 line-clamp-1">✅ {r.whatWorked}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}
