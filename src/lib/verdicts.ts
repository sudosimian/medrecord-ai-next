/**
 * Verdict & Settlement Database Integration
 * 
 * PURPOSE: Provides comparable verdict and settlement data for similar injury cases
 * to support damages demands in personal injury litigation.
 * 
 * LEGAL CONTEXT:
 * Attorneys commonly cite comparable verdicts and settlements to demonstrate that
 * their damages demand is reasonable and supported by similar case outcomes. This
 * helps establish expectations in settlement negotiations and provides benchmarks
 * for jury verdicts if the case proceeds to trial.
 * 
 * COMPARABLE FACTORS:
 * - Injury type and severity (e.g., cervical strain, TBI, fractures)
 * - Jurisdiction (venue matters significantly for award amounts)
 * - Incident type (motor vehicle, slip/fall, medical malpractice)
 * - Treatment modality (conservative care vs. surgery)
 * - Permanency and disability level
 * - Age and occupation of plaintiff
 * 
 * CURRENT IMPLEMENTATION:
 * Returns stub data for development and testing.
 * 
 * FUTURE INTEGRATION POINTS:
 * This module should be replaced with real data from:
 * 
 * 1. **Westlaw VerdictSearch** (Thomson Reuters)
 *    - API: https://legal.thomsonreuters.com/en/products/westlaw/verdicts
 *    - Comprehensive verdict and settlement database
 *    - Searchable by injury type, jurisdiction, verdict amount
 *    - Includes full case summaries and citations
 * 
 * 2. **Lexis Verdict & Settlement Analyzer**
 *    - API: https://www.lexisnexis.com/en-us/products/verdict-settlement-analyzer.page
 *    - Similar coverage to Westlaw
 *    - Strong analytics and trend analysis features
 * 
 * 3. **JuryVerdictSearch.com**
 *    - Specialized personal injury verdict database
 *    - User-friendly search interface
 *    - May require screen scraping if no API available
 * 
 * 4. **VerdictSearch / ALM**
 *    - State-specific verdict reporters
 *    - Detailed case summaries
 *    - Available through subscription services
 * 
 * 5. **Local Court Verdict Services**
 *    - County-specific verdict databases (e.g., Los Angeles Jury Verdicts)
 *    - Most relevant for venue-specific comparables
 *    - May require manual compilation or custom scrapers
 * 
 * IMPLEMENTATION NOTES:
 * - Cache results to minimize API costs
 * - Update database periodically (monthly/quarterly)
 * - Implement similarity scoring algorithm
 * - Handle edge cases (no matches, too many matches)
 * - Respect API rate limits and terms of service
 */

/**
 * Verdict or settlement item from comparable case database
 */
export interface VerdictItem {
  title: string;           // Case description (e.g., "Rear-end collision – cervical strain")
  amount: number;          // Verdict/settlement amount in dollars
  court?: string;          // Court or venue (e.g., "LA Superior Court", "Orange County Superior")
  year?: number;           // Year of verdict/settlement
  cite?: string;           // Case citation if available (e.g., "Smith v. Jones, Case No. 12-CV-3456")
  summary?: string;        // Brief case summary or notable facts
  injuryTypes?: string[];  // Array of injury types (e.g., ["cervical strain", "herniated disc"])
  incidentType?: string;   // Type of incident (e.g., "motor vehicle", "slip and fall")
  treatment?: string;      // Treatment modality (e.g., "conservative care", "surgery", "6 months PT")
  plaintiff?: {
    age?: number;          // Plaintiff age at time of incident
    occupation?: string;   // Plaintiff occupation (affects wage loss calculations)
  };
  defendant?: string;      // Defendant type (e.g., "individual", "corporate", "government")
  trialLength?: number;    // Trial length in days (if went to trial)
  isSettlement?: boolean;  // True if settlement, false if verdict
}

/**
 * Search parameters for finding comparable verdicts
 */
export interface VerdictSearchParams {
  state: string;                    // State/jurisdiction code (e.g., "CA", "NY")
  injuries: string[];               // Array of injury types to match
  incidentFacts?: string;           // Optional incident description for context
  minAmount?: number;               // Minimum verdict/settlement amount
  maxAmount?: number;               // Maximum verdict/settlement amount
  yearFrom?: number;                // Earliest year to include
  yearTo?: number;                  // Latest year to include
  incidentType?: string;            // Type of incident (motor vehicle, premises, etc.)
  onlySettlements?: boolean;        // Return only settlements (exclude verdicts)
  onlyVerdicts?: boolean;           // Return only verdicts (exclude settlements)
  limit?: number;                   // Maximum results to return
}

