import OpenAI from 'openai'
import { ExtractedEvent } from '@/types/chronology'
import { parse, isValid, format } from 'date-fns'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function extractMedicalEvents(
  text: string,
  options?: {
    extractCodes?: boolean
  }
): Promise<ExtractedEvent[]> {
  try {
    const prompt = `You are a medical records analyst. Extract all medical events from the following medical record text.

For each event, identify:
- Date (in YYYY-MM-DD format)
- Time (if mentioned)
- Provider name
- Facility name
- Event type (e.g., "Emergency Visit", "Surgery", "Follow-up", "Diagnostic Test")
- Description (concise summary)
- Significance score (1-5, where 5 is most critical)
${options?.extractCodes ? '- ICD-10 codes (if mentioned)\n- CPT codes (if mentioned)' : ''}

Return a JSON array of events. Example:
[
  {
    "date": "2024-01-15",
    "time": "14:30",
    "provider": "Dr. John Smith",
    "facility": "Memorial Hospital",
    "eventType": "Emergency Visit",
    "description": "Patient presented with acute chest pain",
    "significance": 5,
    "icdCodes": ["I21.9"],
    "cptCodes": ["99285"]
  }
]

Medical Record Text:
${text}

Return ONLY the JSON array, no additional text.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a medical records analyst that extracts structured medical events from clinical text. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1, // Low temperature for more consistent extraction
      max_tokens: 4000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      console.error('No JSON array found in response:', content)
      return []
    }

    const events: ExtractedEvent[] = JSON.parse(jsonMatch[0])

    // Normalize dates
    return events.map(event => ({
      ...event,
      date: normalizeDateString(event.date),
      confidence: 0.85, // Default confidence for GPT-4 extraction
    }))
  } catch (error) {
    console.error('Medical event extraction error:', error)
    throw new Error('Failed to extract medical events')
  }
}

function normalizeDateString(dateStr: string): string {
  try {
    // Try parsing various date formats
    const formats = [
      'yyyy-MM-dd',
      'MM/dd/yyyy',
      'M/d/yyyy',
      'MM-dd-yyyy',
      'MMM dd, yyyy',
      'MMMM dd, yyyy',
    ]

    for (const formatStr of formats) {
      const parsed = parse(dateStr, formatStr, new Date())
      if (isValid(parsed)) {
        return format(parsed, 'yyyy-MM-dd')
      }
    }

    // If all fails, return original
    return dateStr
  } catch {
    return dateStr
  }
}

export function calculateSignificance(event: ExtractedEvent): number {
  let score = 2 // Default routine

  const description = event.description.toLowerCase()
  const eventType = event.eventType?.toLowerCase() || ''

  // Critical indicators
  const criticalKeywords = [
    'emergency',
    'surgery',
    'fracture',
    'trauma',
    'critical',
    'severe',
    'acute',
    'admission',
    'hospitalization',
  ]
  if (criticalKeywords.some(keyword => description.includes(keyword) || eventType.includes(keyword))) {
    score = 5
  }

  // Important indicators
  const importantKeywords = [
    'specialist',
    'mri',
    'ct scan',
    'x-ray',
    'diagnosis',
    'procedure',
    'treatment',
    'therapy',
  ]
  if (score < 5 && importantKeywords.some(keyword => description.includes(keyword) || eventType.includes(keyword))) {
    score = 4
  }

  // Administrative indicators
  const adminKeywords = ['billing', 'insurance', 'paperwork', 'form', 'referral request']
  if (adminKeywords.some(keyword => description.includes(keyword))) {
    score = 1
  }

  return score
}

