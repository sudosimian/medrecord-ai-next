import OpenAI from 'openai'

// Lazy-load OpenAI client to avoid build-time errors
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export interface MedicalSynopsis {
  executive_summary: string
  key_injuries: string[]
  key_providers: string[]
  total_treatment_days: number
  total_medical_costs: number
  case_strength: 'weak' | 'moderate' | 'strong' | 'compelling'
  synopsis_text: string
}

export async function generateMedicalSynopsis(
  caseData: any,
  chronologyData: any,
  billingData: any
): Promise<MedicalSynopsis> {
  
  const prompt = `Generate an ultra-brief medical synopsis for legal case.

Case: ${caseData.case_number}
Patient: ${caseData.patients?.first_name} ${caseData.patients?.last_name}
Incident Date: ${caseData.incident_date}

Medical Events (${chronologyData.events?.length || 0} total):
${JSON.stringify(chronologyData.events?.slice(0, 10), null, 2)}

Billing Summary:
Total Billed: $${billingData.total_billed || 0}
Providers: ${billingData.num_providers || 0}

Create a synopsis (3-5 sentences max) covering:
1. Type and severity of injuries
2. Treatment summary (ER, surgery, therapy, etc.)
3. Current status
4. Total medical costs

Be concise, factual, attorney-focused.`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a medical-legal analyst. Generate ultra-brief case synopses for attorneys.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 300,
  })

  const synopsisText = response.choices[0].message.content || 'Synopsis not available.'

  // Extract key information
  const keyInjuries = extractKeyInjuries(chronologyData.events || [])
  const keyProviders = extractKeyProviders(chronologyData.events || [])
  const treatmentDays = calculateTreatmentDays(chronologyData.events || [])
  const caseStrength = assessCaseStrength(chronologyData, billingData)

  return {
    executive_summary: synopsisText,
    key_injuries: keyInjuries,
    key_providers: keyProviders,
    total_treatment_days: treatmentDays,
    total_medical_costs: billingData.total_billed || 0,
    case_strength: caseStrength,
    synopsis_text: synopsisText,
  }
}

function extractKeyInjuries(events: any[]): string[] {
  const injuries = new Set<string>()
  
  for (const event of events) {
    if (event.icd_codes && Array.isArray(event.icd_codes)) {
      event.icd_codes.forEach((code: string) => injuries.add(code))
    }
  }
  
  return Array.from(injuries).slice(0, 5)
}

function extractKeyProviders(events: any[]): string[] {
  const providers = new Set<string>()
  
  for (const event of events) {
    if (event.provider_name) {
      providers.add(event.provider_name)
    }
  }
  
  return Array.from(providers).slice(0, 5)
}

function calculateTreatmentDays(events: any[]): number {
  if (events.length === 0) return 0
  
  const dates = events.map(e => new Date(e.event_date).getTime())
  const minDate = Math.min(...dates)
  const maxDate = Math.max(...dates)
  
  return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24))
}

function assessCaseStrength(chronologyData: any, billingData: any): 'weak' | 'moderate' | 'strong' | 'compelling' {
  let score = 0
  
  // Medical costs
  if (billingData.total_billed > 50000) score += 3
  else if (billingData.total_billed > 20000) score += 2
  else if (billingData.total_billed > 5000) score += 1
  
  // Number of providers
  if (billingData.num_providers > 5) score += 2
  else if (billingData.num_providers > 3) score += 1
  
  // Treatment duration
  const events = chronologyData.events || []
  if (events.length > 20) score += 2
  else if (events.length > 10) score += 1
  
  // Severity indicators (surgery, hospitalization)
  const hasSurgery = events.some((e: any) => 
    e.event_type?.toLowerCase().includes('surgery') ||
    e.description?.toLowerCase().includes('surgery')
  )
  if (hasSurgery) score += 3
  
  const hasHospitalization = events.some((e: any) =>
    e.event_type?.toLowerCase().includes('inpatient') ||
    e.facility_name?.toLowerCase().includes('hospital')
  )
  if (hasHospitalization) score += 2
  
  // Determine strength
  if (score >= 10) return 'compelling'
  if (score >= 7) return 'strong'
  if (score >= 4) return 'moderate'
  return 'weak'
}

