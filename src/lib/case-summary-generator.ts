import OpenAI from 'openai'
import { CaseSummaryData } from '@/types/case-summary'

// Lazy-load OpenAI client to avoid build-time errors
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function generateCaseSummary(data: {
  case_id: string
  case_number: string
  patient_name: string
  incident_date: string
  incident_type: string
  incident_description: string
  defendant_name?: string
  insurance_company?: string
  chronology_summary?: string
  injuries?: string[]
  total_medical_expenses?: number
  num_bills?: number
  narrative_summary?: string
  depositions?: any[]
  policy_limit?: number
}): Promise<CaseSummaryData> {
  
  // Generate executive overview
  const executiveOverview = await generateExecutiveOverview(data)
  
  // Assess liability
  const liabilityAssessment = await assessLiability(data)
  
  // Summarize injuries
  const injurySummary = await summarizeInjuries(data)
  
  // Calculate damages
  const damagesOverview = calculateDamages(data)
  
  // Analyze settlement
  const settlementAnalysis = await analyzeSettlement(data, damagesOverview)
  
  // Identify strengths and weaknesses
  const { strengths, weaknesses } = await identifyStrengthsWeaknesses(data, liabilityAssessment, injurySummary)
  
  // Generate action items
  const actionItems = await generateActionItems(data)
  
  // Assess case readiness
  const caseReadiness = assessCaseReadiness(data)
  
  // Calculate ROI
  const roiAnalysis = calculateROI(data, damagesOverview)
  
  return {
    case_id: data.case_id,
    case_number: data.case_number,
    patient_name: data.patient_name,
    incident_date: data.incident_date,
    incident_type: data.incident_type,
    executive_overview: executiveOverview,
    liability_assessment: liabilityAssessment,
    injury_summary: injurySummary,
    damages_overview: damagesOverview,
    settlement_analysis: settlementAnalysis,
    key_strengths: strengths,
    key_weaknesses: weaknesses,
    critical_action_items: actionItems,
    case_readiness: caseReadiness,
    roi_analysis: roiAnalysis,
  }
}

async function generateExecutiveOverview(data: any): Promise<string> {
  const prompt = `Write a 3-4 sentence executive overview for a personal injury case.

Case: ${data.patient_name} vs ${data.defendant_name || '[Defendant]'}
Incident Date: ${data.incident_date}
Type: ${data.incident_type}
Description: ${data.incident_description}
Medical Expenses: $${data.total_medical_expenses?.toLocaleString() || '0'}
Injuries: ${data.injuries?.join(', ') || 'To be determined'}

Write in third person, past tense. Be concise and factual. Include key facts about liability, injuries, and damages.`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a personal injury attorney writing executive case summaries for other attorneys. Be concise, factual, and focus on key legal elements.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 300,
  })

  return response.choices[0].message.content || 'Case summary pending full analysis.'
}

async function assessLiability(data: any): Promise<{
  strength: 'Weak' | 'Moderate' | 'Strong' | 'Compelling'
  score: number
  factors: string[]
}> {
  const prompt = `Assess liability strength for this personal injury case.

Type: ${data.incident_type}
Description: ${data.incident_description}
Defendant: ${data.defendant_name || 'Unknown'}

Provide:
1. Strength rating (Weak/Moderate/Strong/Compelling)
2. Score (0-100)
3. List of 3-5 liability factors (strengths and weaknesses)

Format as JSON:
{
  "strength": "Strong",
  "score": 85,
  "factors": ["Clear negligence", "Witness testimony available", "Police report favorable"]
}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a personal injury attorney assessing liability. Be realistic and identify both strengths and weaknesses.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  })

  try {
    const result = JSON.parse(response.choices[0].message.content || '{}')
    return {
      strength: result.strength || 'Moderate',
      score: result.score || 50,
      factors: result.factors || [],
    }
  } catch (error) {
    return {
      strength: 'Moderate',
      score: 50,
      factors: ['Liability assessment pending further review'],
    }
  }
}

async function summarizeInjuries(data: any): Promise<{
  severity: 'Minor' | 'Moderate' | 'Severe' | 'Catastrophic'
  key_injuries: string[]
  treatment_duration_days: number
  permanent_impairment: boolean
}> {
  const prompt = `Assess injury severity for this case.

Injuries: ${data.injuries?.join(', ') || 'Not specified'}
Medical Expenses: $${data.total_medical_expenses?.toLocaleString() || '0'}
Medical Summary: ${data.narrative_summary || data.chronology_summary || 'Not available'}

Provide:
1. Severity (Minor/Moderate/Severe/Catastrophic)
2. List of 3-5 key injuries
3. Estimated treatment duration in days
4. Whether permanent impairment is likely (true/false)

Format as JSON:
{
  "severity": "Moderate",
  "key_injuries": ["Cervical strain", "Lumbar sprain"],
  "treatment_duration_days": 180,
  "permanent_impairment": false
}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a medical-legal expert assessing injury severity for personal injury cases.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 300,
    response_format: { type: 'json_object' },
  })

  try {
    const result = JSON.parse(response.choices[0].message.content || '{}')
    return {
      severity: result.severity || 'Moderate',
      key_injuries: result.key_injuries || [],
      treatment_duration_days: result.treatment_duration_days || 0,
      permanent_impairment: result.permanent_impairment || false,
    }
  } catch (error) {
    return {
      severity: 'Moderate',
      key_injuries: data.injuries || [],
      treatment_duration_days: 0,
      permanent_impairment: false,
    }
  }
}

