import { useLiveQuery } from 'dexie-react-hooks'
import { useState, useMemo } from 'react'
import db from '../db/db'
import type { Problem, Difficulty } from '../db/db'
import { todayIST, formatDateShort } from '../lib/dates'
import { useAppStore } from '../store/useAppStore'
import QuickAddProblem from '../components/QuickAddProblem'
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

type ViewMode = 'table' | 'cards' | 'stats'
type FilterDifficulty = 'All' | Difficulty

export default function DSATracker() {
  const today = todayIST()
  const [view, setView] = useState<ViewMode>('cards')
  const [filterDifficulty, setFilterDifficulty] = useState<FilterDifficulty>('All')
  const [filterPattern, setFilterPattern] = useState('All')
  const [filterRevision, setFilterRevision] = useState(false)
  const [search, setSearch] = useState('')
  const { setShowQuickAdd } = useAppStore()

  const problems = useLiveQuery(() => db.problems.orderBy('dateSolved').reverse().toArray())

  const filtered = useMemo(() => {
    if (!problems) return []
    return problems.filter(p => {
      if (filterDifficulty !== 'All' && p.difficulty !== filterDifficulty) return false
      if (filterPattern !== 'All' && !p.pattern.includes(filterPattern)) return false
      if (filterRevision && p.nextReview > today) return false
      if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [problems, filterDifficulty, filterPattern, filterRevision, today, search])

  const stats = useMemo(() => {
    if (!problems) return null
    const total = problems.length
    const easy = problems.filter(p => p.difficulty === 'Easy').length
    const medium = problems.filter(p => p.difficulty === 'Medium').length
    const hard = problems.filter(p => p.difficulty === 'Hard').length
    const dueForRevision = problems.filter(p => p.nextReview <= today).length

    const patternCounts: Record<string, number> = {}
    for (const p of problems) {
      for (const pat of p.pattern) {
        patternCounts[pat] = (patternCounts[pat] || 0) + 1
      }
    }

    const patternData = PATTERNS.map(p => ({
      name: p.length > 14 ? p.slice(0, 13) + '…' : p,
      count: patternCounts[p] || 0,
    }))

    return { total, easy, medium, hard, dueForRevision, patternData }
  }, [problems, today])

  async function deleteProblem(id: number) {
    const p = await db.problems.get(id)
    if (!p) return
    await db.problems.delete(id)
  }

  function exportCSV() {
    if (!problems?.length) return
    const headers = ['title','url','difficulty','pattern','dateSolved','timeTaken','result','confidence','notes','language']
    const rows = problems.map(p => [
      `"${p.title}"`, `"${p.url}"`, p.difficulty, `"${p.pattern.join(';')}"`,
      p.dateSolved, p.timeTaken, p.result, p.confidence, `"${p.notes}"`, p.language
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dsa-problems-${today}.csv`
    a.click()
  }

  return (
    <div className="px-4 py-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">DSA Tracker</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {stats?.total ?? 0} solved · Target: 220–260
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-ghost text-xs px-3 py-2">⬇️ CSV</button>
          <button onClick={() => setShowQuickAdd(true)} className="btn-primary text-xs px-3 py-2">+ Add</button>
        </div>
      </div>

      {/* Progress bar toward target */}
      <div className="card p-3 mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>Progress to 220</span>
          <span>{stats?.total ?? 0} / 220</span>
        </div>
        <div className="h-2 bg-surface-300 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-purple-500 rounded-full"
            style={{ width: `${Math.min(100, ((stats?.total ?? 0) / 220) * 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs">
          <span className="badge-easy">Easy: {stats?.easy ?? 0}</span>
          <span className="badge-medium">Med: {stats?.medium ?? 0}</span>
          <span className="badge-hard">Hard: {stats?.hard ?? 0}</span>
          {(stats?.dueForRevision ?? 0) > 0 && (
            <span className="badge bg-amber-500/20 text-amber-400">🔄 {stats?.dueForRevision} due</span>
          )}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1.5 mb-4 bg-surface-200 rounded-xl p-1">
        {(['cards', 'table', 'stats'] as ViewMode[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
              ${view === v ? 'bg-brand-500 text-white' : 'text-gray-500'}`}
          >
            {v === 'cards' ? '🃏 Cards' : v === 'table' ? '📋 Table' : '📊 Stats'}
          </button>
        ))}
      </div>

      {/* Filters */}
      {view !== 'stats' && (
        <div className="space-y-2 mb-4">
          <input
            className="input text-sm"
            placeholder="🔍 Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(['All', 'Easy', 'Medium', 'Hard'] as FilterDifficulty[]).map(d => (
              <button
                key={d}
                onClick={() => setFilterDifficulty(d)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${filterDifficulty === d
                    ? d === 'Easy' ? 'bg-emerald-500 text-white' : d === 'Medium' ? 'bg-amber-500 text-white' : d === 'Hard' ? 'bg-red-500 text-white' : 'bg-brand-500 text-white'
                    : 'bg-surface-200 text-gray-500'
                  }`}
              >
                {d}
              </button>
            ))}
            <button
              onClick={() => setFilterRevision(s => !s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filterRevision ? 'bg-amber-500 text-white' : 'bg-surface-200 text-gray-500'}`}
            >
              🔄 Needs Revision
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {['All', ...PATTERNS].map(p => (
              <button
                key={p}
                onClick={() => setFilterPattern(p)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${filterPattern === p ? 'bg-brand-500 text-white' : 'bg-surface-200 text-gray-500'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cards view */}
      {view === 'cards' && (
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-3xl mb-2">💡</p>
              <p className="text-gray-400 text-sm">No problems yet. Hit + Add to add your first!</p>
            </div>
          ) : (
            filtered.map(problem => <ProblemCard key={problem.id} problem={problem} today={today} />)
          )}
        </div>
      )}

      {/* Table view */}
      {view === 'table' && (
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
                {filtered.map(p => (
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
      {view === 'stats' && stats && (
        <div className="space-y-4">
          {/* Pattern breakdown */}
          <div className="card p-4">
            <h2 className="section-header">Problems per Pattern</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.patternData} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} angle={-45} textAnchor="end" height={80} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  labelStyle={{ color: '#e5e7eb' }}
                />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {stats.patternData.map((entry, i) => (
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

          {/* Difficulty targets */}
          <div className="card p-4">
            <h2 className="section-header">Difficulty vs Target</h2>
            <div className="space-y-3">
              {[
                { label: 'Easy', current: stats.easy, target: Math.round(220 * 0.25), color: 'bg-emerald-500' },
                { label: 'Medium', current: stats.medium, target: Math.round(220 * 0.60), color: 'bg-amber-500' },
                { label: 'Hard', current: stats.hard, target: Math.round(220 * 0.15), color: 'bg-red-500' },
              ].map(d => (
                <div key={d.label}>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{d.label}</span>
                    <span>{d.current}/{d.target}</span>
                  </div>
                  <div className="h-2 bg-surface-300 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${d.color} rounded-full transition-all`}
                      style={{ width: `${Math.min(100, (d.current / d.target) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="h-20" />
    </div>
  )
}

function ProblemCard({ problem, today }: { problem: Problem; today: string }) {
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
