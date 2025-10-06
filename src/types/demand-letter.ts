import { Database } from './database'

export type LegalDocument = Database['public']['Tables']['legal_documents']['Row']
export type LegalDocumentInsert = Database['public']['Tables']['legal_documents']['Insert']

export interface DemandLetterRequest {
  case_id: string
  demand_type: 'standard' | 'uim' | 'stowers'
  include_exhibits: boolean
  policy_limit?: number
  deadline_days?: number
}

export interface DemandLetterData {
  case_id: string
  case_type: string
  case_number: string
  
  // Parties
  plaintiff_name: string
  defendant_name?: string
  attorney_name?: string
  insurance_company?: string
  claim_number?: string
  
  // Incident
  incident_date: string
  incident_location?: string
  incident_description?: string
  
  // Medical
  chronology_summary: string
  total_medical_expenses: number
  future_medical_expenses: number
  
  // Damages
  past_lost_wages: number
  future_lost_wages: number
  property_damage: number
  pain_suffering_multiplier: number
  
  // Liability
  liability_theory?: string
  defendant_negligence?: string
  causation_statement?: string
  
  // Settlement
  demand_amount: number
  comparable_cases?: ComparableCase[]
}

export interface ComparableCase {
  jurisdiction: string
  year: number
  case_name: string
  injury_type: string
  verdict_amount: number
  settlement_amount?: number
  source: string
}

export interface DamagesCalculation {
  economic: {
    past_medical: number
    future_medical: number
    past_wages: number
    future_wages: number
    property: number
    total: number
  }
  non_economic: {
    pain_suffering: number
    emotional_distress: number
    loss_of_enjoyment: number
    total: number
  }
  total: number
  demand_multiplier: number
  recommended_demand: number
}

export interface DemandLetterSection {
  title: string
  content: string
  order: number
  is_required: boolean
}

export interface DemandLetterTemplate {
  type: 'standard' | 'uim' | 'stowers'
  sections: DemandLetterSection[]
  required_fields: string[]
}

// Demand Letter Types
export const DEMAND_LETTER_TYPES = {
  standard: {
    name: 'Standard Settlement Demand',
    description: 'Traditional demand letter for insurance claims',
    deadline: null,
  },
  uim: {
    name: 'Underinsured Motorist (UIM) Demand',
    description: 'Demand to own insurance for UIM coverage',
    deadline: null,
  },
  stowers: {
    name: 'Stowers Demand',
    description: 'Time-limited demand with excess liability warning',
    deadline: 30, // days
  },
} as const

// Case Types for template selection
export const CASE_TYPES = {
  personal_injury: 'Personal Injury',
  motor_vehicle: 'Motor Vehicle Accident',
  slip_and_fall: 'Slip and Fall / Premises Liability',
  medical_malpractice: 'Medical Malpractice',
  product_liability: 'Product Liability',
  workers_comp: 'Workers\' Compensation',
  dog_bite: 'Dog Bite',
  wrongful_death: 'Wrongful Death',
} as const

// Injury Severity Levels
export const INJURY_SEVERITY = {
  minor: { level: 1, multiplier: 1.5, description: 'Minor injuries, full recovery' },
  moderate: { level: 2, multiplier: 2.5, description: 'Moderate injuries, some permanency' },
  severe: { level: 3, multiplier: 3.5, description: 'Severe injuries, significant permanency' },
  catastrophic: { level: 4, multiplier: 5.0, description: 'Life-altering injuries' },
} as const

// Liability Strength
export const LIABILITY_STRENGTH = {
  weak: { score: 0.3, multiplier: 1.5 },
  moderate: { score: 0.6, multiplier: 2.5 },
  strong: { score: 0.8, multiplier: 3.0 },
  clear: { score: 1.0, multiplier: 3.5 },
} as const

// Helper functions
export function calculateDamages(data: {
  past_medical: number
  future_medical: number
  past_wages: number
  future_wages: number
  property: number
  injury_severity: keyof typeof INJURY_SEVERITY
  liability_strength: keyof typeof LIABILITY_STRENGTH
}): DamagesCalculation {
  // Economic damages
  const economic = {
    past_medical: data.past_medical,
    future_medical: data.future_medical,
    past_wages: data.past_wages,
    future_wages: data.future_wages,
    property: data.property,
    total: data.past_medical + data.future_medical + data.past_wages + data.future_wages + data.property,
  }

  // Non-economic damages (pain & suffering)
  const severity = INJURY_SEVERITY[data.injury_severity]
  const painSuffering = economic.past_medical * severity.multiplier
  
  const non_economic = {
    pain_suffering: painSuffering,
    emotional_distress: painSuffering * 0.3,
    loss_of_enjoyment: painSuffering * 0.2,
    total: painSuffering * 1.5,
  }

  const total = economic.total + non_economic.total

  // Demand multiplier based on liability
  const liability = LIABILITY_STRENGTH[data.liability_strength]
  const demandMultiplier = liability.multiplier

  const recommendedDemand = total * demandMultiplier

  return {
    economic,
    non_economic,
    total: Math.round(total),
    demand_multiplier: demandMultiplier,
    recommended_demand: Math.round(recommendedDemand),
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date)
  let daysAdded = 0

  while (daysAdded < days) {
    result.setDate(result.getDate() + 1)
    const dayOfWeek = result.getDay()
    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      daysAdded++
    }
  }

  return result
}

