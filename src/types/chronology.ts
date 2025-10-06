export interface MedicalEvent {
  id: string
  case_id: string
  document_id?: string
  event_date: string
  event_time?: string
  provider_name?: string
  facility?: string
  event_type?: string
  description: string
  significance_score?: number // 1-5
  icd_codes?: string[]
  cpt_codes?: string[]
  is_duplicate: boolean
  created_at: string
  updated_at: string
}

export interface ExtractedEvent {
  date: string
  time?: string
  provider?: string
  facility?: string
  eventType?: string
  description: string
  significance?: number
  icdCodes?: string[]
  cptCodes?: string[]
  sourceText?: string
  confidence?: number
}

export interface ChronologyRequest {
  caseId: string
  documentIds: string[]
  options?: {
    includeDuplicates?: boolean
    minSignificance?: number
    extractCodes?: boolean
  }
}

export interface ChronologyResponse {
  events: MedicalEvent[]
  stats: {
    totalEvents: number
    duplicatesFound: number
    processingTime: number
  }
}

export type SignificanceLevel = 'critical' | 'important' | 'routine' | 'administrative'

export const getSignificanceLevel = (score?: number): SignificanceLevel => {
  if (!score) return 'routine'
  if (score >= 4) return 'critical'
  if (score >= 3) return 'important'
  if (score >= 2) return 'routine'
  return 'administrative'
}

export const getSignificanceColor = (level: SignificanceLevel): string => {
  const colors = {
    critical: 'bg-red-100 text-red-800',
    important: 'bg-yellow-100 text-yellow-800',
    routine: 'bg-green-100 text-green-800',
    administrative: 'bg-gray-100 text-gray-800',
  }
  return colors[level]
}

