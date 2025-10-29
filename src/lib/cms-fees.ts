/**
 * CMS Fee Schedule Lookup
 * 
 * PURPOSE: Provides CMS Medicare fee schedule data for CPT codes by geographic locality.
 * Used to analyze reasonableness of medical charges in personal injury cases.
 * 
 * LEGAL CONTEXT:
 * CMS fee schedules are often used as benchmarks for "reasonable and customary" charges
 * in personal injury litigation. While not binding for private pay cases, they provide
 * an objective baseline for evaluating whether billed charges are excessive.
 * 
 * IMPLEMENTATION:
 * Currently uses in-memory demo data. In production, this should be replaced with:
 * - CMS Physician Fee Schedule API
 * - Cached database table with annual updates
 * - Geographic locality-specific adjustments (GPCIs)
 * 
 * CMS FEE SCHEDULE INFO:
 * - Updated annually (usually January)
 * - Varies by locality (MAC region + state)
 * - Includes facility vs. non-facility rates
 * - Subject to geographic practice cost indices (GPCIs)
 * 
 * RESOURCES:
 * - CMS Physician Fee Schedule: https://www.cms.gov/medicare/physician-fee-schedule
 * - Fee Schedule Lookup: https://www.cms.gov/medicare/physician-fee-schedule/search
 * - GPCI Data: https://www.cms.gov/medicare/payment/fee-schedules/physician
 */

/**
 * CMS fee lookup parameters
 */
export interface CMSFeeParams {
  cpt: string;           // CPT code (e.g., "99213", "72148")
  locality: string;      // CMS locality code (e.g., "CA-LA", "NY-Manhattan")
  year?: number;         // Fee schedule year (defaults to current)
  facility?: boolean;    // Facility vs. non-facility rate (defaults to non-facility)
}

/**
 * CMS fee schedule entry
 */
export interface CMSFeeEntry {
  cpt: string;
  locality: string;
  year: number;
  nonFacilityFee: number;    // Non-facility payment amount
  facilityFee: number;       // Facility payment amount
  description: string;       // CPT description
  rvuWork?: number;          // Work RVU (optional)
  rvuPractice?: number;      // Practice expense RVU (optional)
  rvuMalpractice?: number;   // Malpractice RVU (optional)
}

/**
 * Demo CMS fee schedule data
 * 
 * NOTE: These are illustrative values based on typical Medicare rates.
 * REPLACE WITH: Real CMS fee schedule data pulled from CMS API or cached database.
 * 
 * CPT CODES INCLUDED:
 * - 99213: Office visit, established patient, level 3
 * - 72148: MRI lumbar spine without contrast
 * - 97110: Therapeutic exercises (per 15 min)
 * - 73030: X-ray shoulder, 2 views
 * - 99204: Office visit, new patient, level 4
 * - 29827: Arthroscopy, shoulder, surgical
 * - 97035: Ultrasound therapy
 * - 99285: Emergency department visit, high severity
 */
