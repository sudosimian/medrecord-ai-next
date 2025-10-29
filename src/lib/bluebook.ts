/**
 * Bluebook Citation Formatter
 * 
 * PURPOSE: Generates legal citations following The Bluebook (21st ed.) format
 * for use in demand letters, briefs, and other legal documents.
 * 
 * IMPLEMENTATION: Simplified for common cases. Does not handle all edge cases
 * such as multiple reporters, prior/subsequent history, parenthetical explanations,
 * or short-form citations. Assumes standard formats for federal/state courts.
 * 
 * FUTURE ENHANCEMENTS:
 * - Short-form citations (id., supra)
 * - Parallel citations for state cases
 * - Prior/subsequent history
 * - Signals (see, see also, cf., but see, etc.)
 * - Parenthetical explanations
 * - String citations (multiple cases)
 * - Hereinafter cross-references
 */

/**
 * Case citation data structure
 */
export interface CaseCitation {
  caseName: string;        // e.g., "Smith v. Jones"
  reporter: string;        // e.g., "F.3d", "Cal.App.4th", "U.S."
  volume: number;          // Volume number
  page: number;            // Starting page
  court?: string;          // Court abbreviation (e.g., "9th Cir.", "C.D. Cal.")
  year: number;            // Year of decision
  pinCite?: number;        // Specific page for pinpoint citation
}

/**
 * Statute citation data structure
 */
export interface StatuteCitation {
  code: string;            // e.g., "Cal. Ins. Code", "42 U.S.C."
  section: string;         // Section number(s), e.g., "790.03", "1983"
  year?: number;           // Year of code edition (optional)
}

/**
 * Formats a case citation in Bluebook style
 * 
 * BLUEBOOK RULE 10: Cases
 * Format: Case Name, Volume Reporter Page (Court Year)
 * 
 * ASSUMPTIONS:
 * - Case name is already properly formatted (italicized in markdown with asterisks)
 * - Reporter abbreviation follows Bluebook Table T1
 * - Court abbreviation provided when not clear from reporter (Bluebook Rule 10.4)
 * - U.S. Supreme Court cases don't need court parenthetical
 * - Federal Courts of Appeals need circuit designation (e.g., "9th Cir.")
 * - District courts need both district and circuit (e.g., "C.D. Cal.")
 * 
 * EDGE CASES NOT HANDLED:
 * - Multiple reporters (parallel citations)
 * - Prior/subsequent history (aff'd, rev'd, cert. denied)
 * - Parenthetical explanations
 * - Per curiam decisions
 * - Unreported/unpublished opinions
 * 
 * @param citation - Case citation data
 * @returns Formatted Bluebook citation string
 * 
 * @example
 * formatCaseCitation({
 *   caseName: 'Comunale v. Traders & Gen. Ins. Co.',
 *   volume: 50,
 *   reporter: 'Cal.2d',
 *   page: 654,
 *   year: 1958
 * })
 * // Returns: "Comunale v. Traders & Gen. Ins. Co., 50 Cal.2d 654 (1958)"
 * 
 * @example
 * formatCaseCitation({
 *   caseName: 'Brown v. Superior Court',
 *   volume: 34,
 *   reporter: 'Cal.4th',
 *   page: 1799,
 *   year: 2004,
 *   pinCite: 1806
 * })
 * // Returns: "Brown v. Superior Court, 34 Cal.4th 1799, 1806 (2004)"
 */
export function formatCaseCitation(citation: CaseCitation): string {
  const { caseName, volume, reporter, page, court, year, pinCite } = citation;
  
  // Base citation: Case Name, Volume Reporter Page
  let formatted = `${caseName}, ${volume} ${reporter} ${page}`;
  
  // Add pinpoint citation if provided (Bluebook Rule 3.2)
  if (pinCite) {
    formatted += `, ${pinCite}`;
  }
  
  // Add court and year parenthetical (Bluebook Rule 10.4)
  // Format: (Court Year) or just (Year) if court obvious from reporter
  if (court) {
    formatted += ` (${court} ${year})`;
  } else {
    formatted += ` (${year})`;
  }
  
  return formatted;
}

