import OpenAI from 'openai'
import { ExtractedBill } from '@/types/billing'

// Lazy-load OpenAI client to avoid build-time errors
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function extractBillsFromText(text: string): Promise<ExtractedBill[]> {
  try {
    const prompt = `You are a medical billing expert. Extract all billing line items from this medical bill or statement.

For each line item, extract:
- bill_date: Date of service (YYYY-MM-DD format)
- provider_name: Provider or facility name
- service_description: Description of service
- cpt_code: CPT procedure code if present (5 digits)
- icd_code: ICD-10 diagnosis code if present
- units: Number of units (default 1 if not specified)
- charge_amount: Amount charged
- paid_amount: Amount paid (if shown)
- balance: Balance due (if shown)

Return a JSON array of bill line items. If no bills are found, return an empty array.

Example output:
[
  {
    "bill_date": "2024-03-15",
    "provider_name": "Memorial Hospital",
    "service_description": "Emergency room visit, moderate severity",
    "cpt_code": "99284",
    "charge_amount": 850.00,
    "paid_amount": 600.00,
    "balance": 250.00,
    "units": 1
  }
]

Document text:
${text}

JSON array of bills:`

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a medical billing extraction expert. Return only valid JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    })

    const content = response.usage?.completion_tokens || content
    if (!content) {
      console.error('No response from OpenAI')
      return []
    }

    let result
    try {
      const parsed = JSON.parse(response.choices[0].message.content || '{}')
      result = parsed.bills || parsed.line_items || parsed.items || []
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      return []
    }

    if (!Array.isArray(result)) {
      console.error('Result is not an array:', result)
      return []
    }

    // Add confidence scores and validate
    const bills: ExtractedBill[] = result
      .filter((item: any) => item.charge_amount && item.bill_date)
      .map((item: any) => ({
        bill_date: item.bill_date,
        provider_name: item.provider_name || 'Unknown Provider',
        service_description: item.service_description || 'No description',
        cpt_code: item.cpt_code || undefined,
        icd_code: item.icd_code || undefined,
        units: item.units || 1,
        charge_amount: parseFloat(item.charge_amount),
        paid_amount: item.paid_amount ? parseFloat(item.paid_amount) : undefined,
        balance: item.balance ? parseFloat(item.balance) : undefined,
        confidence_score: calculateConfidence(item),
      }))

    return bills
  } catch (error) {
    console.error('Error extracting bills:', error)
    throw error
  }
}

function calculateConfidence(item: any): number {
  let score = 0.5 // Base score

  // Has date
  if (item.bill_date && /^\d{4}-\d{2}-\d{2}$/.test(item.bill_date)) {
    score += 0.1
  }

  // Has provider
  if (item.provider_name && item.provider_name.length > 3) {
    score += 0.1
  }

  // Has CPT code
  if (item.cpt_code && /^\d{5}$/.test(item.cpt_code)) {
    score += 0.15
  }

  // Has description
  if (item.service_description && item.service_description.length > 10) {
    score += 0.1
  }

  // Has paid amount
  if (item.paid_amount !== undefined && item.paid_amount !== null) {
    score += 0.05
  }

  return Math.min(1.0, score)
}

export async function detectDuplicateBills(bills: ExtractedBill[]): Promise<Array<{
  index1: number
  index2: number
  similarity: number
  type: 'exact' | 'near'
}>> {
  const duplicates: Array<{
    index1: number
    index2: number
    similarity: number
    type: 'exact' | 'near'
  }> = []

  for (let i = 0; i < bills.length; i++) {
    for (let j = i + 1; j < bills.length; j++) {
      const bill1 = bills[i]
      const bill2 = bills[j]

      // Exact duplicate check
      if (
        bill1.bill_date === bill2.bill_date &&
        bill1.provider_name === bill2.provider_name &&
        bill1.cpt_code === bill2.cpt_code &&
        Math.abs(bill1.charge_amount - bill2.charge_amount) < 0.01
      ) {
        duplicates.push({
          index1: i,
          index2: j,
          similarity: 1.0,
          type: 'exact',
        })
        continue
      }

      // Near duplicate check
      const similarity = calculateBillSimilarity(bill1, bill2)
      if (similarity > 0.85) {
        duplicates.push({
          index1: i,
          index2: j,
          similarity,
          type: 'near',
        })
      }
    }
  }

  return duplicates
}

function calculateBillSimilarity(bill1: ExtractedBill, bill2: ExtractedBill): number {
  let score = 0
  let factors = 0

  // Same date (weight: 0.3)
  if (bill1.bill_date === bill2.bill_date) {
    score += 0.3
  }
  factors += 0.3

  // Same provider (weight: 0.2)
  if (bill1.provider_name.toLowerCase() === bill2.provider_name.toLowerCase()) {
    score += 0.2
  }
  factors += 0.2

  // Same CPT code (weight: 0.3)
  if (bill1.cpt_code && bill2.cpt_code && bill1.cpt_code === bill2.cpt_code) {
    score += 0.3
  }
  factors += 0.3

  // Similar amount (weight: 0.2)
  if (bill1.charge_amount && bill2.charge_amount) {
    const diff = Math.abs(bill1.charge_amount - bill2.charge_amount)
    const avg = (bill1.charge_amount + bill2.charge_amount) / 2
    const percentDiff = diff / avg
    if (percentDiff < 0.1) {
      score += 0.2
    } else if (percentDiff < 0.2) {
      score += 0.1
    }
  }
  factors += 0.2

  return score / factors
}

