import { DemandLetterData, formatCurrency, formatDate, addBusinessDays } from '@/types/demand-letter'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export function generateMedicalExpensesTable(data: DemandLetterData): string {
  let content = `The medical expenses for treatment of injuries that ${data.plaintiff_name} suffered because of the collision amounted to **${formatCurrency(data.total_medical_expenses)}**. Copies of the medical bills are attached and itemized below:\n\n`
  
  content += `| Provider | Amount |\n`
  content += `| :-- | :-- |\n`
  
  // TODO: Would ideally come from billing summary grouped by provider
  // For now, show total
  content += `| Total Medical Expenses | **${formatCurrency(data.total_medical_expenses)}** |\n`
  
  return content
}

export async function generateFutureMedicalExpenses(data: DemandLetterData): Promise<string> {
  const prompt = `Write a paragraph describing future medical needs for a personal injury victim.

Total future medical expenses: ${formatCurrency(data.future_medical_expenses)}

Explain what future treatment may be needed (consultations, therapy, procedures, medications).
Use phrases like "may require" and "may need".
Be specific about types of providers and treatments.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a medical-legal professional. Describe future medical needs professionally.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.6,
    max_tokens: 500,
  })

  let content = response.choices[0].message.content || `${data.plaintiff_name} may require additional medical treatment.`
  
  content += `\n\nThe estimate of medical expenses in the future are as follows:\n\n`
  content += `| Treatment Type | Estimated Cost |\n`
  content += `| :-- | :-- |\n`
  content += `| Total Future Medical Expenses | **${formatCurrency(data.future_medical_expenses)}** |\n`
  
  return content
}

export async function generateLifestyleImpact(data: DemandLetterData): Promise<string> {
  const prompt = `Write a compelling LIFESTYLE IMPACT section for a settlement demand letter.

Plaintiff: ${data.plaintiff_name}

Write 2-3 paragraphs that:
1. Describe the plaintiff's life before the accident (active, peaceful, healthy)
2. Explain ongoing pain and suffering despite treatment
3. Detail specific limitations in daily activities
4. Describe impact on work, hobbies, sleep, relationships
5. Emphasize emotional distress and frustration
6. Explain how the accident changed their quality of life
7. Use empathetic, compelling language

Use phrases like:
- "continues to suffer from"
- "has difficulty performing activities of daily living"
- "struggles to manage"
- "made her life miserable"
- "experiencing distress"
- "at no fault of her own"

Be emotional and persuasive while remaining professional.`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are an experienced personal injury attorney. Write compelling pain and suffering narratives.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.7,
    max_tokens: 800,
  })

  return response.choices[0].message.content || '[Lifestyle impact section to be written]'
}

export function generateDamagesSummaryTable(data: DemandLetterData): string {
  const economicTotal = data.total_medical_expenses + data.future_medical_expenses + 
                       data.past_lost_wages + data.future_lost_wages + data.property_damage
  
  let content = `| Category | Amount |\n`
  content += `| :-- | :-- |\n`
  
  if (data.total_medical_expenses > 0) {
    content += `| Medical expenses | ${formatCurrency(data.total_medical_expenses)} |\n`
  }
  
  if (data.future_medical_expenses > 0) {
    content += `| Future medical expenses | ${formatCurrency(data.future_medical_expenses)} |\n`
  }
  
  if (data.past_lost_wages > 0) {
    content += `| Past lost wages | ${formatCurrency(data.past_lost_wages)} |\n`
  }
  
  if (data.future_lost_wages > 0) {
    content += `| Future loss of earning capacity | ${formatCurrency(data.future_lost_wages)} |\n`
  }
  
  if (data.property_damage > 0) {
    content += `| Property damage | ${formatCurrency(data.property_damage)} |\n`
  }
  
  content += `| Lifestyle impact/loss of activities | $ |\n`
  content += `| Pain and suffering | $ |\n`
  
  return content
}

export function generateConclusion(data: DemandLetterData, demandType: string): string {
  const deadline = addBusinessDays(new Date(), 30)
  const deadlineStr = formatDate(deadline.toISOString())
  
  let content = ''
  
  if (demandType === 'stowers') {
    content += `We recognize that your insured maintained policy limits of **${formatCurrency(data.demand_amount)}** in available liability coverage to respond to this incident. `
    content += `This is a formal **Stowers demand** for the full policy limits. `
  } else if (demandType === 'uim') {
    content += `This is a demand under the underinsured motorist (UIM) provision of my client's insurance policy. `
  } else {
    if (data.demand_amount >= 100000) {
      content += `We recognize that your insured maintained available liability coverage to respond to this incident. `
    }
  }
  
  content += `In the spirit of compromise and in an effort to resolve this matter without the time and expense necessarily involved in formal litigation, I have been authorized by my client to demand settlement in the amount of **${formatCurrency(data.demand_amount)}** to fully and fairly resolve this claim.\n\n`
  
  if (demandType === 'stowers') {
    content += `**This is a time-limited offer.** If this demand is not accepted by ${deadlineStr}, this offer will be withdrawn and we will proceed with litigation. By rejecting this demand within policy limits, you expose your insured to personal liability for any judgment in excess of the policy limits.\n\n`
  }
  
  content += `I trust that your reasonable evaluation of this file will lead to a settlement and you will not subject your insured to the litigation process. `
  content += `Please contact me directly to discuss this matter. If we do not receive a satisfactory response by ${deadlineStr}, we are prepared to file a lawsuit to protect our client's rights.\n\n`
  
  content += `This letter is intended for settlement purposes only and shall not be deemed admissible pursuant to applicable rules of evidence.\n\n`
  
  content += `Sincerely,\n\n`
  content += `${data.attorney_name || '[Attorney Name]'}  \n`
  content += `[Law Firm Name]  \n`
  content += `[Contact Information]\n\n`
  
  content += `Enclosures: Medical Records and Bills\n`
  content += `cc: Client File`
  
  return content
}

export function generateExhibitsList(data: DemandLetterData): string {
  let content = `| Exhibit | Description |\n`
  content += `| :-- | :-- |\n`
  content += `| Exhibit 1 | Police Report / Accident Report |\n`
  content += `| Exhibit 2 | Medical Records |\n`
  content += `| Exhibit 3 | Medical Bills |\n`
  
  if (data.past_lost_wages > 0) {
    content += `| Exhibit 4 | Wage Loss Documentation |\n`
  }
  
  if (data.property_damage > 0) {
    content += `| Exhibit 5 | Property Damage Estimates/Photos |\n`
  }
  
  return content
}

