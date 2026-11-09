import { useLiveQuery } from 'dexie-react-hooks'
import { useState, useMemo } from 'react'
import db from '../db/db'
import type { Job, JobStatus, JobTier } from '../db/db'
import { todayIST, formatDateShort, addDays } from '../lib/dates'

const STATUSES: JobStatus[] = ['Wishlist', 'Referral asked', 'Applied', 'Online assessment', 'Interviewing', 'Offer', 'Rejected/Closed']
const STATUS_ICONS: Record<JobStatus, string> = {
  'Wishlist': '⭐',
  'Referral asked': '🤝',
  'Applied': '📨',
  'Online assessment': '💻',
  'Interviewing': '💬',
  'Offer': '🎉',
  'Rejected/Closed': '❌',
}
const STATUS_COLORS: Record<JobStatus, string> = {
  'Wishlist': 'bg-gray-500/20 text-gray-400',
  'Referral asked': 'bg-blue-500/20 text-blue-400',
  'Applied': 'bg-brand-500/20 text-brand-400',
  'Online assessment': 'bg-amber-500/20 text-amber-400',
  'Interviewing': 'bg-purple-500/20 text-purple-400',
  'Offer': 'bg-emerald-500/20 text-emerald-400',
  'Rejected/Closed': 'bg-red-500/20 text-red-400',
}
const TIER_COLORS: Record<JobTier, string> = {
  'A': 'badge bg-emerald-500/20 text-emerald-400',
  'B': 'badge bg-brand-500/20 text-brand-400',
  'C': 'badge bg-gray-500/20 text-gray-400',
  'Practice': 'badge bg-amber-500/20 text-amber-400',
}

type ViewMode = 'kanban' | 'list' | 'templates'

export default function Jobs() {
  const [view, setView] = useState<ViewMode>('kanban')
  const [showAddJob, setShowAddJob] = useState(false)
  const [filterTier, setFilterTier] = useState<JobTier | 'All'>('All')
  const today = todayIST()

  const jobs = useLiveQuery(() => db.jobs.toArray())
  const templates = useLiveQuery(() => db.templates.toArray())

  const filtered = useMemo(() => {
    if (!jobs) return []
    return jobs.filter(j => filterTier === 'All' || j.tier === filterTier)
  }, [jobs, filterTier])

  // Weekly targets (from Week 3)
  const weeklyTargets = {
    referralAsks: { target: 10, done: jobs?.filter(j => j.status === 'Referral asked').length ?? 0 },
    applications: { target: 10, done: jobs?.filter(j => j.status !== 'Wishlist').length ?? 0 },
  }

  return (
    <div className="px-4 py-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Job Tracker</h1>
          <p className="text-xs text-gray-500 mt-0.5">{jobs?.length ?? 0} companies</p>
        </div>
        <button onClick={() => setShowAddJob(true)} className="btn-primary text-xs px-3 py-2">+ Add</button>
      </div>

      {/* Weekly targets */}
      <div className="card p-3 mb-4">
        <p className="section-header mb-2">Weekly Targets (from Wk 3)</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Referral asks', ...weeklyTargets.referralAsks },
            { label: 'Applications', ...weeklyTargets.applications },
          ].map(t => (
            <div key={t.label}>
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{t.label}</span>
                <span>{t.done}/{t.target}</span>
              </div>
              <div className="h-1.5 bg-surface-300 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (t.done / t.target) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View toggle */}
      <div className="flex gap-1.5 mb-4 bg-surface-200 rounded-xl p-1">
        {(['kanban', 'list', 'templates'] as ViewMode[]).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
              ${view === v ? 'bg-brand-500 text-white' : 'text-gray-500'}`}
          >
            {v === 'kanban' ? '📋 Kanban' : v === 'list' ? '📃 List' : '✉️ Templates'}
          </button>
        ))}
      </div>

      {/* Tier filter */}
      {view !== 'templates' && (
        <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
          {(['All', 'A', 'B', 'C', 'Practice'] as (JobTier | 'All')[]).map(t => (
            <button
              key={t}
              onClick={() => setFilterTier(t)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filterTier === t ? 'bg-brand-500 text-white' : 'bg-surface-200 text-gray-500'}`}
            >
              {t === 'All' ? 'All' : `Tier ${t}`}
            </button>
          ))}
        </div>
      )}

      {/* Kanban */}
      {view === 'kanban' && (
        <div className="space-y-4">
          {STATUSES.filter(s => s !== 'Rejected/Closed').map(status => {
            const statusJobs = filtered.filter(j => j.status === status)
            if (!statusJobs.length && status === 'Online assessment') return null
            return (
              <KanbanColumn
                key={status}
                status={status}
                jobs={statusJobs}
                today={today}
              />
            )
          })}
          <KanbanColumn
            status="Rejected/Closed"
            jobs={filtered.filter(j => j.status === 'Rejected/Closed')}
            today={today}
          />
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-2">
          {filtered.map(job => <JobListRow key={job.id} job={job} today={today} />)}
          {!filtered.length && (
            <div className="card p-8 text-center">
              <p className="text-3xl mb-2">💼</p>
              <p className="text-gray-400 text-sm">No jobs found</p>
            </div>
          )}
        </div>
      )}

      {/* Templates */}
      {view === 'templates' && <TemplatesList templates={templates ?? []} />}

      {/* Add Job Modal */}
      {showAddJob && <AddJobModal onClose={() => setShowAddJob(false)} today={today} />}

      <div className="h-8" />
    </div>
  )
}

