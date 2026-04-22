'use client'

import { cn } from '@/lib/utils'

interface ResumeHeatmapProps {
  score: number
  weakSections?: string[]
  className?: string
}

const SECTION_WEIGHTS = {
  'Contact Info': 5,
  'Summary': 15,
  'Experience': 30,
  'Education': 10,
  'Skills': 20,
  'Projects': 10,
  'Achievements': 10,
}

const DEFAULT_WEAK = ['Experience', 'Skills', 'Achievements']

export function ResumeHeatmap({ score, weakSections = DEFAULT_WEAK, className }: ResumeHeatmapProps) {
  const getHeatColor = (section: string) => {
    if (weakSections.includes(section)) {
      return 'bg-red-500/20 border-red-500/50'
    }
    return 'bg-green-500/20 border-green-500/50'
  }

  const getHeatGlow = (section: string) => {
    if (weakSections.includes(section)) {
      return 'shadow-red-500/20'
    }
    return 'shadow-green-500/20'
  }

  return (
    <div className={cn('bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50', className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Resume Heatmap</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-400">ATS Visibility</span>
          <span className={cn(
            'text-2xl font-bold',
            score >= 70 ? 'text-green-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'
          )}>
            {score}%
          </span>
        </div>
      </div>

      {/* Visual Heat Bars */}
      <div className="space-y-4">
        {Object.entries(SECTION_WEIGHTS).map(([section, weight]) => {
          const isWeak = weakSections.includes(section)
          return (
            <div key={section} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className={cn(
                    'w-3 h-3 rounded-full',
                    isWeak ? 'bg-red-400 animate-pulse' : 'bg-green-400'
                  )} />
                  <span className="text-sm text-slate-300">{section}</span>
                </div>
                <span className="text-xs text-slate-500">{weight}% weight</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    isWeak
                      ? 'bg-gradient-to-r from-red-600 to-red-400'
                      : 'bg-gradient-to-r from-green-600 to-emerald-400',
                    isWeak && 'animate-breathing-glow'
                  )}
                  style={{ width: isWeak ? '35%' : '85%' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* ATS Warning */}
      {score < 60 && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-sm text-red-400 font-medium">⚠️ Your resume will be filtered out by ATS</p>
          <p className="text-xs text-slate-400 mt-1">Key sections are missing or poorly optimized. Click to fix now.</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center space-x-6 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-400" />
          <span className="text-slate-400">ATS Optimized</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse" />
          <span className="text-slate-400">Needs Attention</span>
        </div>
      </div>
    </div>
  )
}

// Circular Progress Gauge for Resume Health Score
interface HealthScoreGaugeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function HealthScoreGauge({ score, size = 'md', className }: HealthScoreGaugeProps) {
  const dimensions = {
    sm: { size: 80, stroke: 6, fontSize: 'text-lg' },
    md: { size: 160, stroke: 10, fontSize: 'text-4xl' },
    lg: { size: 240, stroke: 14, fontSize: 'text-6xl' },
  }

  const { size: dim, stroke, fontSize } = dimensions[size]
  const radius = (dim - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  const getScoreColor = () => {
    if (score >= 80) return { stroke: '#22c55e', glow: 'green' }
    if (score >= 60) return { stroke: '#eab308', glow: 'yellow' }
    return { stroke: '#ef4444', glow: 'red' }
  }

  const { stroke: scoreColor, glow } = getScoreColor()
  const isLow = score < 60

  return (
    <div className={cn('relative flex items-center justify-center', className)} style={{ width: dim, height: dim }}>
      {/* Background Circle */}
      <svg className="absolute" width={dim} height={dim}>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-800"
        />
      </svg>

      {/* Progress Circle */}
      <svg className="absolute" width={dim} height={dim} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={dim / 2}
          cy={dim / 2}
          r={radius}
          fill="none"
          stroke={scoreColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${scoreColor}50)` }}
        />
      </svg>

      {/* Pulse Ring Animation for Low Scores */}
      {isLow && (
        <svg className="absolute animate-pulse-ring" width={dim} height={dim}>
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke="#ef4444"
            strokeWidth={stroke / 2}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            opacity="0.3"
          />
        </svg>
      )}

      {/* Center Score */}
      <div className="relative z-10 text-center">
        <div className={cn(fontSize, 'font-bold text-white')}>{score}</div>
        <div className="text-xs text-slate-400 uppercase tracking-wider">Health</div>
      </div>

      {/* Glow Effect */}
      {isLow && (
        <div className="absolute inset-0 rounded-full bg-red-500/10 animate-breathing-glow" />
      )}
    </div>
  )
}

export default ResumeHeatmap