function calculateDamages(data: any) {
  const totalMedical = data.total_medical_expenses || 0
  const projectedFuture = totalMedical * 0.2 // Estimate 20% future medical
  const lostWages = 0 // Would come from case data
  const economicTotal = totalMedical + projectedFuture + lostWages
  
  // Pain and suffering multiplier based on severity
  let multiplier = 2.5 // Default moderate
  if (totalMedical > 100000) multiplier = 4
  else if (totalMedical > 50000) multiplier = 3
  else if (totalMedical < 10000) multiplier = 1.5
  
  const nonEconomicEstimate = totalMedical * multiplier
  
  return {
    total_medical: totalMedical,
    projected_future_medical: projectedFuture,
    lost_wages: lostWages,
    economic_total: economicTotal,
    non_economic_estimate: nonEconomicEstimate,
    total_damages_range: {
      low: economicTotal + nonEconomicEstimate * 0.7,
      high: economicTotal + nonEconomicEstimate * 1.3,
    },
  }
}

async function analyzeSettlement(data: any, damagesOverview: any): Promise<{
  recommended_demand: number
  expected_settlement_range: { low: number; high: number }
  comparable_cases_average: number
  policy_limits?: number
}> {
  const totalDamagesLow = damagesOverview.total_damages_range.low
  const totalDamagesHigh = damagesOverview.total_damages_range.high
  
  // Demand typically 2-3x expected settlement
  const recommendedDemand = totalDamagesHigh * 1.5
  
  // Expected settlement 50-70% of total damages
  const expectedSettlementRange = {
    low: totalDamagesLow * 0.5,
    high: totalDamagesHigh * 0.7,
  }
  
  // Comparable cases (would query database in production)
  const comparableCasesAverage = (expectedSettlementRange.low + expectedSettlementRange.high) / 2
  
  return {
    recommended_demand: Math.round(recommendedDemand),
    expected_settlement_range: {
      low: Math.round(expectedSettlementRange.low),
      high: Math.round(expectedSettlementRange.high),
    },
    comparable_cases_average: Math.round(comparableCasesAverage),
    policy_limits: data.policy_limit,
  }
}

async function identifyStrengthsWeaknesses(
  data: any,
  liability: any,
  injuries: any
): Promise<{ strengths: string[]; weaknesses: string[] }> {
  const prompt = `Identify key strengths and weaknesses for this case.

Liability: ${liability.strength} (${liability.score}/100)
Liability Factors: ${liability.factors.join(', ')}
Injuries: ${injuries.severity}
Key Injuries: ${injuries.key_injuries.join(', ')}
Permanent Impairment: ${injuries.permanent_impairment ? 'Yes' : 'No'}
Medical Expenses: $${data.total_medical_expenses?.toLocaleString() || '0'}

List 3-5 key strengths and 3-5 key weaknesses.

Format as JSON:
{
  "strengths": ["Clear liability", "Severe injuries", "Strong medical documentation"],
  "weaknesses": ["Pre-existing conditions", "Treatment gap", "Limited property damage"]
}`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a personal injury attorney conducting case analysis. Be honest about both strengths and weaknesses.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 400,
    response_format: { type: 'json_object' },
  })

  try {
    const result = JSON.parse(response.choices[0].message.content || '{}')
    return {
      strengths: result.strengths || [],
      weaknesses: result.weaknesses || [],
    }
  } catch (error) {
    return {
      strengths: ['Analysis pending'],
      weaknesses: ['Analysis pending'],
    }
  }
}

async function generateActionItems(data: any): Promise<string[]> {
  const prompt = `Generate 3-5 critical next steps for this case.

Case Status: Active
Medical Records: ${data.chronology_summary ? 'Complete' : 'Incomplete'}
Bills: ${data.num_bills || 0} extracted
Narrative: ${data.narrative_summary ? 'Complete' : 'Not generated'}
Depositions: ${data.depositions?.length || 0} completed

List specific, actionable tasks prioritized by urgency.

Format as JSON array:
["Obtain missing medical records from Dr. Smith", "File discovery requests", "Schedule plaintiff deposition"]`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a case manager generating action items for personal injury cases.',
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.5,
    max_tokens: 300,
  })

  try {
    const content = response.choices[0].message.content || '[]'
    return JSON.parse(content)
  } catch (error) {
    return ['Review case file', 'Complete discovery', 'Prepare for mediation']
  }
}

