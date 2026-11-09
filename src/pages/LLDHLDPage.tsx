import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import db from '../db/db'
import type { LLDHLDItem, LLDHLDCategory } from '../db/db'

const STAGES_LLD = [
  'Requirements clarified',
  'Entities and classes defined',
  'Code written',
  'Concurrency/Failure modes covered',
  'Trade-offs written',
  'Self-reviewed aloud',
  'Mock-explained to someone',
]

const STAGES_HLD = [
  'Requirements clarified',
  'Data model designed',
  'Diagram and APIs drawn',
  'Failure modes covered',
  'Trade-offs written',
  'Self-reviewed aloud',
  'Mock-explained to someone',
]

export default function LLDHLDPage() {
  const [activeTab, setActiveTab] = useState<LLDHLDCategory>('LLD')
  const items = useLiveQuery(() =>
    db.lldHldItems.where('category').equals(activeTab).sortBy('order')
  )

  const stages = activeTab === 'LLD' ? STAGES_LLD : STAGES_HLD

  const totalStages = (items?.length ?? 0) * stages.length
  const doneStages = items?.reduce((acc, item) =>
    acc + Object.values(item.stagesState).filter(Boolean).length, 0
  ) ?? 0
  const pct = totalStages > 0 ? Math.round((doneStages / totalStages) * 100) : 0

  return (
    <div className="px-4 py-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">LLD & HLD</h1>
          <p className="text-xs text-gray-500 mt-0.5">{pct}% complete</p>
        </div>
      </div>

      {/* Tab */}
      <div className="flex gap-1.5 mb-4 bg-surface-200 rounded-xl p-1">
        {(['LLD', 'HLD'] as LLDHLDCategory[]).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
              ${activeTab === cat ? 'bg-brand-500 text-white' : 'text-gray-500'}`}
          >
            {cat === 'LLD' ? '🔧 Low Level Design' : '🏗️ High Level Design'}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {(items ?? []).map(item => (
          <DesignItem key={item.id} item={item} stages={stages} />
        ))}

        {!items?.length && (
          <div className="card p-8 text-center">
            <p className="text-3xl mb-2">🏗️</p>
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        )}
      </div>
      <div className="h-8" />
    </div>
  )
}

function DesignItem({ item, stages }: { item: LLDHLDItem; stages: string[] }) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(item.notes)
  const [link, setLink] = useState(item.link)

  const doneCount = stages.filter(s => item.stagesState[s]).length
  const pct = Math.round((doneCount / stages.length) * 100)

  async function toggleStage(stage: string) {
    const newState = {
      ...item.stagesState,
      [stage]: !item.stagesState[stage],
    }
    await db.lldHldItems.update(item.id!, { stagesState: newState })
  }

  async function saveNotes() {
    await db.lldHldItems.update(item.id!, { notes, link })
  }

  return (
    <div className="card p-4">
      <button
        className="w-full text-left"
        onClick={() => setExpanded(s => !s)}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-200">{item.title}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{doneCount}/{stages.length}</span>
            <span className="text-gray-600">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 bg-surface-300 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500
              ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-purple-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-2 animate-fade-in">
          {/* Stage checklist */}
          {stages.map(stage => (
            <button
              key={stage}
              onClick={() => toggleStage(stage)}
              className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl text-sm transition-all
                ${item.stagesState[stage]
                  ? 'bg-brand-500/15 text-brand-300'
                  : 'bg-surface-200/60 text-gray-400 hover:bg-surface-200'
                }`}
            >
              <span className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center text-xs
                ${item.stagesState[stage] ? 'bg-brand-500 border-brand-500' : 'border-gray-600'}`}>
                {item.stagesState[stage] && '✓'}
              </span>
              {stage}
            </button>
          ))}

          {/* Link */}
          <div className="mt-3">
            <label className="block text-xs text-gray-500 mb-1">Link / Gist</label>
            <input
              className="input text-sm"
              placeholder="https://..."
              value={link}
              onChange={e => setLink(e.target.value)}
              onBlur={saveNotes}
              type="url"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Notes</label>
            <textarea
              className="textarea text-sm"
              rows={3}
              placeholder="Key design decisions, trade-offs..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={saveNotes}
            />
          </div>
        </div>
      )}
    </div>
  )
}
