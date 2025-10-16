import OpenAI from 'openai'
import { DemandLetterData, DemandLetterSection, formatCurrency, formatDate } from '@/types/demand-letter'
import { 
  generateMedicalExpensesTable, 
  generateFutureMedicalExpenses, 
  generateLifestyleImpact,
  generateDamagesSummaryTable,
  generateConclusion,
  generateExhibitsList
} from './demand-letter-helpers'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getStatutes, getCaseLaw } from './westlaw'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Generate a professional settlement demand letter
 * Based on industry-standard format from MedSum Legal
 * Reference: https://medsumlegal.com/wp-content/uploads/2020/07/Personal-Injury-Settlement-Demand-Letter__MedSum-Legal.pdf
 */
export async function generateDemandLetter(data: DemandLetterData, demandType: 'standard' | 'uim' | 'stowers'): Promise<{
  sections: DemandLetterSection[]
  full_text: string
}> {
  const sections: DemandLetterSection[] = []

  // 1. Header with RE: line
  sections.push({
    title: 'HEADER',
    content: generateHeader(data),
    order: 1,
    is_required: true,
  })

  // 2. Introduction paragraph
  sections.push({
    title: 'INTRODUCTION',
    content: await generateIntroduction(data, demandType),
    order: 2,
    is_required: true,
  })

  // 3. Facts and Liability
  sections.push({
    title: 'FACTS AND LIABILITY',
    content: await generateLiabilitySection(data),
    order: 3,
    is_required: true,
  })

  // 4. Property Damage (if applicable)
  if (data.property_damage > 0) {
    sections.push({
      title: 'PROPERTY DAMAGE',
      content: await generatePropertyDamageSection(data),
      order: 4,
      is_required: false,
    })
  }

  // 5. Summary of Physical Injuries (ICD-10 codes)
  sections.push({
    title: 'SUMMARY OF PHYSICAL INJURIES',
    content: await generateInjuriesSummary(data),
    order: 5,
    is_required: true,
  })

  // 6. Treatment of Injuries (chronological narrative)
  sections.push({
    title: 'TREATMENT OF INJURIES',
    content: await generateTreatmentNarrative(data),
    order: 6,
    is_required: true,
  })

  // 7. Medical Expenses (itemized table)
  sections.push({
    title: 'MEDICAL EXPENSES',
    content: generateMedicalExpensesTable(data),
    order: 7,
    is_required: true,
  })

  // 8. Future Medical Expenses (if applicable)
  if (data.future_medical_expenses > 0) {
    sections.push({
      title: 'FUTURE MEDICAL EXPENSES',
      content: await generateFutureMedicalExpenses(data),
      order: 8,
      is_required: false,
    })
  }

  // 9. Lifestyle Impact (pain & suffering)
  sections.push({
    title: 'LIFESTYLE IMPACT',
    content: await generateLifestyleImpact(data),
    order: 9,
    is_required: true,
  })

  // 10. Summary of Damages (table)
  sections.push({
    title: 'SUMMARY OF DAMAGES',
    content: generateDamagesSummaryTable(data),
    order: 10,
    is_required: true,
  })

  // 11. Conclusion (demand and deadline)
  sections.push({
    title: 'CONCLUSION',
    content: generateConclusion(data, demandType),
    order: 11,
    is_required: true,
  })

  // 12. Exhibits list
  sections.push({
    title: 'EXHIBITS',
    content: generateExhibitsList(data),
    order: 12,
    is_required: true,
  })

  const fullText = sections.map(s => `# ${s.title}\n\n${s.content}`).join('\n\n---\n\n')

  return {
    sections,
    full_text: fullText,
  }
}

function generateHeader(data: DemandLetterData): string {
  const today = formatDate(new Date().toISOString())
  
  return `# SETTLEMENT DEMAND
**${today}**

## Addressee:
${data.insurance_company || '[Insurance Company]'}  
Claims Department  
[Address]  
[City, State ZIP]

| Re: | My Client | ${data.plaintiff_name} |
| :-- | :-- | :-- |
|  | Your Insured: | ${data.defendant_name || '[Defendant Name]'} |
|  | Claim Number: | ${data.claim_number || '[Claim Number]'} |
|  | Incident Date: | ${formatDate(data.incident_date)} |

Dear Claims Representative:`
}

