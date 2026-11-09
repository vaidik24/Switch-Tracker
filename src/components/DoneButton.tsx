import { useState } from 'react'
import db from '../db/db'
import type { DailyLog } from '../db/db'
import { useAppStore } from '../store/useAppStore'
import { hasRestDayThisWeek } from '../lib/streak'
import { weekStart } from '../lib/dates'

const MISS_REASONS = ['sick', 'travel', 'work overload', 'rest day'] as const
type MissReason = typeof MISS_REASONS[number]

interface DoneButtonProps {
  allDone: boolean
  alreadyDone: boolean
  todayLog: DailyLog | undefined
  today: string
  streak: number
  checklistState: Record<string, boolean>
  allLogs: DailyLog[]
}

export default function DoneButton({
  allDone, alreadyDone, todayLog, today, streak, checklistState, allLogs
}: DoneButtonProps) {
  const [showReasonPicker, setShowReasonPicker] = useState(false)
  const [selectedReason, setSelectedReason] = useState<MissReason | null>(null)
  const { snoozeReminders } = useAppStore()

  const weekStartDate = weekStart(today)
  const restDayUsed = hasRestDayThisWeek(allLogs, weekStartDate)

  async function markDone(reason: MissReason | null = null) {
    await db.dailyLogs.put({
      date: today,
      checklistState,
      doneForToday: true,
      missReason: reason,
      notes: todayLog?.notes ?? '',
      streak: streak + 1,
      completedAt: new Date().toISOString(),
    })
    setShowReasonPicker(false)
  }

  if (alreadyDone) {
    return (
      <div className="card p-4 mb-4 flex items-center gap-3">
        <span className="text-2xl">🎊</span>
        <div>
          <p className="text-sm font-bold text-emerald-400">Done for today!</p>
          <p className="text-xs text-gray-500">Great work. Streak continues 🔥</p>
        </div>
      </div>
    )
  }

  if (showReasonPicker) {
    return (
      <div className="card p-4 mb-4">
        <p className="text-sm font-semibold text-gray-300 mb-3">
          What prevented you from completing everything today?
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {MISS_REASONS.map(reason => {
            const disabled = reason === 'rest day' && restDayUsed
            return (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                disabled={disabled}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all border-2 
                  ${selectedReason === reason
                    ? 'border-brand-500 bg-brand-500/20 text-brand-300'
                    : 'border-white/10 bg-surface-200 text-gray-400 hover:border-white/20'
                  } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {reason === 'sick' && '🤒 '}
                {reason === 'travel' && '✈️ '}
                {reason === 'work overload' && '😩 '}
                {reason === 'rest day' && '😴 '}
                {reason}
                {reason === 'rest day' && restDayUsed ? ' (used)' : ''}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowReasonPicker(false)} className="btn-secondary flex-1 text-sm">
            Cancel
          </button>
          <button
            onClick={() => selectedReason && markDone(selectedReason)}
            disabled={!selectedReason}
            className="btn-primary flex-1 text-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 mb-4">
      <button
        onClick={() => allDone ? markDone(null) : setShowReasonPicker(true)}
        className={`w-full py-4 rounded-2xl text-base font-bold transition-all duration-200 
          ${allDone
            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/40 active:scale-98'
            : 'bg-surface-200 text-gray-500 hover:bg-surface-300'
          }`}
        id="done-for-today-btn"
      >
        {allDone ? '🎉 Done for today!' : '📝 Mark as done (with reason)'}
      </button>

      <button
        onClick={() => snoozeReminders(60)}
        className="w-full py-3 rounded-xl text-sm text-gray-500 hover:text-gray-400 transition-colors"
      >
        😴 Snooze reminders 1 hour
      </button>
    </div>
  )
}