/**
 * Finds comparable verdicts and settlements for similar injury cases
 * 
 * CURRENT: Returns stub data for development
 * FUTURE: Query Westlaw VerdictSearch API or similar service
 * 
 * SEARCH ALGORITHM (to be implemented):
 * 1. Normalize injury keywords (synonyms, medical terminology)
 * 2. Match jurisdiction (exact state, then neighboring states if needed)
 * 3. Filter by incident type if provided
 * 4. Score results by similarity:
 *    - Exact injury match: +10 points
 *    - Related injury: +5 points
 *    - Same jurisdiction: +5 points
 *    - Similar amount range: +3 points
 *    - Recent (last 5 years): +2 points
 * 5. Sort by relevance score, then by amount
 * 6. Return top N results
 * 
 * @param params - Search parameters
 * @returns Array of comparable verdict items
 * 
 * @example
 * const verdicts = await findComparableVerdicts({
 *   state: 'CA',
 *   injuries: ['cervical strain', 'soft tissue'],
 *   incidentFacts: 'Rear-end collision on highway'
 * })
 */
export async function findComparableVerdicts(
  params: VerdictSearchParams
): Promise<VerdictItem[]> {
  const { state, injuries, incidentFacts } = params;
  
  // Log warning that this is stub data
  console.warn('[verdicts] Using stub data. Replace with Westlaw/VerdictSearch API integration.');
  console.info('[verdicts] Search params:', { state, injuries, incidentFacts });
  
  // TODO: Replace with real API call
  // Example integration:
  //
  // const response = await fetch('https://api.westlaw.com/verdicts/search', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.WESTLAW_API_KEY}`,
  //     'Content-Type': 'application/json'
  //   },
  //   body: JSON.stringify({
  //     jurisdiction: state,
  //     injuries: injuries.join(' OR '),
  //     incidentDescription: incidentFacts,
  //     limit: params.limit || 10
  //   })
  // });
  // 
  // return response.json();
  
  // STUB DATA - Realistic examples for development/testing
  const stubVerdicts: VerdictItem[] = [
    {
      title: 'Rear-end collision – cervical strain with herniation',
      amount: 135000,
      court: 'Los Angeles Superior Court',
      year: 2019,
      cite: 'Jane Doe v. ABC Transport, Case No. BC-2019-45678',
      summary: 'Soft-tissue injuries with MRI-confirmed disc herniation at C5-C6. Conservative care including 4 months physical therapy. Plaintiff age 42, office worker.',
      injuryTypes: ['cervical strain', 'herniated disc', 'soft tissue'],
      incidentType: 'motor vehicle',
      treatment: '4 months PT, pain management, no surgery',
      plaintiff: { age: 42, occupation: 'office worker' },
      defendant: 'commercial vehicle',
      isSettlement: true,
    },
    {
      title: 'Motor vehicle accident – cervical and lumbar injuries',
      amount: 245000,
      court: 'Orange County Superior Court',
      year: 2020,
      cite: 'Smith v. Jones Trucking Co., Case No. 30-2020-11234',
      summary: 'Multi-level disc herniations C4-C6 and L4-L5. Surgery (microdiscectomy) performed 6 months post-accident. Permanent partial disability rating of 15%.',
      injuryTypes: ['cervical herniated disc', 'lumbar herniated disc', 'radiculopathy'],
      incidentType: 'motor vehicle',
      treatment: 'Microdiscectomy surgery, 8 months PT, ongoing pain management',
      plaintiff: { age: 38, occupation: 'warehouse worker' },
      defendant: 'commercial trucking',
      trialLength: 8,
      isSettlement: false,
    },
    {
      title: 'Intersection collision – soft tissue injuries',
      amount: 85000,
      court: 'San Diego Superior Court',
      year: 2021,
      cite: 'Rodriguez v. State Farm, Case No. 37-2021-00098765',
      summary: 'Cervical and thoracic sprains/strains. Conservative treatment with chiropractic care and physical therapy for 3 months. Full recovery with no permanency.',
      injuryTypes: ['cervical strain', 'thoracic strain', 'soft tissue'],
      incidentType: 'motor vehicle',
      treatment: '3 months chiropractic and PT, conservative care',
      plaintiff: { age: 35, occupation: 'teacher' },
      defendant: 'insured individual',
      isSettlement: true,
    },
    {
      title: 'Freeway rear-end – moderate soft tissue with TMJ',
      amount: 175000,
      court: 'Sacramento Superior Court',
      year: 2022,
      cite: 'Johnson v. USAA Casualty Ins., Case No. 34-2022-00256789',
      summary: 'Cervical strain with associated TMJ dysfunction. Extended treatment including jaw specialists, orthodontic appliances, and ongoing pain management. Plaintiff credibility strong.',
      injuryTypes: ['cervical strain', 'TMJ', 'soft tissue', 'jaw injury'],
      incidentType: 'motor vehicle',
      treatment: '6 months multi-disciplinary treatment, TMJ specialist, orthodontics',
      plaintiff: { age: 29, occupation: 'sales representative' },
      defendant: 'insured individual',
      isSettlement: true,
    },
    {
      title: 'Low-speed impact – disputed soft tissue claim',
      amount: 42000,
      court: 'Riverside Superior Court',
      year: 2021,
      cite: 'Martinez v. Mercury Insurance, Case No. RIC-2021-7890',
      summary: 'Soft tissue cervical strain, minimal property damage. Defense argued low impact. Settlement after mediation avoided trial costs.',
      injuryTypes: ['cervical strain', 'soft tissue'],
      incidentType: 'motor vehicle',
      treatment: '6 weeks PT, chiropractic',
      plaintiff: { age: 45, occupation: 'construction worker' },
      defendant: 'insured individual',
      isSettlement: true,
    },
    {
      title: 'T-bone collision – multiple injuries including shoulder surgery',
      amount: 425000,
      court: 'San Francisco Superior Court',
      year: 2020,
      cite: 'Chen v. Lyft, Inc., Case No. CGC-20-587654',
      summary: 'Cervical strain, rotator cuff tear requiring surgery, and rib fractures. Rideshare accident with clear liability. Plaintiff missed 4 months work.',
      injuryTypes: ['cervical strain', 'rotator cuff tear', 'rib fractures', 'shoulder injury'],
      incidentType: 'motor vehicle',
      treatment: 'Arthroscopic shoulder surgery, 8 months PT and recovery',
      plaintiff: { age: 52, occupation: 'accountant' },
      defendant: 'commercial rideshare',
      isSettlement: true,
    },
  ];
  
  // Filter by state if not CA (return only CA examples for now)
  if (state.toUpperCase() !== 'CA') {
    console.info(`[verdicts] Stub data only available for CA. Requested: ${state}. Returning empty array.`);
    return [];
  }
  
  // Simple filtering based on injury keywords (case-insensitive partial match)
  const filtered = stubVerdicts.filter(verdict => {
    if (injuries.length === 0) return true;
    
    const injuryLower = injuries.map(i => i.toLowerCase());
    const verdictInjuries = (verdict.injuryTypes || []).map(i => i.toLowerCase());
    const titleLower = verdict.title.toLowerCase();
    const summaryLower = (verdict.summary || '').toLowerCase();
    
    // Match if any injury keyword appears in verdict injuries, title, or summary
    return injuryLower.some(injury => 
      verdictInjuries.some(vi => vi.includes(injury) || injury.includes(vi)) ||
      titleLower.includes(injury) ||
      summaryLower.includes(injury)
    );
  });
  
  // Sort by amount (descending) to show higher awards first
  filtered.sort((a, b) => b.amount - a.amount);
  
  // Apply limit if specified
  const limit = params.limit || 10;
  return filtered.slice(0, limit);
}

