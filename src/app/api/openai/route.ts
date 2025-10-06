import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    // Route to appropriate OpenAI function based on action
    let result

    switch (action) {
      case 'analyzeSymptoms':
        result = await analyzeSymptoms(params.symptoms, params.patientData)
        break
      case 'checkDrugInteractions':
        result = await checkDrugInteractions(params.medications)
        break
      case 'generateDemandLetter':
        result = await generateDemandLetter(params.caseData)
        break
      case 'generateChronology':
        result = await generateChronology(params.medicalRecordsText, params.patientInfo)
        break
      case 'generateExpertOpinion':
        result = await generateExpertOpinion(params.opinionData)
        break
      case 'extractBills':
        result = await extractBills(params.documentText)
        break
      case 'detectDuplicateCharges':
        result = await detectDuplicateCharges(params.bills)
        break
      case 'analyzeReasonableRates':
        result = await analyzeReasonableRates(params.bills, params.region)
        break
      case 'identifyMissingRecords':
        result = await identifyMissingRecords(params.chronologyEvents, params.caseType)
        break
      case 'findComparableCases':
        result = await findComparableCases(params.caseData)
        break
      case 'recommendDemandAmount':
        result = await recommendDemandAmount(params.caseData, params.comparables)
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('OpenAI API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

async function callOpenAI(prompt: string, maxTokens: number = 2000) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  })

  return JSON.parse(response.choices[0].message.content || '{}')
}

async function analyzeSymptoms(symptoms: string, patientData: any) {
  const prompt = `Analyze the following patient symptoms and medical history to suggest potential diagnoses, treatment recommendations, next steps (e.g., diagnostic tests), and identify any critical risk factors. Provide the output in a JSON object with keys: "diagnoses" (array of objects with "condition", "severity", "confidence", "matchingSymptoms"), "treatmentRecommendations" (array of strings), "diagnosticTests" (array of strings), and "redFlags" (array of strings).

Patient Data: ${JSON.stringify(patientData)}
Symptoms: ${symptoms}`

  return callOpenAI(prompt)
}

async function checkDrugInteractions(medications: string[]) {
  const prompt = `Check for potential drug-drug interactions between the following medications. For each interaction, provide the severity (major, moderate, minor), a description, the mechanism of interaction, and a recommendation for management. If no significant interactions are found, state that. Provide the output as a JSON object with keys: "interactions" (array of objects with "drug1", "drug2", "severity", "description", "mechanism", "management"), and "generalWarnings" (array of strings for general advice).

Medications: ${medications.join(', ')}`

  return callOpenAI(prompt)
}

async function generateDemandLetter(caseData: any) {
  const prompt = `Generate a comprehensive settlement demand letter based on the following case data. The letter should include a persuasive liability narrative, a detailed medical treatment summary, an itemized damages breakdown, and a justification for the total demand amount. Adapt the tone and content based on the demand type (normal, underinsured, stowers). Provide the output as a JSON object with keys: "liability" (object with "narrative", "full"), "medical" (object with "summary", "injuries" array), "damages" (object with "breakdown", "total", "narrative"), "demand" (object with "amount", "justification"), "deadline" (string, e.g., "30 days from date of letter").

Case Data: ${JSON.stringify(caseData)}`

  return callOpenAI(prompt, 3000)
}

async function generateChronology(medicalRecordsText: string, patientInfo: any) {
  const prompt = `Generate a chronological summary of medical events from the provided medical records text. Identify key events such as visits, diagnoses, treatments, providers, and billing information. Include significance (high, medium, low) for each event. The output should be a JSON object with a single key "events", which is an array of event objects. Each event object should have: "date", "time", "provider" (object with "name", "specialty"), "facility", "event" (description), "diagnosis", "treatment", "outcome", "billing" (number), "icdCodes" (array), "cptCodes" (array), "significance", and "notes".

Patient Information: ${JSON.stringify(patientInfo)}
Medical Records Text: ${medicalRecordsText}`

  return callOpenAI(prompt, 4000)
}

async function generateExpertOpinion(opinionData: any) {
  const prompt = `Generate a detailed expert medical opinion based on the provided case information. The opinion should include an introduction, materials reviewed, a medical history summary, current condition, a thorough causation analysis, an assessment of the standard of care, and clear conclusions stated to a reasonable degree of medical certainty. Provide supporting medical basis and references. Output as a JSON object with keys: "introduction", "materialsReviewed" (array of strings), "medicalHistory", "currentCondition", "causation" (object with "analysis", "probability"), "standardOfCare" (object with "analysis", "deviation"), "opinion" (object with "conclusion", "summary"), "medicalBasis", "references" (array of strings).

Opinion Data: ${JSON.stringify(opinionData)}`

  return callOpenAI(prompt, 3500)
}

async function extractBills(documentText: string) {
  const prompt = `Extract all medical billing information from this document.

Document text:
${documentText}

Extract and return JSON with array of bills, each containing:
- date (service date)
- provider (provider/facility name)
- procedure (procedure/service description)
- cptCode (CPT code if present)
- icdCode (ICD-10 code if present)
- amount (dollar amount)
- insurance (insurance information if present)
- status (paid/pending/denied if determinable)

Return format: { "bills": [...] }`

  return callOpenAI(prompt, 3000)
}