/**
 * Formats a statute citation in Bluebook style
 * 
 * BLUEBOOK RULE 12: Statutes
 * Format: Code § Section (Year)
 * 
 * ASSUMPTIONS:
 * - Code abbreviation follows Bluebook Table T1
 * - Section symbol (§) used for single section, (§§) for multiple
 * - Year is edition year, not enactment year
 * - Federal codes use USC format: "42 U.S.C. § 1983"
 * - State codes use state abbreviation: "Cal. Ins. Code § 790.03"
 * 
 * EDGE CASES NOT HANDLED:
 * - Multiple sections (use § only, not §§)
 * - Subsections with parentheses/letters (e.g., § 1983(a)(1))
 * - Session laws (Pub. L. No.)
 * - Amendments and effective dates
 * - Repealed statutes
 * - Short titles
 * 
 * @param citation - Statute citation data
 * @returns Formatted Bluebook citation string
 * 
 * @example
 * formatStatuteCitation({
 *   code: 'Cal. Ins. Code',
 *   section: '790.03'
 * })
 * // Returns: "Cal. Ins. Code § 790.03"
 * 
 * @example
 * formatStatuteCitation({
 *   code: '42 U.S.C.',
 *   section: '1983',
 *   year: 2018
 * })
 * // Returns: "42 U.S.C. § 1983 (2018)"
 */
export function formatStatuteCitation(citation: StatuteCitation): string {
  const { code, section, year } = citation;
  
  // Base citation: Code § Section
  let formatted = `${code} § ${section}`;
  
  // Add year if provided (Bluebook Rule 12.3.2)
  // Year indicates edition of code, typically only needed for older editions
  if (year) {
    formatted += ` (${year})`;
  }
  
  return formatted;
}

/**
 * Helper: Detects if a case citation needs court designation
 * 
 * Supreme Court reporters (U.S., S.Ct.) don't need court.
 * State reporters (Cal.2d, N.Y.2d) don't need court if highest court.
 * Federal reporters (F.3d, F.Supp.3d) always need court.
 * 
 * @param reporter - Reporter abbreviation
 * @returns true if court designation should be omitted
 */
export function shouldOmitCourt(reporter: string): boolean {
  const noCourtNeeded = [
    'U.S.',        // U.S. Supreme Court
    'S.Ct.',       // Supreme Court Reporter
    'L.Ed.',       // Lawyers' Edition
    'L.Ed.2d',     // Lawyers' Edition, Second Series
  ];
  
  // State supreme court reporters (e.g., Cal.2d, Cal.3d, Cal.4th)
  // are obvious, but state appellate courts (Cal.App.4th) need court
  const stateSupremeCourt = /^[A-Z][a-z]+\.\d[a-z]{2}$/;
  
  if (noCourtNeeded.includes(reporter)) {
    return true;
  }
  
  if (stateSupremeCourt.test(reporter)) {
    return true;
  }
  
  return false;
}

/**
 * Helper: Common court abbreviations (Bluebook Table T1)
 * 
 * These are standard abbreviations for federal and California courts.
 * Expand this list for other jurisdictions as needed.
 */
