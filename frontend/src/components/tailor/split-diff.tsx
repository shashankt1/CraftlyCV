'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, AlertCircle, ChevronDown, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface TailoredResult {
  tailored_summary: string
  tailored_experience: Array<{ role: string; company: string; bullets: string[] }>
  tailored_skills: string[]
  added_keywords: Array<{ keyword: string; reason: string }>
  suggested_improvements: Array<{ original: string; improved: string; why: string }>
  ats_score_estimate: number
  version_name: string
}

interface SplitDiffProps {
  original: string
  tailored: TailoredResult
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <div className="border-b border-white/5 last:border-0">
      <button onClick={() => setCollapsed(!collapsed)} className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/3 transition-colors">
        <span className="text-sm font-bold text-white/60 uppercase tracking-widest">{title}</span>
        <ChevronDown className={`h-4 w-4 text-white/30 transition-transform ${collapsed ? '-rotate-90' : ''}`} />
      </button>
      {!collapsed && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

export function SplitDiff({ original, tailored }: SplitDiffProps) {
  const [showOriginal, setShowOriginal] = useState(true)

  return (
    <div className="rounded-2xl border border-white/8 overflow-hidden">
      {/* Header with tabs */}
      <div className="flex border-b border-white/5">
        <button
          onClick={() => setShowOriginal(true)}
          className={`flex-1 px-4 py-3 text-sm font-semibold text-center transition-all ${showOriginal ? 'bg-white/5 text-white border-b-2 border-blue-500' : 'text-white/40 hover:text-white/60'}`}
        >
          Original
        </button>
        <button
          onClick={() => setShowOriginal(false)}
          className={`flex-1 px-4 py-3 text-sm font-semibold text-center transition-all ${!showOriginal ? 'bg-white/5 text-white border-b-2 border-blue-500' : 'text-white/40 hover:text-white/60'}`}
        >
          Tailored
          <Badge className="ml-2 bg-green-500/10 border border-green-500/25 text-green-400 text-[10px] font-bold">
            +{tailored.added_keywords.length} keywords
          </Badge>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 min-h-96">
        {/* ── LEFT: ORIGINAL (dimmed) ── */}
        {showOriginal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-white/5"
          >
            <p className="text-xs text-white/20 uppercase tracking-widest mb-4">Original</p>
            <div className="space-y-4 opacity-40 select-none">
              <div>
                <p className="text-xs font-bold text-white/30 mb-2">Summary</p>
                <p className="text-sm text-white/50 leading-relaxed">{original.slice(0, 300)}...</p>
              </div>
              <div>
                <p className="text-xs font-bold text-white/30 mb-2">Experience</p>
                <div className="space-y-3">
                  {['Senior Software Engineer at TechCorp', 'Software Engineer at StartupXYZ', 'Software Developer at DataSoft'].map((exp, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-sm font-semibold text-white/50">{exp}</p>
                      <ul className="space-y-1">
                        {[1, 2, 3].map(b => (
                          <li key={b} className="text-xs text-white/40 leading-relaxed">
                            • Led development of key features and improved system performance by 30%
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-white/30 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git'].map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-white/5 text-xs text-white/40 border border-white/5">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── RIGHT: TAILORED (highlighted) ── */}
        {!showOriginal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-5 space-y-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <p className="text-xs text-green-400 uppercase tracking-widest">Tailored Output</p>
              <span className="text-xs text-white/20">·</span>
              <p className="text-xs text-white/30">{tailored.version_name}</p>
            </div>

            {/* Summary */}
            <SectionBlock title="Summary">
              <p className="text-sm text-white/80 leading-relaxed">{tailored.tailored_summary}</p>
            </SectionBlock>

            {/* Experience */}
            {tailored.tailored_experience.length > 0 && (
              <SectionBlock title="Experience">
                <div className="space-y-4">
                  {tailored.tailored_experience.map((exp, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-white">{exp.role}</p>
                          <p className="text-xs text-white/40">{exp.company}</p>
                        </div>
                      </div>
                      <ul className="space-y-1.5">
                        {exp.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-white/60">
                            <span className="text-green-400 flex-shrink-0 mt-0.5">→</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </SectionBlock>
            )}

            {/* Skills */}
            {tailored.tailored_skills.length > 0 && (
              <SectionBlock title="Skills">
                <div className="flex flex-wrap gap-2">
                  {tailored.tailored_skills.map(s => (
                    <span key={s} className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/25 text-xs text-green-400 font-medium">{s}</span>
                  ))}
                </div>
              </SectionBlock>
            )}

            {/* Keywords added summary */}
            {tailored.added_keywords.length > 0 && (
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/15">
                <p className="text-xs text-green-400 font-bold mb-3 uppercase tracking-widest">Keywords Added by AI</p>
                <div className="flex flex-wrap gap-2">
                  {tailored.added_keywords.map((kw, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/25 text-xs text-green-300 font-semibold">+{kw.keyword}</span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
