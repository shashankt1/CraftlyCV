'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Sparkles, ExternalLink, Zap, TrendingUp, Target, Check } from 'lucide-react'
import { useAppStore, type GigOpportunity } from '@/lib/store'

interface GigMatcherProps {
  className?: string
}

export function GigMatcher({ className }: GigMatcherProps) {
  const { gigs, setGigs, resume } = useAppStore()
  const [loading, setLoading] = useState(false)
  const [skillMatch, setSkillMatch] = useState<Record<string, number>>({})

  // Fetch gigs on mount
  useEffect(() => {
    if (gigs.length === 0) {
      fetchGigs()
    }
  }, [])

  const fetchGigs = async () => {
    setLoading(true)
    try {
      // Simulated gig data - in production, call your AI job matching API
      const mockGigs: GigOpportunity[] = [
        {
          id: '1',
          title: 'AI/ML Content Reviewer',
          platform: 'outlier',
          rate: '$25-35/hr',
          url: 'https://outlier.ai',
          skills: ['writing', 'ai training', 'english'],
          postedAt: '2 hours ago',
          relevanceScore: 85
        },
        {
          id: '2',
          title: 'Full Stack Developer',
          platform: 'upwork',
          rate: '$40-60/hr',
          url: 'https://upwork.com',
          skills: ['react', 'node', 'typescript', 'python'],
          postedAt: '1 day ago',
          relevanceScore: 72
        },
        {
          id: '3',
          title: 'Technical Writer',
          platform: 'outlier',
          rate: '$20-28/hr',
          url: 'https://outlier.ai',
          skills: ['writing', 'documentation', 'technical'],
          postedAt: '5 hours ago',
          relevanceScore: 90
        },
        {
          id: '4',
          title: 'Data Annotation Specialist',
          platform: 'outlier',
          rate: '$18-22/hr',
          url: 'https://outlier.ai',
          skills: ['attention to detail', 'ai training'],
          postedAt: '3 hours ago',
          relevanceScore: 78
        },
        {
          id: '5',
          title: 'Resume Writer (Tech)',
          platform: 'upwork',
          rate: '$30-45/hr',
          url: 'https://upwork.com',
          skills: ['writing', 'resume', ' ATS'],
          postedAt: '6 hours ago',
          relevanceScore: 95
        },
      ]
      setGigs(mockGigs)

      // Calculate skill match based on resume
      if (resume?.skills) {
        const userSkills = resume.skills.map(s => s.toLowerCase())
        const matchScores: Record<string, number> = {}
        mockGigs.forEach(gig => {
          const matched = gig.skills.filter(s =>
            userSkills.some(us => us.includes(s) || s.includes(us))
          ).length
          matchScores[gig.id] = Math.round((matched / gig.skills.length) * 100)
        })
        setSkillMatch(matchScores)
      }
    } catch (error) {
      console.error('Failed to fetch gigs:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter gigs by relevance
  const topGigs = gigs
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, 3)

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Gig Matcher</h3>
          <Badge className="bg-blue-600 text-white text-xs">AI-Powered</Badge>
        </div>
        <Button variant="ghost" size="sm" className="text-xs" onClick={fetchGigs} disabled={loading}>
          {loading ? 'Updating...' : 'Refresh'}
        </Button>
      </div>

      {topGigs.map((gig) => {
        const matchScore = skillMatch[gig.id] || gig.relevanceScore || 0
        const isGreatMatch = matchScore >= 80

        return (
          <Card
            key={gig.id}
            className={cn(
              'p-4 transition-all hover:scale-[1.02] hover:shadow-lg',
              isGreatMatch && 'border-green-500/50 bg-green-500/5'
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded font-medium',
                    gig.platform === 'outlier'
                      ? 'bg-green-600/20 text-green-400'
                      : 'bg-blue-600/20 text-blue-400'
                  )}>
                    {gig.platform}
                  </span>
                  <span className="text-xs text-slate-500">{gig.postedAt}</span>
                </div>
                <h4 className="font-medium text-base mb-2">{gig.title}</h4>
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg font-bold text-green-400">{gig.rate}</span>
                  <div className="flex items-center space-x-1">
                    <div className={cn(
                      'w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden'
                    )}>
                      <div
                        className={cn(
                          'h-full rounded-full',
                          matchScore >= 80 ? 'bg-green-500' :
                            matchScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        )}
                        style={{ width: `${matchScore}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400">{matchScore}% match</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {gig.skills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className={cn(
                        'text-xs',
                        isGreatMatch && 'bg-green-500/20 text-green-400 border-green-500/30'
                      )}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <a
                href={gig.url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-3"
              >
                <Button size="sm" className={cn(
                  isGreatMatch
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                )}>
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              </a>
            </div>

            {/* Great Match Indicator */}
            {isGreatMatch && (
              <div className="mt-3 flex items-center space-x-2 text-green-400 text-sm">
                <Check className="h-4 w-4" />
                <span>You match {matchScore}% of required skills!</span>
              </div>
            )}
          </Card>
        )
      })}

      {/* CTA */}
      <div className="text-center pt-2">
        <Link href="/income">
          <Button variant="link" className="text-blue-400 text-sm">
            <TrendingUp className="h-4 w-4 mr-1" />
            View all opportunities
          </Button>
        </Link>
      </div>
    </div>
  )
}

// Location-based pricing component
interface PricingByLocationProps {
  basePriceINR?: number
  basePriceUSD?: number
  className?: string
}

export function PricingByLocation({
  basePriceINR = 49,
  basePriceUSD = 5,
  className
}: PricingByLocationProps) {
  const [country, setCountry] = useState<string>('loading')

  useEffect(() => {
    // In production, this would come from your geo-detection middleware
    fetch('/api/geo')
      .then(res => res.json())
      .then(data => setCountry(data.country || 'US'))
      .catch(() => setCountry('US'))
  }, [])

  return (
    <div className={cn('flex items-center justify-center space-x-4 text-sm', className)}>
      <span className="text-slate-400">Regional pricing:</span>
      <Badge variant="outline" className="bg-slate-800 border-slate-700">
        🇮🇳 ₹{basePriceINR}
      </Badge>
      <Badge variant="outline" className="bg-slate-800 border-slate-700">
        🇺🇸 ${basePriceUSD}
      </Badge>
    </div>
  )
}

export default GigMatcher