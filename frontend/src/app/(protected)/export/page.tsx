'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FileOutput, Download, Loader2, Check, Languages } from 'lucide-react'
import { toast } from 'sonner'

export default function ExportPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [versions, setVersions] = useState<any[]>([])
  const [selectedVersion, setSelectedVersion] = useState('')
  const [outputLang, setOutputLang] = useState('en')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      loadVersions()
    }
    checkAuth()
  }, [])

  async function loadVersions() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('resume_versions')
      .select('id, version_name, tailored_for_company, ats_score, status')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setVersions(data || [])
    setLoading(false)
  }

  const handleExport = async () => {
    if (!selectedVersion) { toast.error('Select a version first'); return }
    setExporting(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeVersionId: selectedVersion, outputLanguage: outputLang }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success('Export ready!')
    } catch (e: any) {
      toast.error(e.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <div className="max-w-2xl mx-auto space-y-4"><Skeleton className="h-96 w-full rounded-xl" /></div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">Export Center</h1>
        <p className="text-sm text-zinc-500 mt-1">Download your resume as a PDF</p>
      </div>

      <Card className="bg-zinc-900/80 border-zinc-800">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <FileOutput className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Resume Export</h2>
              <p className="text-xs text-zinc-500">ATS-safe PDF generation</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Select Version</label>
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger><SelectValue placeholder="Choose a version" /></SelectTrigger>
                <SelectContent>
                  {versions.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.version_name || 'Untitled'} {v.tailored_for_company ? `· ${v.tailored_for_company}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Export Language</label>
              <Select value={outputLang} onValueChange={setOutputLang}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English only</SelectItem>
                  <SelectItem value="native">My language only</SelectItem>
                  <SelectItem value="both">Both (2 PDFs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleExport} disabled={exporting || !selectedVersion} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {exporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Download className="h-4 w-4 mr-2" />Export PDF</>}
          </Button>
        </CardContent>
      </Card>

      {versions.length === 0 && (
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileOutput className="h-12 w-12 text-zinc-700 mb-3" />
            <h3 className="text-sm font-medium text-zinc-400">No versions to export</h3>
            <p className="text-xs text-zinc-600 mt-1">Create a version from your vault first.</p>
            <Button asChild className="mt-4 bg-indigo-600 hover:bg-indigo-700">
              <a href="/versions">View Versions</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}