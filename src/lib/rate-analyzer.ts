import { OverchargeBill } from '@/types/billing'

// Medicare rate multipliers by region (simplified)
// Real implementation would query CMS Physician Fee Schedule database
const MEDICARE_RATES: Record<string, number> = {
  // Emergency Room visits
  '99281': 60,
  '99282': 100,
  '99283': 150,
  '99284': 250,
  '99285': 400,
  
  // Office visits
  '99201': 45,
  '99202': 75,
  '99203': 110,
  '99204': 165,
  '99205': 210,
  '99211': 25,
  '99212': 55,
  '99213': 90,
  '99214': 130,
  '99215': 180,
  
  // Hospital visits
  '99221': 95,
  '99222': 155,
  '99223': 210,
  
  // Imaging (examples)
  '70450': 125, // CT head without contrast
  '70553': 400, // MRI brain with contrast
  '71045': 35,  // Chest X-ray
  '71046': 45,  // Chest X-ray multiple views
  '72148': 275, // MRI lumbar spine
  '73221': 85,  // MRI joint upper extremity
  
  // Lab (examples)
  '80053': 15,  // Comprehensive metabolic panel
  '85025': 10,  // Complete blood count
  '85027': 12,  // Complete blood count with diff
  
  // Physical therapy
  '97110': 30,  // Therapeutic exercise
  '97140': 28,  // Manual therapy
  '97530': 32,  // Therapeutic activities
}

const COMMERCIAL_MULTIPLIER = 2.0 // Commercial rates typically 1.5-3x Medicare

export interface RateAnalysisResult {
  cpt_code: string
  charged_amount: number
  medicare_rate: number
  reasonable_rate: number
  is_overcharge: boolean
  overcharge_amount: number
  overcharge_percentage: number
}

export function analyzeBillRate(
  cptCode: string,
  chargedAmount: number
): RateAnalysisResult {
  const medicareRate = getMedicareRate(cptCode)
  const reasonableRate = medicareRate * COMMERCIAL_MULTIPLIER
  const threshold = reasonableRate * 1.5 // 50% above reasonable is overcharge
  
  const isOvercharge = chargedAmount > threshold
  const overchargeAmount = isOvercharge ? chargedAmount - reasonableRate : 0
  const overchargePercentage = isOvercharge 
    ? ((chargedAmount - reasonableRate) / reasonableRate) * 100 
    : 0

  return {
    cpt_code: cptCode,
    charged_amount: chargedAmount,
    medicare_rate: medicareRate,
    reasonable_rate: reasonableRate,
    is_overcharge: isOvercharge,
    overcharge_amount: overchargeAmount,
    overcharge_percentage: Math.round(overchargePercentage),
  }
}

export function getMedicareRate(cptCode: string): number {
  // Look up actual Medicare rate
  if (MEDICARE_RATES[cptCode]) {
    return MEDICARE_RATES[cptCode]
  }
  
  // Estimate based on CPT code range
  const code = parseInt(cptCode)
  
  // Evaluation & Management (99201-99499)
  if (code >= 99201 && code <= 99499) {
    return 100 // Average E&M
  }
  
  // Surgery (10000-69999)
  if (code >= 10000 && code <= 69999) {
    if (code >= 10000 && code <= 19999) return 300 // Integumentary
    if (code >= 20000 && code <= 29999) return 500 // Musculoskeletal
    if (code >= 30000 && code <= 39999) return 800 // Respiratory
    if (code >= 40000 && code <= 49999) return 600 // Digestive
    if (code >= 50000 && code <= 59999) return 700 // Urinary
    if (code >= 60000 && code <= 69999) return 400 // Endocrine
    return 500 // Default surgery
  }
  
  // Radiology (70000-79999)
  if (code >= 70000 && code <= 79999) {
    if (code >= 70000 && code <= 70559) return 200 // CT
    if (code >= 71000 && code <= 71555) return 150 // Chest imaging
    if (code >= 72000 && code <= 72295) return 180 // Spine imaging
    if (code >= 73000 && code <= 73725) return 160 // Extremity imaging
    return 175 // Default radiology
  }
  
  // Pathology & Lab (80000-89999)
  if (code >= 80000 && code <= 89999) {
    return 20 // Average lab test
  }
  
  // Medicine (90000-99199)
  if (code >= 90000 && code <= 99199) {
    if (code >= 90281 && code <= 90399) return 150 // Immunizations
    if (code >= 90460 && code <= 90474) return 30 // Immunization admin
    if (code >= 90700 && code <= 90749) return 50 // Vaccines
    if (code >= 97000 && code <= 97799) return 30 // Physical therapy
    return 75 // Default medicine
  }
  
  // Unknown CPT - estimate conservatively
  return 100
}

export function identifyOvercharges(
  bills: Array<{ cpt_code?: string; charge_amount: number; id: string }>
): OverchargeBill[] {
  const overcharges: OverchargeBill[] = []

  for (const bill of bills) {
    if (!bill.cpt_code) continue

    const analysis = analyzeBillRate(bill.cpt_code, bill.charge_amount)
    
    if (analysis.is_overcharge) {
      overcharges.push({
        bill_id: bill.id,
        cpt_code: bill.cpt_code,
        charged_amount: bill.charge_amount,
        medicare_rate: analysis.medicare_rate,
        reasonable_rate: analysis.reasonable_rate,
        overcharge_amount: analysis.overcharge_amount,
        overcharge_percentage: analysis.overcharge_percentage,
      })
    }
  }

  return overcharges
}

