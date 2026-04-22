import { GoogleGenerativeAI } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const GEMINI_MODEL = 'gemini-2.5-flash'

function getGenAI(): GoogleGenerativeAI {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured')
  }
  return new GoogleGenerativeAI(GEMINI_API_KEY)
}

export interface LanguageType {
  code: string
  name: string
  country: string
  format: 'rirekisho' | 'jigisogeseo' | 'standard'
}

export const SUPPORTED_LANGUAGES: LanguageType[] = [
  { code: 'en', name: 'English', country: 'Global', format: 'standard' },
  { code: 'ja', name: 'Japanese', country: 'Japan', format: 'rirekisho' },
  { code: 'ko', name: 'Korean', country: 'Korea', format: 'jigisogeseo' },
  { code: 'hi', name: 'Hindi', country: 'India', format: 'standard' },
  { code: 'zh', name: 'Chinese', country: 'China', format: 'standard' },
  { code: 'es', name: 'Spanish', country: 'Spain/LATAM', format: 'standard' },
  { code: 'de', name: 'German', country: 'Germany', format: 'standard' },
  { code: 'fr', name: 'French', country: 'France', format: 'standard' },
]

const ENGLISH_TO_RIREKISHO_PROMPT = `You are an expert Japanese resume (履歴書 - Rirekisho) converter.

Convert the following English resume into a proper Japanese Rirekisho format.

IMPORTANT RULES:
- Rirekisho is a standardized Japanese resume format
- Use Japanese era dates (令和) for dates
- All text must be in Japanese
- Include these sections:
  1. 氏名 (Name) - full name
  2. 生年月日 (Date of Birth) - use Japanese era format (令和__)
  3. 住所 (Address) - prefecture and city
  4. 電話番号 (Phone)
  5. メールアドレス (Email)
  6. 学歴 (Education) - most recent first, use era format
  7. 職歴 (Work Experience) - most recent first, include company and position
  8. 保有スキル (Skills) - relevant skills
  9. 資格 (Certifications) - any certifications
  10. 自己PR (Self Introduction) - brief self-introduction

Format requirements:
- Clean, formal Japanese business format
- Use proper spacing (全角 spaces)
- Dates in 令和 format: 令和__年__月
- Be concise and formal

Original resume:
{resumeText}

Output ONLY the converted Rirekisho in Japanese text format. No JSON, no markdown.`

const ENGLISH_TO_JIGISOGESEO_PROMPT = `You are an expert Korean resume (자기소개서 - Jigisogeseo) converter.

Convert the following English resume into a proper Korean Jigisogeseo format.

IMPORTANT RULES:
- Jigisogeseo is a Korean resume/cover letter format
- Include: personal info, education, experience, skills, self-introduction
- Use formal Korean business language
- Include these sections:
  1. 이름 (Name)
  2. 생년월일 (Date of Birth) - Korean format: 년도.월.일
  3. 주소 (Address)
  4. 연락처 (Contact)
  5. 학력 (Education)
  6. 경력 (Work Experience)
  7. 기술 (Skills)
  8. 자격증 (Certifications)
  9. 자기소개 (Self Introduction)

Format requirements:
- Formal Korean business format
- Use Korean age system (만 나이) where appropriate
- Professional and concise

Original resume:
{resumeText}

Output ONLY the converted Jigisogeseo in Korean text format. No JSON, no markdown.`

const RIREKISHO_TO_ENGLISH_PROMPT = `You are an expert at converting Japanese Rirekisho resumes to standard English ATS format.

Extract information from this Japanese Rirekisho and convert to a professional English resume.

Original Rirekisho:
{resumeText}

Convert to English ATS resume with:
- Standard Western name format
- Education in reverse chronological order
- Work experience with clear bullet points
- Quantified achievements
- ATS-optimized keywords
- Professional summary

Output ONLY the English resume text. No JSON, no markdown, no code fences.`

const JIGISOGESEO_TO_ENGLISH_PROMPT = `You are an expert at converting Korean Jigisogeseo resumes to standard English ATS format.

Extract information from this Korean Jigisogeseo and convert to a professional English resume.

Original Jigisogeseo:
{resumeText}

Convert to English ATS resume with:
- Standard Western name format
- Education in reverse chronological order
- Work experience with clear bullet points
- Quantified achievements
- ATS-optimized keywords
- Professional summary

Output ONLY the English resume text. No JSON, no markdown, no code fences.`

