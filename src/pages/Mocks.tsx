import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import db from '../db/db'
import type { MockLog, MockType } from '../db/db'
import { todayIST, formatDateShort } from '../lib/dates'
import { recordLocalChange } from '../lib/syncEngine'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

const MOCK_TYPES: MockType[] = ['DSA', 'LLD', 'HLD', 'Behavioural', 'AI-assisted debugging']

export default function Mocks() {
  const [showAdd, setShowAdd] = useState(false)
  const today = todayIST()
  const mocks = useLiveQuery(() => db.mockLogs.orderBy('date').reverse().toArray())

  const chartData = mocks
    ? [...mocks].reverse().map(m => ({
        date: formatDateShort(m.date),
        score: m.score,
        type: m.type,
      }))
    : []

  return (
    <div className="px-4 py-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Mock Interviews</h1>
          <p className="text-xs text-gray-500 mt-0.5">{mocks?.length ?? 0} sessions logged</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary text-xs px-3 py-2">+ Log</button>
      </div>

      {/* Score chart */}
      {chartData.length > 1 && (
        <div className="card p-4 mb-4">
          <h2 className="section-header">Score Over Time</h2>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
              <YAxis domain={[1, 5]} ticks={[1,2,3,4,5]} tick={{ fontSize: 10, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
              />
              <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mock list */}
      <div className="space-y-3">
        {!mocks?.length ? (
          <div className="card p-8 text-center">
            <p className="text-3xl mb-2">🎤</p>
            <p className="text-gray-400 text-sm">No mock interviews yet. Log your first one!</p>
            <p className="text-xs text-gray-600 mt-2">Tip: Book mocks weekly from Week 5 onward</p>
          </div>
        ) : (
          mocks.map(m => <MockCard key={m.id} mock={m} />)
        )}
      </div>

      {showAdd && <AddMockModal onClose={() => setShowAdd(false)} today={today} />}
      <div className="h-8" />
    </div>
  )
}

function MockCard({ mock }: { mock: MockLog }) {
  const [expanded, setExpanded] = useState(false)
  const scoreColor = mock.score >= 4 ? 'text-emerald-400' : mock.score >= 3 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="card p-4">
      <button className="w-full text-left" onClick={() => setExpanded(s => !s)}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${scoreColor} bg-surface-200`}>
            {mock.score}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-200">{mock.type}</span>
              <span className="badge bg-surface-300 text-gray-400">{mock.durationMinutes}m</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDateShort(mock.date)} · {mock.withWhom || 'Solo practice'}
            </p>
          </div>
          <span className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 space-y-2 animate-fade-in">
          {mock.wentWell && (
            <div className="bg-emerald-500/10 rounded-xl p-3">
              <p className="text-xs text-emerald-400 font-medium mb-1">✅ Went well</p>
              <p className="text-xs text-gray-300">{mock.wentWell}</p>
            </div>
          )}
          {mock.toFix && (
            <div className="bg-red-500/10 rounded-xl p-3">
              <p className="text-xs text-red-400 font-medium mb-1">🔧 To fix</p>
              <p className="text-xs text-gray-300">{mock.toFix}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AddMockModal({ onClose, today }: { onClose: () => void; today: string }) {
  const [form, setForm] = useState({
    date: today, type: 'DSA' as MockType, withWhom: '',
    durationMinutes: 60, score: 3, wentWell: '', toFix: '', notes: ''
  })

  async function save() {
    const id = (await db.mockLogs.add(form)) as number
    await recordLocalChange('mockLogs', id, 'upsert', { ...form, id })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl bg-surface-100 rounded-t-3xl p-5 pb-safe animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Log Mock Interview</h2>
          <button onClick={onClose} className="btn-ghost p-2">✕</button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Type</label>
            <div className="flex flex-wrap gap-2">
              {MOCK_TYPES.map(t => (
                <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all
                    ${form.type === t ? 'bg-brand-500 text-white' : 'bg-surface-200 text-gray-500'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <input className="input" placeholder="With whom (leave blank for solo)" value={form.withWhom}
            onChange={e => setForm(f => ({ ...f, withWhom: e.target.value }))} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Duration (mins)</label>
              <input className="input" type="number" value={form.durationMinutes}
                onChange={e => setForm(f => ({ ...f, durationMinutes: parseInt(e.target.value) || 60 }))} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Score (1-5)</label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm(f => ({ ...f, score: n }))}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all
                      ${form.score === n ? 'bg-brand-500 text-white' : 'bg-surface-200 text-gray-600'}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <textarea className="textarea" rows={2} placeholder="What went well..."
            value={form.wentWell} onChange={e => setForm(f => ({ ...f, wentWell: e.target.value }))} />
          <textarea className="textarea" rows={2} placeholder="What to fix..."
            value={form.toFix} onChange={e => setForm(f => ({ ...f, toFix: e.target.value }))} />
          <button onClick={save} className="btn-primary w-full">Save Mock Log</button>
        </div>
      </div>
    </div>
  )
}