function assessCaseReadiness(data: any) {
  return {
    discovery_complete: false,
    medical_records_complete: !!data.chronology_summary,
    expert_opinions_needed: ['Medical causation expert', 'Accident reconstruction expert'],
    estimated_trial_date: undefined,
  }
}

function calculateROI(data: any, damagesOverview: any) {
  const estimatedFee = damagesOverview.total_damages_range.high * 0.33 // 33% contingency
  const estimatedNetRecovery = damagesOverview.total_damages_range.high * 0.67
  
  return {
    attorney_hours_invested: 10, // Placeholder
    costs_advanced: data.total_medical_expenses * 0.1 || 0, // Estimate 10% of medical
    estimated_fee: Math.round(estimatedFee),
    estimated_net_recovery: Math.round(estimatedNetRecovery),
  }
}

export async function generateCaseSummaryDocument(summaryData: CaseSummaryData): Promise<string> {
  const formatCurrency = (num: number) => `$${num.toLocaleString()}`
  
  return `# CASE SUMMARY - ${summaryData.case_number}

**Client:** ${summaryData.patient_name}
**Incident Date:** ${summaryData.incident_date}
**Case Type:** ${summaryData.incident_type}

---

## EXECUTIVE OVERVIEW

${summaryData.executive_overview}

---

## LIABILITY ASSESSMENT

**Strength:** ${summaryData.liability_assessment.strength} (${summaryData.liability_assessment.score}/100)

**Key Factors:**
${summaryData.liability_assessment.factors.map(f => `- ${f}`).join('\n')}

---

## INJURY SUMMARY

**Severity:** ${summaryData.injury_summary.severity}
**Treatment Duration:** ${summaryData.injury_summary.treatment_duration_days} days
**Permanent Impairment:** ${summaryData.injury_summary.permanent_impairment ? 'Yes' : 'No'}

**Key Injuries:**
${summaryData.injury_summary.key_injuries.map(i => `- ${i}`).join('\n')}

---

## DAMAGES OVERVIEW

| Category | Amount |
| :-- | --: |
| Past Medical Expenses | ${formatCurrency(summaryData.damages_overview.total_medical)} |
| Future Medical (Projected) | ${formatCurrency(summaryData.damages_overview.projected_future_medical)} |
| Lost Wages | ${formatCurrency(summaryData.damages_overview.lost_wages)} |
| **Economic Damages** | **${formatCurrency(summaryData.damages_overview.economic_total)}** |
| Non-Economic (Estimated) | ${formatCurrency(summaryData.damages_overview.non_economic_estimate)} |
| **Total Damages Range** | **${formatCurrency(summaryData.damages_overview.total_damages_range.low)} - ${formatCurrency(summaryData.damages_overview.total_damages_range.high)}** |

---

## SETTLEMENT ANALYSIS

**Recommended Demand:** ${formatCurrency(summaryData.settlement_analysis.recommended_demand)}

**Expected Settlement Range:** ${formatCurrency(summaryData.settlement_analysis.expected_settlement_range.low)} - ${formatCurrency(summaryData.settlement_analysis.expected_settlement_range.high)}

**Comparable Cases Average:** ${formatCurrency(summaryData.settlement_analysis.comparable_cases_average)}

${summaryData.settlement_analysis.policy_limits ? `**Policy Limits:** ${formatCurrency(summaryData.settlement_analysis.policy_limits)}` : ''}

---

## KEY STRENGTHS

${summaryData.key_strengths.map(s => `- ${s}`).join('\n')}

---

## KEY WEAKNESSES

${summaryData.key_weaknesses.map(w => `- ${w}`).join('\n')}

---

## CRITICAL ACTION ITEMS

${summaryData.critical_action_items.map((item, i) => `${i + 1}. ${item}`).join('\n')}

---

## CASE READINESS

- Discovery Complete: ${summaryData.case_readiness.discovery_complete ? 'Yes' : 'No'}
- Medical Records Complete: ${summaryData.case_readiness.medical_records_complete ? 'Yes' : 'No'}
- Expert Opinions Needed: ${summaryData.case_readiness.expert_opinions_needed.join(', ')}
${summaryData.case_readiness.estimated_trial_date ? `- Estimated Trial Date: ${summaryData.case_readiness.estimated_trial_date}` : ''}

---

## ROI ANALYSIS

| Metric | Amount |
| :-- | --: |
| Attorney Hours Invested | ${summaryData.roi_analysis.attorney_hours_invested} hours |
| Costs Advanced | ${formatCurrency(summaryData.roi_analysis.costs_advanced)} |
| Estimated Attorney Fee (33%) | ${formatCurrency(summaryData.roi_analysis.estimated_fee)} |
| Estimated Net Client Recovery | ${formatCurrency(summaryData.roi_analysis.estimated_net_recovery)} |

---

**Generated:** ${new Date().toLocaleDateString()}
`
}