const ATS_OPTIMIZE_PROMPT = `Optimize this resume for Applicant Tracking Systems (ATS).

Resume:
{resumeText}

Job Description (if provided):
{jobDescription}

Tasks:
1. Identify missing keywords from the job description
2. Restructure bullets to include quantifiable achievements
3. Add ATS-friendly formatting
4. Suggest additional keywords to add
5. Score the ATS compatibility

Respond ONLY with valid JSON:
{
  "optimizedResume": "[full optimized resume text]",
  "atsScore": [0-100],
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestedImprovements": ["improvement1", "improvement2"],
  "quantifiedBullets": ["bullet with metrics", "another bullet"]
}`

export async function convertResume(
  resumeText: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<{ convertedResume: string; matchScore?: number }> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  // Same language = just optimize
  if (sourceLanguage === targetLanguage) {
    return { convertedResume: resumeText }
  }

  let prompt = ''

  // English to Japanese Rirekisho
  if (sourceLanguage === 'en' && targetLanguage === 'ja') {
    prompt = ENGLISH_TO_RIREKISHO_PROMPT.replace('{resumeText}', resumeText)
  }
  // English to Korean Jigisogeseo
  else if (sourceLanguage === 'en' && targetLanguage === 'ko') {
    prompt = ENGLISH_TO_JIGISOGESEO_PROMPT.replace('{resumeText}', resumeText)
  }
  // Japanese Rirekisho to English
  else if (sourceLanguage === 'ja' && targetLanguage === 'en') {
    prompt = RIREKISHO_TO_ENGLISH_PROMPT.replace('{resumeText}', resumeText)
  }
  // Korean Jigisogeseo to English
  else if (sourceLanguage === 'ko' && targetLanguage === 'en') {
    prompt = JIGISOGESEO_TO_ENGLISH_PROMPT.replace('{resumeText}', resumeText)
  }
  // English to other languages (general conversion)
  else if (sourceLanguage === 'en') {
    const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)
    prompt = `Convert this English resume to ${targetLang?.name || targetLanguage}. Keep all factual information accurate while adapting to the cultural format expectations of ${targetLang?.country || targetLanguage}.

Original Resume:
${resumeText}

Output ONLY the converted resume. No JSON, no markdown.`
  }
  // Any language to English (ATS optimization)
  else if (targetLanguage === 'en') {
    prompt = `Convert this resume to professional English ATS format. Extract all information and present it in a clear, structured format with quantified achievements.

Original Resume:
${resumeText}

Output ONLY the English resume. No JSON, no markdown.`
  }
  // Direct conversion between non-English languages (go through English as bridge)
  else {
    // First convert to English, then to target
    const bridgePrompt = `Convert this resume to English, preserving all factual information accurately.

Original:
${resumeText}

Output ONLY the English version.`
    const bridgeResult = await model.generateContent(bridgePrompt)
    const englishVersion = bridgeResult.response.text().replace(/```[\s\S]*?```/g, '').trim()

    const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage)
    const convertPrompt = `Convert this English resume to ${targetLang?.name || targetLanguage} format. Adapt to cultural expectations of ${targetLang?.country || targetLanguage}.

English Resume:
${englishVersion}

Output ONLY the converted resume. No JSON, no markdown.`
    const finalResult = await model.generateContent(convertPrompt)
    return {
      convertedResume: finalResult.response.text().replace(/```[\s\S]*?```/g, '').trim(),
    }
  }

  const result = await model.generateContent(prompt)
  const convertedResume = result.response.text().replace(/```[\s\S]*?```/g, '').trim()

  return { convertedResume }
}

export async function optimizeForATS(
  resumeText: string,
  jobDescription?: string
): Promise<{
  optimizedResume: string
  atsScore: number
  missingKeywords: string[]
  suggestedImprovements: string[]
  quantifiedBullets: string[]
}> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = ATS_OPTIMIZE_PROMPT
    .replace('{resumeText}', resumeText)
    .replace('{jobDescription}', jobDescription || '')

  const result = await model.generateContent(prompt)
  const raw = result.response.text().replace(/```json\n?|```\n?/g, '').trim()

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response')
  }

  return JSON.parse(jsonMatch[0])
}

export async function detectLanguage(text: string): Promise<LanguageType | null> {
  const genAI = getGenAI()
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

  const prompt = `Detect the language of this resume text. Respond ONLY with the language code:
- "en" for English
- "ja" for Japanese
- "ko" for Korean
- "hi" for Hindi
- "zh" for Chinese
- "es" for Spanish
- "de" for German
- "fr" for French

Text:
${text.substring(0, 500)}

Output ONLY the 2-letter language code. No explanation.`

  try {
    const result = await model.generateContent(prompt)
    const detected = result.response.text().trim().toLowerCase()
    return SUPPORTED_LANGUAGES.find(l => l.code === detected) || null
  } catch {
    return null
  }
}
