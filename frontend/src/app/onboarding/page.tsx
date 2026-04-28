'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileText, Check, Loader2, ArrowRight, Sparkles, Globe, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { PLANS, PLANS_LIST, type PlanId } from '@/lib/plans'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { value: 'hi', label: 'हिंदी', native: 'Hindi', flag: '🇮🇳' },
]

// Username validation
function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' }
  }
  if (username.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' }
  }
  if (!/^[a-z0-9]+$/.test(username)) {
    return { valid: false, error: 'Only letters and numbers allowed' }
  }
  return { valid: true }
}

// Check username availability
async function checkUsernameAvailable(supabase: ReturnType<typeof createClient>, username: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username.toLowerCase())
    .maybeSingle()
  return !data
}

// Fallback profile creation (server-side safe via admin client would be better,
// but since we're in a client component, we use the RPC or direct insert)
async function ensureProfileExists(supabase: ReturnType<typeof createClient>, userId: string, email: string): Promise<{ success: boolean; error?: string }> {
  // Check if profile already exists
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existing) {
    return { success: true }
  }

  // Generate username from email
  const emailPrefix = email?.split('@')[0] || 'user'
  const baseUsername = emailPrefix.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'user'
  let username = baseUsername
  let counter = 0

  // Find available username
  while (true) {
    const available = await checkUsernameAvailable(supabase, username)
    if (available) break
    counter++
    username = `${baseUsername}${counter}`
    if (counter > 1000) {
      username = `user_${userId.slice(0, 8)}`
      break
    }
  }

  // Try to insert profile directly (RLS may block this, but worth trying as fallback)
  const { error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: userId,
      email: email,
      username: username,
      scans: 3,
      plan: 'free',
      role: 'user',
      country: 'US',
      language: 'en',
      currency: 'USD',
      professional_track: 'general',
      experience_level: 'mid',
      onboarding_completed: false,
      onboarding_step: 0,
    })

  if (insertError) {
    // If direct insert fails (likely RLS), try via RPC if it exists
    console.error('Direct profile insert failed:', insertError)
    return { success: false, error: 'Could not create profile. Please try again.' }
  }

  return { success: true }
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('free')
  const [username, setUsername] = useState('')
  const [inputLang, setInputLang] = useState('en')
  const [outputLang, setOutputLang] = useState('en')
  const [loading, setLoading] = useState(false)
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Debounced username check
  const checkUsername = useCallback(async (value: string) => {
    const validation = validateUsername(value)
    if (!validation.valid) {
      setUsernameAvailable(null)
      return
    }

    setUsernameChecking(true)
    const available = await checkUsernameAvailable(supabase, value)
    setUsernameAvailable(available)
    setUsernameChecking(false)
  }, [supabase])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)
      setEmail(user.email || null)

      // Ensure profile exists (fallback if trigger failed)
      const profileResult = await ensureProfileExists(supabase, user.id, user.email || '')
      if (!profileResult.success) {
        toast.error(profileResult.error || 'Failed to initialize profile')
      }

      // Check onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, username')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed === true) {
        router.push('/dashboard')
        return
      }

      // Pre-fill username from email if no username set
      if (!profile?.username) {
        const emailPrefix = user.email?.split('@')[0] || ''
        setUsername(emailPrefix.replace(/[^a-z0-9]/gi, '').toLowerCase())
      } else {
        setUsername(profile.username)
      }
    }
    checkAuth()
  }, [router, supabase])

  // Check username on change (debounced via useCallback)
  useEffect(() => {
    if (username && username.length >= 3) {
      const timer = setTimeout(() => checkUsername(username), 300)
      return () => clearTimeout(timer)
    }
  }, [username, checkUsername])

  const handleComplete = async () => {
    if (!userId) return

    // Validate username
    const validation = validateUsername(username)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    // Double-check username availability before submitting
    if (usernameAvailable === false) {
      toast.error('Username is already taken. Please choose another.')
      return
    }

    setLoading(true)

    try {
      // Final availability check
      const available = await checkUsernameAvailable(supabase, username)
      if (!available) {
        toast.error('Username is already taken. Please choose another.')
        setLoading(false)
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.toLowerCase(),
          plan: selectedPlan,
          onboarding_completed: true,
          onboarding_step: 2,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        if (error.code === '23505') {
          toast.error('Username is already taken. Please choose another.')
        } else if (error.code === '42501') {
          toast.error('Permission denied. Please sign out and sign in again.')
        } else {
          toast.error(`Update failed: ${error.message}`)
          console.error('Onboarding error:', error)
        }
        setLoading(false)
        return
      }

      toast.success('Welcome to CraftlyCV! You have 3 free scans to get started.')
      if (selectedPlan !== 'free') {
        router.push('/billing')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Onboarding error:', err)
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const usernameValidation = validateUsername(username)
  const canProceedStep2 = username.length >= 3 && usernameValidation.valid && !usernameChecking && (usernameAvailable === true || usernameAvailable === null)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <nav className="border-b bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 h-16">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold">CraftlyCV</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">

        {/* Progress */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((s, i) => (
              <div key={s} className="flex items-center space-x-2">
                {i > 0 && (
                  <div className={`w-8 h-1 rounded ${step > i ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s + (i === 1 ? 0.5 : 0)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}>
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: Plan selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Which plan interests you?</h1>
              <p className="text-muted-foreground">Start with 3 free scans. Upgrade anytime.</p>
            </div>

            <RadioGroup
              value={selectedPlan}
              onValueChange={(v) => setSelectedPlan(v as PlanId)}
              className="grid md:grid-cols-2 gap-4"
            >
              {PLANS_LIST.map((plan) => (
                <div key={plan.id}>
                  <RadioGroupItem value={plan.id} id={plan.id} className="peer sr-only" />
                  <Label
                    htmlFor={plan.id}
                    className="flex flex-col h-full p-6 border-2 rounded-lg cursor-pointer hover:border-blue-200 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-950 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">{plan.name}</span>
                      {plan.popular && <Badge>Popular</Badge>}
                      {plan.badge && !plan.popular && (
                        <Badge variant="outline" className="text-amber-500 border-amber-500 text-xs">
                          {plan.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xl font-bold mb-1 text-blue-600">
                      {plan.priceLabel}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    <ul className="space-y-2 text-sm">
                      {plan.features.slice(0, 4).map((feature: string, i: number) => (
                        <li key={i} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <div className="flex justify-center">
              <Button size="lg" onClick={() => setStep(1.5)}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1.5: Language preference */}
        {step === 1.5 && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
                  <Globe className="h-7 w-7 text-blue-400" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">Your language</h1>
              <p className="text-muted-foreground">CraftlyCV works in your language.</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">What language is your resume in?</CardTitle>
                <CardDescription>Helps us process your content correctly for ATS scoring.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {LANGUAGE_OPTIONS.map(lang => (
                  <button
                    key={lang.value}
                    type="button"
                    onClick={() => setInputLang(lang.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                      inputLang === lang.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50'
                        : 'border-border hover:border-blue-300'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <p className="text-sm font-bold">{lang.label}</p>
                      <p className="text-xs text-muted-foreground">{lang.native}</p>
                    </div>
                    {inputLang === lang.value && (
                      <Check className="h-5 w-5 text-blue-500 ml-auto" />
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button size="lg" onClick={() => setStep(2)}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Username */}
        {step === 2 && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Choose Your Username</h1>
              <p className="text-muted-foreground">Your public profile URL on CraftlyCV</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Profile URL</CardTitle>
                <CardDescription>craftlycv.com/u/{username || 'yourname'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                    placeholder="yourname"
                    maxLength={20}
                    className={usernameAvailable === false ? 'border-red-500' : usernameAvailable === true ? 'border-green-500' : ''}
                  />
                  <div className="flex items-center gap-2">
                    {!usernameValidation.valid && username.length > 0 && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {usernameValidation.error}
                      </p>
                    )}
                    {usernameChecking && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Checking...
                      </p>
                    )}
                    {!usernameChecking && usernameAvailable === true && username.length >= 3 && (
                      <p className="text-xs text-green-500 flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Username available
                      </p>
                    )}
                    {!usernameChecking && usernameAvailable === false && username.length >= 3 && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Username taken
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Letters and numbers only, 3–20 characters
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Your Starter Pack</span>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ 3 free scans to get started</li>
                    <li>✓ ATS Resume Analyzer</li>
                    <li>✓ Resume Tailoring Engine</li>
                    {selectedPlan !== 'free' && (
                      <li className="text-blue-600 font-medium">
                        ✓ Upgrading to {PLANS[selectedPlan].name}
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1.5)}>Back</Button>
              <Button
                onClick={handleComplete}
                disabled={loading || !canProceedStep2}
              >
                {loading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Setting up...</>
                  : 'Complete Setup'
                }
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
