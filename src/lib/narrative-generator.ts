import OpenAI from 'openai'
import { 
  NarrativeSummary, 
  InjuryCategory, 
  CausationAnalysis,
  PreExistingCondition,
  TreatmentPhase,
  FunctionalImpact,
  ComparativeAnalysis 
} from '@/types/narrative'

// Lazy-load OpenAI client to avoid build-time errors
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function generateNarrativeSummary(
  chronologyData: any,
  caseData: any
): Promise<Omit<NarrativeSummary, 'id' | 'case_id' | 'user_id' | 'created_at' | 'updated_at'>> {
  
  // Extract injury categories
  const injuryCategories = await categorizeInjuries(chronologyData)
  
  // Analyze causation
  const causationAnalyses = await analyzeCausation(chronologyData, caseData)
  
  // Detect pre-existing conditions
  const preExistingConditions = await detectPreExistingConditions(chronologyData, caseData.incident_date)
  
  // Generate treatment phases narrative
  const treatmentPhases = await generateTreatmentPhases(chronologyData)
  
  // Assess functional impact
  const functionalImpacts = await assessFunctionalImpact(chronologyData)
  
  // Generate comparative analysis
  const comparativeAnalysis = await generateComparativeAnalysis(chronologyData, caseData.incident_date)
  
  // Generate executive summary
  const executiveSummary = await generateExecutiveSummary({
    injuryCategories,
    causationAnalyses,
    preExistingConditions,
    treatmentPhases,
    functionalImpacts,
  })
  
  // Generate full narrative
  const fullNarrative = await generateFullNarrative({
    injuryCategories,
    causationAnalyses,
    preExistingConditions,
    treatmentPhases,
    functionalImpacts,
    comparativeAnalysis,
  })
  
  return {
    injury_categories: injuryCategories,
    causation_analyses: causationAnalyses,
    pre_existing_conditions: preExistingConditions,
    treatment_phases: treatmentPhases,
    functional_impacts: functionalImpacts,
    comparative_analysis: comparativeAnalysis,
    executive_summary: executiveSummary,
    full_narrative: fullNarrative,
  }
}

async function categorizeInjuries(chronologyData: any): Promise<InjuryCategory[]> {
  const prompt = `Based on the following medical chronology, categorize all injuries by body system.

Medical Events:
${JSON.stringify(chronologyData.events, null, 2)}

Provide output as JSON array with this structure:
[
  {
    "category": "Musculoskeletal",
    "injuries": ["Right femur fracture", "Cervical spine strain"],
    "icd10_codes": ["S72.301A", "S13.4XXA"],
    "severity": "severe"
  }
]

Categories: Musculoskeletal, Neurological, Soft Tissue, Internal, Psychological, Sensory
Severity: minor, moderate, severe, critical`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a medical coding expert. Extract and categorize injuries with ICD-10 codes.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{"categories":[]}')
  return result.categories || []
}

async function analyzeCausation(chronologyData: any, caseData: any): Promise<CausationAnalysis[]> {
  const prompt = `Analyze causation between the accident and injuries.

Accident Date: ${caseData.incident_date}
Accident Type: ${caseData.case_type}
Accident Description: ${caseData.incident_description || 'Motor vehicle accident'}

Medical Timeline:
${JSON.stringify(chronologyData.events?.slice(0, 10), null, 2)}

For each injury, provide causation analysis as JSON:
[
  {
    "injury": "Right femur fracture",
    "causation_score": 95,
    "causation_strength": "clear",
    "evidence": [
      "Injury documented immediately after accident",
      "Mechanism consistent with collision",
      "ER physician attributed to accident"
    ],
    "temporal_relationship": true,
    "mechanism_consistency": true,
    "physician_opinion": true,
    "alternative_causes": []
  }
]

Score 0-100, strength: weak/moderate/strong/clear`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a medical causation expert. Analyze causal relationships between accidents and injuries.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{"analyses":[]}')
  return result.analyses || []
}

