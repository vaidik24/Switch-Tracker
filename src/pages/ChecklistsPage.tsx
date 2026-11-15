import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import db from '../db/db'
import type { ChecklistItem, ChecklistType } from '../db/db'
import { recordLocalChange } from '../lib/syncEngine'

type Tab = 'resume' | 'linkedin'

export default function ChecklistsPage() {
  const [tab, setTab] = useState<Tab>('resume')
  const items = useLiveQuery(() =>
    db.checklistItems.where('listType').equals(tab).sortBy('order')
  )

  const doneCount = items?.filter(i => i.done).length ?? 0
  const total = items?.length ?? 0
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0

  async function toggleItem(id: number, done: boolean) {
    await db.checklistItems.update(id, { done: !done })
    const item = await db.checklistItems.get(id)
    if (item) {
      await recordLocalChange('checklistItems', id, 'upsert', item)
    }
  }

  return (
    <div className="px-4 py-4 animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold gradient-text">Checklists</h1>
        <p className="text-xs text-gray-500 mt-1">{pct}% complete · {doneCount}/{total} items</p>
      </div>

      {/* Tab */}
      <div className="flex gap-1.5 mb-4 bg-surface-200 rounded-xl p-1">
        <button
          onClick={() => setTab('resume')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${tab === 'resume' ? 'bg-brand-500 text-white' : 'text-gray-500'}`}
        >
          📄 Resume
        </button>
        <button
          onClick={() => setTab('linkedin')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all
            ${tab === 'linkedin' ? 'bg-brand-500 text-white' : 'text-gray-500'}`}
        >
          💼 LinkedIn
        </button>
      </div>

      {/* Progress */}
      <div className="h-2 bg-surface-300 rounded-full overflow-hidden mb-4">
        <div
          className={`h-full rounded-full transition-all duration-500
            ${pct === 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-brand-500 to-purple-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Items */}
      <div className="card p-4 space-y-1">
        {(items ?? []).map(item => (
          <div
            key={item.id}
            className={`flex items-center gap-3 py-3 px-1 rounded-xl transition-all
              ${item.done ? 'opacity-60' : 'hover:bg-white/3'}`}
          >
            <button
              onClick={() => toggleItem(item.id!, item.done)}
              className={`task-checkbox ${item.done ? 'checked' : ''}`}
            >
              {item.done && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className={`text-sm ${item.done ? 'line-through text-gray-500' : 'text-gray-200'}`}>
              {item.title}
            </span>
          </div>
        ))}

        {(!items?.length) && (
          <p className="text-gray-500 text-sm text-center py-4">Loading...</p>
        )}
      </div>

      {pct === 100 && (
        <div className="card p-4 mt-4 text-center border border-emerald-500/20">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-emerald-400 font-semibold">All items complete!</p>
        </div>
      )}

      <div className="h-8" />
    </div>
  )
}
