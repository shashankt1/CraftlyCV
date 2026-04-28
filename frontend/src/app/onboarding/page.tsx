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
import { PLANS, PLANS_LIST, type PlanId } from '@/lib/plans'

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
    if (!username || username.length < 3) {
      toast.error('Username must be at least 3 characters.')
      return
    }
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

      toast.success('Welcome to CraftlyCV! You have 3 free scans.')
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
                disabled={loading || !username || username.length < 3}
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