export const COURT_ABBREVIATIONS: Record<string, string> = {
  // Federal Courts of Appeals (by circuit)
  '1st_cir': '1st Cir.',
  '2nd_cir': '2d Cir.',
  '3rd_cir': '3d Cir.',
  '4th_cir': '4th Cir.',
  '5th_cir': '5th Cir.',
  '6th_cir': '6th Cir.',
  '7th_cir': '7th Cir.',
  '8th_cir': '8th Cir.',
  '9th_cir': '9th Cir.',
  '10th_cir': '10th Cir.',
  '11th_cir': '11th Cir.',
  'dc_cir': 'D.C. Cir.',
  'fed_cir': 'Fed. Cir.',
  
  // California Courts of Appeal (by district)
  'cal_app_1st': 'Cal. Ct. App. 1st Dist.',
  'cal_app_2nd': 'Cal. Ct. App. 2d Dist.',
  'cal_app_3rd': 'Cal. Ct. App. 3d Dist.',
  'cal_app_4th': 'Cal. Ct. App. 4th Dist.',
  'cal_app_5th': 'Cal. Ct. App. 5th Dist.',
  'cal_app_6th': 'Cal. Ct. App. 6th Dist.',
  
  // Federal District Courts (California examples)
  'cd_cal': 'C.D. Cal.',      // Central District
  'nd_cal': 'N.D. Cal.',      // Northern District
  'ed_cal': 'E.D. Cal.',      // Eastern District
  'sd_cal': 'S.D. Cal.',      // Southern District
  
  // Other common courts
  'cal_super': 'Cal. Super. Ct.',
  'ny_app_div': 'N.Y. App. Div.',
  'tex_app': 'Tex. App.',
};

/**
 * Helper: Common reporter abbreviations (Bluebook Table T1)
 * 
 * This lookup helps validate reporter formats. Not exhaustive.
 */
export const REPORTER_ABBREVIATIONS: Record<string, string> = {
  // U.S. Supreme Court
  'us': 'U.S.',
  'sct': 'S.Ct.',
  'led': 'L.Ed.',
  'led2d': 'L.Ed.2d',
  
  // Federal reporters
  'f': 'F.',              // Federal Reporter (historical)
  'f2d': 'F.2d',          // Federal Reporter, Second Series
  'f3d': 'F.3d',          // Federal Reporter, Third Series
  'f4th': 'F.4th',        // Federal Reporter, Fourth Series
  'fsupp': 'F.Supp.',     // Federal Supplement
  'fsupp2d': 'F.Supp.2d', // Federal Supplement, Second Series
  'fsupp3d': 'F.Supp.3d', // Federal Supplement, Third Series
  
  // California reporters
  'cal': 'Cal.',
  'cal2d': 'Cal.2d',
  'cal3d': 'Cal.3d',
  'cal4th': 'Cal.4th',
  'cal5th': 'Cal.5th',
  'calapp': 'Cal.App.',
  'calapp2d': 'Cal.App.2d',
  'calapp3d': 'Cal.App.3d',
  'calapp4th': 'Cal.App.4th',
  'calapp5th': 'Cal.App.5th',
  
  // Other state reporters (examples)
  'ny': 'N.Y.',
  'ny2d': 'N.Y.2d',
  'ny3d': 'N.Y.3d',
  'sw': 'S.W.',
  'sw2d': 'S.W.2d',
  'sw3d': 'S.W.3d',
  'ne': 'N.E.',
  'ne2d': 'N.E.2d',
  'ne3d': 'N.E.3d',
};

/**
 * Utility: Extracts case name from full citation string
 * 
 * Useful for parsing existing citations or validating input.
 * Assumes case name comes before first comma.
 * 
 * @param fullCitation - Full citation string
 * @returns Case name portion
 */
export function extractCaseName(fullCitation: string): string {
  const commaIndex = fullCitation.indexOf(',');
  if (commaIndex === -1) return fullCitation;
  return fullCitation.substring(0, commaIndex).trim();
}

/**
 * Utility: Validates basic citation structure
 * 
 * Checks if citation has minimum required fields.
 * Does not validate legal accuracy or Bluebook compliance.
 * 
 * @param citation - Case citation to validate
 * @returns true if citation has required fields
 */
export function isValidCaseCitation(citation: Partial<CaseCitation>): citation is CaseCitation {
  return !!(
    citation.caseName &&
    citation.volume &&
    citation.reporter &&
    citation.page &&
    citation.year
  );
}

/**
 * Utility: Validates statute citation structure
 * 
 * @param citation - Statute citation to validate
 * @returns true if citation has required fields
 */
export function isValidStatuteCitation(citation: Partial<StatuteCitation>): citation is StatuteCitation {
  return !!(citation.code && citation.section);
}


