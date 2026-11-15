import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import db, { PlanWeek } from '../db/db'
import { formatDateShort, todayIST, formatDateLong, dateRange } from '../lib/dates'
import { recalculatePlanWeeksFromNewStart, shiftPlanByDays } from '../lib/planShift'
import { recordLocalChange } from '../lib/syncEngine'

export default function Plan() {
  const planWeeks = useLiveQuery(() => db.planWeeks.orderBy('weekNumber').toArray())
  const settings = useLiveQuery(() => db.settings.toArray().then(r => r[0]))
  const allLogs = useLiveQuery(() => db.dailyLogs.toArray())
  const allNeetCode = useLiveQuery(() => db.neetcodeProblems.toArray())
  const allCsTasks = useLiveQuery(() => db.csMicroTasks.toArray())
  const [shiftN, setShiftN] = useState(1)
  const [shiftOpen, setShiftOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [newStartDate, setNewStartDate] = useState(settings?.planStartDate || '2026-11-11')
  const [resetError, setResetError] = useState('')
  const today = todayIST()

  const resetsRemaining = settings?.startDateResetsRemaining ?? 3

  async function handleShift() {
    if (!planWeeks) return
    const shifted = shiftPlanByDays(planWeeks, today, shiftN)
    for (const week of shifted) {
      await db.planWeeks.put(week)
      await recordLocalChange('planWeeks', week.weekNumber, 'upsert', week)
    }
    setShiftOpen(false)
  }

  async function handleResetStartDate() {
    setResetError('')
    if (!planWeeks || !settings?.id) return

    if (resetsRemaining <= 0) {
      setResetError('No start date changes remaining (limit 3 reached). Commit to your current schedule!')
      return
    }

    if (!newStartDate) {
      setResetError('Please select a valid date.')
      return
    }

    const recalculated = recalculatePlanWeeksFromNewStart(planWeeks, newStartDate)
    for (const week of recalculated) {
      await db.planWeeks.put(week)
      await recordLocalChange('planWeeks', week.weekNumber, 'upsert', week)
    }

    const newResetsCount = Math.max(0, resetsRemaining - 1)
    await db.settings.update(settings.id, {
      planStartDate: newStartDate,
      startDateResetsRemaining: newResetsCount,
    })
    await recordLocalChange('settings', settings.id, 'upsert', {
      ...settings,
      planStartDate: newStartDate,
      startDateResetsRemaining: newResetsCount,
    })

    setResetModalOpen(false)
  }

  const overallGoals = [
    { label: '200-240 DSA problems solved', icon: '💻' },
    { label: '8 LLD + 8 HLD designs done', icon: '🏗️' },
    { label: '60 Tier-A/B company list', icon: '🏢' },
    { label: 'Applications in Jan (Week 8)', icon: '🚀' },
  ]

  const firstWeek = planWeeks?.find(w => w.weekNumber === 1)
  const lastWeek = planWeeks?.find(w => w.weekNumber === 8)

  function getWeekCompletion(week: PlanWeek): number {
    if (!week) return 0

    if (week.isBaseline || week.weekNumber === 0) {
      let best = 0
      for (const log of (allLogs || [])) {
        if (log.date <= week.endDate) {
          if (log.doneForToday) return 100
          if (log.checklistState) {
            const vals = Object.values(log.checklistState)
            if (vals.length > 0) {
              const checked = vals.filter(Boolean).length
              best = Math.max(best, Math.round((checked / vals.length) * 100))
            }
          }
        }
      }
      return Math.max(best, week.completionPct || 0)
    }

    // Regular week
    const ncForWeek = allNeetCode?.filter(p => p.weekNumber === week.weekNumber) || []
    const ncSolved = ncForWeek.filter(p => p.status === 'solved' || p.status === 'needs_revision').length

    const csForWeek = allCsTasks?.filter(t => t.weekNumber === week.weekNumber) || []
    const csSolved = csForWeek.filter(t => t.completed).length

    const totalCurriculum = ncForWeek.length + csForWeek.length
    const solvedCurriculum = ncSolved + csSolved
    const curriculumPct = totalCurriculum > 0 ? Math.round((solvedCurriculum / totalCurriculum) * 100) : 0

    const dates = dateRange(week.startDate, week.endDate)
    const daysDone = dates.filter(d => allLogs?.find(l => l.date === d)?.doneForToday).length
    const daysPct = dates.length > 0 ? Math.round((daysDone / dates.length) * 100) : 0

    return Math.max(curriculumPct, daysPct, week.completionPct || 0)
  }

  return (
    <div className="px-4 py-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">2-Month Prep Plan</h1>
          <p className="text-xs text-gray-400 mt-1">
            {firstWeek ? formatDateShort(firstWeek.startDate) : 'Nov 11'} –{' '}
            {lastWeek ? formatDateShort(lastWeek.endDate) : 'Jan 10, 2027'} · Asia/Kolkata
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setResetModalOpen(true)}
            className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1"
            title="Change plan start date (up to 3 times)"
          >
            <span>📅 Start Date</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              resetsRemaining > 0 ? 'bg-brand-500/30 text-brand-300' : 'bg-red-500/20 text-red-400'
            }`}>
              {resetsRemaining}/3
            </span>
          </button>
          <button
            onClick={() => setShiftOpen(s => !s)}
            className="btn-secondary text-xs px-2.5 py-1.5"
          >
            ⏩ Shift
          </button>
        </div>
      </div>

      {/* Reset Start Date Modal */}
      {resetModalOpen && (
        <div className="card p-4 mb-4 border border-brand-500/30 bg-surface-200/90 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-100">Change Plan Start Date</h3>
            <span className={`badge text-xs ${
              resetsRemaining > 0 ? 'bg-brand-500/20 text-brand-300' : 'bg-red-500/20 text-red-400'
            }`}>
              {resetsRemaining} change{resetsRemaining === 1 ? '' : 's'} remaining
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-3">
            You can change your Day 1 start date up to 3 times. All 8 weeks will automatically recalibrate from your chosen date.
          </p>

          {resetsRemaining > 0 ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">New Start Date (Day 1)</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={e => setNewStartDate(e.target.value)}
                  className="input text-sm py-2"
                />
              </div>

              {resetError && <p className="text-xs text-red-400">{resetError}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setResetModalOpen(false)}
                  className="btn-secondary flex-1 text-xs py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResetStartDate}
                  className="btn-primary flex-1 text-xs py-2"
                >
                  Apply New Start Date ({resetsRemaining - 1} left)
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
              <p className="text-xs text-red-300 font-semibold">🔒 Start Date Locked</p>
              <p className="text-[11px] text-red-200/70 mt-1">
                You have used all 3 start date changes. No more postponing—execute the plan today!
              </p>
              <button
                onClick={() => setResetModalOpen(false)}
                className="btn-secondary text-xs mt-3 px-4 py-1.5"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}

      {/* Shift future weeks modal */}
      {shiftOpen && (
        <div className="card p-4 mb-4 border border-amber-500/20 bg-surface-200/80">
          <p className="text-sm font-semibold text-gray-300 mb-2">
            Shift upcoming weeks forward by N days
          </p>
          <div className="flex gap-2 items-center mb-3">
            <input
              type="number"
              min="1"
              max="30"
              value={shiftN}
              onChange={e => setShiftN(parseInt(e.target.value) || 1)}
              className="input w-24 text-center"
            />
            <span className="text-gray-400 text-xs">calendar days</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShiftOpen(false)} className="btn-secondary flex-1 text-xs py-2">Cancel</button>
            <button onClick={handleShift} className="btn-primary flex-1 text-xs py-2">Shift Schedule</button>
          </div>
        </div>
      )}

      {/* Overall goals */}
      <div className="card p-4 mb-4">
        <h2 className="section-header">2-Month Curriculum Target</h2>
        <div className="grid grid-cols-2 gap-2">
          {overallGoals.map(g => (
            <div key={g.label} className="flex items-center gap-2 bg-surface-200/60 rounded-xl p-3">
              <span className="text-xl">{g.icon}</span>
              <span className="text-xs text-gray-300">{g.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Week timeline */}
      <div className="space-y-3">
        {planWeeks?.map(week => {
          const isCurrent = today >= week.startDate && today <= week.endDate
          const isPast = week.endDate < today
          const completionPct = getWeekCompletion(week)
          const isCompleted = completionPct === 100

          return (
            <div
              key={week.weekNumber}
              className={`card p-4 transition-all duration-200
                ${isCompleted ? 'border-emerald-500/30 bg-emerald-950/10' : ''}
                ${isCurrent && !isCompleted ? 'border-brand-500/50 ring-1 ring-brand-500/30' : ''}
                ${isPast && !isCompleted ? 'opacity-70' : ''}
              `}
            >
              <div className="flex items-start gap-3">
                {/* Week indicator */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-colors
                  ${isCompleted
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : isCurrent
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : isPast
                        ? 'bg-surface-300 text-gray-400'
                        : 'bg-surface-200 text-gray-500'}`}
                >
                  {isCompleted ? '✓' : `W${week.weekNumber}`}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Dates */}
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-500 font-medium">
                      {week.isBaseline ? 'Baseline · ' : ''}
                      {formatDateShort(week.startDate)}
                      {week.startDate !== week.endDate ? ` → ${formatDateShort(week.endDate)}` : ''}
                    </p>
                    <div className="flex items-center gap-1.5">
                      {isCompleted && (
                        <span className="badge bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Completed 🏆
                        </span>
                      )}
                      {isCurrent && !isCompleted && <span className="badge-brand">ACTIVE WEEK</span>}
                      {isPast && !isCompleted && <span className="badge bg-surface-300 text-gray-500">Done</span>}
                    </div>
                  </div>

                  {/* Focus topic */}
                  <p className="text-sm font-semibold text-gray-200 mb-2">{week.focusTopic}</p>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-emerald-500 flex-shrink-0">💻</span>
                      <span className="text-xs text-gray-400">{week.dsaGoal}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs flex-shrink-0">📚</span>
                      <span className="text-xs text-gray-400">{week.studyGoal}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs flex-shrink-0">🎯</span>
                      <span className="text-xs text-gray-400">{week.jobGoal}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {(isCurrent || isPast || isCompleted) && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400">Completion</span>
                        <span className={`text-xs font-semibold ${isCompleted ? 'text-emerald-400' : 'text-gray-300'}`}>
                          {completionPct}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-surface-300 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-brand-500 to-purple-500'
                          }`}
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="h-8" />
    </div>
  )
}
