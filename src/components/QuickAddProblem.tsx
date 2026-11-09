import { useState } from 'react'
import db from '../db/db'
import type { Problem, SolveResult, Difficulty } from '../db/db'
import { todayIST } from '../lib/dates'
import { scheduleAfterSolve } from '../lib/spacedRep'

const PATTERNS = [
  'Two pointers', 'Sliding window', 'Prefix sum', 'Hashing',
  'Stack/Monotonic stack', 'Binary search', 'Linked list', 'Trees',
  'Heap/Top-K', 'Trie', 'Intervals', 'Graph BFS/DFS',
  'Topological sort', 'Union find', 'Dijkstra', 'Backtracking',
  'Greedy', 'DP 1D', 'DP 2D',
]

interface QuickAddProblemProps {
  onClose: () => void
}

export default function QuickAddProblem({ onClose }: QuickAddProblemProps) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium')
  const [patterns, setPatterns] = useState<string[]>([])
  const [timeTaken, setTimeTaken] = useState('')
  const [result, setResult] = useState<SolveResult>('Solved alone')
  const [confidence, setConfidence] = useState(3)
  const [notes, setNotes] = useState('')
  const [language, setLanguage] = useState('TypeScript')
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'form' | 'patterns'>('form')

  const today = todayIST()

  function togglePattern(p: string) {
    setPatterns(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
  }

  async function handleSave() {
    if (!title.trim()) return
    setSaving(true)
    try {
      const schedule = scheduleAfterSolve(today, result)
      await db.problems.add({
        title: title.trim(),
        url: url.trim(),
        difficulty,
        pattern: patterns,
        dateSolved: today,
        timeTaken: parseInt(timeTaken) || 0,
        result,
        confidence,
        notes: notes.trim(),
        language,
        nextReview: schedule.nextReview,
        reviewInterval: schedule.reviewInterval,
        reviewCount: 0,
      })
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl bg-surface-100 rounded-t-3xl p-5 pb-safe
                      animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-100">Quick Add Problem</h2>
          <button onClick={onClose} className="btn-ghost p-2 text-xl">✕</button>
        </div>

        {step === 'form' ? (
          <div className="space-y-3">
            <div>
              <label htmlFor="problem-title" className="block text-xs text-gray-500 mb-1">Problem title *</label>
              <input
                id="problem-title"
                className="input"
                placeholder="Two Sum"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="problem-url" className="block text-xs text-gray-500 mb-1">URL</label>
              <input
                id="problem-url"
                className="input"
                placeholder="https://leetcode.com/problems/..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                type="url"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Difficulty</label>
                <div className="flex gap-1.5">
                  {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all
                        ${difficulty === d
                          ? d === 'Easy' ? 'bg-emerald-500 text-white' : d === 'Medium' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                          : 'bg-surface-200 text-gray-500'
                        }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="problem-time" className="block text-xs text-gray-500 mb-1">Time (mins)</label>
                <input
                  id="problem-time"
                  className="input py-2"
                  placeholder="25"
                  type="number"
                  min="1"
                  value={timeTaken}
                  onChange={e => setTimeTaken(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Result</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Solved alone', 'Solved with hints', 'Failed'] as SolveResult[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setResult(r)}
                    className={`py-2.5 rounded-xl text-xs font-medium transition-all
                      ${result === r ? 'bg-brand-500 text-white' : 'bg-surface-200 text-gray-500'}`}
                  >
                    {r === 'Solved alone' ? '✅ Solo' : r === 'Solved with hints' ? '💡 Hints' : '❌ Failed'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Confidence: {confidence}/5</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    onClick={() => setConfidence(n)}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all
                      ${confidence >= n ? 'bg-brand-500 text-white' : 'bg-surface-200 text-gray-600'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="problem-notes" className="block text-xs text-gray-500 mb-1">Notes</label>
              <textarea
                id="problem-notes"
                className="textarea"
                rows={2}
                placeholder="Key insight, approach used..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStep('patterns')}
                className="btn-secondary flex-1 text-sm"
              >
                + Patterns {patterns.length > 0 ? `(${patterns.length})` : ''}
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim() || saving}
                className="btn-primary flex-1 text-sm"
              >
                {saving ? 'Saving...' : '💾 Save'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-400 mb-3">Select all patterns that apply:</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {PATTERNS.map(p => (
                <button
                  key={p}
                  onClick={() => togglePattern(p)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all
                    ${patterns.includes(p) ? 'bg-brand-500 text-white' : 'bg-surface-200 text-gray-400'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button onClick={() => setStep('form')} className="btn-primary w-full">
              ✓ Done ({patterns.length} selected)
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
