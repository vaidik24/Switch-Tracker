import { useLiveQuery } from 'dexie-react-hooks'
import { useState, useMemo } from 'react'
import db from '../db/db'
import type { Concept, ConceptStatus } from '../db/db'
import { todayIST } from '../lib/dates'

const STATUSES: ConceptStatus[] = ["Don't know", 'Can explain', 'Can explain with example']
const STATUS_COLORS: Record<ConceptStatus, string> = {
  "Don't know": 'bg-red-500/20 text-red-400',
  'Can explain': 'bg-amber-500/20 text-amber-400',
  'Can explain with example': 'bg-emerald-500/20 text-emerald-400',
}

type Mode = 'list' | 'flashcard'

export default function Concepts() {
  const [mode, setMode] = useState<Mode>('list')
  const [filterCategory, setFilterCategory] = useState('All')
  const [filterStatus, setFilterStatus] = useState<ConceptStatus | 'All'>('All')
  const today = todayIST()

  const concepts = useLiveQuery(() => db.concepts.toArray())

  const categories = useMemo(() => {
    if (!concepts) return []
    return ['All', ...new Set(concepts.map(c => c.category))]
  }, [concepts])

  const filtered = useMemo(() => {
    if (!concepts) return []
    return concepts.filter(c => {
      if (filterCategory !== 'All' && c.category !== filterCategory) return false
      if (filterStatus !== 'All' && c.status !== filterStatus) return false
      return true
    })
  }, [concepts, filterCategory, filterStatus])

  // Stats
  const stats = useMemo(() => {
    if (!concepts) return null
    return {
      total: concepts.length,
      dontKnow: concepts.filter(c => c.status === "Don't know").length,
      canExplain: concepts.filter(c => c.status === 'Can explain').length,
      mastered: concepts.filter(c => c.status === 'Can explain with example').length,
    }
  }, [concepts])

  if (mode === 'flashcard') {
    return <FlashcardMode concepts={filtered} onExit={() => setMode('list')} today={today} />
  }

  return (
    <div className="px-4 py-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Concepts</h1>
          {stats && (
            <div className="flex gap-2 mt-1">
              <span className="badge bg-red-500/20 text-red-400">{stats.dontKnow} unknown</span>
              <span className="badge bg-amber-500/20 text-amber-400">{stats.canExplain} learning</span>
              <span className="badge bg-emerald-500/20 text-emerald-400">{stats.mastered} mastered</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setMode('flashcard')}
          className="btn-primary text-sm px-4 py-2"
        >
          🃏 Drill
        </button>
      </div>

      {/* Progress bar */}
      {stats && (
        <div className="card p-3 mb-4">
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
            <div
              className="bg-red-500 transition-all"
              style={{ width: `${(stats.dontKnow / stats.total) * 100}%` }}
            />
            <div
              className="bg-amber-500 transition-all"
              style={{ width: `${(stats.canExplain / stats.total) * 100}%` }}
            />
            <div
              className="bg-emerald-500 transition-all"
              style={{ width: `${(stats.mastered / stats.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1.5 text-center">
            {Math.round((stats.mastered / stats.total) * 100)}% mastered
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2 mb-4">
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filterCategory === cat ? 'bg-brand-500 text-white' : 'bg-surface-200 text-gray-500'}`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['All', ...STATUSES] as (ConceptStatus | 'All')[]).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filterStatus === s ? 'bg-brand-500 text-white' : 'bg-surface-200 text-gray-500'}`}
            >
              {s === 'All' ? 'All' : s === "Don't know" ? '❓' : s === 'Can explain' ? '📖' : '⭐'}
              {' '}{s === 'All' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped by category */}
      {filterCategory === 'All' ? (
        categories.slice(1).map(cat => {
          const catItems = filtered.filter(c => c.category === cat)
          if (!catItems.length) return null
          return (
            <CategoryGroup key={cat} category={cat} concepts={catItems} />
          )
        })
      ) : (
        <CategoryGroup category={filterCategory} concepts={filtered} />
      )}

      <div className="h-8" />
    </div>
  )
}

function CategoryGroup({ category, concepts }: { category: string; concepts: Concept[] }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(s => !s)}
        className="flex items-center justify-between w-full mb-2"
      >
        <h2 className="text-xs font-semibold uppercase tracking-widest text-brand-400">
          {category}
        </h2>
        <span className="text-gray-600 text-xs">{concepts.length} · {open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="space-y-2">
          {concepts.map(c => <ConceptRow key={c.id} concept={c} />)}
        </div>
      )}
    </div>
  )
}

function ConceptRow({ concept }: { concept: Concept }) {
  const [expanded, setExpanded] = useState(false)
  const [explanation, setExplanation] = useState(concept.myExplanation)

  async function cycleStatus() {
    const idx = STATUSES.indexOf(concept.status)
    const next = STATUSES[(idx + 1) % STATUSES.length]
    await db.concepts.update(concept.id!, { status: next })
  }

  async function saveExplanation() {
    await db.concepts.update(concept.id!, { myExplanation: explanation })
  }

  return (
    <div className="card p-3">
      <div className="flex items-center gap-3">
        <button
          onClick={cycleStatus}
          className={`flex-shrink-0 badge ${STATUS_COLORS[concept.status]} cursor-pointer hover:opacity-80 transition-opacity`}
        >
          {concept.status === "Don't know" ? '❓' : concept.status === 'Can explain' ? '📖' : '⭐'}
        </button>
        <button
          className="flex-1 text-left text-sm text-gray-200 font-medium"
          onClick={() => setExpanded(s => !s)}
        >
          {concept.term}
        </button>
        <button onClick={() => setExpanded(s => !s)} className="text-gray-600 text-xs">
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 animate-fade-in">
          <label className="block text-xs text-gray-500 mb-1">My 2-sentence explanation</label>
          <textarea
            className="textarea text-sm"
            rows={3}
            placeholder="Explain it in your own words..."
            value={explanation}
            onChange={e => setExplanation(e.target.value)}
            onBlur={saveExplanation}
            autoFocus
          />
        </div>
      )}
    </div>
  )
}

function FlashcardMode({ concepts, onExit, today }: { concepts: Concept[]; onExit: () => void; today: string }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * Math.max(1, concepts.length)))
  const [revealed, setRevealed] = useState(false)

  const concept = concepts[idx]
  if (!concept) {
    return (
      <div className="px-4 py-4 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-3xl mb-3">🎉</p>
        <p className="text-gray-400 mb-4">No concepts match your filter!</p>
        <button onClick={onExit} className="btn-primary">Back to list</button>
      </div>
    )
  }

  async function rate(rating: 1 | 2 | 3 | 4 | 5) {
    const newStatus: ConceptStatus = rating >= 4
      ? 'Can explain with example'
      : rating >= 3
        ? 'Can explain'
        : "Don't know"
    await db.concepts.update(concept.id!, { status: newStatus })
    await db.conceptReviews.add({ conceptId: concept.id!, date: today, rating })
    setRevealed(false)
    setIdx(Math.floor(Math.random() * concepts.length))
  }

  return (
    <div className="px-4 py-4 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onExit} className="btn-ghost text-sm">← Back</button>
        <p className="text-xs text-gray-500">{idx + 1}/{concepts.length}</p>
      </div>

      <div className="card p-6 min-h-[200px] flex flex-col items-center justify-center text-center mb-4">
        <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">{concept.category}</p>
        <h2 className="text-xl font-bold text-gray-100 mb-4">{concept.term}</h2>

        {!revealed ? (
          <button
            onClick={() => setRevealed(true)}
            className="btn-primary px-8"
          >
            Reveal my answer
          </button>
        ) : (
          <div className="w-full animate-fade-in">
            {concept.myExplanation ? (
              <div className="bg-surface-200 rounded-xl p-4 text-left mb-4">
                <p className="text-xs text-gray-500 mb-1">Your explanation:</p>
                <p className="text-sm text-gray-200">{concept.myExplanation}</p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm mb-4 italic">No explanation saved yet. Go to list view to add one.</p>
            )}
          </div>
        )}
      </div>

      {revealed && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-xs text-gray-500 text-center">Rate yourself:</p>
          <div className="grid grid-cols-5 gap-2">
            {([1,2,3,4,5] as const).map(r => (
              <button
                key={r}
                onClick={() => rate(r)}
                className={`py-3 rounded-xl text-sm font-bold transition-all
                  ${r <= 2 ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : r === 3 ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-600 px-1">
            <span>Blank</span>
            <span>Partial</span>
            <span>Nailed it</span>
          </div>

          <button
            onClick={() => { setRevealed(false); setIdx(Math.floor(Math.random() * concepts.length)) }}
            className="w-full py-2 text-xs text-gray-500 hover:text-gray-400"
          >
            Skip →
          </button>
        </div>
      )}
    </div>
  )
}