async function generateIntroduction(data: DemandLetterData, demandType: string): Promise<string> {
  return `Please consider this correspondence as my client's demand for the full and final resolution of the above referenced claim.`
}

async function generatePropertyDamageSection(data: DemandLetterData): Promise<string> {
  const prompt = `Write a brief property damage section for a demand letter.

Incident date: ${formatDate(data.incident_date)}
Property damage amount: ${formatCurrency(data.property_damage)}

Describe the property damage sustained (vehicle damage, personal property, etc.). 
Keep it to 1-2 sentences. Be factual and specific.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an experienced personal injury attorney. Write clear, factual descriptions of property damage.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 200,
  })

  return response.choices[0].message.content || `On ${formatDate(data.incident_date)}, property damage occurred in the amount of ${formatCurrency(data.property_damage)}.`
}

async function generateLiabilitySection(data: DemandLetterData): Promise<string> {
  // Query Westlaw for relevant statutes before composing the liability section
  const incidentQuery = `${data.incident_description || 'Motor vehicle accident'} ${data.case_type || 'personal injury'} negligence`
  const statutes = await getStatutes(incidentQuery)
  
  const prompt = `Write the LIABILITY section for a settlement demand letter.

Incident details:
${data.incident_description || 'Motor vehicle accident'}

Defendant: ${data.defendant_name || '[Defendant]'}
Incident date: ${formatDate(data.incident_date)}
${data.incident_location ? `Location: ${data.incident_location}` : ''}

Write 2-3 paragraphs that:
1. Describe how the accident occurred
2. Explain the defendant's negligence or fault
3. Establish causation (defendant's actions caused the injuries)
4. Cite applicable law or legal standards if relevant
5. Be factual, detailed, and persuasive

Use strong, confident language. This should make clear liability rests with the defendant.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an experienced personal injury attorney. Write compelling, factual liability arguments.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 800,
  })

  let liabilityContent = response.choices[0].message.content || '[Liability section to be written]'
  
  // Append relevant law citations if any were found
  if (statutes.length > 0) {
    liabilityContent += '\n\n## Relevant Law\n\n'
    liabilityContent += 'The following statutes are applicable to this matter:\n\n'
    
    statutes.forEach((statute, index) => {
      liabilityContent += `${index + 1}. **${statute.citation}**`
      if (statute.description) {
        liabilityContent += ` - ${statute.description}`
      }
      liabilityContent += '\n'
    })
  }
  
  return liabilityContent
}

async function generateInjuriesSummary(data: DemandLetterData): Promise<string> {
  const prompt = `Based on the medical chronology, extract a bulleted list of injuries with ICD-10 codes.

Medical chronology:
${data.chronology_summary}

Format as:
- ICD-10 CODE Description of injury
- ICD-10 CODE Description of injury

Example:
- G44.309 Post-traumatic headache
- M54.2 Cervicalgia
- S13.4XXA Sprain of cervical spine

Extract all relevant injuries. Be specific and use proper ICD-10 coding.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a medical coding expert. Extract injuries with accurate ICD-10 codes.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    max_tokens: 800,
  })

  const injuries = response.choices[0].message.content || 'Injuries to be determined from medical records.'
  
  return `As a result of the collision, ${data.plaintiff_name} sustained the following injuries:\n\n${injuries}`
}

async function generateTreatmentNarrative(data: DemandLetterData): Promise<string> {
  const prompt = `Write a detailed chronological narrative of medical treatment for a demand letter.

Medical chronology:
${data.chronology_summary}

Write multiple paragraphs (one per significant visit) that:
1. Start each paragraph with the date
2. Name the provider and facility
3. Describe complaints/symptoms reported
4. Detail examination findings
5. List diagnoses
6. Describe treatment provided
7. Include follow-up recommendations

Use this format:
"On [DATE], [PATIENT] was examined by [PROVIDER], at [FACILITY] for the complaints of having [SYMPTOMS]. On examination, [FINDINGS]. She/He was diagnosed with [DIAGNOSES]. She/He was prescribed [TREATMENT]. She/He was recommended to [FOLLOW-UP]."

Be detailed, factual, and use medical terminology. Write in past tense, third person.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a medical-legal professional. Write detailed chronological treatment narratives using proper medical terminology.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 2000,
  })

  return response.choices[0].message.content || '[Treatment narrative to be written from medical chronology]'
}

