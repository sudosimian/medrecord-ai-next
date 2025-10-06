// TypeScript types for database tables

export type UserRole = 'admin' | 'user' | 'viewer'
export type CaseType = 'personal_injury' | 'workers_comp' | 'medical_malpractice' | 'other'
export type CaseStatus = 'active' | 'closed' | 'archived'
export type DocumentType = 'medical_record' | 'bill' | 'imaging' | 'lab_report' | 'deposition' | 'legal' | 'other'
export type AnalysisType = 'chronology' | 'billing' | 'demand_letter' | 'narrative' | 'medical_opinion' | 'deposition'
export type LegalDocumentType = 'demand_letter' | 'expert_opinion' | 'narrative_summary' | 'deposition_summary'
export type LegalDocumentStatus = 'draft' | 'review' | 'final'
export type AnnotationType = 'highlight' | 'note' | 'redaction'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Patient {
  id: string
  user_id: string
  first_name: string
  last_name: string
  date_of_birth: string | null
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Case {
  id: string
  user_id: string
  patient_id: string
  case_number: string | null
  case_type: CaseType | null
  incident_date: string | null
  status: CaseStatus
  attorney_name: string | null
  insurance_company: string | null
  claim_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  patient_id: string | null
  case_id: string | null
  storage_path: string
  file_name: string
  file_size: number | null
  file_type: string | null
  document_type: DocumentType | null
  page_count: number | null
  extracted_text: string | null
  ocr_completed: boolean
  classified: boolean
  created_at: string
  updated_at: string
}

export interface MedicalEvent {
  id: string
  case_id: string
  document_id: string | null
  event_date: string
  event_time: string | null
  provider_name: string | null
  facility: string | null
  event_type: string | null
  description: string
  significance_score: number | null
  icd_codes: string[] | null
  cpt_codes: string[] | null
  is_duplicate: boolean
  created_at: string
  updated_at: string
}

export interface Bill {
  id: string
  case_id: string
  document_id: string | null
  provider_name: string | null
  bill_date: string | null
  service_date: string | null
  bill_amount: number | null
  paid_amount: number | null
  outstanding_amount: number | null
  cpt_code: string | null
  description: string | null
  is_duplicate: boolean
  is_reasonable: boolean | null
  medicare_rate: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface AIAnalysis {
  id: string
  case_id: string
  analysis_type: AnalysisType
  input_data: Record<string, unknown> | null
  output_data: Record<string, unknown> | null
  ai_model: string | null
  confidence_score: number | null
  reviewed: boolean
  created_at: string
  updated_at: string
}

export interface LegalDocument {
  id: string
  case_id: string
  document_type: LegalDocumentType
  content: Record<string, unknown> | null
  exported_path: string | null
  status: LegalDocumentStatus
  created_at: string
  updated_at: string
}

export interface Annotation {
  id: string
  user_id: string
  document_id: string
  page_number: number | null
  x_position: number | null
  y_position: number | null
  width: number | null
  height: number | null
  annotation_type: AnnotationType
  content: string | null
  created_at: string
  updated_at: string
}

// Database helper types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      patients: {
        Row: Patient
        Insert: Omit<Patient, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>
      }
      cases: {
        Row: Case
        Insert: Omit<Case, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Case, 'id' | 'created_at' | 'updated_at'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at'>>
      }
      medical_events: {
        Row: MedicalEvent
        Insert: Omit<MedicalEvent, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MedicalEvent, 'id' | 'created_at' | 'updated_at'>>
      }
      bills: {
        Row: Bill
        Insert: Omit<Bill, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Bill, 'id' | 'created_at' | 'updated_at'>>
      }
      ai_analyses: {
        Row: AIAnalysis
        Insert: Omit<AIAnalysis, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AIAnalysis, 'id' | 'created_at' | 'updated_at'>>
      }
      legal_documents: {
        Row: LegalDocument
        Insert: Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<LegalDocument, 'id' | 'created_at' | 'updated_at'>>
      }
      annotations: {
        Row: Annotation
        Insert: Omit<Annotation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Annotation, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}

