import { useState } from 'react'
import db from '../db/db'
import type { NeetCodeProblem, NeetCodeSolveResult } from '../db/db'
import { scheduleNeetCodeAfterSolve } from '../lib/spacedRep'
import { recordLocalChange, pushDailyStatus } from '../lib/syncEngine'
import NeetCodeSolveModal from './NeetCodeSolveModal'

interface NeetCodeDailySectionProps {
  problems: NeetCodeProblem[]
  today: string
  onProblemsUpdated?: () => void
}

export default function NeetCodeDailySection({
  problems,
  today,
  onProblemsUpdated,
}: NeetCodeDailySectionProps) {
  const [activeProblem, setActiveProblem] = useState<NeetCodeProblem | null>(null)

  const diffColors = {
    Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Hard: 'text-red-400 bg-red-500/10 border-red-500/20',
  }

  const resultBadge = {
    alone: { label: 'Alone', bg: 'bg-emerald-500/20 text-emerald-300' },
    hints: { label: 'Hints (2d rev)', bg: 'bg-amber-500/20 text-amber-300' },
    failed: { label: 'Failed (1d rev)', bg: 'bg-red-500/20 text-red-300' },
  }

  async function handleSelectResult(result: NeetCodeSolveResult) {
    if (!activeProblem || !activeProblem.id) return

    const sched = scheduleNeetCodeAfterSolve(today, result)
    const updated: Partial<NeetCodeProblem> = {
      status: result === 'failed' ? 'needs_revision' : 'solved',
      solveResult: result,
      lastSolvedAt: new Date().toISOString(),
      nextReviewAt: sched.nextReview,
      reviewCount: sched.reviewCount,
    }

    await db.neetcodeProblems.update(activeProblem.id, updated)
    await recordLocalChange('neetcodeProblems', activeProblem.id, 'upsert', {
      ...activeProblem,
      ...updated,
    })
    await pushDailyStatus()
    setActiveProblem(null)
    onProblemsUpdated?.()
  }

  async function handleReset() {
    if (!activeProblem || !activeProblem.id) return

    const updated: Partial<NeetCodeProblem> = {
      status: 'unsolved',
      solveResult: null,
      lastSolvedAt: null,
      nextReviewAt: null,
      reviewCount: 0,
    }

    await db.neetcodeProblems.update(activeProblem.id, updated)
    await recordLocalChange('neetcodeProblems', activeProblem.id, 'upsert', {
      ...activeProblem,
      ...updated,
    })
    await pushDailyStatus()
    setActiveProblem(null)
    onProblemsUpdated?.()
  }

  const solvedCount = problems.filter(p => p.status === 'solved' || p.status === 'needs_revision').length

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">💻</span>
          <h2 className="section-header mb-0">NeetCode 150 Daily Targets</h2>
        </div>
        <span className="text-xs text-gray-400 font-medium">
          {solvedCount} of {problems.length} solved
        </span>
      </div>

      {problems.length === 0 ? (
        <div className="py-2">
          <p className="text-xs text-brand-300 font-semibold mb-1">
            🚀 Week 1 officially kicks off tomorrow!
          </p>
          <p className="text-[11px] text-gray-400">
            Daily prescribed NeetCode 150 problems unlock tomorrow morning at 08:00 IST. Complete your baseline setup today and preview tomorrow's battle plan below!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {problems.map(problem => {
            const isDone = problem.status === 'solved' || problem.status === 'needs_revision'
            const badge = problem.solveResult ? resultBadge[problem.solveResult] : null

            return (
              <div
                key={problem.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  isDone
                    ? 'bg-white/[0.02] border-white/5 opacity-75'
                    : 'bg-surface-200/50 hover:bg-surface-200 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Quick solve check button */}
                  <button
                    onClick={() => setActiveProblem(problem)}
                    className={`task-checkbox flex-shrink-0 ${isDone ? 'checked' : ''}`}
                    title={isDone ? 'Click to change status or reset' : 'Click to mark solved'}
                  >
                    {isDone && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${diffColors[problem.difficulty]}`}>
                        {problem.difficulty}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {problem.category}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        ⏱️ {problem.estMinutes}m
                      </span>
                      {badge && (
                        <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${badge.bg}`}>
                          {badge.label}
                        </span>
                      )}
                    </div>

                    <a
                      href={problem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs font-semibold hover:text-brand-300 transition-colors inline-flex items-center gap-1 group ${
                        isDone ? 'line-through text-gray-400' : 'text-gray-100'
                      }`}
                    >
                      <span>{problem.title}</span>
                      <span className="text-gray-500 group-hover:text-brand-300 text-[10px]">↗</span>
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => setActiveProblem(problem)}
                  className="ml-2 text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 font-medium transition-colors"
                >
                  {isDone ? 'Edit' : 'Log Solve'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Solve Modal */}
      {activeProblem && (
        <NeetCodeSolveModal
          problem={activeProblem}
          isOpen={!!activeProblem}
          onClose={() => setActiveProblem(null)}
          onSelectResult={handleSelectResult}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
