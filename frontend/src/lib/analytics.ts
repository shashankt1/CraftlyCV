// Analytics event tracking — fire and forget

export function track(event: string, properties?: Record<string, any>): void {
  // Fire and forget — never await, never block UI
  if (typeof window === 'undefined') return

  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, properties }),
  }).catch(() => {
    // Silently fail — never interrupt user
  })
}
