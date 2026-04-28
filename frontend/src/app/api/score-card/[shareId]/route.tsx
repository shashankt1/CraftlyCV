import { NextRequest, NextResponse } from 'next/server'
import { ImageResponse } from '@vercel/og'
import { createAdminClient } from '@/lib/supabase/server'

export const runtime = 'edge'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    const admin = await createAdminClient()
    const { shareId } = await params
    const { data } = await admin
      .from('resume_analyses')
      .select('result, created_at')
      .eq('share_id', shareId)
      .single()

    if (!data) {
      return new NextResponse('Analysis not found', { status: 404 })
    }

    const result = data.result as any
    const score = result?.ats_score ?? 0
    const kwScore = result?.keyword_score ?? 0
    const fmtScore = result?.formatting_score ?? 0
    const rdScore = result?.readability_score ?? 0
    const missing = (result?.missing_keywords ?? []).slice(0, 3) as string[]
    const date = new Date(data.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })

    return new ImageResponse(
      (
        <div
          style={{
            width: '1200px',
            height: '630px',
            background: 'linear-gradient(135deg, #0a0a0f 0%, #111827 100%)',
            display: 'flex',
            flexDirection: 'column',
            padding: '48px',
            fontFamily: 'sans-serif',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #3b82f6, #9333ea)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '20px' }}>📄</span>
            </div>
            <span style={{ fontSize: '22px', fontWeight: 'bold', color: 'white' }}>CraftlyCV</span>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto' }}>ATS Compatibility Report</span>
          </div>

          {/* Score section */}
          <div style={{ display: 'flex', gap: '48px', marginBottom: '32px' }}>
            {/* Score ring */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="90" cy="90" r="72" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
                  <circle
                    cx="90" cy="90" r="72" fill="none"
                    stroke={score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'}
                    strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 72}`}
                    strokeDashoffset={`${2 * Math.PI * 72 * (1 - score / 100)}`}
                  />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '48px', fontWeight: '900', color: 'white' }}>{score}</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '2px' }}>ATS Score</span>
                </div>
              </div>
            </div>

            {/* Sub-scores */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '16px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Keyword Match</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: kwScore >= 80 ? '#22c55e' : '#eab308' }}>{kwScore}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${kwScore}%`, background: kwScore >= 80 ? '#22c55e' : '#eab308', borderRadius: '4px' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Formatting</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: fmtScore >= 80 ? '#22c55e' : '#eab308' }}>{fmtScore}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${fmtScore}%`, background: fmtScore >= 80 ? '#22c55e' : '#eab308', borderRadius: '4px' }} />
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>Readability</span>
                  <span style={{ fontSize: '14px', fontWeight: 'bold', color: rdScore >= 80 ? '#22c55e' : '#eab308' }}>{rdScore}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${rdScore}%`, background: rdScore >= 80 ? '#22c55e' : '#eab308', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Missing keywords */}
          {missing.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '12px', color: '#f87171', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '2px' }}>Top Missing Keywords</p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {missing.map((kw: string) => (
                  <span key={kw} style={{ padding: '4px 12px', borderRadius: '999px', background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', fontSize: '14px', fontWeight: '600' }}>
                    ✗ {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>{date}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>craftlycv.in</span>
              <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.3)' }}>·</span>
              <span style={{ fontSize: '14px', color: '#3b82f6' }}>Get your free ATS score</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (err) {
    console.error('[/api/score-card]', err)
    return new NextResponse('Internal error', { status: 500 })
  }
}
