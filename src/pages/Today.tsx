import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import db from '../db/db'
import { todayIST, formatDateLong, addDays, isWeekend, formatDateShort, nowIST } from '../lib/dates'
import { calculateStreak } from '../lib/streak'
import ProgressRing from '../components/ProgressRing'
import ChecklistItem from '../components/ChecklistItem'
import RevisionQueue from '../components/RevisionQueue'
import JobActions from '../components/JobActions'
import CarryOver from '../components/CarryOver'
import DoneButton from '../components/DoneButton'
import { useSync } from '../store/useSyncStore'
import { recordLocalChange, pushDailyStatus } from '../lib/syncEngine'

// Weekday must-do items
const WEEKDAY_ITEMS = [
  { id: 'dsa-new', label: 'DSA: 1 new problem', icon: '💡', mins: 45 },
  { id: 'dsa-revision', label: 'DSA: 1 revision problem', icon: '🔄', mins: 20 },
  { id: 'topic-study', label: 'Topic of the week (deep study)', icon: '📚', mins: 60 },
  { id: 'story-practice', label: 'Story / project answer practice', icon: '🎭', mins: 15 },
]

// Weekend must-do items
const WEEKEND_ITEMS = [
  { id: 'mock-90', label: '90-min timed mock (2 DSA problems)', icon: '⏱️', mins: 90 },
  { id: 'design-exercise', label: 'System design or LLD exercise', icon: '🏗️', mins: 60 },
]

function getChecklistItems(isWeekendDay: boolean, weekendLightMode: boolean) {
  if (isWeekendDay) {
    if (weekendLightMode) {
      return WEEKEND_ITEMS
    }
    return [...WEEKEND_ITEMS, ...WEEKDAY_ITEMS]
  }
  return WEEKDAY_ITEMS
}

