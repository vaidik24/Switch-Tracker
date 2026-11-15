import db from '../db/db'
import type { CsMicroTask } from '../db/db'
import { recordLocalChange, pushDailyStatus } from '../lib/syncEngine'

interface CsMicroTaskCardProps {
  task: CsMicroTask | null
  onTaskUpdated?: () => void
}

export default function CsMicroTaskCard({ task, onTaskUpdated }: CsMicroTaskCardProps) {
  if (!task) return null

  async function handleToggle() {
    if (!task || !task.id) return

    const newCompleted = !task.completed
    const updated: Partial<CsMicroTask> = {
      completed: newCompleted,
      completedAt: newCompleted ? new Date().toISOString() : null,
    }

    await db.csMicroTasks.update(task.id, updated)
    await recordLocalChange('csMicroTasks', task.id, 'upsert', {
      ...task,
      ...updated,
    })
    await pushDailyStatus()
    onTaskUpdated?.()
  }

  return (
    <div className="card p-4 mb-4 bg-gradient-to-br from-surface-200/40 via-surface-100 to-brand-950/20 border border-brand-500/10">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">🧠</span>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
              Today's CS / System Design Micro-Topic
            </span>
            <h3 className="text-sm font-bold text-gray-100 leading-tight">
              {task.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
            ⏱️ {task.estMinutes}m
          </span>
          <button
            onClick={handleToggle}
            className={`task-checkbox flex-shrink-0 ${task.completed ? 'checked' : ''}`}
            title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
          >
            {task.completed && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="mt-2 bg-surface-300/30 rounded-xl p-3 border border-white/5">
        <p className="text-[11px] font-medium text-gray-300 leading-relaxed">
          {task.deliverable}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className={`text-[10px] font-semibold ${task.completed ? 'text-emerald-400' : 'text-gray-400'}`}>
          {task.completed ? '✓ Concept Mastered' : 'Pending today'}
        </span>
        <button
          onClick={handleToggle}
          className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors border ${
            task.completed
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              : 'bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border-brand-500/30'
          }`}
        >
          {task.completed ? 'Mark Incomplete' : 'Mark Done'}
        </button>
      </div>
    </div>
  )
}
