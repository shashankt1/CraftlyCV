'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from './utils'
import messagesData from './loading-messages.json'

type Context = keyof typeof messagesData

interface LoadingMessageProps {
  context: Context
  className?: string
  iconSize?: number
}

/**
 * Picks a random message from the given context on first render.
 * Cycles to next message every 3 seconds so it feels alive.
 */
export function LoadingMessage({ context, className, iconSize = 20 }: LoadingMessageProps) {
  const [messageIdx, setMessageIdx] = useState(() => Math.floor(Math.random() * messagesData[context].length))

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx(i => (i + 1) % messagesData[context].length)
    }, 3000)
    return () => clearInterval(interval)
  }, [context])

  return (
    <div className={cn('flex items-center gap-3 text-white/50', className)}>
      <Loader2 className={cn('animate-spin text-blue-400')} style={{ width: iconSize, height: iconSize }} />
      <span className="text-sm font-medium text-white/70">
        {messagesData[context][messageIdx]}
      </span>
    </div>
  )
}

export default LoadingMessage