// CraftlyCV Shared Types

export type PlanId = 'free' | 'career_launch' | 'niche_pro' | 'concierge'

export type ProfessionalTrack =
  | 'general'
  | 'cybersecurity'
  | 'nursing'
  | 'skilled_trades'
  | 'creative_tech'

export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'executive'

export type VersionStatus = 'draft' | 'ready' | 'applied'

export type ExportMode = 'ats_safe' | 'creative_premium'

// ─── API Response Shape ────────────────────────────────────────────────────────

export interface APIResponse<T = any> {
  success: true
  data: T
}

export interface APIError {
  success: false
  error: string
  message: string
  details?: any
}

export type APIResult<T = any> = APIResponse<T> | APIError

// ─── Resume Data ────────────────────────────────────────────────────────────────

export interface Experience {
  id?: string
  company: string
  title: string
  startDate: string
  endDate?: string
  current: boolean
  location?: string
  bullets: string[]
}

export interface Education {
  id?: string
  institution: string
  degree: string
  field?: string
  graduationDate?: string
}

export interface MasterResume {
  id?: string
  userId?: string
  fullName: string
  email?: string
  phone?: string
  location?: string
  linkedinUrl?: string
  githubUrl?: string
  websiteUrl?: string
  professionalSummary?: string
  experience: Experience[]
  education: Education[]
  skills: string[]
  certifications?: string[]
  projects?: Array<{ name: string; description: string; url?: string }>
  primaryNiche?: ProfessionalTrack
}

// ─── Match Report ────────────────────────────────────────────────────────────────

export interface MatchReport {
  id: string
  userId: string
  masterResumeId?: string
  tailoredVersionId?: string
  overallScore: number
  keywordMatchScore: number
  skillsMatchScore: number
  experienceMatchScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  skillGaps: string[]
  proofGaps: string[]
  atsRiskScore: number
  atsWarnings: string[]
  improvementSuggestions: string[]
  sectionRelevance: Array<{ section: string; score: number; note: string }>
  jobTitle: string
  companyName: string
  analyzedAt: string
}

// ─── Tailored Version ────────────────────────────────────────────────────────────

export interface TailoredVersion {
  id: string
  userId: string
  masterResumeId: string
  name: string
  targetJobTitle?: string
  targetCompany?: string
  targetJobDescription?: string
  matchScore: number
  atsRiskScore: number
  missingKeywords: string[]
  matchedKeywords: string[]
  status: VersionStatus
  exportMode: ExportMode
  exportedCount: number
  lastExportedAt?: string
  createdAt: string
  updatedAt: string
}
