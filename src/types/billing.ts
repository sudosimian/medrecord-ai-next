import { Database } from './database'

export type Bill = Database['public']['Tables']['bills']['Row']
export type BillInsert = Database['public']['Tables']['bills']['Insert']

export interface ExtractedBill {
  bill_date: string
  provider_name: string
  service_description: string
  cpt_code?: string
  icd_code?: string
  units?: number
  charge_amount: number
  paid_amount?: number
  balance?: number
  confidence_score: number
}

export interface BillingSummary {
  case_id: string
  total_billed: number
  total_paid: number
  total_balance: number
  num_bills: number
  date_range: {
    start: string
    end: string
  }
  by_provider: ProviderSummary[]
  by_service_type: ServiceTypeSummary[]
  duplicates: DuplicateBill[]
  overcharges: OverchargeBill[]
}

export interface ProviderSummary {
  provider_name: string
  total_billed: number
  num_bills: number
  visit_count: number
}

export interface ServiceTypeSummary {
  service_type: string
  total_billed: number
  num_bills: number
  percentage: number
}

export interface DuplicateBill {
  bill1_id: string
  bill2_id: string
  similarity: number
  type: 'exact' | 'near' | 'unbundling'
  potential_overcharge: number
}

export interface OverchargeBill {
  bill_id: string
  cpt_code: string
  charged_amount: number
  medicare_rate: number
  reasonable_rate: number
  overcharge_amount: number
  overcharge_percentage: number
}

export interface BillProcessingStats {
  total_documents: number
  bills_extracted: number
  duplicates_found: number
  overcharges_found: number
  processing_time: number
}

export const SERVICE_TYPE_CATEGORIES = [
  'Emergency Services',
  'Hospital Inpatient',
  'Hospital Outpatient',
  'Physician Services',
  'Diagnostic Imaging',
  'Laboratory',
  'Physical Therapy',
  'Medications',
  'Medical Equipment',
  'Home Health',
  'Other',
] as const

export type ServiceType = typeof SERVICE_TYPE_CATEGORIES[number]

// Helper functions
export function categorizeServiceType(cptCode: string, description: string): ServiceType {
  const desc = description.toLowerCase()
  
  // Emergency
  if (cptCode.startsWith('99281') || cptCode.startsWith('99282') || 
      cptCode.startsWith('99283') || cptCode.startsWith('99284') || 
      cptCode.startsWith('99285') || desc.includes('emergency')) {
    return 'Emergency Services'
  }
  
  // Hospital Inpatient
  if (cptCode.startsWith('9922') || cptCode.startsWith('9923') || 
      desc.includes('inpatient') || desc.includes('admission')) {
    return 'Hospital Inpatient'
  }
  
  // Imaging (70000-79999)
  if (cptCode >= '70000' && cptCode <= '79999') {
    return 'Diagnostic Imaging'
  }
  
  // Lab (80000-89999)
  if (cptCode >= '80000' && cptCode <= '89999') {
    return 'Laboratory'
  }
  
  // Physical Therapy (97000-97799)
  if (cptCode >= '97000' && cptCode <= '97799') {
    return 'Physical Therapy'
  }
  
  // Surgery (10000-69999)
  if (cptCode >= '10000' && cptCode <= '69999') {
    return 'Hospital Outpatient'
  }
  
  // Medications
  if (desc.includes('medication') || desc.includes('drug') || 
      desc.includes('prescription') || desc.includes('pharmacy')) {
    return 'Medications'
  }
  
  // Medical Equipment
  if (desc.includes('equipment') || desc.includes('durable medical') || 
      desc.includes('wheelchair') || desc.includes('crutches')) {
    return 'Medical Equipment'
  }
  
  // Home Health
  if (desc.includes('home health') || desc.includes('home care')) {
    return 'Home Health'
  }
  
  return 'Other'
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 100 * 10) / 10
}

