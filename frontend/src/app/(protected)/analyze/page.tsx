'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Target, AlertTriangle, Sparkles, ArrowRight, Loader2,
  CheckCircle2, XCircle, AlertCircle, Plus
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const NICHE_OPTIONS = [
  { value: 'general', label: 'General Professional' },
  { value: 'cybersecurity', label: 'Cybersecurity' },
  { value: 'nursing', label: 'Nursing / Healthcare' },
  { value: 'skilled_trades', label: 'Skilled Trades' },
  { value: 'creative_tech', label: 'Creative Tech / Game Dev' },
]

interface AnalysisResult {
  overallScore: number
  keywordMatchScore: number
  skillsMatchScore: number
  matchedKeywords: string[]
  missingKeywords: string[]
  skillGaps: string[]
  proofGaps: string[]
  atsRiskScore: number
  atsWarnings: string[]
  improvementSuggestions: string[]
}

export default function AnalyzePage() {
  const router = useRouter()
  const supabase = createClient()
  const [jd, setJd] = useState('')
  const [niche, setNiche] = useState('general')
  const [masterId, setMasterId] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: resumes } = await supabase
        .from('master_resumes')
        .select('id, full_name, primary_niche')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .single()

      if (resumes) {
        setMasterId(resumes.id)
        if (resumes.primary_niche) setNiche(resumes.primary_niche)
      }
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const handleAnalyze = async () => {
    if (!masterId) { toast.error('Create a master resume first'); router.push('/vault'); return }
    if (jd.length < 100) { toast.error('Paste a longer job description (100+ chars)'); return }

    setAnalyzing(true)
    setResult(null)

    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterResumeId: masterId, jobDescription: jd, niche }),
      })

      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.message || json.error || 'Analysis failed')
        return
      }

      setResult(json.data)

      // Save report
      await fetch('/api/match/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterResumeId: masterId,
          overallScore: json.data.overallScore,
          keywordMatchScore: json.data.keywordMatchScore,
          skillsMatchScore: json.data.skillsMatchScore,
          matchedKeywords: json.data.matchedKeywords,
          missingKeywords: json.data.missingKeywords,
          skillGaps: json.data.skillGaps,
          proofGaps: json.data.proofGaps,
          atsRiskScore: json.data.atsRiskScore,
          atsWarnings: json.data.atsWarnings,
          improvementSuggestions: json.data.improvementSuggestions,
          jobTitle: '',
          jobDescription: jd.slice(0, 500),
        }),
      })
    } catch (err) {
      console.error('Analysis failed:', err)
      toast.error('Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return <div className="space-y-4 max-w-3xl"><Skeleton className="h-96" /></div>
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Match Analyzer</h1>
        <p className="text-sm text-muted-foreground">Paste a job description to see how your resume matches</p>
      </div>

      {/* Input Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" /> Job Description
          </CardTitle>
          <CardDescription>Paste the full job description for best results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Niche</label>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NICHE_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            placeholder="Paste job description here (100+ characters)..."
            rows={10}
            className="min-h-[200px] text-sm"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{jd.length} characters</span>
            <Button onClick={handleAnalyze} disabled={analyzing || jd.length < 100} size="lg">
              {analyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing...</> : <><Target className="h-4 w-4 mr-2" />Analyze Match</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Score Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ResultCard
              label="Overall Match"
              value={result.overallScore}
              suffix="%"
              icon={<Target className="h-5 w-5" />}
              color={result.overallScore >= 70 ? 'green' : result.overallScore >= 50 ? 'amber' : 'red'}
              description={result.overallScore >= 70 ? 'Strong match' : result.overallScore >= 50 ? 'Moderate match' : 'Weak match'}
            />
            <ResultCard
              label="ATS Risk"
              value={result.atsRiskScore}
              suffix="/100"
              icon={<AlertTriangle className="h-5 w-5" />}
              color={result.atsRiskScore <= 25 ? 'green' : result.atsRiskScore <= 50 ? 'amber' : 'red'}
              description={result.atsRiskScore <= 25 ? 'Low risk' : result.atsRiskScore <= 50 ? 'Moderate risk' : 'High risk'}
              invertColor
            />
            <ResultCard
              label="Skills Match"
              value={result.skillsMatchScore}
              suffix="%"
              icon={<CheckCircle2 className="h-5 w-5" />}
              color={result.skillsMatchScore >= 70 ? 'green' : result.skillsMatchScore >= 50 ? 'amber' : 'red'}
            />
          </div>

          {/* Keywords Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" /> Matched Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.matchedKeywords?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.matchedKeywords.slice(0, 15).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No matches found</p>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" /> Missing Keywords
                </CardTitle>
              </CardHeader>
              <CardContent>
                {result.missingKeywords?.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {result.missingKeywords.slice(0, 10).map((kw, i) => (
                      <Badge key={i} variant="outline" className="text-xs border-red-200 text-red-600 dark:text-red-400">{kw}</Badge>
                    ))}
                  </div>
                ) : <p className="text-sm text-green-600 dark:text-green-400">All important keywords covered</p>}
              </CardContent>
            </Card>
          </div>

          {/* ATS Warnings */}
          {result.atsWarnings?.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" /> ATS Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.atsWarnings.map((w: string, i: number) => (
                    <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Proof Gaps */}
          {result.proofGaps?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Proof Gaps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.proofGaps.map((g: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-red-400">−</span>{g}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Improvements */}
          {result.improvementSuggestions?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">How to Improve</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {result.improvementSuggestions.map((s: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-blue-500 font-bold">{i + 1}.</span>{s}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <div className="flex justify-center">
            <Button size="lg" asChild>
              <Link href={`/versions?analyze=true&jd=${encodeURIComponent(jd.slice(0, 200))}&niche=${niche}`}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Tailored Version
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultCard({ label, value, suffix, icon, color, description, invertColor }: {
  label: string; value: number; suffix: string; icon: React.ReactNode
  color: 'green' | 'amber' | 'red'; description?: string; invertColor?: boolean
}) {
  const colorMap = {
    green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
    red: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' },
  }
  const c = colorMap[color]

  return (
    <Card className={`${c.border}`}>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <div className={`p-1.5 rounded-md ${c.bg}`}>{icon}</div>
        </div>
        <div className={`text-3xl font-bold ${c.text}`}>{value}{suffix}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        <Progress value={value} className={`mt-2 h-1 ${c.bg.replace('100', '200')}`} />
      </CardContent>
    </Card>
  )
}
