import { useState } from 'react'
import db from '../db/db'
import type { Problem } from '../db/db'
import { scheduleAfterReview } from '../lib/spacedRep'
import type { ReviewResult } from '../db/db'
import { recordLocalChange, pushDailyStatus } from '../lib/syncEngine'

interface RevisionQueueProps {
  problems: Problem[]
  today: string
}

export default function RevisionQueue({ problems, today }: RevisionQueueProps) {
  const [reviewed, setReviewed] = useState<Set<number>>(new Set())

  async function handleReview(problem: Problem, result: ReviewResult) {
    if (!problem.id) return
    const schedule = scheduleAfterReview(
      today,
      result,
      problem.reviewInterval,
      problem.reviewCount,
      problem.result
    )
    const updatedProblem = {
      ...problem,
      nextReview: schedule.nextReview,
      reviewInterval: schedule.reviewInterval,
      reviewCount: schedule.reviewCount,
    }
    await db.problems.update(problem.id, {
      nextReview: schedule.nextReview,
      reviewInterval: schedule.reviewInterval,
      reviewCount: schedule.reviewCount,
    })
    await recordLocalChange('problems', problem.id, 'upsert', updatedProblem)

    const revId = (await db.reviews.add({
      problemId: problem.id,
      date: today,
      result,
    })) as number
    await recordLocalChange('reviews', revId, 'upsert', {
      id: revId,
      problemId: problem.id,
      date: today,
      result,
    })
    await pushDailyStatus()
    setReviewed(s => new Set(s).add(problem.id!))
  }

  const pending = problems.filter(p => !reviewed.has(p.id!))

  if (pending.length === 0 && reviewed.size > 0) {
    return (
      <div className="card p-4 mb-4 flex items-center gap-3">
        <span className="text-2xl">🎉</span>
        <div>
          <p className="text-sm font-semibold text-emerald-400">All revisions done!</p>
          <p className="text-xs text-gray-500">{reviewed.size} problem{reviewed.size > 1 ? 's' : ''} reviewed today</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-header mb-0">Revision Queue</h2>
        <span className="badge bg-amber-500/20 text-amber-400">{pending.length} due</span>
      </div>

      <div className="space-y-3">
        {pending.slice(0, 5).map(problem => (
          <div key={problem.id} className="bg-surface-200/60 rounded-xl p-3">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <a
                  href={problem.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-200 hover:text-brand-400 transition-colors line-clamp-1"
                >
                  {problem.title}
                </a>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge-${problem.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}`}>
                    {problem.difficulty}
                  </span>
                  {problem.pattern.slice(0, 2).map(p => (
                    <span key={p} className="badge-brand">{p}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleReview(problem, 'easy')}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
              >
                ✓ Easy
              </button>
              <button
                onClick={() => handleReview(problem, 'hard')}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition-colors"
              >
                ~ Hard
              </button>
              <button
                onClick={() => handleReview(problem, 'forgot')}
                className="flex-1 py-2 rounded-lg text-xs font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
              >
                ✗ Forgot
              </button>
            </div>
          </div>
        ))}

        {pending.length > 5 && (
          <p className="text-xs text-gray-500 text-center">
            +{pending.length - 5} more — go to DSA Tracker to see all
          </p>
        )}
      </div>
    </div>
  )
}