const DEMO_CMS_FEES: Record<string, Record<string, CMSFeeEntry>> = {
  // Locality: CA-LA (Los Angeles, California)
  'CA-LA': {
    '99213': {
      cpt: '99213',
      locality: 'CA-LA',
      year: 2024,
      nonFacilityFee: 112.00,
      facilityFee: 93.00,
      description: 'Office/outpatient visit, established patient, 20-29 minutes',
      rvuWork: 1.30,
      rvuPractice: 1.51,
      rvuMalpractice: 0.11,
    },
    '72148': {
      cpt: '72148',
      locality: 'CA-LA',
      year: 2024,
      nonFacilityFee: 245.00,
      facilityFee: 245.00,
      description: 'MRI lumbar spine without contrast',
      rvuWork: 1.00,
      rvuPractice: 13.15,
      rvuMalpractice: 0.78,
    },
    '97110': {
      cpt: '97110',
      locality: 'CA-LA',
      year: 2024,
      nonFacilityFee: 36.00,
      facilityFee: 34.00,
      description: 'Therapeutic exercises, each 15 minutes',
      rvuWork: 0.45,
      rvuPractice: 0.55,
      rvuMalpractice: 0.04,
    },
    '73030': {
      cpt: '73030',
      locality: 'CA-LA',
      year: 2024,
      nonFacilityFee: 45.00,
      facilityFee: 45.00,
      description: 'X-ray shoulder, minimum 2 views',
      rvuWork: 0.20,
      rvuPractice: 2.00,
      rvuMalpractice: 0.06,
    },
    '99204': {
      cpt: '99204',
      locality: 'CA-LA',
      year: 2024,
      nonFacilityFee: 185.00,
      facilityFee: 157.00,
      description: 'Office/outpatient visit, new patient, 45-59 minutes',
      rvuWork: 2.60,
      rvuPractice: 2.88,
      rvuMalpractice: 0.23,
    },
    '29827': {
      cpt: '29827',
      locality: 'CA-LA',
      year: 2024,
      nonFacilityFee: 1250.00,
      facilityFee: 1250.00,
      description: 'Arthroscopy, shoulder, surgical; with rotator cuff repair',
      rvuWork: 14.32,
      rvuPractice: 52.15,
      rvuMalpractice: 8.95,
    },
    '97035': {
      cpt: '97035',
      locality: 'CA-LA',
      year: 2024,
      nonFacilityFee: 20.00,
      facilityFee: 18.00,
      description: 'Ultrasound therapy, each 15 minutes',
      rvuWork: 0.22,
      rvuPractice: 0.28,
      rvuMalpractice: 0.02,
    },
    '99285': {
      cpt: '99285',
      locality: 'CA-LA',
      year: 2024,
      nonFacilityFee: 320.00,
      facilityFee: 215.00,
      description: 'Emergency department visit, high severity',
      rvuWork: 3.50,
      rvuPractice: 4.12,
      rvuMalpractice: 0.58,
    },
  },
  // Locality: NY-Manhattan (New York City)
  'NY-Manhattan': {
    '99213': {
      cpt: '99213',
      locality: 'NY-Manhattan',
      year: 2024,
      nonFacilityFee: 125.00,
      facilityFee: 105.00,
      description: 'Office/outpatient visit, established patient, 20-29 minutes',
      rvuWork: 1.30,
      rvuPractice: 1.68,
      rvuMalpractice: 0.12,
    },
    '72148': {
      cpt: '72148',
      locality: 'NY-Manhattan',
      year: 2024,
      nonFacilityFee: 270.00,
      facilityFee: 270.00,
      description: 'MRI lumbar spine without contrast',
      rvuWork: 1.00,
      rvuPractice: 14.52,
      rvuMalpractice: 0.86,
    },
  },
  // Default/fallback locality
  'DEFAULT': {
    '99213': {
      cpt: '99213',
      locality: 'DEFAULT',
      year: 2024,
      nonFacilityFee: 100.00,
      facilityFee: 85.00,
      description: 'Office/outpatient visit, established patient, 20-29 minutes',
    },
    '72148': {
      cpt: '72148',
      locality: 'DEFAULT',
      year: 2024,
      nonFacilityFee: 220.00,
      facilityFee: 220.00,
      description: 'MRI lumbar spine without contrast',
    },
    '97110': {
      cpt: '97110',
      locality: 'DEFAULT',
      year: 2024,
      nonFacilityFee: 32.00,
      facilityFee: 30.00,
      description: 'Therapeutic exercises, each 15 minutes',
    },
    '73030': {
      cpt: '73030',
      locality: 'DEFAULT',
      year: 2024,
      nonFacilityFee: 40.00,
      facilityFee: 40.00,
      description: 'X-ray shoulder, minimum 2 views',
    },
  },
};

/**
 * Gets CMS Medicare fee for a CPT code in a specific locality
 * 
 * CURRENT IMPLEMENTATION: Returns demo values from in-memory map
 * 
 * FUTURE IMPLEMENTATION:
 * 1. Query CMS Physician Fee Schedule API
 * 2. Fall back to cached database table (updated annually)
 * 3. Apply geographic practice cost index (GPCI) adjustments
 * 4. Handle modifier codes (e.g., -26 professional component, -TC technical component)
 * 5. Cache results to minimize API calls
 * 
 * @param params - CPT code and locality information
 * @returns CMS fee amount or null if not found
 * 
 * @example
 * const fee = await getCMSFee({ cpt: '99213', locality: 'CA-LA' })
 * // Returns: 112.00
 * 
 * @example
 * const fee = await getCMSFee({ cpt: '72148', locality: 'CA-LA', facility: true })
 * // Returns: 245.00 (facility rate)
 */