async function detectDuplicateCharges(bills: any[]) {
  const prompt = `Analyze these medical bills for duplicate charges:

${JSON.stringify(bills, null, 2)}

Identify:
1. Exact duplicates (same date, provider, service, amount)
2. Near duplicates (same service, similar amount, close dates)
3. Potential unbundling (services that should be bundled)
4. Potential upcoding (higher-level service than appropriate)

Return JSON with:
{
  "duplicates": [
    {
      "type": "exact|near|unbundling|upcoding",
      "bill1_index": number,
      "bill2_index": number,
      "description": "explanation",
      "potential_overcharge": number
    }
  ],
  "total_potential_savings": number,
  "summary": "brief analysis"
}`

  return callOpenAI(prompt, 2000)
}

async function analyzeReasonableRates(bills: any[], region: string = 'US') {
  const prompt = `Analyze if these medical charges are reasonable for ${region}:

${JSON.stringify(bills, null, 2)}

For each bill, compare to typical Medicare rates (multiplied by 2-3x for commercial insurance).

Return JSON with:
{
  "analysis": [
    {
      "bill_index": number,
      "charged": number,
      "typical_range_low": number,
      "typical_range_high": number,
      "assessment": "reasonable|high|excessive",
      "explanation": "brief explanation"
    }
  ],
  "total_potential_overcharges": number,
  "summary": "overall assessment"
}`

  return callOpenAI(prompt, 2000)
}

async function identifyMissingRecords(chronologyEvents: any[], caseType: string = 'personal_injury') {
  const prompt = `Analyze this medical chronology for missing records:

Case Type: ${caseType}
Events:
${JSON.stringify(chronologyEvents, null, 2)}

Identify expected but missing records based on:
- Gaps in timeline
- Mentioned but not included records (e.g., "MRI ordered" but no MRI report)
- Standard medical protocols for this case type
- Referrals without follow-up
- Incomplete diagnostic workups

Return JSON with:
{
  "missing_records": [
    {
      "type": "record type (e.g., MRI report, specialist consultation)",
      "expected_date": "approximate date",
      "provider": "likely provider if determinable",
      "importance": "high|medium|low",
      "reason": "why this record is expected",
      "impact": "impact on case if missing"
    }
  ],
  "timeline_gaps": [
    {
      "gap_start": "date",
      "gap_end": "date",
      "duration_days": number,
      "significance": "assessment of gap significance"
    }
  ],
  "summary": "overall assessment of record completeness"
}`

  return callOpenAI(prompt, 2500)
}

async function findComparableCases(caseData: any) {
  const prompt = `Based on this case information, suggest comparable cases for settlement valuation:

Case Type: ${caseData.incidentType}
Jurisdiction: ${caseData.jurisdiction || 'General US'}
Injuries: ${JSON.stringify(caseData.injuries)}
Medical Expenses: $${caseData.totalMedicalExpenses}
Liability Strength: ${caseData.liabilityStrength || 'moderate'}

Provide 3-5 hypothetical comparable cases based on typical verdicts/settlements in similar cases.

Return JSON with:
{
  "comparable_cases": [
    {
      "case_summary": "brief description",
      "jurisdiction": "state/region",
      "injuries": ["list of injuries"],
      "verdict_amount": number,
      "year": year,
      "relevance_score": number (0-100)
    }
  ],
  "statistics": {
    "average_verdict": number,
    "median_verdict": number,
    "range_low": number,
    "range_high": number
  },
  "analysis": "brief analysis of comparables"
}`

  return callOpenAI(prompt, 2500)
}

async function recommendDemandAmount(caseData: any, comparables: any = null) {
  const prompt = `Recommend a settlement demand amount for this case:

Case Details:
- Type: ${caseData.incidentType}
- Total Medical: $${caseData.totalMedicalExpenses}
- Future Medical: $${caseData.futureMedicalExpenses || 0}
- Lost Wages: $${caseData.lostWages || 0}
- Future Lost Wages: $${caseData.futureLostWages || 0}
- Pain & Suffering: $${caseData.painSuffering || 0}
- Property Damage: $${caseData.propertyDamage || 0}
- Total Damages: $${caseData.totalDemand}
- Liability Strength: ${caseData.liabilityStrength || 'moderate'}
- Injury Severity: ${caseData.injurySeverity || 'moderate'}
${comparables ? `\nComparable Cases: ${JSON.stringify(comparables)}` : ''}

Recommend:
1. Demand amount (typically 2-4x total damages based on case strength)
2. Expected settlement range
3. Multiplier justification
4. Negotiation strategy

Return JSON with:
{
  "recommended_demand": number,
  "multiplier": number,
  "expected_settlement_low": number,
  "expected_settlement_mid": number,
  "expected_settlement_high": number,
  "justification": "explanation for demand amount",
  "strategy": "negotiation strategy recommendations",
  "strengths": ["case strengths"],
  "weaknesses": ["case weaknesses"]
}`

  return callOpenAI(prompt, 2000)
}

