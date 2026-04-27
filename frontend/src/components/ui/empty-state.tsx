import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className ?? ''}`}>
      {icon && <div className="text-muted-foreground mb-3">{icon}</div>}
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
        <span className="text-xl">⚠️</span>
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {message && <p className="text-sm text-muted-foreground max-w-sm mb-4">{message}</p>}
      {onRetry && <Button onClick={onRetry} variant="outline">Try Again</Button>}
    </div>
  )
}

interface LoadingStateProps {
  lines?: number
}

export function LoadingState({ lines = 3 }: LoadingStateProps) {
  return (
    <div className="space-y-3 py-4">
      {[...Array(lines)].map((_, i) => (
        <div key={i} className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }} />
      ))}
    </div>
  )
}
