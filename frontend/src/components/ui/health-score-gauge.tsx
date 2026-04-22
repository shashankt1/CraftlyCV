-- Resume Health Score Circular Gauge
-- Displays ATS visibility score with pulsing animation when low

import { cn } from '@/lib/utils'

interface HealthScoreGaugeProps {
  score: number // 0-100
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { dimension: 80, stroke: 6, fontSize: 'text-lg' },
  md: { dimension: 160, stroke: 10, fontSize: 'text-4xl' },
  lg: { dimension: 240, stroke: 14, fontSize: 'text-6xl' },
}

export function HealthScoreGauge({ score, size = 'md', className }: HealthScoreGaugeProps) {
  const { dimension, stroke, fontSize } = sizes[size]
  const radius = (dimension - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  const getColor = () => {
    if (score >= 80) return { stroke: '#22c55e', glow: 'green' }
    if (score >= 60) return { stroke: '#eab308', glow: 'yellow' }
    return { stroke: '#ef4444', glow: 'red' }
  }

  const { stroke: color } = getColor()
  const isLow = score < 60

  return (
    <div className={cn('relative flex items-center justify-center', className)}>
      <svg width={dimension} height={dimension} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-800"
        />
        {/* Progress circle */}
        <circle
          cx={dimension / 2}
          cy={dimension / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color}50)` }}
        />
      </svg>

      {/* Pulse animation for low scores */}
      {isLow && (
        <svg className="absolute animate-pulse-ring" width={dimension} height={dimension}>
          <circle
            cx={dimension / 2}
            cy={dimension / 2}
            r={radius}
            fill="none"
            stroke="#ef4444"
            strokeWidth={stroke / 2}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            opacity="0.4"
          />
        </svg>
      )}

      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn(fontSize, 'font-black text-white')}>{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-slate-400">Health</span>
      </div>
    </div>
  )
}

export default HealthScoreGauge