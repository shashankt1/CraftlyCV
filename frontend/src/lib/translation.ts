/**
 * Language-Transparent ATS Optimization Engine
 * ===========================================
 * All translation calls are server-side only — never expose to browser.
 *
 * Phase 1: Hindi (hi), English (en)
 * Phase 2: Bengali (bn), Urdu (ur)
 * Phase 3: Filipino (tl), Bahasa Indonesia (id)
 * Phase 4: Vietnamese (vi), Bahasa Malaysia (ms)
 * Phase 5: Japanese (ja) + Rirekisho, Korean (ko) + Jagisogeseo
 * Phase 6: Arabic (ar) + additional
 */

export const SUPPORTED_LANGUAGES = {
  en: { label: 'English', native_label: 'English', flag: '🇬🇧', phase: 1 },
  hi: { label: 'Hindi', native_label: 'हिंदी', flag: '🇮🇳', phase: 1 },
  bn: { label: 'Bengali', native_label: 'বাংলা', flag: '🇧🇩', phase: 2 },
  ur: { label: 'Urdu', native_label: 'اردو', flag: '🇵🇰', phase: 2 },
  tl: { label: 'Filipino', native_label: 'Filipino', flag: '🇵🇭', phase: 3 },
  id: { label: 'Bahasa Indonesia', native_label: 'Bahasa Indonesia', flag: '🇮🇩', phase: 3 },
  vi: { label: 'Vietnamese', native_label: 'Tiếng Việt', flag: '🇻🇳', phase: 4 },
  ms: { label: 'Bahasa Malaysia', native_label: 'Bahasa Malaysia', flag: '🇲🇾', phase: 4 },
  ja: { label: 'Japanese', native_label: '日本語', flag: '🇯🇵', phase: 5, rirekisho: true },
  ko: { label: 'Korean', native_label: '한국어', flag: '🇰🇷', phase: 5, jagi: true },
  ar: { label: 'Arabic', native_label: 'العربية', flag: '🇸🇦', phase: 6 },
} as const

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES

// ← THE FIX: added `export` here. This is the only change in this file.
export type JSONValue =
  | string
  | number
  | boolean
  | null
  | JSONValue[]
  | { [key: string]: JSONValue }

export function isSupported(lang: string): lang is LanguageCode {
  return lang in SUPPORTED_LANGUAGES
}

export const PHASE_LANGUAGES = Object.entries(SUPPORTED_LANGUAGES)
  .filter(([, v]) => v.phase <= 1)
  .map(([code]) => code as LanguageCode)

/* ─── Internal helpers ─────────────────────────────────────────────────────── */

async function translateWithClaude(
  text: string,
  sourceLang: LanguageCode,
  targetLang: LanguageCode,
  context?: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const direction =
    targetLang === 'en'
      ? `from ${SUPPORTED_LANGUAGES[sourceLang].native_label} (${sourceLang}) to English`
      : `from English to ${SUPPORTED_LANGUAGES[targetLang].native_label} (${targetLang})`

  const systemPrompt = [
    `You are a professional translation engine for resume and career content.`,
    context ? `Context: ${context}` : '',
    `Preserve all formatting markers, section headers, and professional terminology.`,
    `Return ONLY the translated text — no explanations, no markdown, no commentary.`,
    targetLang === 'en'
      ? `IMPORTANT: Translate all content to fluent, professional English suitable for ATS systems.`
      : `IMPORTANT: Translate to natural, professional ${SUPPORTED_LANGUAGES[targetLang].label} suitable for a job application.`,
  ].filter(Boolean).join('\n')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: 'user', content: text }],
    }),
  })

  if (!response.ok) throw new Error(`Translation failed: ${response.status}`)
  const data = await response.json()
  return (data.content?.[0]?.text || '').trim()
}

/* ─── Layer 2: Normalization (user's language → English) ─────────────────── */

export async function translateToEnglish(
  text: string,
  sourceLang: LanguageCode
): Promise<string> {
  if (sourceLang === 'en') return text
  if (!isSupported(sourceLang)) throw new Error(`Unsupported source language: ${sourceLang}`)
  return translateWithClaude(text, sourceLang, 'en')
}

/* ─── Layer 5: Localization (English → user's language) ────────────────────── */

export async function translateFromEnglish(
  text: string,
  targetLang: LanguageCode,
  context?: string
): Promise<string> {
  if (targetLang === 'en') return text
  if (!isSupported(targetLang)) throw new Error(`Unsupported target language: ${targetLang}`)
  return translateWithClaude(text, 'en', targetLang, context)
}

/* ─── Batch translation for JSON objects ───────────────────────────────────── */

export async function translateObject(
  obj: JSONValue,
  sourceLang: LanguageCode,
  targetLang: LanguageCode,
  context?: string
): Promise<JSONValue> {
  if (sourceLang === 'en' && targetLang === 'en') return obj

  if (typeof obj === 'string') {
    if (targetLang === 'en') return translateToEnglish(obj, sourceLang)
    return translateFromEnglish(obj, targetLang, context)
  }

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => translateObject(item, sourceLang, targetLang, context)))
  }

  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, JSONValue> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = await translateObject(value, sourceLang, targetLang, context)
    }
    return result
  }

  return obj
}

/* ─── Translate ATS result JSON ──────────────────────────────────────────── */

export async function translateATSResult(
  result: Record<string, JSONValue>,
  targetLang: LanguageCode
): Promise<Record<string, JSONValue>> {
  if (targetLang === 'en') return result
  return translateObject(result, 'en', targetLang, 'ATS resume feedback') as Promise<Record<string, JSONValue>>
}