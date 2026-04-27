import { ImageResponse } from '@vercel/og';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } }
) {
  const { shareId } = params;

  const supabase = createClient();

  const { data: analysis } = await supabase
    .from('resume_analyses')
    .select(
      'candidate_name, ats_score, keyword_score, formatting_score, readability_score, key_matches, missing_keywords, analyzed_at'
    )
    .eq('share_id', shareId)
    .single();

  if (!analysis) {
    return new NextResponse('Analysis not found', { status: 404 });
  }

  const {
    candidate_name,
    ats_score,
    keyword_score,
    formatting_score,
    readability_score,
    key_matches = [],
    missing_keywords = [],
    analyzed_at,
  } = analysis;

  const score = ats_score || 0;
  const analyzedDate = new Date(analyzed_at);
  const monthYear = analyzedDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const html = `
    <div style="width: 1200px; height: 630px; background: #0e0e0f; display: flex; flex-direction: column; padding: 48px; box-sizing: border-box; font-family: system-ui, -apple-system, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
        <div style="display: flex; flex-direction: column;">
          <span style="font-size: 32px; font-weight: 700; color: white; letter-spacing: -1px;">CraftlyCV</span>
          <span style="font-size: 18px; color: #a1a1aa; margin-top: 8px;">ATS Compatibility Report</span>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 24px; font-weight: 600; color: #e4e4e7;">${candidate_name || 'Candidate'}</span>
        </div>
      </div>

      <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 40px;">
        <div style="width: 180px; height: 180px; border-radius: 50%; background: conic-gradient(from 180deg, #6366f1 0deg, #8b5cf6 180deg, #0e0e0f 180deg); display: flex; align-items: center; justify-content: center; position: relative;">
          <div style="width: 150px; height: 150px; border-radius: 50%; background: #0e0e0f; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 56px; font-weight: 800; color: white;">${score}</span>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 32px; margin-bottom: 32px;">
        <div style="flex: 1; background: #18181b; border-radius: 12px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #a1a1aa; font-size: 14px;">Keywords</span>
            <span style="color: white; font-weight: 600;">${keyword_score || 0}%</span>
          </div>
          <div style="height: 8px; background: #27272a; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${keyword_score || 0}%; background: #22c55e;"></div>
          </div>
        </div>

        <div style="flex: 1; background: #18181b; border-radius: 12px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #a1a1aa; font-size: 14px;">Formatting</span>
            <span style="color: white; font-weight: 600;">${formatting_score || 0}%</span>
          </div>
          <div style="height: 8px; background: #27272a; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${formatting_score || 0}%; background: #3b82f6;"></div>
          </div>
        </div>

        <div style="flex: 1; background: #18181b; border-radius: 12px; padding: 20px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
            <span style="color: #a1a1aa; font-size: 14px;">Readability</span>
            <span style="color: white; font-weight: 600;">${readability_score || 0}%</span>
          </div>
          <div style="height: 8px; background: #27272a; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${readability_score || 0}%; background: #a855f7;"></div>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 24px; margin-bottom: 32px;">
        <div style="flex: 1;">
          <span style="color: #a1a1aa; font-size: 14px; display: block; margin-bottom: 12px;">Key Matches</span>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${(key_matches as string[]).slice(0, 8).map((kw: string) => `
              <span style="background: #166534; color: #bbf7d0; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">${kw}</span>
            `).join('')}
          </div>
        </div>

        <div style="flex: 1;">
          <span style="color: #a1a1aa; font-size: 14px; display: block; margin-bottom: 12px;">Missing Keywords</span>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${(missing_keywords as string[]).slice(0, 8).map((kw: string) => `
              <span style="background: #92400e; color: #fde68a; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 500;">${kw}</span>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 24px; border-top: 1px solid #27272a;">
        <span style="color: #52525b; font-size: 16px;">craftlycv.in</span>
        <span style="color: #52525b; font-size: 16px;">Analyzed ${monthYear}</span>
      </div>
    </div>
  `;

  return new ImageResponse(
    (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
        }}
      />
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