export default function Today() {
  const today = todayIST()
  const tomorrow = addDays(today, 1)
  const yesterday = addDays(today, -1)
  const isWeekendDay = isWeekend(today)

  const settings = useLiveQuery(() => db.settings.toArray().then(r => r[0]))
  const todayLog = useLiveQuery(() => db.dailyLogs.get(today))
  const yesterdayLog = useLiveQuery(() => db.dailyLogs.get(yesterday))
  const allLogs = useLiveQuery(() => db.dailyLogs.toArray())
  const planWeeks = useLiveQuery(() => db.planWeeks.toArray())
  const dueProblems = useLiveQuery(() =>
    db.problems.where('nextReview').belowOrEqual(today).toArray()
  )
  const dueJobs = useLiveQuery(() =>
    db.jobs.where('nextFollowUp').belowOrEqual(today).toArray()
  )

  const [editingWhy, setEditingWhy] = useState(false)
  const [whyInput, setWhyInput] = useState('')

  const weekendLightMode = settings?.weekendLightMode ?? false
  const checklistItems = getChecklistItems(isWeekendDay, weekendLightMode)

  // Current plan week & Tomorrow's plan week
  const currentWeek = planWeeks?.find(w => today >= w.startDate && today <= w.endDate)
  const tomorrowWeek = planWeeks?.find(w => tomorrow >= w.startDate && tomorrow <= w.endDate)

  // Streak
  const streak = allLogs ? calculateStreak(allLogs, today) : 0

  // Checklist state
  const checklistState = todayLog?.checklistState ?? {}
  const checkedCount = checklistItems.filter(i => checklistState[i.id]).length
  const allMustDoDone = checklistItems.every(i => checklistState[i.id])

  const { status: syncStatus, triggerSync } = useSync()

  // Time check for danger zone
  const currentHour = nowIST().hour
  const isDangerTime = currentHour >= 19
  const isStreakInDanger = isDangerTime && !allMustDoDone && !todayLog?.doneForToday && todayLog?.missReason !== 'rest day'

  async function toggleItem(id: string) {
    const existing = await db.dailyLogs.get(today)
    const current = existing?.checklistState ?? {}
    const newState = { ...current, [id]: !current[id] }
    const updated = {
      date: today,
      checklistState: newState,
      doneForToday: existing?.doneForToday ?? false,
      missReason: existing?.missReason ?? null,
      notes: existing?.notes ?? '',
      streak,
      completedAt: existing?.completedAt ?? null,
    }
    await db.dailyLogs.put(updated)
    await recordLocalChange('dailyLogs', today, 'upsert', updated)
    await pushDailyStatus()
  }

  async function saveWhy() {
    if (!settings?.id || !whyInput.trim()) return
    await db.settings.update(settings.id, { whyIMustSwitch: whyInput.trim() })
    await recordLocalChange('settings', settings.id, 'upsert', {
      ...settings,
      whyIMustSwitch: whyInput.trim(),
    })
    setEditingWhy(false)
  }

  // Day label
  const daysSinceStart = planWeeks && settings
    ? Math.floor((new Date(today + 'T00:00:00+05:30').getTime() - new Date(settings.planStartDate + 'T00:00:00+05:30').getTime()) / 86400000)
    : 0
  const weekNum = Math.floor(daysSinceStart / 7) + 1
  const dayNum = (daysSinceStart % 7) + 1

  const progressPct = checklistItems.length > 0
    ? Math.round((checkedCount / checklistItems.length) * 100)
    : 0

  // Yesterday carry-over
  const yesterdayItems = getChecklistItems(
    yesterdayLog ? isWeekend(yesterday) : false,
    weekendLightMode
  )
  const missedYesterday = yesterdayLog && !yesterdayLog.doneForToday
    ? yesterdayItems.filter(i => !(yesterdayLog.checklistState?.[i.id]))
    : []

  const whyText = settings?.whyIMustSwitch || 'To escape career stagnation, command top-tier compensation (35L+), and master engineering at scale.'

  return (
    <div className="px-4 py-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">
              {formatDateLong(today)}
            </p>
            <button
              onClick={() => triggerSync()}
              title={`Sync status: ${syncStatus}. Click to sync now.`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-gray-400 border border-white/5 transition-colors"
            >
              <span className={syncStatus === 'syncing' ? 'animate-spin' : ''}>
                {syncStatus === 'synced' ? '☁️' : syncStatus === 'syncing' ? '🔄' : syncStatus === 'offline' ? '📡' : syncStatus === 'error' ? '⚠️' : '☁️'}
              </span>
              <span className="capitalize">{syncStatus}</span>
            </button>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 dark:text-gray-100 leading-tight">
            {currentWeek
              ? `Week ${weekNum}, Day ${dayNum}`
              : daysSinceStart < 0
                ? 'Countdown to Nov 11'
                : `Day ${daysSinceStart + 1}`
            }
          </h1>
          {currentWeek ? (
            <p className="text-sm text-brand-400 mt-0.5 font-medium">
              {currentWeek.focusTopic}
            </p>
          ) : daysSinceStart < 0 ? (
            <p className="text-xs text-amber-400 mt-0.5 font-medium">
              Starts on Nov 11 · Complete your environment setup & baseline problems
            </p>
          ) : null}
        </div>

        {/* Progress ring + streak */}
        <div className="flex flex-col items-center gap-2 ml-4">
          <ProgressRing
            percent={progressPct}
            size={72}
            strokeWidth={6}
            label={`${checkedCount}/${checklistItems.length}`}
          />
          <div className={`flex items-center gap-1 rounded-full px-2.5 py-1 ${
            isStreakInDanger
              ? 'bg-red-500/30 border border-red-500/50 animate-pulse text-red-400'
              : 'bg-orange-500/20 text-orange-400'
          }`}>
            <span className="text-sm">{isStreakInDanger ? '⚠️' : '🔥'}</span>
            <span className="font-bold text-sm">{streak}d</span>
          </div>
        </div>
      </div>

      {/* North Star Motivation Banner ("Why I Need This") */}
      <div className="card p-3 mb-4 bg-gradient-to-r from-brand-950/40 via-surface-200/50 to-purple-950/40 border border-brand-500/20">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">🎯</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-300">
              My North Star (Why I Must Switch)
            </span>
          </div>
          <button
            onClick={() => {
              setWhyInput(whyText)
              setEditingWhy(!editingWhy)
            }}
            className="text-[10px] text-gray-400 hover:text-brand-300"
          >
            {editingWhy ? 'Cancel' : '✏️ Edit'}
          </button>
        </div>

        {editingWhy ? (
          <div className="mt-2 space-y-2">
            <textarea
              value={whyInput}
              onChange={e => setWhyInput(e.target.value)}
              className="input text-xs w-full h-16 py-1.5"
              placeholder="What drives this switch? e.g. Escaping dead-end stack, 35L+ CTC..."
            />
            <button onClick={saveWhy} className="btn-primary text-xs py-1 px-3">
              Save Reason
            </button>
          </div>
        ) : (
          <p className="text-xs text-gray-200 italic font-medium leading-relaxed">
            "{whyText}"
          </p>
        )}
      </div>

      {/* Streak in Danger Warning Alert */}
      {isStreakInDanger && (
        <div className="card p-3 mb-4 bg-red-950/30 border border-red-500/40 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚨</span>
            <div>
              <p className="text-xs font-bold text-red-300">STREAK IN JEOPARDY</p>
              <p className="text-[11px] text-red-200/80">
                You have {checklistItems.length - checkedCount} tasks remaining. At midnight, your {streak}-day streak burns to ZERO. Stop scrolling and sit at your desk!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Carry-over from yesterday */}
      {missedYesterday.length > 0 && (
        <CarryOver items={missedYesterday} />
      )}

      {/* Today's Checklist */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="section-header mb-0">Today's Checklist</h2>
          <span className="text-xs text-gray-400 font-medium">
            {checkedCount} of {checklistItems.length} completed
          </span>
        </div>
        <div className="space-y-1">
          {checklistItems.map(item => (
            <ChecklistItem
              key={item.id}
              id={item.id}
              label={item.label}
              icon={item.icon}
              mins={item.mins}
              checked={!!checklistState[item.id]}
              onToggle={() => toggleItem(item.id)}
            />
          ))}
        </div>

        {allMustDoDone && !todayLog?.doneForToday && (
          <div className="mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
            <span className="text-lg">🏆</span>
            <span className="text-emerald-300 text-xs font-semibold">
              All must-dos conquered! Tap "Done for today" below to protect your streak.
            </span>
          </div>
        )}
      </div>

      {/* DSA Revision Queue */}
      {dueProblems && dueProblems.length > 0 && (
        <RevisionQueue problems={dueProblems} today={today} />
      )}

      {/* Job Actions Due */}
      {dueJobs && dueJobs.length > 0 && (
        <JobActions jobs={dueJobs} />
      )}

      {/* Done for Today Button */}
      <DoneButton
        allDone={allMustDoDone}
        alreadyDone={todayLog?.doneForToday ?? false}
        todayLog={todayLog}
        today={today}
        streak={streak}
        checklistState={checklistState}
        allLogs={allLogs ?? []}
      />

      {/* Tomorrow's Battle Plan Preview Card */}
      {tomorrowWeek && (
        <div className="card p-4 mt-4 bg-surface-200/40 border border-white/5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                Tomorrow's Battle Plan ({formatDateShort(tomorrow)})
              </h3>
            </div>
            <span className="text-[10px] text-brand-400 font-semibold">
              Week {tomorrowWeek.weekNumber}
            </span>
          </div>

          <p className="text-xs font-semibold text-gray-300 mb-2">
            {tomorrowWeek.focusTopic}
          </p>

          <div className="space-y-1.5 text-xs text-gray-400 bg-surface-300/30 p-2.5 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-emerald-400">💻</span>
              <span>{tomorrowWeek.dsaGoal}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-purple-400">📚</span>
              <span>{tomorrowWeek.studyGoal}</span>
            </div>
          </div>

          <p className="text-[11px] text-gray-500 mt-2 text-center italic">
            This plan will be sent directly to your Telegram at {settings?.nextDayPlanTime || '21:30'} tonight.
          </p>
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}
