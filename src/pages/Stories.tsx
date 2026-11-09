import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import db from '../db/db'
import type { Story } from '../db/db'

type StoryTab = 'project' | 'star' | 'numbers'

export default function Stories() {
  const [tab, setTab] = useState<StoryTab>('project')
  const stories = useLiveQuery(() => db.stories.toArray())

  const projectQs = stories?.filter(s => s.type === 'projectQ') ?? []
  const starStories = stories?.filter(s => s.type === 'star') ?? []
  const numbersCard = stories?.find(s => s.type === 'numbers')

  return (
    <div className="px-4 py-4 animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold gradient-text">Stories & Prep</h1>
        <p className="text-xs text-gray-500 mt-1">CRM deep-dive · STAR · Numbers</p>
      </div>

      {/* Tab */}
      <div className="flex gap-1.5 mb-4 bg-surface-200 rounded-xl p-1">
        {([
          { id: 'project', label: '🏭 Project Q&A' },
          { id: 'star', label: '⭐ STAR Stories' },
          { id: 'numbers', label: '🔢 Numbers' },
        ] as { id: StoryTab; label: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
              ${tab === t.id ? 'bg-brand-500 text-white' : 'text-gray-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'project' && (
        <div className="space-y-3">
          {projectQs.map((q, i) => <ProjectCard key={q.id} story={q} number={i + 1} />)}
        </div>
      )}

      {tab === 'star' && (
        <div className="space-y-3">
          {starStories.map(s => <StarCard key={s.id} story={s} />)}
        </div>
      )}

      {tab === 'numbers' && numbersCard && (
        <NumbersCard story={numbersCard} />
      )}

      <div className="h-8" />
    </div>
  )
}

function ProjectCard({ story, number }: { story: Story; number: number }) {
  const [expanded, setExpanded] = useState(false)
  const [answer, setAnswer] = useState(story.answerScript)
  const [practiced, setPracticed] = useState(story.practicedAloud)

  async function save() {
    await db.stories.update(story.id!, { answerScript: answer })
  }

  async function togglePracticed() {
    const next = !practiced
    const nextCount = story.practiceCount + (next ? 1 : 0)
    await db.stories.update(story.id!, {
      practicedAloud: next,
      practiceCount: nextCount,
    })
    setPracticed(next)
  }

  return (
    <div className="card p-4">
      <button className="w-full text-left" onClick={() => setExpanded(s => !s)}>
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-500/20 text-brand-400
                           flex items-center justify-center text-xs font-bold">
            {number}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-200">{story.title}</p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{story.questionText}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {story.practiceCount > 0 && (
              <span className="badge bg-brand-500/20 text-brand-400">×{story.practiceCount}</span>
            )}
            <span className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</span>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 animate-fade-in">
          <p className="text-xs text-gray-500 mb-2 font-medium">Question:</p>
          <p className="text-sm text-gray-300 bg-surface-200/50 rounded-xl p-3 mb-3">
            {story.questionText}
          </p>
          <label className="block text-xs text-gray-500 mb-1">Answer script</label>
          <textarea
            className="textarea text-sm"
            rows={5}
            placeholder="Write your answer here..."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            onBlur={save}
          />
          <button
            onClick={togglePracticed}
            className={`mt-3 w-full py-3 rounded-xl text-sm font-semibold transition-all
              ${practiced
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-surface-200 text-gray-500'
              }`}
          >
            {practiced ? `✅ Practiced aloud (×${story.practiceCount})` : '🎤 Mark as practiced aloud'}
          </button>
        </div>
      )}
    </div>
  )
}

function StarCard({ story }: { story: Story }) {
  const [expanded, setExpanded] = useState(false)
  const fields = [
    { key: 'situation', label: 'Situation' },
    { key: 'task', label: 'Task' },
    { key: 'action', label: 'Action' },
    { key: 'result', label: 'Result' },
    { key: 'whatIdDoDifferently', label: "What I'd do differently" },
  ] as const

  const [formData, setFormData] = useState<Record<string, string>>({
    situation: story.situation,
    task: story.task,
    action: story.action,
    result: story.result,
    whatIdDoDifferently: story.whatIdDoDifferently,
  })

  async function saveField(key: string, value: string) {
    await db.stories.update(story.id!, { [key]: value })
  }

  const filledCount = fields.filter(f => (formData[f.key] || '').trim().length > 0).length

  return (
    <div className="card p-4">
      <button className="w-full text-left" onClick={() => setExpanded(s => !s)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-200">{story.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex gap-0.5">
                {fields.map((f, i) => (
                  <div key={f.key}
                    className={`w-4 h-1.5 rounded-full ${i < filledCount ? 'bg-brand-500' : 'bg-surface-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500">{filledCount}/{fields.length} filled</span>
              {story.practiceCount > 0 && (
                <span className="badge bg-brand-500/20 text-brand-400">×{story.practiceCount} practiced</span>
              )}
            </div>
          </div>
          <span className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">
                {f.label}
              </label>
              <textarea
                className="textarea text-sm"
                rows={3}
                placeholder={`${f.label}...`}
                value={formData[f.key]}
                onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))}
                onBlur={e => saveField(f.key, e.target.value)}
              />
            </div>
          ))}
          <button
            onClick={async () => {
              const next = story.practiceCount + 1
              await db.stories.update(story.id!, { practiceCount: next, practicedAloud: true })
            }}
            className="w-full py-3 rounded-xl text-sm font-semibold bg-surface-200 text-gray-400 hover:bg-surface-300 transition-all"
          >
            🎤 Practiced aloud (+1)
          </button>
        </div>
      )}
    </div>
  )
}

function NumbersCard({ story }: { story: Story }) {
  const [data, setData] = useState<Record<string, string>>(story.numbersData)

  async function saveField(key: string, value: string) {
    const newData = { ...data, [key]: value }
    await db.stories.update(story.id!, { numbersData: newData })
  }

  return (
    <div className="card p-4">
      <h2 className="text-sm font-bold text-gray-200 mb-4">Numbers I Must Remember</h2>
      <div className="space-y-3">
        {Object.keys(data).map(key => (
          <div key={key}>
            <label className="block text-xs text-gray-500 mb-1">{key}</label>
            <input
              className="input text-sm"
              placeholder="Fill in..."
              value={data[key]}
              onChange={e => setData(d => ({ ...d, [key]: e.target.value }))}
              onBlur={e => saveField(key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
