import { useLiveQuery } from 'dexie-react-hooks'
import { useState, useMemo } from 'react'
import db from '../db/db'
import type { Problem, Difficulty, NeetCodeProblem, NeetCodeSolveResult, NeetCodeStatus } from '../db/db'
import { todayIST, formatDateShort } from '../lib/dates'
import { scheduleNeetCodeAfterSolve } from '../lib/spacedRep'
import { recordLocalChange, pushDailyStatus } from '../lib/syncEngine'
import { useAppStore } from '../store/useAppStore'
import NeetCodeSolveModal from '../components/NeetCodeSolveModal'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const PATTERNS = [
  'Two pointers', 'Sliding window', 'Prefix sum', 'Hashing',
  'Stack/Monotonic stack', 'Binary search', 'Linked list', 'Trees',
  'Heap/Top-K', 'Trie', 'Intervals', 'Graph BFS/DFS',
  'Topological sort', 'Union find', 'Dijkstra', 'Backtracking',
  'Greedy', 'DP 1D', 'DP 2D',
]

const NEETCODE_CATEGORIES = [
  'All',
  'Arrays & Hashing',
  'Two Pointers',
  'Sliding Window',
  'Stack',
  'Binary Search',
  'Linked List',
  'Trees',
  'Tries',
  'Heap / Priority Queue',
  'Backtracking',
  'Graphs',
  'Advanced Graphs',
  '1-D DP',
  '2-D DP',
  'Greedy',
  'Intervals',
  'Math & Geometry',
  'Bit Manipulation',
]

type MainTab = 'neetcode' | 'custom'
type CustomViewMode = 'table' | 'cards' | 'stats'
type FilterDifficulty = 'All' | Difficulty
type NeetCodeFilterStatus = 'All' | 'solved' | 'needs_revision' | 'unsolved'

