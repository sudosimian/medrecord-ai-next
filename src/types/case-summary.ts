export interface CaseSummaryData {
  case_id: string
  case_number: string
  patient_name: string
  incident_date: string
  incident_type: string
  
  // Input data from other services
  chronology_events?: number
  total_medical_expenses?: number
  total_bills?: number
  narrative_available?: boolean
  deposition_count?: number
  
  // Generated summary sections
  executive_overview: string
  liability_assessment: {
    strength: 'Weak' | 'Moderate' | 'Strong' | 'Compelling'
    score: number // 0-100
    factors: string[]
  }
  injury_summary: {
    severity: 'Minor' | 'Moderate' | 'Severe' | 'Catastrophic'
    key_injuries: string[]
    treatment_duration_days: number
    permanent_impairment: boolean
  }
  damages_overview: {
    total_medical: number
    projected_future_medical: number
    lost_wages: number
    economic_total: number
    non_economic_estimate: number
    total_damages_range: {
      low: number
      high: number
    }
  }
  settlement_analysis: {
    recommended_demand: number
    expected_settlement_range: {
      low: number
      high: number
    }
    comparable_cases_average: number
    policy_limits?: number
  }
  key_strengths: string[]
  key_weaknesses: string[]
  critical_action_items: string[]
  case_readiness: {
    discovery_complete: boolean
    medical_records_complete: boolean
    expert_opinions_needed: string[]
    estimated_trial_date?: string
  }
  roi_analysis: {
    attorney_hours_invested: number
    costs_advanced: number
    estimated_fee: number
    estimated_net_recovery: number
  }
}

export interface CaseSummaryResponse {
  id: string
  case_id: string
  summary_data: CaseSummaryData
  generated_text: string
  created_at: string
}

