import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/rate-limit'
import { aiRouter } from '@/lib/ai-router'

const IMPROVE_SCAN_COST = 2

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  if (file.type === 'application/pdf') {
    const pdfParse = require('pdf-parse')
    return (await pdfParse(buffer)).text
  }
  const mammoth = require('mammoth')
  return (await mammoth.extractRawText({ buffer })).value
}

async function buildDocx(resumeText: string): Promise<Buffer> {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle } = require('docx')
  const lines = resumeText.split('\n')
  const children: any[] = []
  let nameSet = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { children.push(new Paragraph({ spacing: { after: 80 } })); continue }
    const isHeader = trimmed === trimmed.toUpperCase() && trimmed.length > 2 && !/^\d/.test(trimmed) && !trimmed.includes('@')
    if (!nameSet) {
      children.push(new Paragraph({ children: [new TextRun({ text: trimmed, bold: true, size: 32, color: '1e3a8a' })], alignment: AlignmentType.CENTER, spacing: { after: 120 } }))
      nameSet = true
    } else if (isHeader) {
      children.push(new Paragraph({ children: [new TextRun({ text: trimmed, bold: true, size: 22, color: '1e40af' })], spacing: { before: 240, after: 80 }, border: { bottom: { color: 'bfdbfe', size: 6, style: BorderStyle.SINGLE } } }))
    } else if (/^[-•*]/.test(trimmed)) {
      children.push(new Paragraph({ children: [new TextRun({ text: trimmed.replace(/^[-•*]\s*/, ''), size: 20 })], bullet: { level: 0 }, spacing: { after: 60 } }))
    } else {
      children.push(new Paragraph({ children: [new TextRun({ text: trimmed, size: 20 })], spacing: { after: 60 } }))
    }
  }
  const doc = new Document({ sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } }, children }] })
  return Packer.toBuffer(doc)
}

function buildPdfHtml(resumeText: string): string {
  const lines = resumeText.split('\n')
  let html = ''; let nameSet = false
  for (const line of lines) {
    const t = line.trim()
    if (!t) { html += '<div style="margin:5px 0"></div>'; continue }
    const isHeader = t === t.toUpperCase() && t.length > 2 && !/^\d/.test(t) && !t.includes('@')
    if (!nameSet) {
      html += `<h1 style="text-align:center;color:#1e3a8a;font-size:22px;margin:0 0 8px;font-family:Georgia,serif;font-weight:700">${t}</h1>`; nameSet = true
    } else if (isHeader) {
      html += `<h2 style="color:#1e40af;font-size:12px;font-weight:700;margin:18px 0 4px;padding-bottom:3px;border-bottom:2px solid #bfdbfe;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:.06em">${t}</h2>`
    } else if (/^[-•*]/.test(t)) {
      html += `<div style="display:flex;gap:8px;margin:2px 0;font-size:11px;line-height:1.55;font-family:Arial,sans-serif;color:#374151"><span style="color:#3b82f6;flex-shrink:0;margin-top:1px">▸</span><span>${t.replace(/^[-•*]\s*/, '')}</span></div>`
    } else {
      html += `<p style="margin:2px 0;font-size:11px;line-height:1.55;font-family:Arial,sans-serif;color:#374151">${t}</p>`
    }
  }
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>*{box-sizing:border-box}body{margin:0;padding:36px 44px;background:white;color:#1f2937}@page{margin:0}@media print{body{padding:28px 36px}}</style></head><body>${html}</body></html>`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string
    const improvementsRaw = formData.get('improvements') as string

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 10MB.' }, { status: 400 })
    }

    // ─── RATE LIMITING ───────────────────────────────────────────────────────
    const rateLimit = await checkRateLimit(userId, 'improve', 10, 60)
    if (!rateLimit?.success) return rateLimitExceededResponse(rateLimit.retryAfter || 60)

    const supabase = await createAdminClient()

    // ─── ATOMIC SCAN DEDUCTION ─────────────────────────────────────────────────
    const { data: deductResult, error: deductError } = await supabase
      .rpc('deduct_scan', { p_user_id: userId, p_amount: IMPROVE_SCAN_COST })

    if (deductError) return NextResponse.json({ error: 'Database error' }, { status: 500 })

    const parsedResult = typeof deductResult === 'string' ? JSON.parse(deductResult) : deductResult
    if (!parsedResult.success) {
      const err = parsedResult.error || ''
      if (err === 'Insufficient scans') return NextResponse.json({ error: 'Need 2 scans' }, { status: 402 })
      return NextResponse.json({ error: err }, { status: 400 })
    }

    // ─── Extract and Process ───────────────────────────────────────────────────
    const improvements: string[] = JSON.parse(improvementsRaw || '[]')
    const resumeText = await extractTextFromFile(file)

    // ─── Call AI Brain ──────────────────────────────────────────────────────────
    const aiResult = await aiRouter({
      mode: 'resume',
      userId,
      resumeText,
      improvements,
    })

    if (!aiResult.success) {
      await supabase.rpc('add_scans', { p_user_id: userId, p_amount: IMPROVE_SCAN_COST })
      return NextResponse.json({ error: aiResult.error }, { status: 500 })
    }

    const { improvedText } = aiResult.data

    const docxBuffer = await buildDocx(improvedText)
    const docxBase64 = docxBuffer.toString('base64')
    const pdfHtml = buildPdfHtml(improvedText)
    const pdfHtmlBase64 = Buffer.from(pdfHtml).toString('base64')

    // ─── LOG USAGE ───────────────────────────────────────────────────────────
    await supabase.from('scan_logs').insert({
      user_id: userId, action_type: 'improve_resume', scans_used: IMPROVE_SCAN_COST, created_at: new Date().toISOString(),
    })

    return NextResponse.json({ improvedText, docxBase64, pdfHtmlBase64 })

  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Improvement failed' }, { status: 500 })
  }
}