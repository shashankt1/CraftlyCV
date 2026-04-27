'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileText, Check, Loader2, ArrowRight, Sparkles, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { PLANS, type PlanId } from '@/lib/plans'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English', native: 'English', flag: '🇬🇧' },
  { value: 'hi', label: 'हिंदी', native: 'Hindi', flag: '🇮🇳' },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('free')
  const [username, setUsername] = useState('')
  const [inputLang, setInputLang] = useState('en')
  const [outputLang, setOutputLang] = useState('en')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth'); return }
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()
      if (profile?.onboarding_completed === true) router.push('/dashboard')
      const emailPrefix = user.email?.split('@')[0] || ''
      setUsername(emailPrefix.replace(/[^a-z0-9]/gi, '').toLowerCase())
    }
    checkAuth()
  }, [router, supabase])

  const handleComplete = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: username.toLowerCase(),
          plan: selectedPlan,
          onboarding_completed: true,
          onboarding_step: 2,
          input_language: inputLang,
          output_language: outputLang,
          resume_output_language: 'en',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)

      if (error) {
        if (error.code === '23505') {
          toast.error('Username is already taken. Please choose another.')
        } else {
          toast.error('Something went wrong. Please try again.')
          console.error('Onboarding error:', error)
        }
        setLoading(false)
        return
      }

      toast.success('Welcome to CraftlyCV! You have 10 free scans.')
      if (selectedPlan !== 'free') router.push('/billing')
      else router.push('/dashboard')
    } catch (err) {
      toast.error('Something went wrong')
      setLoading(false)
    }
  }

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
          <div className="flex items-center space-x-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
            <div className={`w-8 h-1 ${step >= 1.5 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1.5 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
            <div className={`w-8 h-1 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>3</div>
          </div>
        </div>

        {/* STEP 1: Plan selection */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Which plan interests you?</h1>
              <p className="text-muted-foreground">You'll start with 10 free scans. Upgrade anytime.</p>
            </div>
            <RadioGroup value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanId)} className="grid md:grid-cols-2 gap-4">
              {Object.values(PLANS).map((plan) => (
                <div key={plan.id}>
                  <RadioGroupItem value={plan.id} id={plan.id} className="peer sr-only" />
                  <Label htmlFor={plan.id} className="flex flex-col h-full p-6 border-2 rounded-lg cursor-pointer hover:border-blue-200 peer-data-[state=checked]:border-blue-600 peer-data-[state=checked]:bg-blue-50 dark:peer-data-[state=checked]:bg-blue-950 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-lg">{plan.name}</span>
                      {'popular' in plan && plan.popular && <Badge>Popular</Badge>}
                    </div>
                    <div className="text-2xl font-bold mb-1">
                      {plan.price === 0 ? 'Free' : `$${plan.price}`}
                      {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground"> one-time</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                    <ul className="space-y-2 text-sm">
                      {plan.features.slice(0, 4).map((feature, i) => (
                        <li key={i} className="flex items-center">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />{feature}
                        </li>
                      ))}
                    </ul>
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <div className="flex justify-center">
              <Button size="lg" onClick={() => setStep(1.5)}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
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
              <p className="text-muted-foreground">CraftlyCV works in your language. Choose what you prefer.</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">What language do you write your resume in?</CardTitle>
                <CardDescription>This helps us process your content correctly for ATS scoring.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {LANGUAGE_OPTIONS.map(lang => (
                  <button
                    key={lang.value}
                    onClick={() => setInputLang(lang.value)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${inputLang === lang.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50' : 'border-white/8 hover:border-white/15'}`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div>
                      <p className="text-sm font-bold text-white">{lang.label}</p>
                      <p className="text-xs text-white/40">{lang.native}</p>
                    </div>
                    {inputLang === lang.value && <Check className="h-5 w-5 text-blue-500 ml-auto" />}
                  </button>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button size="lg" onClick={() => setStep(2)}>Continue <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {/* STEP 2: Username */}
        {step === 2 && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Choose Your Username</h1>
              <p className="text-muted-foreground">This will be your public profile URL</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Profile URL</CardTitle>
                <CardDescription>craftlycv.in/u/{username || 'yourname'}</CardDescription>
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
                  />
                  <p className="text-xs text-muted-foreground">Only letters and numbers, max 20 characters</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Your Starter Pack</span>
                  </div>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✓ 10 free scans to get started</li>
                    <li>✓ ATS Resume Analyzer access</li>
                    <li>✓ Resume Tailoring Engine</li>
                    {selectedPlan !== 'free' && <li className="text-blue-600">✓ Redirecting to {PLANS[selectedPlan].name} upgrade</li>}
                  </ul>
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1.5)}>Back</Button>
              <Button onClick={handleComplete} disabled={loading || !username}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...</> : 'Complete Setup'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
