/**
 * Medical Charges Reasonableness Analysis
 * 
 * PURPOSE: Analyzes whether billed medical charges are reasonable and customary
 * by comparing them to CMS Medicare fee schedule benchmarks.
 * 
 * LEGAL CONTEXT:
 * In personal injury cases, defendants often challenge the reasonableness of medical
 * charges, especially for private-pay patients. CMS fee schedules provide an objective
 * baseline for what Medicare considers reasonable compensation for medical services.
 * While not binding for non-Medicare cases, these benchmarks are frequently referenced
 * in litigation and settlement negotiations.
 * 
 * METHODOLOGY:
 * 1. Extract CPT codes from medical bills
 * 2. Lookup CMS fee for each CPT in patient's geographic locality
 * 3. Calculate variance: (Billed - CMS) / CMS * 100%
 * 4. Flag charges significantly above benchmark (>150% is common threshold)
 * 
 * CAVEATS:
 * - CMS fees represent Medicare reimbursement, not private pay rates
 * - Geographic adjustments may not perfectly match patient location
 * - Facility vs. non-facility rates affect comparison
 * - Some CPT codes may not have CMS equivalents (e.g., experimental treatments)
 * - Private insurance typically pays 150-200% of Medicare rates
 * 
 * USE CASES:
 * - Defendant challenges medical special damages as excessive
 * - Liens/subrogation negotiations with health plans
 * - Expert testimony preparation on reasonable medical costs
 * - Settlement demand drafting showing good faith on damages
 */

// import { createClient } from '@/lib/supabase-server'; // TODO: Uncomment when integrating with database
import { getCMSFee, getCPTDescription } from './cms-fees';

/**
 * Reasonableness row for a single medical charge
 */
export interface ReasonablenessRow {
  id: string;                    // Unique row ID
  cpt: string;                   // CPT code
  cptDescription?: string;       // CPT description
  provider: string;              // Provider name
  dateOfService?: string;        // Date service provided
  billed: number;                // Amount billed
  cms: number | null;            // CMS benchmark fee
  variancePct: number | null;    // Percentage variance (positive = over CMS)
  varianceAmount: number | null; // Dollar variance
  flag?: 'reasonable' | 'high' | 'excessive'; // Reasonableness flag
}

/**
 * Builds reasonableness analysis rows for a case's medical bills
 * 
 * PROCESS:
 * 1. Fetch all billing entries for case from database
 * 2. Extract CPT codes and billed amounts
 * 3. Determine geographic locality (default to CA-LA until real mapping)
 * 4. Lookup CMS fee for each CPT
 * 5. Calculate variance percentage and flag outliers
 * 
 * LOCALITY DETERMINATION:
 * Currently defaults to 'CA-LA' (Los Angeles).
 * TODO: Implement real locality mapping based on:
 * - Patient ZIP code → CMS MAC region
 * - Provider ZIP code (fallback)
 * - Case jurisdiction
 * 
 * @param caseId - Case ID to analyze
 * @returns Array of reasonableness rows
 * 
 * @example
 * const rows = await buildReasonablenessRows({ caseId: 'case-123' })
 * // Returns array with CPT, billed, CMS, variance for each charge
 */
