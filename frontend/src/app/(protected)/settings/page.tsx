'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  User, Mail, Globe, Shield, Trash2, Download,
  Loader2, Check, AlertTriangle, Languages
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी (Hindi)' },
]

const OUTPUT_OPTIONS = [
  { value: 'native', label: 'My language only' },
  { value: 'en', label: 'English only' },
  { value: 'both', label: 'Both (downloads two PDFs)' },
]

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const [form, setForm] = useState({
    username: '', email: '', country: 'US', language: 'en',
    input_language: 'en', output_language: 'en', resume_output_language: 'en',
    avatar_url: '', first_name: '', last_name: '',
  })

  const [notifications, setNotifications] = useState({
    weekly_digest: false,
    upgrade_prompts: false,
    job_tips: false,
    all_email: false,
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }

      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setForm({
          username: data.username ?? '',
          email: data.email ?? user.email ?? '',
          country: data.country ?? 'US',
          language: data.language ?? 'en',
          input_language: data.input_language ?? 'en',
          output_language: data.output_language ?? 'en',
          resume_output_language: data.resume_output_language ?? 'en',
          avatar_url: data.avatar_url ?? '',
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
        })
        setNotifications({
          weekly_digest: data.weekly_digest ?? false,
          upgrade_prompts: data.upgrade_prompts ?? false,
          job_tips: data.job_tips ?? false,
          all_email: data.all_email ?? false,
        })
      }
      setLoading(false)
    }
    load()
  }, [router, supabase])

  const handleUsernameBlur = async () => {
    if (!form.username || form.username.length < 3 || form.username === profile?.username) {
      setUsernameAvailable(null)
      return
    }

    setUsernameChecking(true)
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', form.username)
      .maybeSingle()

    setUsernameAvailable(!data)
    setUsernameChecking(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const fileExt = file.name.split('.').pop()
    const fileName = `${profile.id}/${Date.now()}.${fileExt}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      toast.error('Failed to upload avatar')
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName)
    setForm((prev) => ({ ...prev, avatar_url: urlData.publicUrl }))
    toast.success('Avatar updated')
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: form.username,
          first_name: form.first_name,
          last_name: form.last_name,
          country: form.country,
          language: form.language,
          input_language: form.input_language,
          output_language: form.output_language,
          resume_output_language: form.resume_output_language,
          avatar_url: form.avatar_url,
        })
        .eq('id', profile.id)

      if (error) throw error
      toast.success('Settings saved')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationChange = async (
    field: 'weekly_digest' | 'upgrade_prompts' | 'job_tips' | 'all_email',
    value: boolean
  ) => {
    setNotifications((prev) => ({ ...prev, [field]: value }))
    await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', profile.id)
  }

  const handleExportData = async () => {
    window.open('/api/user/export', '_blank')
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      })

      if (res.ok) {
        toast.success('Account deleted')
        router.push('/')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Failed to delete account')
      }
    } catch {
      toast.error('Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  const handleChangePassword = async () => {
    const newPassword = (document.getElementById('new-password') as HTMLInputElement)?.value
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Password updated')
      ;(document.getElementById('new-password') as HTMLInputElement).value = ''
    }
  }

  if (loading) return <div className="space-y-4 max-w-2xl"><Skeleton className="h-96" /></div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={form.avatar_url} />
              <AvatarFallback>{form.first_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <label className="text-sm font-medium">Profile Picture</label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="max-w-xs mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">First Name</label>
              <Input
                value={form.first_name}
                onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Last Name</label>
              <Input
                value={form.last_name}
                onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Username</label>
              <div className="flex gap-2">
                <Input
                  value={form.username}
                  onChange={e => {
                    setForm(p => ({ ...p, username: e.target.value }))
                    setUsernameAvailable(null)
                  }}
                  onBlur={handleUsernameBlur}
                  className={
                    usernameAvailable === false
                      ? 'border-red-500'
                      : usernameAvailable === true
                        ? 'border-green-500'
                        : ''
                  }
                />
                {usernameChecking && (
                  <span className="self-center text-sm text-muted-foreground">Checking...</span>
                )}
                {usernameAvailable === false && (
                  <span className="self-center text-sm text-red-500">Taken</span>
                )}
                {usernameAvailable === true && (
                  <span className="self-center text-sm text-green-500">Available</span>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Email</label>
              <Input value={form.email} disabled className="opacity-60" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Country</label>
            <Select value={form.country} onValueChange={v => setForm(p => ({ ...p, country: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="IN">India</SelectItem>
                <SelectItem value="UK">United Kingdom</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Language Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="h-4 w-4" /> Language Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            CraftlyCV processes everything in English under the hood for accurate ATS scoring. Choose how you want to interact with the product.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Resume language</label>
              <p className="text-xs text-muted-foreground">What language do you write in?</p>
              <Select value={form.input_language} onValueChange={v => setForm(p => ({ ...p, input_language: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Feedback language</label>
              <p className="text-xs text-muted-foreground">Show tips in...</p>
              <Select value={form.output_language} onValueChange={v => setForm(p => ({ ...p, output_language: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Export language</label>
              <p className="text-xs text-muted-foreground">Download resume as...</p>
              <Select value={form.resume_output_language} onValueChange={v => setForm(p => ({ ...p, resume_output_language: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OUTPUT_OPTIONS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Weekly Digest</label>
              <p className="text-xs text-muted-foreground">Weekly summary of your job search progress</p>
            </div>
            <Switch
              checked={notifications.weekly_digest}
              onCheckedChange={v => handleNotificationChange('weekly_digest', v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Upgrade Prompts</label>
              <p className="text-xs text-muted-foreground">Get notified when you could benefit from premium</p>
            </div>
            <Switch
              checked={notifications.upgrade_prompts}
              onCheckedChange={v => handleNotificationChange('upgrade_prompts', v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Job Tips</label>
              <p className="text-xs text-muted-foreground">Weekly tips on resume optimization</p>
            </div>
            <Switch
              checked={notifications.job_tips}
              onCheckedChange={v => handleNotificationChange('job_tips', v)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">All Email Communications</label>
              <p className="text-xs text-muted-foreground">Master toggle for all email notifications</p>
            </div>
            <Switch
              checked={notifications.all_email}
              onCheckedChange={v => handleNotificationChange('all_email', v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Change Password</label>
            <div className="flex gap-2">
              <Input
                id="new-password"
                type="password"
                placeholder="New password (min 8 characters)"
                className="max-w-xs"
              />
              <Button variant="outline" onClick={handleChangePassword}>
                Update Password
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Privacy Center</label>
              <p className="text-xs text-muted-foreground">Review our data practices</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/settings/privacy">View Privacy</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plan Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Current Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="outline" className="text-base px-3 py-1">{profile?.plan?.replace('_', ' ').toUpperCase()}</Badge>
              <p className="text-sm text-muted-foreground mt-1">{profile?.scans} scans remaining</p>
            </div>
            <Button variant="outline" asChild><a href="/billing">Manage Plan</a></Button>
          </div>
        </CardContent>
      </Card>

      {/* Data */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4" /> Your Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Download all your data as JSON. Export available once per 24 hours.</p>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />Export All Data
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-4 w-4" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all data. This cannot be undone.</p>
          <Button variant="destructive" onClick={() => setShowDelete(true)}>
            <Trash2 className="h-4 w-4 mr-2" />Delete Account
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account?</DialogTitle>
            <DialogDescription>
              This will permanently delete all your data including resumes, versions, analyses, and applications.
              Payment transactions will be retained for accounting purposes.
              <br /><br />
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              {deleting ? 'Deleting...' : 'Yes, Delete Everything'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
