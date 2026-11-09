interface ProgressRingProps {
  percent: number
  size?: number
  strokeWidth?: number
  label?: string
  color?: string
}

export default function ProgressRing({
  percent,
  size = 64,
  strokeWidth = 5,
  label,
  color = '#6366f1',
}: ProgressRingProps) {
  const radius = (size - strokeWidth * 2) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      {label && (
        <span className="absolute text-xs font-bold text-gray-200" style={{ fontSize: size < 50 ? '10px' : '12px' }}>
          {label}
        </span>
      )}
    </div>
  )
}
