'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from './utils'

interface LoadingMessageProps {
  context: 'ats_analyzer' | 'resume_tailoring' | 'resume_vault_upload' | 'pdf_export' | 'dashboard_loading' | 'mock_interview' | 'job_tracker'
  className?: string
  iconSize?: number
}

const messages = {
  ats_analyzer: [
    "Teaching the robots to read your resume...",
    "Counting bullets without numbers (there are many)...",
    "Checking if recruiters would swipe right...",
    "Running 47 ATS filters simultaneously...",
    "Comparing you to 10,000 other resumes...",
    "Finding keywords you forgot to include...",
    "Calculating your first-impression score...",
    "Almost done — this part is the scary bit..."
  ],
  resume_tailoring: [
    "Reading the job description like a detective...",
    "Aligning your story with what they want...",
    "Surgically inserting missing keywords...",
    "Making you look like their dream candidate...",
    "Cross-referencing 200 hiring signals...",
    "Rewriting the boring bits...",
    "Polishing your professional narrative...",
    "Almost there — worth the wait, promise..."
  ],
  resume_vault_upload: [
    "Securing your resume in the vault...",
    "Parsing every bullet point carefully...",
    "Extracting your career DNA...",
    "Reading between the lines...",
    "Cataloguing your professional story...",
    "Scanning for hidden strengths...",
    "Building your master profile...",
    "Your vault is almost ready..."
  ],
  pdf_export: [
    "Typesetting like it is 1984...",
    "Making sure nothing breaks on page 2...",
    "ATS-proofing every single character...",
    "Compressing without losing quality...",
    "Final formatting checks in progress...",
    "Adding the finishing touches...",
    "Rendering your career masterpiece...",
    "Download incoming in 3... 2..."
  ],
  dashboard_loading: [
    "Pulling your career snapshot...",
    "Checking what the ATS gods think...",
    "Loading your job search command center...",
    "Counting your wins so far...",
    "Syncing your latest activity...",
    "Your dashboard is waking up...",
    "Fetching everything you need...",
    "Good things take a second..."
  ],
  mock_interview: [
    "Warming up the interview panel...",
    "Loading questions designed to trip you up...",
    "Preparing your toughest interviewer yet...",
    "Calibrating difficulty to your level...",
    "Getting into character as your interviewer...",
    "Reviewing your resume before we start...",
    "Setting the scene — deep breath...",
    "Interview starts in just a moment..."
  ],
  job_tracker: [
    "Checking the status of your applications...",
    "Tracking every recruiter move...",
    "Syncing your job search battlefield...",
    "Loading your pipeline...",
    "Seeing who ghosted you this week...",
    "Counting opportunities in progress...",
    "Updating your application timeline...",
    "Your job map is loading..."
  ],
} as const

/**
 * Picks a random message from the given context on first render.
 * Cycles to next message every 3 seconds so it feels alive.
 */
export function LoadingMessage({ context, className, iconSize = 20 }: LoadingMessageProps) {
  const [messageIdx, setMessageIdx] = useState(() => Math.floor(Math.random() * messages[context].length))

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIdx(i => (i + 1) % messages[context].length)
    }, 3000)
    return () => clearInterval(interval)
  }, [context])

  return (
    <div className={cn('flex items-center gap-3 text-white/50', className)}>
      <Loader2 className={cn('animate-spin text-blue-400', `h-[${iconSize}] w-[${iconSize}]`)} style={{ width: iconSize, height: iconSize }} />
      <span className="text-sm font-medium text-white/70">
        {messages[context][messageIdx]}
      </span>
    </div>
  )
}

export default LoadingMessage