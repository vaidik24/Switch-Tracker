import type { Job } from '../db/db'
import { formatDateShort } from '../lib/dates'
import { useNavigate } from 'react-router-dom'

interface JobActionsProps {
  jobs: Job[]
}

export default function JobActions({ jobs }: JobActionsProps) {
  const navigate = useNavigate()

  return (
    <div className="card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="section-header mb-0">Job Actions Due</h2>
        <span className="badge bg-red-500/20 text-red-400">{jobs.length}</span>
      </div>

      <div className="space-y-2">
        {jobs.slice(0, 3).map(job => (
          <div key={job.id} className="flex items-center gap-3 py-2 px-3 bg-surface-200/60 rounded-xl">
            <span className="text-lg">
              {job.status === 'Referral asked' ? '🤝'
                : job.status === 'Applied' ? '📨'
                : job.status === 'Interviewing' ? '💬'
                : '📋'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{job.company}</p>
              <p className="text-xs text-gray-500">
                Follow up · Due {job.nextFollowUp ? formatDateShort(job.nextFollowUp) : 'today'}
              </p>
            </div>
            <button
              onClick={() => navigate('/jobs')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex-shrink-0"
            >
              View →
            </button>
          </div>
        ))}

        {jobs.length > 3 && (
          <button
            onClick={() => navigate('/jobs')}
            className="w-full text-xs text-brand-400 hover:text-brand-300 py-2 text-center"
          >
            +{jobs.length - 3} more job actions →
          </button>
        )}
      </div>
    </div>
  )
}
