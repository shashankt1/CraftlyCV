'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  FileOutput, Download, FileText, Loader2, CheckCircle2,
  AlertTriangle, Eye, Shield, Sparkles
} from 'lucide-react'
import { toast } from 'sonner'

interface Version {
  id: string
  name: string
  target_job_title?: string
  target_company?: string
  match_score?: number
  ats_risk_score?: number
  tailored_summary?: string
  tailored_experience?: any[]
  tailored_skills?: string[]
  export_mode: string
  exported_count: number
}

export default function ExportPage() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [exportMode, setExportMode] = useState<'ats_safe' | 'creative_premium'>('ats_safe')
  const [format, setFormat] = useState<'pdf' | 'docx' | 'txt'>('pdf')
  const [exporting, setExporting] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data: vers } = await supabase
        .from('tailored_versions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setVersions(vers ?? [])
      setLoading(false)

      // Pre-select from query param
      const versionId = searchParams.get('version')
      if (versionId && vers) {
        const found = vers.find((v: any) => v.id === versionId)
        if (found) setSelectedVersion(found)
      }
    }
    load()
  }, [router, supabase, searchParams])

  const handleExport = async () => {
    if (!selectedVersion) { toast.error('Select a version first'); return }

    setExporting(true)
    try {
      // Generate export preview (in a real app, this would call an export API)
      await new Promise(r => setTimeout(r, 1000))

      // Update export count
      await supabase
        .from('tailored_versions')
        .update({
          exported_count: (selectedVersion.exported_count || 0) + 1,
          last_exported_at: new Date().toISOString(),
          export_mode: exportMode,
        })
        .eq('id', selectedVersion.id)

      toast.success('Export ready! (Demo mode - PDF would download)')
      setSelectedVersion(prev => prev ? { ...prev, exported_count: (prev.exported_count || 0) + 1 } : null)
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="space-y-4 max-w-3xl"><Skeleton className="h-96" /></div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Export Center</h1>
        <p className="text-sm text-muted-foreground">Download your tailored resumes in ATS-safe or premium formats</p>
      </div>

      {/* Version Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Select Version
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedVersion?.id ?? ''}
            onValueChange={v => {
              const found = versions.find(ver => ver.id === v)
              setSelectedVersion(found ?? null)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a tailored version..." />
            </SelectTrigger>
            <SelectContent>
              {versions.map(v => (
                <SelectItem key={v.id} value={v.id}>
                  <div className="flex items-center gap-2">
                    <span>{v.name}</span>
                    {v.match_score && (
                      <Badge variant="secondary" className="text-xs ml-2">
                        {v.match_score}% match
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedVersion && (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedVersion.name}</p>
                  {selectedVersion.target_job_title && (
                    <p className="text-sm text-muted-foreground">{selectedVersion.target_job_title}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  {selectedVersion.match_score && (
                    <Badge variant={selectedVersion.match_score >= 70 ? 'default' : 'secondary'}>
                      {selectedVersion.match_score}% match
                    </Badge>
                  )}
                  <Badge variant="outline">
                    Exported {selectedVersion.exported_count || 0}x
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      {selectedVersion && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileOutput className="h-4 w-4" /> Export Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Resume Mode</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setExportMode('ats_safe')}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    exportMode === 'ats_safe'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold">ATS-Safe</span>
                    {exportMode === 'ats_safe' && <CheckCircle2 className="h-4 w-4 text-blue-600 ml-auto" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Single-column layout, parser-safe headings. Best for automated screening systems.
                  </p>
                </button>

                <button
                  onClick={() => setExportMode('creative_premium')}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    exportMode === 'creative_premium'
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold">Premium Visual</span>
                    {exportMode === 'creative_premium' && <CheckCircle2 className="h-4 w-4 text-purple-600 ml-auto" />}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Modern dark navy theme, premium typography. Best for human reviewers.
                  </p>
                </button>
              </div>
            </div>

            {/* Format Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">File Format</label>
              <Select value={format} onValueChange={v => setFormat(v as typeof format)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="docx">Word Document (DOCX)</SelectItem>
                  <SelectItem value="txt">Plain Text (TXT)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ATS Warning */}
            {exportMode === 'ats_safe' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-green-800 dark:text-green-200">ATS-Safe Export</p>
                  <p className="text-green-700 dark:text-green-300 text-xs">
                    Your resume will be formatted to pass ATS parsing. No tables, graphics, or complex formatting.
                  </p>
                </div>
              </div>
            )}

            {exportMode === 'creative_premium' && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">Human Review Recommended</p>
                  <p className="text-amber-700 dark:text-amber-300 text-xs">
                    Premium visual format may not parse correctly in automated screening systems.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Export Button */}
      {selectedVersion && (
        <div className="flex justify-center">
          <Button size="lg" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
            ) : (
              <><Download className="h-4 w-4 mr-2" />Export as {format.toUpperCase()}</>
            )}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {versions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileOutput className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No versions to export</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Create and tailor a version first before exporting.
            </p>
            <Button onClick={() => router.push('/versions')}>
              Go to Versions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
