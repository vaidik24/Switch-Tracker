import { useState } from 'react'
import db from '../db/db'
import type { NeetCodeProblem, ReviewResult } from '../db/db'
import { scheduleNeetCodeAfterReview } from '../lib/spacedRep'
import { recordLocalChange, pushDailyStatus } from '../lib/syncEngine'

interface NeetCodeRevisionQueueProps {
  problems: NeetCodeProblem[]
  today: string
  onRevisionDone?: () => void
}

export default function NeetCodeRevisionQueue({
  problems,
  today,
  onRevisionDone,
}: NeetCodeRevisionQueueProps) {
  const [reviewed, setReviewed] = useState<Set<string>>(new Set())

  const pending = problems.filter(p => p.id && !reviewed.has(p.id))

  const diffColors = {
    Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Hard: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  async function handleReview(problem: NeetCodeProblem, result: ReviewResult) {
    if (!problem.id) return

    // Calculate next schedule
    const sched = scheduleNeetCodeAfterReview(
      today,
      result,
      problem.solveResult === 'hints' ? 2 : (problem.solveResult === 'failed' ? 1 : 7),
      problem.reviewCount
    )

    const updated: Partial<NeetCodeProblem> = {
      nextReviewAt: sched.nextReview,
      reviewCount: sched.reviewCount,
      status: result === 'forgot' ? 'needs_revision' : 'solved',
    }

    await db.neetcodeProblems.update(problem.id, updated)
    await recordLocalChange('neetcodeProblems', problem.id, 'upsert', {
      ...problem,
      ...updated,
    })
    await pushDailyStatus()

    setReviewed(s => new Set(s).add(problem.id!))
    onRevisionDone?.()
  }

  if (pending.length === 0 && reviewed.size > 0) {
    return (
      <div className="card p-4 mb-4 flex items-center gap-3 bg-emerald-950/20 border border-emerald-500/20">
        <span className="text-2xl">🎉</span>
        <div>
          <p className="text-sm font-semibold text-emerald-400">All NeetCode Revisions Cleared!</p>
          <p className="text-xs text-gray-400">{reviewed.size} problem{reviewed.size > 1 ? 's' : ''} revised today.</p>
        </div>
      </div>
    )
  }

  if (pending.length === 0) return null

  return (
    <div className="card p-4 mb-4 border border-amber-500/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">🔄</span>
          <h2 className="section-header mb-0">NeetCode Spaced Revision</h2>
        </div>
        <span className="badge bg-amber-500/20 text-amber-300">
          {pending.length} due today
        </span>
      </div>

      <p className="text-[11px] text-gray-400 mb-3">
        Re-solve these without looking at code. Check your memory retention:
      </p>

      <div className="space-y-2.5">
        {pending.slice(0, 5).map(problem => (
          <div key={problem.id} className="bg-surface-200/60 rounded-xl p-3 border border-white/5">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${diffColors[problem.difficulty]}`}>
                    {problem.difficulty}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {problem.category}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    Rev #{problem.reviewCount}
                  </span>
                </div>
                <a
                  href={problem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-gray-100 hover:text-brand-300 inline-flex items-center gap-1 group"
                >
                  <span>{problem.title}</span>
                  <span className="text-gray-500 group-hover:text-brand-300 text-[10px]">↗</span>
                </a>
              </div>
            </div>

            {/* Quick 3-button review bar */}
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => handleReview(problem, 'easy')}
                className="flex-1 py-1 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium transition-colors"
              >
                Easy (+7/14d)
              </button>
              <button
                onClick={() => handleReview(problem, 'hard')}
                className="flex-1 py-1 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-[11px] font-medium transition-colors"
              >
                Hard (+2d)
              </button>
              <button
                onClick={() => handleReview(problem, 'forgot')}
                className="flex-1 py-1 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 text-[11px] font-medium transition-colors"
              >
                Forgot (+1d)
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
