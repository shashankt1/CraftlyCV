import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    const body = await request.json()
    const { skills, target_role, niche, experience_level } = body

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return NextResponse.json({ error: 'Skills are required' }, { status: 400 })
    }

    const profile = await supabase.from('profiles').select('plan').eq('id', user.id).single()
    const isPro = ['pro', 'lifetime'].includes(profile.data?.plan)

    // Check cache
    const { data: cached } = await supabase
      .from('career_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (cached && cached.created_at && (Date.now() - new Date(cached.created_at).getTime() < 86400000)) {
      return NextResponse.json({ success: true, data: cached.data })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const prompt = `You are a career intelligence advisor. Based on the following user profile, provide personalized career path recommendations.

User Profile:
- Skills: ${skills.join(', ')}
- Target Role: ${target_role || 'Not specified'}
- Niche: ${niche || 'Software'}
- Experience Level: ${experience_level || 'mid'}

Return ONLY valid JSON with this exact structure — no markdown, no explanation:
{
  "adjacent_roles": [
    {
      "role": "Role Name",
      "match_percentage": 75-90,
      "skill_gaps": ["skill1", "skill2"]
    }
  ],
  "skill_monetization": [
    {
      "title": "Freelance on Toptal",
      "icon": "DollarSign",
      "description": "Your React skills can earn $40-80/hr on Toptal. Average client value $3-5k/project.",
      "platform": "Toptal / Upwork",
      "salary_impact": "$40-80/hr",
      "cost": "Free to join"
    }
  ],
  "upskill_paths": [
    {
      "title": "AWS Solutions Architect",
      "platform": "AWS Training",
      "salary_impact": "+$15k avg",
      "cost": "$300",
      "url": "https://aws.amazon.com/certification/"
    }
  ],
  "bridge_opportunities": [
    {
      "title": "Contract Frontend Engineer",
      "icon": "Briefcase",
      "description": "Short-term contracts that keep income flowing while you search for your ideal role. Check remote.co or flexjobs.",
      "platform": "Remote.co / Flexjobs"
    }
  ]
}

CRITICAL REQUIREMENTS:
- adjacent_roles: Find exactly 3-4 roles where the user is 70-90% qualified based on their skills. Be specific and realistic.
- skill_monetization: Always include at least 2 freelance platforms and their expected rates based on the skills provided.
- upskill_paths: Rank by salary ROI. Include realistic costs and salary impact numbers.
- bridge_opportunities: Always include contract/part-time roles that can bridge income gaps.
- DO NOT use "earn money online" language. Frame everything as career growth and professional development.
- If the user has software skills, reference specific platforms and rate ranges.
- If the user has healthcare/nursing skills, reference travel nursing, per diem, and agency rates.
- Keep all descriptions practical and grounded in real market data.`

    const msg = await client.messages.create({
      model: 'claude-sonnet-4-7',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }]
    })

    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const data = JSON.parse(rawText.trim())

    // Cache result
    await supabase.from('career_recommendations').upsert({
      user_id: user.id,
      data,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('career paths error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}