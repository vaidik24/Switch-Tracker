interface CarryOverProps {
  items: Array<{ id: string; label: string; icon: string; mins: number }>
}

export default function CarryOver({ items }: CarryOverProps) {
  if (items.length === 0) return null

  return (
    <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-amber-400 text-sm">⚠️</span>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-amber-500/80">
          Missed yesterday — carry forward?
        </h2>
      </div>
      <div className="space-y-1">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2 text-sm text-amber-200/70">
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-amber-600 mt-2">These were missed yesterday. No shame — just start fresh today.</p>
    </div>
  )
}
