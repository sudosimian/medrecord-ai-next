// Types for Deposition Summary service

export interface DepositionWitness {
  name: string
  role: 'plaintiff' | 'defendant' | 'expert' | 'fact_witness' | 'treating_physician'
  specialty?: string
  deposition_date: string
}

export interface DepositionIssue {
  issue: string
  category: 'liability' | 'causation' | 'damages' | 'treatment' | 'background'
  page_references: number[]
  key_quotes: string[]
}

export interface DepositionQA {
  page: number
  line?: number
  question: string
  answer: string
  significance: 'critical' | 'important' | 'routine'
  tags: string[]
}

export interface DepositionContradiction {
  issue: string
  statement1: {
    text: string
    page: number
    context: string
  }
  statement2: {
    text: string
    page: number
    context: string
  }
  severity: 'minor' | 'moderate' | 'major'
}

export interface DepositionSummary {
  id: string
  case_id: string
  user_id: string
  
  // Deposition metadata
  witness: DepositionWitness
  total_pages: number
  deposition_date: string
  location?: string
  
  // Analysis
  issues: DepositionIssue[]
  qa_pairs: DepositionQA[]
  contradictions: DepositionContradiction[]
  key_admissions: string[]
  key_denials: string[]
  
  // Summaries
  executive_summary: string
  issue_summaries: {
    issue: string
    summary: string
  }[]
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface DepositionRequest {
  case_id: string
  document_id: string // PDF of deposition transcript
  witness_name: string
  witness_role: 'plaintiff' | 'defendant' | 'expert' | 'fact_witness' | 'treating_physician'
  deposition_date: string
}

