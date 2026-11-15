import type { NeetCodeProblem, NeetCodeSolveResult } from '../db/db'

interface NeetCodeSolveModalProps {
  problem: NeetCodeProblem
  isOpen: boolean
  onClose: () => void
  onSelectResult: (result: NeetCodeSolveResult) => Promise<void>
  onReset?: () => Promise<void>
}

export default function NeetCodeSolveModal({
  problem,
  isOpen,
  onClose,
  onSelectResult,
  onReset,
}: NeetCodeSolveModalProps) {
  if (!isOpen) return null

  const diffColors = {
    Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Hard: 'bg-red-500/10 text-red-400 border-red-500/20',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-md bg-surface-100 border border-white/10 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${diffColors[problem.difficulty]}`}>
                {problem.difficulty}
              </span>
              <span className="text-[10px] text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                {problem.category}
              </span>
              <span className="text-[10px] text-gray-400">
                ⏱️ {problem.estMinutes}m
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-100 leading-tight">
              {problem.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-lg p-1"
          >
            ✕
          </button>
        </div>

        {/* LeetCode link */}
        <div className="mb-4">
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-medium hover:underline"
          >
            <span>Open problem on LeetCode</span>
            <span>↗</span>
          </a>
        </div>

        <p className="text-xs text-gray-400 mb-3 font-medium">
          How did your attempt go?
        </p>

        {/* 3 Result Buttons */}
        <div className="space-y-2 mb-3">
          <button
            onClick={() => onSelectResult('alone')}
            className="w-full text-left p-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🟢</span>
              <div>
                <p className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">
                  Solved Alone (Clean)
                </p>
                <p className="text-[11px] text-emerald-400/70">
                  No hints or solution looked. Next review in +7 days.
                </p>
              </div>
            </div>
            <span className="text-xs text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Select →
            </span>
          </button>

          <button
            onClick={() => onSelectResult('hints')}
            className="w-full text-left p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🟡</span>
              <div>
                <p className="text-xs font-bold text-amber-300 group-hover:text-amber-200">
                  Solved with Hints
                </p>
                <p className="text-[11px] text-amber-400/70">
                  Looked at hint/tag/discussion. Re-solve in 2 days.
                </p>
              </div>
            </div>
            <span className="text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Select →
            </span>
          </button>

          <button
            onClick={() => onSelectResult('failed')}
            className="w-full text-left p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔴</span>
              <div>
                <p className="text-xs font-bold text-red-300 group-hover:text-red-200">
                  Failed / Looked at Solution
                </p>
                <p className="text-[11px] text-red-400/70">
                  Couldn't solve independently. Re-solve tomorrow (+1 day).
                </p>
              </div>
            </div>
            <span className="text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Select →
            </span>
          </button>
        </div>

        {/* Reset button if already solved */}
        {problem.status !== 'unsolved' && onReset && (
          <div className="pt-2 border-t border-white/5 flex justify-end">
            <button
              onClick={onReset}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              Reset to Unsolved
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