/**
 * Filters verdicts by amount range
 * 
 * @param verdicts - Array of verdict items
 * @param min - Minimum amount (inclusive)
 * @param max - Maximum amount (inclusive)
 * @returns Filtered verdicts
 */
export function filterByAmount(
  verdicts: VerdictItem[],
  min?: number,
  max?: number
): VerdictItem[] {
  return verdicts.filter(v => {
    if (min !== undefined && v.amount < min) return false;
    if (max !== undefined && v.amount > max) return false;
    return true;
  });
}

/**
 * Filters verdicts by year range
 * 
 * @param verdicts - Array of verdict items
 * @param yearFrom - Earliest year (inclusive)
 * @param yearTo - Latest year (inclusive)
 * @returns Filtered verdicts
 */
export function filterByYear(
  verdicts: VerdictItem[],
  yearFrom?: number,
  yearTo?: number
): VerdictItem[] {
  return verdicts.filter(v => {
    if (!v.year) return true; // Include if year not specified
    if (yearFrom !== undefined && v.year < yearFrom) return false;
    if (yearTo !== undefined && v.year > yearTo) return false;
    return true;
  });
}

/**
 * Calculates average verdict/settlement amount
 * 
 * @param verdicts - Array of verdict items
 * @returns Average amount
 */
export function calculateAverageAmount(verdicts: VerdictItem[]): number {
  if (verdicts.length === 0) return 0;
  const sum = verdicts.reduce((acc, v) => acc + v.amount, 0);
  return Math.round(sum / verdicts.length);
}

/**
 * Calculates median verdict/settlement amount
 * 
 * @param verdicts - Array of verdict items
 * @returns Median amount
 */
export function calculateMedianAmount(verdicts: VerdictItem[]): number {
  if (verdicts.length === 0) return 0;
  const sorted = [...verdicts].sort((a, b) => a.amount - b.amount);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1].amount + sorted[mid].amount) / 2)
    : sorted[mid].amount;
}

/**
 * Formats verdict item for display in demand letter
 * 
 * @param verdict - Verdict item
 * @returns Formatted string
 */
export function formatVerdictForDemand(verdict: VerdictItem): string {
  const parts: string[] = [];
  
  // Title and amount
  parts.push(`**${verdict.title}** - $${verdict.amount.toLocaleString()}`);
  
  // Court and year
  const metadata: string[] = [];
  if (verdict.court) metadata.push(verdict.court);
  if (verdict.year) metadata.push(verdict.year.toString());
  if (metadata.length > 0) {
    parts.push(`(${metadata.join(', ')})`);
  }
  
  // Citation
  if (verdict.cite) {
    parts.push(`*${verdict.cite}*`);
  }
  
  // Summary
  if (verdict.summary) {
    parts.push(`\n  ${verdict.summary}`);
  }
  
  return parts.join(' ');
}

