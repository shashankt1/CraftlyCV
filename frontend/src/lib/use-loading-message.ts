import { useMemo } from 'react'
import { ats_analyzer, resume_tailoring, resume_vault_upload, pdf_export, dashboard_loading, mock_interview, job_tracker } from './loading-messages'

type Context = keyof typeof messages

const messages = {
  ats_analyzer,
  resume_tailoring,
  resume_vault_upload,
  pdf_export,
  dashboard_loading,
  mock_interview,
  job_tracker,
} as const

/**
 * Returns a random loading message for the given context.
 * Call this inside useMemo or useState if you want to pick once on mount.
 */
export function getRandomMessage(context: Context): string {
  const arr = messages[context]
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * React hook: picks a random message from the given context on mount.
 * Returns the same message for the lifetime of the component (no re-randomization).
 */
export function useLoadingMessage(context: Context): string {
  return useMemo(() => getRandomMessage(context), [context])
}

export type LoadingContext = Context