export async function buildReasonablenessRows(params: {
  caseId: string;
}): Promise<ReasonablenessRow[]> {
  const { caseId } = params;
  
  // TODO: Pull from actual database
  // For now, return demo data simulating database fetch
  
  // In production, this would be:
  // const supabase = await createClient();
  // const { data: bills } = await supabase
  //   .from('medical_bills')
  //   .select('*, provider:providers(name)')
  //   .eq('case_id', caseId);
  
  // Demo data simulating medical bills from database
  const demoBills = [
    {
      id: 'bill-1',
      cpt: '99213',
      provider: 'Dr. Smith Primary Care',
      dateOfService: '2024-01-15',
      billed: 250.00,
    },
    {
      id: 'bill-2',
      cpt: '72148',
      provider: 'Radiology Associates',
      dateOfService: '2024-01-20',
      billed: 1200.00,
    },
    {
      id: 'bill-3',
      cpt: '97110',
      provider: 'Physical Therapy Center',
      dateOfService: '2024-02-01',
      billed: 85.00,
    },
    {
      id: 'bill-4',
      cpt: '97110',
      provider: 'Physical Therapy Center',
      dateOfService: '2024-02-08',
      billed: 85.00,
    },
    {
      id: 'bill-5',
      cpt: '97110',
      provider: 'Physical Therapy Center',
      dateOfService: '2024-02-15',
      billed: 85.00,
    },
    {
      id: 'bill-6',
      cpt: '73030',
      provider: 'Radiology Associates',
      dateOfService: '2024-01-15',
      billed: 150.00,
    },
    {
      id: 'bill-7',
      cpt: '99204',
      provider: 'Orthopedic Specialist',
      dateOfService: '2024-01-25',
      billed: 450.00,
    },
    {
      id: 'bill-8',
      cpt: '29827',
      provider: 'Surgical Center',
      dateOfService: '2024-03-10',
      billed: 4500.00,
    },
  ];
  
  // Determine locality
  // TODO: Map patient ZIP or case jurisdiction to CMS locality
  // For now, default to CA-LA (Los Angeles, California)
  const locality = 'CA-LA';
  
  // Build reasonableness rows
  const rows: ReasonablenessRow[] = [];
  
  for (const bill of demoBills) {
    // Get CMS benchmark fee
    const cmsFee = await getCMSFee({
      cpt: bill.cpt,
      locality,
      facility: false, // Assume non-facility for most outpatient services
    });
    
    // Get CPT description
    const description = await getCPTDescription(bill.cpt, locality);
    
    // Calculate variance
    let variancePct: number | null = null;
    let varianceAmount: number | null = null;
    let flag: ReasonablenessRow['flag'] = undefined;
    
    if (cmsFee !== null) {
      varianceAmount = bill.billed - cmsFee;
      variancePct = (varianceAmount / cmsFee) * 100;
      
      // Flag based on variance
      if (variancePct <= 150) {
        flag = 'reasonable'; // Up to 2.5x CMS is often considered reasonable
      } else if (variancePct <= 250) {
        flag = 'high';       // 2.5x - 3.5x CMS is high but possibly defensible
      } else {
        flag = 'excessive';  // Over 3.5x CMS is likely excessive
      }
    }
    
    rows.push({
      id: bill.id,
      cpt: bill.cpt,
      cptDescription: description || undefined,
      provider: bill.provider,
      dateOfService: bill.dateOfService,
      billed: bill.billed,
      cms: cmsFee,
      variancePct: variancePct !== null ? Math.round(variancePct * 10) / 10 : null,
      varianceAmount: varianceAmount !== null ? Math.round(varianceAmount * 100) / 100 : null,
      flag,
    });
  }
  
  return rows;
}

/**
 * Generates footnotes explaining reasonableness methodology
 * 
 * CONTENT:
 * - Explanation of CMS fee schedules
 * - Geographic locality used
 * - Methodology for variance calculation
 * - Caveats and limitations
 * - Legal citations if applicable
 * 
 * PURPOSE:
 * Provides transparency about how reasonableness was determined and defends
 * against challenges that the analysis is arbitrary or biased.
 * 
 * @returns Markdown-formatted footnotes text
 * 
 * @example
 * const footnotes = reasonablenessFootnotes()
 * // Returns detailed methodology explanation
 */
export function reasonablenessFootnotes(): string {
  return `## Methodology: Reasonableness of Medical Charges

### CMS Fee Schedule Benchmark

The Centers for Medicare & Medicaid Services (CMS) publishes annual Physician Fee Schedules that establish Medicare reimbursement rates for medical services identified by Current Procedural Terminology (CPT) codes. While these rates apply specifically to Medicare beneficiaries, they are widely recognized as an objective benchmark for reasonable and customary medical charges.

### Geographic Adjustment

CMS fee schedules vary by geographic locality to account for differences in practice costs. This analysis uses the **CA-LA (Los Angeles, California)** locality rates. Geographic Practice Cost Indices (GPCIs) adjust for local differences in:
- Physician work expenses
- Practice operating costs
- Malpractice insurance premiums

### Variance Calculation

For each billed charge, we calculate the percentage variance from the CMS benchmark:

**Variance % = [(Billed Amount - CMS Fee) / CMS Fee] × 100**

### Reasonableness Thresholds

Industry practice and case law suggest the following thresholds:

- **0% - 150% of CMS**: Generally considered reasonable. Private insurance typically pays 150-200% of Medicare rates.
- **150% - 250% of CMS**: Elevated but may be justified based on factors such as:
  - Emergency services requiring immediate care
  - Specialized procedures with limited provider availability
  - Geographic market conditions
  - Facility overhead and accreditation requirements
- **Over 250% of CMS**: Potentially excessive and subject to challenge absent compelling justification.

### Important Caveats

1. **Not a Ceiling**: CMS rates do not represent a legal maximum for private-pay charges. Providers are entitled to set their own fees.

2. **Context Matters**: Reasonableness depends on multiple factors including:
   - Provider specialization and credentials
   - Facility accreditation and overhead
   - Emergency vs. scheduled care
   - Market conditions and provider availability
   - Whether patient had insurance at time of service

3. **Legal Standard**: The appropriate standard is "reasonable value of services" or "reasonable and customary charges" in the relevant geographic area, not Medicare rates specifically.

4. **Private Pay Differential**: Studies show private-pay patients are typically charged 2-3x Medicare rates. Thus, charges within this range are generally defensible.

### Data Limitations

- **Locality Mapping**: ZIP code-to-locality mapping may not perfectly match patient's exact location
- **Facility Status**: Analysis uses non-facility rates; facility rates may differ
- **Missing CPT Codes**: Some services may not have direct Medicare equivalents
- **Fee Schedule Year**: Rates based on 2024 Medicare Physician Fee Schedule
- **Modifiers**: CPT modifiers (e.g., -25, -59) may affect appropriate comparison rate

### Legal References

CMS fee schedules are frequently referenced in personal injury litigation:
- *Howell v. Hamilton Meats* (2011) - California Supreme Court on medical damages
- *Hanif v. Housing Authority* (1988) - Reasonable value of medical services
- Various state statutes regarding medical damages admissibility

This analysis is provided for informational purposes and does not constitute a legal opinion on the recoverability of damages. The reasonableness of medical charges is ultimately a question of fact for the jury considering all relevant evidence.

---

*Data Source: CMS Physician Fee Schedule, 2024*  
*Locality: CA-LA (Los Angeles, California)*  
*Analysis Date: ${new Date().toISOString().split('T')[0]}*`;
}