export async function getCMSFee(params: CMSFeeParams): Promise<number | null> {
  const { cpt, locality, facility = false } = params;
  
  // Normalize CPT code (remove hyphens, spaces)
  const normalizedCPT = cpt.replace(/[-\s]/g, '');
  
  // Try exact locality first
  const localityData = DEMO_CMS_FEES[locality];
  if (localityData && localityData[normalizedCPT]) {
    const entry = localityData[normalizedCPT];
    return facility ? entry.facilityFee : entry.nonFacilityFee;
  }
  
  // Fall back to DEFAULT locality
  const defaultData = DEMO_CMS_FEES['DEFAULT'];
  if (defaultData && defaultData[normalizedCPT]) {
    const entry = defaultData[normalizedCPT];
    return facility ? entry.facilityFee : entry.nonFacilityFee;
  }
  
  // CPT not found
  return null;
}

/**
 * Gets full CMS fee schedule entry with all details
 * 
 * Useful when you need RVU breakdowns or descriptions in addition to fee.
 * 
 * @param params - CPT code and locality information
 * @returns Full CMS fee entry or null
 */
export async function getCMSFeeEntry(params: CMSFeeParams): Promise<CMSFeeEntry | null> {
  const { cpt, locality } = params;
  const normalizedCPT = cpt.replace(/[-\s]/g, '');
  
  // Try exact locality
  const localityData = DEMO_CMS_FEES[locality];
  if (localityData && localityData[normalizedCPT]) {
    return localityData[normalizedCPT];
  }
  
  // Fall back to DEFAULT
  const defaultData = DEMO_CMS_FEES['DEFAULT'];
  if (defaultData && defaultData[normalizedCPT]) {
    return defaultData[normalizedCPT];
  }
  
  return null;
}

/**
 * Gets multiple CMS fees in batch
 * 
 * More efficient than calling getCMSFee repeatedly.
 * 
 * @param cptCodes - Array of CPT codes
 * @param locality - CMS locality code
 * @param facility - Facility vs. non-facility rate
 * @returns Map of CPT code to fee amount
 */
export async function getCMSFeesBatch(
  cptCodes: string[],
  locality: string,
  facility: boolean = false
): Promise<Map<string, number>> {
  const fees = new Map<string, number>();
  
  for (const cpt of cptCodes) {
    const fee = await getCMSFee({ cpt, locality, facility });
    if (fee !== null) {
      fees.set(cpt, fee);
    }
  }
  
  return fees;
}

/**
 * Lists all available localities in the fee schedule
 * 
 * @returns Array of locality codes
 */
export function getAvailableLocalities(): string[] {
  return Object.keys(DEMO_CMS_FEES).filter(loc => loc !== 'DEFAULT');
}

/**
 * Lists all CPT codes available for a locality
 * 
 * @param locality - CMS locality code
 * @returns Array of CPT codes
 */
export function getAvailableCPTs(locality: string): string[] {
  const localityData = DEMO_CMS_FEES[locality] || DEMO_CMS_FEES['DEFAULT'];
  return Object.keys(localityData);
}

/**
 * Validates if a CPT code exists in the fee schedule
 * 
 * @param cpt - CPT code to check
 * @param locality - CMS locality code
 * @returns true if CPT exists
 */
export function isCPTAvailable(cpt: string, locality: string = 'DEFAULT'): boolean {
  const normalizedCPT = cpt.replace(/[-\s]/g, '');
  const localityData = DEMO_CMS_FEES[locality] || DEMO_CMS_FEES['DEFAULT'];
  return normalizedCPT in localityData;
}

/**
 * Gets CPT description from fee schedule
 * 
 * @param cpt - CPT code
 * @param locality - CMS locality code
 * @returns CPT description or null
 */
export async function getCPTDescription(cpt: string, locality: string = 'CA-LA'): Promise<string | null> {
  const entry = await getCMSFeeEntry({ cpt, locality });
  return entry?.description || null;
}

/**
 * Calculates reasonable fee range based on CMS benchmark
 * 
 * Common multipliers used in personal injury practice:
 * - 1.0x - 1.5x: Generally considered reasonable
 * - 1.5x - 2.0x: May be acceptable depending on circumstances
 * - 2.0x+: Often considered excessive
 * 
 * @param cmsFee - CMS benchmark fee
 * @returns Object with min, max, and excessive thresholds
 */
export function getReasonableFeeRange(cmsFee: number): {
  min: number;
  reasonable: number;
  high: number;
  excessive: number;
} {
  return {
    min: cmsFee,                    // CMS fee (minimum reasonable)
    reasonable: cmsFee * 1.5,       // 1.5x CMS (upper bound of reasonable)
    high: cmsFee * 2.0,            // 2.0x CMS (high but possibly defensible)
    excessive: cmsFee * 2.5,       // 2.5x+ CMS (likely excessive)
  };
}