export default function DSATracker() {
  const today = todayIST()
  const [activeTab, setActiveTab] = useState<MainTab>('neetcode')
  const { setShowQuickAdd } = useAppStore()

  // NeetCode tab state
  const [ncCategory, setNcCategory] = useState('All')
  const [ncStatus, setNcStatus] = useState<NeetCodeFilterStatus>('All')
  const [ncDifficulty, setNcDifficulty] = useState<FilterDifficulty>('All')
  const [ncSearch, setNcSearch] = useState('')
  const [selectedNcProblem, setSelectedNcProblem] = useState<NeetCodeProblem | null>(null)

  // Custom problems tab state
  const [customView, setCustomView] = useState<CustomViewMode>('cards')
  const [customDifficulty, setCustomDifficulty] = useState<FilterDifficulty>('All')
  const [customPattern, setCustomPattern] = useState('All')
  const [customFilterRevision, setCustomFilterRevision] = useState(false)
  const [customSearch, setCustomSearch] = useState('')

  // Queries
  const customProblems = useLiveQuery(() => db.problems.orderBy('dateSolved').reverse().toArray())
  const neetcodeProblems = useLiveQuery(() => db.neetcodeProblems.toArray())

  // Overall combined stats
  const combinedStats = useMemo(() => {
    const custom = customProblems || []
    const nc = neetcodeProblems || []

    const ncSolved = nc.filter(p => p.status === 'solved' || p.status === 'needs_revision')
    const totalSolved = custom.length + ncSolved.length

    const easySolved = custom.filter(p => p.difficulty === 'Easy').length +
      ncSolved.filter(p => p.difficulty === 'Easy').length

    const mediumSolved = custom.filter(p => p.difficulty === 'Medium').length +
      ncSolved.filter(p => p.difficulty === 'Medium').length

    const hardSolved = custom.filter(p => p.difficulty === 'Hard').length +
      ncSolved.filter(p => p.difficulty === 'Hard').length

    const customDue = custom.filter(p => p.nextReview <= today).length
    const ncDue = nc.filter(p => (p.status === 'needs_revision' || (p.nextReviewAt && p.nextReviewAt <= today))).length
    const totalDue = customDue + ncDue

    return {
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      totalDue,
      ncTotalCount: nc.length,
      ncSolvedCount: ncSolved.length,
      customTotalCount: custom.length,
    }
  }, [customProblems, neetcodeProblems, today])

  // Filtered NeetCode problems
  const filteredNeetCode = useMemo(() => {
    if (!neetcodeProblems) return []
    return neetcodeProblems.filter(p => {
      if (ncCategory !== 'All' && p.category !== ncCategory) return false
      if (ncDifficulty !== 'All' && p.difficulty !== ncDifficulty) return false
      if (ncStatus === 'solved' && p.status !== 'solved') return false
      if (ncStatus === 'needs_revision' && p.status !== 'needs_revision') return false
      if (ncStatus === 'unsolved' && p.status !== 'unsolved') return false
      if (ncSearch && !p.title.toLowerCase().includes(ncSearch.toLowerCase())) return false
      return true
    })
  }, [neetcodeProblems, ncCategory, ncDifficulty, ncStatus, ncSearch])

  // Filtered Custom problems
  const filteredCustom = useMemo(() => {
    if (!customProblems) return []
    return customProblems.filter(p => {
      if (customDifficulty !== 'All' && p.difficulty !== customDifficulty) return false
      if (customPattern !== 'All' && !p.pattern.includes(customPattern)) return false
      if (customFilterRevision && p.nextReview > today) return false
      if (customSearch && !p.title.toLowerCase().includes(customSearch.toLowerCase())) return false
      return true
    })
  }, [customProblems, customDifficulty, customPattern, customFilterRevision, today, customSearch])

  // Custom pattern stats
  const customPatternStats = useMemo(() => {
    if (!customProblems) return []
    const patternCounts: Record<string, number> = {}
    for (const p of customProblems) {
      for (const pat of p.pattern) {
        patternCounts[pat] = (patternCounts[pat] || 0) + 1
      }
    }
    return PATTERNS.map(p => ({
      name: p.length > 14 ? p.slice(0, 13) + '…' : p,
      count: patternCounts[p] || 0,
    }))
  }, [customProblems])

  // Handlers for NeetCode solve modal
  async function handleSolveNeetCode(result: NeetCodeSolveResult) {
    if (!selectedNcProblem?.id) return

    const sched = scheduleNeetCodeAfterSolve(today, result)
    const updated: Partial<NeetCodeProblem> = {
      status: result === 'failed' ? 'needs_revision' : 'solved',
      solveResult: result,
      lastSolvedAt: new Date().toISOString(),
      nextReviewAt: sched.nextReview,
      reviewCount: sched.reviewCount,
    }

    await db.neetcodeProblems.update(selectedNcProblem.id, updated)
    await recordLocalChange('neetcodeProblems', selectedNcProblem.id, 'upsert', {
      ...selectedNcProblem,
      ...updated,
    })
    await pushDailyStatus()
    setSelectedNcProblem(null)
  }

  async function handleResetNeetCode() {
    if (!selectedNcProblem?.id) return

    const updated: Partial<NeetCodeProblem> = {
      status: 'unsolved',
      solveResult: null,
      lastSolvedAt: null,
      nextReviewAt: null,
      reviewCount: 0,
    }

    await db.neetcodeProblems.update(selectedNcProblem.id, updated)
    await recordLocalChange('neetcodeProblems', selectedNcProblem.id, 'upsert', {
      ...selectedNcProblem,
      ...updated,
    })
    await pushDailyStatus()
    setSelectedNcProblem(null)
  }

  async function deleteCustomProblem(id: number) {
    await db.problems.delete(id)
    await recordLocalChange('problems', id, 'delete')
    await pushDailyStatus()
  }

  function exportCSV() {
    if (!customProblems?.length) return
    const headers = ['title','url','difficulty','pattern','dateSolved','timeTaken','result','confidence','notes','language']
    const rows = customProblems.map(p => [
      `"${p.title}"`, `"${p.url}"`, p.difficulty, `"${p.pattern.join(';')}"`,
      p.dateSolved, p.timeTaken, p.result, p.confidence, `"${p.notes}"`, p.language
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dsa-custom-problems-${today}.csv`
    a.click()
  }

  return (
    <div className="px-4 py-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">DSA Tracker</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {combinedStats.totalSolved} solved · Target: 220–260
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'custom' && (
            <button onClick={exportCSV} className="btn-ghost text-xs px-3 py-2">⬇️ CSV</button>
          )}
          <button onClick={() => setShowQuickAdd(true)} className="btn-primary text-xs px-3 py-2">+ Add Custom</button>
        </div>
      </div>

      {/* Progress bar toward overall 220 target */}
      <div className="card p-3 mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Overall Target Progress</span>
          <span className="font-semibold text-gray-200">{combinedStats.totalSolved} / 220</span>
        </div>
        <div className="h-2 bg-surface-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (combinedStats.totalSolved / 220) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-2.5 text-xs flex-wrap gap-1.5">
          <span className="badge-easy">Easy: {combinedStats.easySolved}</span>
          <span className="badge-medium">Med: {combinedStats.mediumSolved}</span>
          <span className="badge-hard">Hard: {combinedStats.hardSolved}</span>
          {combinedStats.totalDue > 0 && (
            <span className="badge bg-amber-500/20 text-amber-400">🔄 {combinedStats.totalDue} due</span>
          )}
        </div>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex gap-1.5 mb-4 bg-surface-200 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('neetcode')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5
            ${activeTab === 'neetcode' ? 'bg-brand-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <span>⚡ NeetCode 150</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/25">
            {combinedStats.ncSolvedCount}/150
          </span>
        </button>
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5
            ${activeTab === 'custom' ? 'bg-brand-500 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <span>📝 Custom Log</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/25">
            {combinedStats.customTotalCount}
          </span>
        </button>
      </div>

      {/* ─────────────────── TAB 1: NEETCODE 150 SHEET ─────────────────── */}
      {activeTab === 'neetcode' && (
        <div className="space-y-3">
          {/* Search bar */}
          <input
            className="input text-sm"
            placeholder="🔍 Search NeetCode 150 problems..."
            value={ncSearch}
            onChange={e => setNcSearch(e.target.value)}
          />

          {/* Status filters */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'All', label: 'All (150)' },
              { id: 'solved', label: `✅ Solved (${combinedStats.ncSolvedCount})` },
              { id: 'needs_revision', label: `🔄 Needs Rev (${neetcodeProblems?.filter(p => p.status === 'needs_revision').length ?? 0})` },
              { id: 'unsolved', label: `⭕ Unsolved (${neetcodeProblems?.filter(p => p.status === 'unsolved').length ?? 150})` },
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setNcStatus(s.id as NeetCodeFilterStatus)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${ncStatus === s.id ? 'bg-brand-500 text-white font-semibold' : 'bg-surface-200 text-gray-400 hover:text-gray-200'}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Difficulty filters */}
          <div className="flex gap-2">
            {(['All', 'Easy', 'Medium', 'Hard'] as FilterDifficulty[]).map(d => (
              <button
                key={d}
                onClick={() => setNcDifficulty(d)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${ncDifficulty === d
                    ? d === 'Easy' ? 'bg-emerald-500 text-white' : d === 'Medium' ? 'bg-amber-500 text-white' : d === 'Hard' ? 'bg-red-500 text-white' : 'bg-brand-500 text-white'
                    : 'bg-surface-200 text-gray-400'
                  }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Categories horizontal scroll */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {NEETCODE_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setNcCategory(cat)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${ncCategory === cat ? 'bg-purple-600 text-white font-semibold' : 'bg-surface-200/80 text-gray-400 hover:text-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Problem List Count */}
          <div className="flex items-center justify-between text-xs text-gray-500 px-1 pt-1">
            <span>Showing {filteredNeetCode.length} questions</span>
            {ncCategory !== 'All' && <span className="text-brand-400">{ncCategory}</span>}
          </div>

          {/* List of NeetCode Problems */}
          <div className="space-y-2">
            {filteredNeetCode.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-gray-400 text-sm">No NeetCode problems match this filter.</p>
              </div>
            ) : (
              filteredNeetCode.map(problem => {
                const isSolved = problem.status === 'solved'
                const isNeedsRev = problem.status === 'needs_revision'
                const isDue = (isNeedsRev || (problem.nextReviewAt && problem.nextReviewAt <= today))

                const diffClass = problem.difficulty === 'Easy'
                  ? 'badge-easy'
                  : problem.difficulty === 'Medium'
                    ? 'badge-medium'
                    : 'badge-hard'

                return (
                  <div
                    key={problem.id}
                    className={`card p-3 transition-all duration-200 flex items-center justify-between gap-3
                      ${isSolved ? 'border-emerald-500/30 bg-emerald-950/5' : ''}
                      ${isNeedsRev ? 'border-amber-500/30 bg-amber-950/5' : ''}
                    `}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={diffClass}>{problem.difficulty}</span>
                        <span className="text-[10px] text-gray-400 bg-surface-300/60 px-1.5 py-0.5 rounded">
                          {problem.category}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          W{problem.weekNumber} D{problem.dayNumber} · ⏱️ {problem.estMinutes}m
                        </span>
                        {isDue && (
                          <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded">
                            🔄 Revise
                          </span>
                        )}
                      </div>

                      <a
                        href={problem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-gray-200 hover:text-brand-400 transition-colors inline-flex items-center gap-1"
                      >
                        <span>{problem.title}</span>
                        <span className="text-xs text-gray-500">↗</span>
                      </a>

                      {problem.solveResult && (
                        <div className="text-[10px] text-gray-400 mt-1 flex items-center gap-2">
                          <span className={isSolved ? 'text-emerald-400' : 'text-amber-400'}>
                            {problem.solveResult === 'alone' ? '✓ Solved Alone' : problem.solveResult === 'hints' ? '💡 With Hints' : '❌ Failed'}
                          </span>
                          {problem.nextReviewAt && (
                            <span className="text-gray-500">
                              Next: {formatDateShort(problem.nextReviewAt)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedNcProblem(problem)}
                      className={`btn-ghost text-xs px-3 py-1.5 rounded-lg border transition-all flex-shrink-0
                        ${isSolved
                          ? 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                          : isNeedsRev
                            ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                            : 'border-white/10 text-gray-300 hover:bg-white/5'
                        }`}
                    >
                      {isSolved ? 'Solve Again' : isNeedsRev ? 'Log Revise' : 'Log Solve'}
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ─────────────────── TAB 2: CUSTOM PROBLEMS LOG ─────────────────── */}
      {activeTab === 'custom' && (
        <div>
          {/* View toggle */}
          <div className="flex gap-1.5 mb-4 bg-surface-200 rounded-xl p-1">
            {(['cards', 'table', 'stats'] as CustomViewMode[]).map(v => (
              <button
                key={v}
                onClick={() => setCustomView(v)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
                  ${customView === v ? 'bg-brand-500 text-white' : 'text-gray-500'}`}
              >
                {v === 'cards' ? '🃏 Cards' : v === 'table' ? '📋 Table' : '📊 Stats'}
              </button>
            ))}
          </div>

          {/* Filters */}
          {customView !== 'stats' && (
            <div className="space-y-2 mb-4">
              <input
                className="input text-sm"
                placeholder="🔍 Search custom problems..."
                value={customSearch}
                onChange={e => setCustomSearch(e.target.value)}
              />
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {(['All', 'Easy', 'Medium', 'Hard'] as FilterDifficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setCustomDifficulty(d)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${customDifficulty === d
                        ? d === 'Easy' ? 'bg-emerald-500 text-white' : d === 'Medium' ? 'bg-amber-500 text-white' : d === 'Hard' ? 'bg-red-500 text-white' : 'bg-brand-500 text-white'
                        : 'bg-surface-200 text-gray-500'
                      }`}
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={() => setCustomFilterRevision(s => !s)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${customFilterRevision ? 'bg-amber-500 text-white' : 'bg-surface-200 text-gray-500'}`}
                >
                  🔄 Needs Revision
                </button>
              </div>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {['All', ...PATTERNS].map(p => (
                  <button
                    key={p}
                    onClick={() => setCustomPattern(p)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${customPattern === p ? 'bg-brand-500 text-white' : 'bg-surface-200 text-gray-500'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cards view */}
          {customView === 'cards' && (
            <div className="space-y-3">
              {filteredCustom.length === 0 ? (
                <div className="card p-8 text-center">
                  <p className="text-3xl mb-2">💡</p>
                  <p className="text-gray-400 text-sm">No custom problems yet. Hit + Add Custom to log one!</p>
                </div>
              ) : (
                filteredCustom.map(problem => (
                  <ProblemCard
                    key={problem.id}
                    problem={problem}
                    today={today}
                    onDelete={() => problem.id && deleteCustomProblem(problem.id)}
                  />
                ))
              )}
            </div>
          )}

          {/* Table view */}
          {customView === 'table' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left p-3 text-gray-500 font-medium">Title</th>
                      <th className="text-left p-3 text-gray-500 font-medium">Diff</th>
                      <th className="text-left p-3 text-gray-500 font-medium">Time</th>
                      <th className="text-left p-3 text-gray-500 font-medium">Result</th>
                      <th className="text-left p-3 text-gray-500 font-medium">Next Rev</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustom.map(p => (
                      <tr key={p.id} className="border-b border-white/3 hover:bg-white/3 transition-colors">
                        <td className="p-3">
                          <a href={p.url || '#'} target="_blank" rel="noopener noreferrer"
                            className="text-gray-200 hover:text-brand-400 line-clamp-1">
                            {p.title}
                          </a>
                          <div className="flex gap-1 mt-1">
                            {p.pattern.slice(0,2).map(pat => <span key={pat} className="badge-brand">{pat}</span>)}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`badge-${p.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}`}>
                            {p.difficulty}
                          </span>
                        </td>
                        <td className="p-3 text-gray-400">{p.timeTaken}m</td>
                        <td className="p-3 text-gray-400">{p.result === 'Solved alone' ? '✅' : p.result === 'Solved with hints' ? '💡' : '❌'}</td>
                        <td className="p-3 text-gray-400">{p.nextReview <= today ? <span className="text-amber-400">Due!</span> : formatDateShort(p.nextReview)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats view */}
          {customView === 'stats' && (
            <div className="space-y-4">
              <div className="card p-4">
                <h2 className="section-header">Problems per Pattern</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={customPatternStats} margin={{ left: -20 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                      labelStyle={{ color: '#e5e7eb' }}
                    />
                    <Bar dataKey="count" radius={[4,4,0,0]}>
                      {customPatternStats.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={entry.count === 0 ? '#374151' : entry.count < 3 ? '#ef4444' : entry.count < 8 ? '#f59e0b' : '#6366f1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-red-400 mt-2">🔴 = needs work (&lt; 3 problems)</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* NeetCode Solve Modal */}
      {selectedNcProblem && (
        <NeetCodeSolveModal
          problem={selectedNcProblem}
          isOpen={true}
          onClose={() => setSelectedNcProblem(null)}
          onSelectResult={handleSolveNeetCode}
          onReset={selectedNcProblem.status !== 'unsolved' ? handleResetNeetCode : undefined}
        />
      )}

      <div className="h-20" />
    </div>
  )
}

function ProblemCard({
  problem,
  today,
  onDelete
}: {
  problem: Problem
  today: string
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const isOverdue = problem.nextReview <= today

  return (
    <div className="card p-4 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={problem.url || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-gray-200 hover:text-brand-400 transition-colors"
            >
              {problem.title}
            </a>
            <span className={`badge-${problem.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}`}>
              {problem.difficulty}
            </span>
            {isOverdue && <span className="badge bg-amber-500/20 text-amber-400">🔄 Due review</span>}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {problem.pattern.map(p => <span key={p} className="badge-brand">{p}</span>)}
          </div>

          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span>{formatDateShort(problem.dateSolved)}</span>
            <span>⏱ {problem.timeTaken}m</span>
            <span>{problem.result === 'Solved alone' ? '✅' : problem.result === 'Solved with hints' ? '💡 hints' : '❌ failed'}</span>
            <span>{'⭐'.repeat(problem.confidence)}</span>
          </div>

          {expanded && problem.notes && (
            <p className="mt-2 text-xs text-gray-400 bg-surface-200/50 rounded-lg p-2">
              {problem.notes}
            </p>
          )}

          {expanded && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={onDelete}
                className="text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                🗑️ Delete problem
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setExpanded(s => !s)}
          className="btn-ghost p-2 text-gray-600"
        >
          {expanded ? '▲' : '▼'}
        </button>
      </div>
    </div>
  )
}