/**
 * Calculates summary statistics for reasonableness analysis
 * 
 * @param rows - Reasonableness rows
 * @returns Summary statistics
 */
export function calculateReasonablenessSummary(rows: ReasonablenessRow[]): {
  totalBilled: number;
  totalCMS: number;
  overallVariancePct: number;
  reasonableCount: number;
  highCount: number;
  excessiveCount: number;
  averageVariance: number;
  medianVariance: number;
} {
  const totalBilled = rows.reduce((sum, row) => sum + row.billed, 0);
  const totalCMS = rows.reduce((sum, row) => sum + (row.cms || 0), 0);
  const overallVariancePct = totalCMS > 0 ? ((totalBilled - totalCMS) / totalCMS) * 100 : 0;
  
  const reasonableCount = rows.filter(r => r.flag === 'reasonable').length;
  const highCount = rows.filter(r => r.flag === 'high').length;
  const excessiveCount = rows.filter(r => r.flag === 'excessive').length;
  
  const variances = rows
    .filter(r => r.variancePct !== null)
    .map(r => r.variancePct!);
  
  const averageVariance = variances.length > 0
    ? variances.reduce((sum, v) => sum + v, 0) / variances.length
    : 0;
  
  const sortedVariances = [...variances].sort((a, b) => a - b);
  const medianVariance = sortedVariances.length > 0
    ? sortedVariances[Math.floor(sortedVariances.length / 2)]
    : 0;
  
  return {
    totalBilled: Math.round(totalBilled * 100) / 100,
    totalCMS: Math.round(totalCMS * 100) / 100,
    overallVariancePct: Math.round(overallVariancePct * 10) / 10,
    reasonableCount,
    highCount,
    excessiveCount,
    averageVariance: Math.round(averageVariance * 10) / 10,
    medianVariance: Math.round(medianVariance * 10) / 10,
  };
}

/**
 * Filters rows by reasonableness flag
 * 
 * @param rows - All reasonableness rows
 * @param flag - Flag to filter by
 * @returns Filtered rows
 */
export function filterByFlag(
  rows: ReasonablenessRow[],
  flag: 'reasonable' | 'high' | 'excessive'
): ReasonablenessRow[] {
  return rows.filter(r => r.flag === flag);
}

/**
 * Sorts rows by variance percentage (descending)
 * 
 * Useful for highlighting the most concerning charges.
 * 
 * @param rows - Reasonableness rows
 * @returns Sorted rows
 */
export function sortByVariance(rows: ReasonablenessRow[]): ReasonablenessRow[] {
  return [...rows].sort((a, b) => {
    if (a.variancePct === null) return 1;
    if (b.variancePct === null) return -1;
    return b.variancePct - a.variancePct;
  });
}

/**
 * Formats reasonableness analysis as markdown table
 * 
 * Used for demand letter integration.
 * 
 * @param rows - Reasonableness rows (typically top N sorted by variance)
 * @param limit - Maximum rows to include (default: 10)
 * @returns Markdown table
 */
export function formatReasonablenessTable(rows: ReasonablenessRow[], limit: number = 10): string {
  const sortedRows = sortByVariance(rows).slice(0, limit);
  
  let table = '| CPT Code | Service | Provider | Billed | CMS Benchmark | Variance |\n';
  table += '|----------|---------|----------|--------|---------------|----------|\n';
  
  for (const row of sortedRows) {
    const cptDesc = row.cptDescription
      ? `${row.cpt} - ${row.cptDescription.substring(0, 30)}...`
      : row.cpt;
    
    const billedStr = `$${row.billed.toFixed(2)}`;
    const cmsStr = row.cms !== null ? `$${row.cms.toFixed(2)}` : 'N/A';
    const varianceStr = row.variancePct !== null
      ? `${row.variancePct > 0 ? '+' : ''}${row.variancePct.toFixed(1)}%`
      : 'N/A';
    
    table += `| ${cptDesc} | ${row.cptDescription?.substring(0, 20) || 'Medical Service'} | ${row.provider} | ${billedStr} | ${cmsStr} | ${varianceStr} |\n`;
  }
  
  return table;
}