function KanbanColumn({ status, jobs, today }: { status: JobStatus; jobs: Job[]; today: string }) {
  const [collapsed, setCollapsed] = useState(jobs.length === 0)

  return (
    <div>
      <button
        onClick={() => setCollapsed(s => !s)}
        className="flex items-center gap-2 mb-2 w-full"
      >
        <span className="text-base">{STATUS_ICONS[status]}</span>
        <span className="text-sm font-semibold text-gray-300">{status}</span>
        <span className="badge bg-surface-300 text-gray-500 ml-1">{jobs.length}</span>
        <span className="ml-auto text-gray-600 text-xs">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="grid grid-cols-1 gap-2">
          {jobs.map(job => <JobCard key={job.id} job={job} today={today} />)}
          {jobs.length === 0 && (
            <p className="text-xs text-gray-600 italic px-2 py-3">No companies here yet</p>
          )}
        </div>
      )}
    </div>
  )
}

function JobCard({ job, today }: { job: Job; today: string }) {
  const [expanded, setExpanded] = useState(false)
  const isFollowUpDue = job.nextFollowUp && job.nextFollowUp <= today

  async function moveStatus(newStatus: JobStatus) {
    await db.jobs.update(job.id!, {
      status: newStatus,
      statusHistory: [...(job.statusHistory || []), { status: newStatus, date: today }],
    })
  }

  async function setFollowUp() {
    const nextDate = addDays(today, 6)
    await db.jobs.update(job.id!, { nextFollowUp: nextDate })
  }

  return (
    <div className={`card p-3 ${isFollowUpDue ? 'border-amber-500/30' : ''}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-200">{job.company}</span>
            <span className={TIER_COLORS[job.tier]}>T{job.tier}</span>
            {isFollowUpDue && <span className="badge bg-amber-500/20 text-amber-400">⏰ Follow up</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{job.role}</p>
        </div>
        <button onClick={() => setExpanded(s => !s)} className="text-gray-600 text-xs p-1">
          {expanded ? '▲' : '▼'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 animate-fade-in space-y-2">
          {job.jobLink && (
            <a href={job.jobLink} target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand-400 hover:underline block">{job.jobLink}</a>
          )}
          {job.contactPerson && (
            <p className="text-xs text-gray-400">Contact: {job.contactPerson}</p>
          )}
          {job.dateApplied && (
            <p className="text-xs text-gray-400">Applied: {formatDateShort(job.dateApplied)}</p>
          )}

          {/* Move to next status */}
          <div className="grid grid-cols-2 gap-1.5">
            {STATUSES.filter(s => s !== job.status).slice(0, 4).map(s => (
              <button
                key={s}
                onClick={() => moveStatus(s)}
                className="py-2 rounded-xl text-xs font-medium bg-surface-200 text-gray-400 hover:bg-surface-300 transition-all"
              >
                → {s}
              </button>
            ))}
          </div>

          <button
            onClick={setFollowUp}
            className="w-full py-2 rounded-xl text-xs font-medium bg-amber-500/15 text-amber-400"
          >
            📅 Set follow-up in 6 days
          </button>
        </div>
      )}
    </div>
  )
}

function JobListRow({ job, today }: { job: Job; today: string }) {
  const isFollowUpDue = job.nextFollowUp && job.nextFollowUp <= today

  return (
    <div className={`card p-3 flex items-center gap-3 ${isFollowUpDue ? 'border-amber-500/20' : ''}`}>
      <span className="text-lg">{STATUS_ICONS[job.status]}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">{job.company}</span>
          <span className={TIER_COLORS[job.tier]}>T{job.tier}</span>
        </div>
        <p className="text-xs text-gray-500">{job.status} · {job.role}</p>
      </div>
      {isFollowUpDue && <span className="text-amber-400 text-xs">⏰</span>}
    </div>
  )
}

function TemplatesList({ templates }: { templates: any[] }) {
  const [copied, setCopied] = useState<number | null>(null)
  const [fillVars, setFillVars] = useState<Record<string, string>>({
    Name: '', Company: '', Role: '', Link: '', ReferrerName: ''
  })

  function fillTemplate(body: string): string {
    return body
      .replace(/\{Name\}/g, fillVars.Name || '{Name}')
      .replace(/\{Company\}/g, fillVars.Company || '{Company}')
      .replace(/\{Role\}/g, fillVars.Role || '{Role}')
      .replace(/\{Link\}/g, fillVars.Link || '{Link}')
      .replace(/\{ReferrerName\}/g, fillVars.ReferrerName || '{ReferrerName}')
  }

  function copyTemplate(template: any) {
    const filled = fillTemplate(template.body)
    navigator.clipboard.writeText(filled)
    setCopied(template.id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Fill-in vars */}
      <div className="card p-4">
        <p className="section-header mb-3">Fill in variables</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(fillVars).map(key => (
            <div key={key}>
              <label className="block text-xs text-gray-500 mb-1">{'{' + key + '}'}</label>
              <input
                className="input text-sm py-2"
                placeholder={key}
                value={fillVars[key]}
                onChange={e => setFillVars(v => ({ ...v, [key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Templates */}
      {templates.map(t => (
        <div key={t.id} className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-200">{t.name}</h3>
            <button
              onClick={() => copyTemplate(t)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all
                ${copied === t.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-500/20 text-brand-400'}`}
            >
              {copied === t.id ? '✓ Copied!' : '📋 Copy'}
            </button>
          </div>
          {t.subject && (
            <p className="text-xs text-gray-500 mb-2">
              <strong>Subject:</strong> {fillTemplate(t.subject)}
            </p>
          )}
          <p className="text-xs text-gray-400 bg-surface-200/50 rounded-xl p-3 whitespace-pre-wrap">
            {fillTemplate(t.body)}
          </p>
        </div>
      ))}
    </div>
  )
}

