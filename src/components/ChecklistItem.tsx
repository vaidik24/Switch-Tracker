import { useState } from 'react'

interface ChecklistItemProps {
  id: string
  label: string
  icon: string
  mins: number
  checked: boolean
  onToggle: () => void
  onNote?: (note: string) => void
}

export default function ChecklistItem({
  id, label, icon, mins, checked, onToggle, onNote
}: ChecklistItemProps) {
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')

  return (
    <div
      className={`flex items-start gap-3 py-3 px-1 rounded-xl transition-all duration-200 
        ${checked ? 'opacity-60' : 'hover:bg-white/3'}`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`task-checkbox mt-0.5 ${checked ? 'checked' : ''}`}
        aria-label={`${checked ? 'Uncheck' : 'Check'}: ${label}`}
        id={`checkbox-${id}`}
      >
        {checked && (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-base leading-none flex-shrink-0">{icon}</span>
          <span className={`text-sm font-medium ${checked ? 'line-through text-gray-500' : 'text-gray-200'}`}>
            {label}
          </span>
          <span className="ml-auto text-xs text-gray-600 flex-shrink-0">~{mins}m</span>
        </div>

        {/* Note expand */}
        {onNote && showNote && (
          <textarea
            className="mt-2 w-full text-xs bg-surface-200 rounded-lg px-3 py-2 text-gray-300 placeholder-gray-600 resize-none"
            rows={2}
            placeholder="Add a note..."
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={() => onNote(note)}
            autoFocus
          />
        )}
      </div>

      {/* Note toggle */}
      {onNote && (
        <button
          onClick={() => setShowNote(s => !s)}
          className="text-gray-600 hover:text-gray-400 p-1 rounded-lg transition-colors"
          aria-label="Add note"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
    </div>
  )
}
