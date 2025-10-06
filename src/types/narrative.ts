// Types for Narrative Summary service

export interface InjuryCategory {
  category: string // e.g., "Musculoskeletal", "Neurological"
  injuries: string[]
  icd10_codes: string[]
  severity: 'minor' | 'moderate' | 'severe' | 'critical'
}

export interface CausationAnalysis {
  injury: string
  causation_score: number // 0-100
  causation_strength: 'weak' | 'moderate' | 'strong' | 'clear'
  evidence: string[]
  temporal_relationship: boolean
  mechanism_consistency: boolean
  physician_opinion: boolean
  alternative_causes: string[]
}

export interface PreExistingCondition {
  condition: string
  icd10_code: string
  first_documented: string // ISO date
  is_aggravated: boolean
  aggravation_evidence: string[]
}

export interface TreatmentPhase {
  phase: 'initial' | 'diagnostic' | 'acute' | 'rehabilitation' | 'current' | 'prognosis'
  date_range: {
    start: string
    end: string | null
  }
  narrative: string
  key_events: string[]
}

export interface FunctionalImpact {
  domain: 'self_care' | 'mobility' | 'work' | 'household' | 'recreation' | 'social'
  limitations: string[]
  severity: 'mild' | 'moderate' | 'severe'
}

export interface ComparativeAnalysis {
  category: string
  pre_accident: string
  post_accident: string
  change_description: string
}

export interface NarrativeSummary {
  id: string
  case_id: string
  user_id: string
  
  // Core data
  injury_categories: InjuryCategory[]
  causation_analyses: CausationAnalysis[]
  pre_existing_conditions: PreExistingCondition[]
  treatment_phases: TreatmentPhase[]
  functional_impacts: FunctionalImpact[]
  comparative_analysis: ComparativeAnalysis[]
  
  // Generated text
  executive_summary: string
  full_narrative: string
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface NarrativeRequest {
  case_id: string
  chronology_id?: string
  focus_areas?: ('causation' | 'pre_existing' | 'functional' | 'comparative')[]
}