async function detectPreExistingConditions(
  chronologyData: any,
  incidentDate: string
): Promise<PreExistingCondition[]> {
  const prompt = `Identify pre-existing conditions (conditions present before accident).

Accident Date: ${incidentDate}

Medical Records:
${JSON.stringify(chronologyData.events, null, 2)}

Return JSON array:
[
  {
    "condition": "Degenerative disc disease",
    "icd10_code": "M51.36",
    "first_documented": "2023-01-15",
    "is_aggravated": true,
    "aggravation_evidence": [
      "Pain level increased from 3/10 to 8/10 post-accident",
      "New radicular symptoms post-accident"
    ]
  }
]

Look for: "history of", dates before accident, pre-existing diagnoses, chronic conditions`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a medical records analyst. Identify pre-existing conditions and analyze aggravation.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{"conditions":[]}')
  return result.conditions || []
}

async function generateTreatmentPhases(chronologyData: any): Promise<TreatmentPhase[]> {
  const events = chronologyData.events || []
  
  const prompt = `Generate treatment phase narratives from medical chronology.

Medical Events:
${JSON.stringify(events, null, 2)}

Create narrative for each phase:
- initial: Emergency care and initial treatment
- diagnostic: Imaging, tests, specialist consultations
- acute: Surgeries, hospitalizations, intensive treatment
- rehabilitation: Physical therapy, ongoing treatment
- current: Current symptoms and limitations
- prognosis: Future care needs and permanency

Return JSON array:
[
  {
    "phase": "initial",
    "date_range": {"start": "2024-03-15", "end": "2024-03-16"},
    "narrative": "Patient presented to ER...",
    "key_events": ["ER visit", "X-rays", "Discharge"]
  }
]`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a medical-legal writer. Generate clear chronological treatment narratives.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 2000,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{"phases":[]}')
  return result.phases || []
}

async function assessFunctionalImpact(chronologyData: any): Promise<FunctionalImpact[]> {
  const prompt = `Extract functional limitations from medical records.

Medical Records:
${JSON.stringify(chronologyData.events, null, 2)}

Return JSON array by domain:
[
  {
    "domain": "mobility",
    "limitations": ["Unable to walk without assistive device", "Difficulty climbing stairs"],
    "severity": "moderate"
  },
  {
    "domain": "work",
    "limitations": ["Cannot perform lifting duties", "Reduced to light duty"],
    "severity": "severe"
  }
]

Domains: self_care, mobility, work, household, recreation, social
Severity: mild, moderate, severe`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a functional capacity evaluator. Extract activity limitations from medical records.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{"impacts":[]}')
  return result.impacts || []
}

async function generateComparativeAnalysis(
  chronologyData: any,
  incidentDate: string
): Promise<ComparativeAnalysis[]> {
  const prompt = `Compare patient status before and after accident.

Accident Date: ${incidentDate}
Medical Records: ${JSON.stringify(chronologyData.events, null, 2)}

Return JSON comparing pre vs post accident:
[
  {
    "category": "Health Status",
    "pre_accident": "Generally healthy, no significant medical conditions",
    "post_accident": "Multiple injuries requiring ongoing treatment",
    "change_description": "Significant decline in health status"
  },
  {
    "category": "Work Capacity",
    "pre_accident": "Full-time employment, no restrictions",
    "post_accident": "Light duty only, part-time hours",
    "change_description": "Reduced to 50% work capacity"
  }
]

Categories: Health Status, Work Capacity, Physical Function, Quality of Life, Pain Level`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a medical-legal analyst. Compare pre-accident and post-accident status.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.5,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{"comparisons":[]}')
  return result.comparisons || []
}