function AddJobModal({ onClose, today }: { onClose: () => void; today: string }) {
  const [form, setForm] = useState({
    company: '', tier: 'B' as JobTier, role: 'Software Engineer',
    jobLink: '', location: 'India', expectedSalaryBand: '',
    source: '', contactPerson: '', contactLinkedIn: '',
  })

  async function save() {
    if (!form.company.trim()) return
    await db.jobs.add({
      ...form,
      dateApplied: null,
      nextFollowUp: null,
      status: 'Wishlist',
      statusHistory: [{ status: 'Wishlist', date: today }],
      notes: '',
      order: Date.now(),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl bg-surface-100 rounded-t-3xl p-5 pb-safe animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Add Company</h2>
          <button onClick={onClose} className="btn-ghost p-2">✕</button>
        </div>
        <div className="space-y-3">
          <input className="input" placeholder="Company *" value={form.company}
            onChange={e => setForm(f => ({ ...f, company: e.target.value }))} autoFocus />
          <div className="grid grid-cols-4 gap-2">
            {(['A', 'B', 'C', 'Practice'] as JobTier[]).map(t => (
              <button key={t} onClick={() => setForm(f => ({ ...f, tier: t }))}
                className={`py-2.5 rounded-xl text-sm font-bold transition-all
                  ${form.tier === t ? 'bg-brand-500 text-white' : 'bg-surface-200 text-gray-500'}`}>
                Tier {t}
              </button>
            ))}
          </div>
          <input className="input" placeholder="Role" value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value }))} />
          <input className="input" placeholder="Job link" value={form.jobLink} type="url"
            onChange={e => setForm(f => ({ ...f, jobLink: e.target.value }))} />
          <input className="input" placeholder="Contact person" value={form.contactPerson}
            onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
          <input className="input" placeholder="Source (referral, LinkedIn...)" value={form.source}
            onChange={e => setForm(f => ({ ...f, source: e.target.value }))} />
          <button onClick={save} className="btn-primary w-full">Add to Wishlist</button>
        </div>
      </div>
    </div>
  )
}