async function generateExecutiveSummary(data: any): Promise<string> {
  const prompt = `Write a concise executive summary (2-3 paragraphs) for attorneys.

Data:
- Injuries: ${JSON.stringify(data.injuryCategories)}
- Causation: ${JSON.stringify(data.causationAnalyses)}
- Pre-existing: ${JSON.stringify(data.preExistingConditions)}
- Treatment: ${data.treatmentPhases.length} phases
- Functional Impact: ${JSON.stringify(data.functionalImpacts)}

Include:
1. Key injuries and severity
2. Causation strength
3. Pre-existing conditions (if any) and aggravation
4. Treatment summary
5. Current status and prognosis

Professional, factual tone.`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a legal medical consultant. Write clear, concise executive summaries for attorneys.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.6,
    max_tokens: 500,
  })

  return response.choices[0].message.content || 'Executive summary not available.'
}

async function generateFullNarrative(data: any): Promise<string> {
  const sections = []
  
  // Section 1: Injury Summary
  sections.push(`# INJURY SUMMARY\n\n`)
  for (const cat of data.injuryCategories) {
    sections.push(`## ${cat.category} (${cat.severity})\n`)
    cat.injuries.forEach((inj: string, idx: number) => {
      sections.push(`- ${inj} (ICD-10: ${cat.icd10_codes[idx] || 'N/A'})\n`)
    })
    sections.push('\n')
  }
  
  // Section 2: Causation Analysis
  sections.push(`# CAUSATION ANALYSIS\n\n`)
  for (const analysis of data.causationAnalyses) {
    sections.push(`## ${analysis.injury}\n`)
    sections.push(`Causation Strength: **${analysis.causation_strength}** (Score: ${analysis.causation_score}/100)\n\n`)
    sections.push(`Evidence:\n`)
    analysis.evidence.forEach((ev: string) => {
      sections.push(`- ${ev}\n`)
    })
    sections.push('\n')
  }
  
  // Section 3: Pre-Existing Conditions
  if (data.preExistingConditions.length > 0) {
    sections.push(`# PRE-EXISTING CONDITIONS\n\n`)
    for (const cond of data.preExistingConditions) {
      sections.push(`## ${cond.condition} (${cond.icd10_code})\n`)
      sections.push(`First Documented: ${cond.first_documented}\n`)
      sections.push(`Aggravated: ${cond.is_aggravated ? 'Yes' : 'No'}\n`)
      if (cond.is_aggravated && cond.aggravation_evidence.length > 0) {
        sections.push(`\nAggravation Evidence:\n`)
        cond.aggravation_evidence.forEach((ev: string) => {
          sections.push(`- ${ev}\n`)
        })
      }
      sections.push('\n')
    }
  }
  
  // Section 4: Treatment Narrative
  sections.push(`# TREATMENT NARRATIVE\n\n`)
  for (const phase of data.treatmentPhases) {
    sections.push(`## ${phase.phase.charAt(0).toUpperCase() + phase.phase.slice(1)} Phase\n`)
    sections.push(`Period: ${phase.date_range.start} to ${phase.date_range.end || 'Present'}\n\n`)
    sections.push(`${phase.narrative}\n\n`)
  }
  
  // Section 5: Functional Impact
  sections.push(`# FUNCTIONAL IMPACT\n\n`)
  for (const impact of data.functionalImpacts) {
    sections.push(`## ${impact.domain.charAt(0).toUpperCase() + impact.domain.slice(1)} (${impact.severity})\n`)
    impact.limitations.forEach((lim: string) => {
      sections.push(`- ${lim}\n`)
    })
    sections.push('\n')
  }
  
  // Section 6: Comparative Analysis
  sections.push(`# COMPARATIVE ANALYSIS (Pre vs Post Accident)\n\n`)
  sections.push(`| Category | Pre-Accident | Post-Accident | Change |\n`)
  sections.push(`| :-- | :-- | :-- | :-- |\n`)
  for (const comp of data.comparativeAnalysis) {
    sections.push(`| ${comp.category} | ${comp.pre_accident} | ${comp.post_accident} | ${comp.change_description} |\n`)
  }
  
  return sections.join('')
}

