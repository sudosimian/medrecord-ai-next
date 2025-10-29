/**
 * Table of Authorities Generator
 * 
 * PURPOSE: Generates properly formatted Table of Authorities (ToA) for legal documents.
 * Standard practice in briefs, motions, and settlement demands to list all cited
 * authorities alphabetically by type (cases, statutes, regulations, etc.).
 * 
 * BLUEBOOK RULE: Not explicitly covered, but follows standard legal document practice.
 * Cases are alphabetized by first party name. Statutes by code and section number.
 * 
 * IMPLEMENTATION: Basic grouping and alphabetization. Does not include page references
 * (passim) as those require tracking where each authority appears in document.
 * 
 * FUTURE ENHANCEMENTS:
 * - Track page numbers where each authority cited
 * - Add "passim" for authorities cited throughout
 * - Support additional authority types (regulations, treatises, law review articles)
 * - Short-form citation mapping (id. → full cite)
 * - Detect and merge duplicate citations
 */

/**
 * Citation node representing a single legal authority
 */
export interface CitationNode {
  type: 'case' | 'statute' | 'regulation' | 'constitution' | 'rule' | 'other';
  citation: string;      // Full Bluebook formatted citation
  sortKey?: string;      // Optional custom sort key (defaults to citation)
  pages?: number[];      // Pages where cited (future enhancement)
}

/**
 * Table of Authorities sections
 */
export interface TableOfAuthorities {
  cases: string[];
  statutes: string[];
  regulations: string[];
  constitutions: string[];
  rules: string[];
  other: string[];
}

/**
 * Builds a formatted Table of Authorities from citation nodes
 * 
 * PROCESS:
 * 1. Group citations by type (cases, statutes, etc.)
 * 2. Remove duplicates within each group
 * 3. Alphabetize each group
 * 4. Format as markdown with proper headings
 * 
 * ALPHABETIZATION RULES:
 * - Cases: By first party name (before "v.")
 * - Statutes: By code abbreviation, then section number
 * - Ignore "The", "In re", "Ex parte" prefixes for sorting
 * 
 * @param nodes - Array of citation nodes to include in ToA
 * @returns Markdown-formatted Table of Authorities
 * 
 * @example
 * buildTableOfAuthorities([
 *   { type: 'case', citation: 'Brown v. Superior Court, 34 Cal.4th 1799 (2004)' },
 *   { type: 'case', citation: 'Comunale v. Traders, 50 Cal.2d 654 (1958)' },
 *   { type: 'statute', citation: 'Cal. Ins. Code § 790.03' }
 * ])
 * // Returns formatted markdown ToA
 */
export function buildTableOfAuthorities(nodes: CitationNode[]): string {
  // Group citations by type
  const grouped: TableOfAuthorities = {
    cases: [],
    statutes: [],
    regulations: [],
    constitutions: [],
    rules: [],
    other: [],
  };
  
  // Deduplicate and group
  const seen = new Set<string>();
  
  for (const node of nodes) {
    // Skip duplicates
    if (seen.has(node.citation)) {
      continue;
    }
    seen.add(node.citation);
    
    // Add to appropriate group
    switch (node.type) {
      case 'case':
        grouped.cases.push(node.citation);
        break;
      case 'statute':
        grouped.statutes.push(node.citation);
        break;
      case 'regulation':
        grouped.regulations.push(node.citation);
        break;
      case 'constitution':
        grouped.constitutions.push(node.citation);
        break;
      case 'rule':
        grouped.rules.push(node.citation);
        break;
      default:
        grouped.other.push(node.citation);
    }
  }
  
  // Alphabetize each group
  grouped.cases.sort(compareCase);
  grouped.statutes.sort(compareStatute);
  grouped.regulations.sort();
  grouped.constitutions.sort();
  grouped.rules.sort();
  grouped.other.sort();
  
  // Build markdown output
  let output = '# TABLE OF AUTHORITIES\n\n';
  
  // Cases section
  if (grouped.cases.length > 0) {
    output += '## Cases\n\n';
    for (const cite of grouped.cases) {
      output += `- ${cite}\n`;
    }
    output += '\n';
  }
  
  // Statutes section
  if (grouped.statutes.length > 0) {
    output += '## Statutes\n\n';
    for (const cite of grouped.statutes) {
      output += `- ${cite}\n`;
    }
    output += '\n';
  }
  
  // Regulations section
  if (grouped.regulations.length > 0) {
    output += '## Regulations\n\n';
    for (const cite of grouped.regulations) {
      output += `- ${cite}\n`;
    }
    output += '\n';
  }
  
  // Constitutional Provisions section
  if (grouped.constitutions.length > 0) {
    output += '## Constitutional Provisions\n\n';
    for (const cite of grouped.constitutions) {
      output += `- ${cite}\n`;
    }
    output += '\n';
  }
  
  // Court Rules section
  if (grouped.rules.length > 0) {
    output += '## Court Rules\n\n';
    for (const cite of grouped.rules) {
      output += `- ${cite}\n`;
    }
    output += '\n';
  }
  
  // Other Authorities section
  if (grouped.other.length > 0) {
    output += '## Other Authorities\n\n';
    for (const cite of grouped.other) {
      output += `- ${cite}\n`;
    }
    output += '\n';
  }
  
  return output.trim();
}

/**
 * Compares two case citations for alphabetization
 * 
 * RULES:
 * - Ignore case (uppercase vs lowercase)
 * - Ignore leading articles: "The", "In re", "Ex parte", "People v."
 * - Sort by first party name (before " v. ")
 * - If no " v. ", use full case name
 * 
 * @param a - First case citation
 * @param b - Second case citation
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 */
function compareCase(a: string, b: string): number {
  const keyA = getCaseSortKey(a);
  const keyB = getCaseSortKey(b);
  return keyA.localeCompare(keyB, 'en', { sensitivity: 'base' });
}

/**
 * Extracts sort key from case citation
 * 
 * Removes common prefixes and extracts first party name for sorting.
 * 
 * @param citation - Full case citation
 * @returns Sort key (first party name, normalized)
 */
function getCaseSortKey(citation: string): string {
  // Extract case name (before first comma)
  let caseName = citation;
  const commaIndex = citation.indexOf(',');
  if (commaIndex > 0) {
    caseName = citation.substring(0, commaIndex);
  }
  
  // Remove common prefixes for sorting
  caseName = caseName
    .replace(/^The\s+/i, '')
    .replace(/^In re\s+/i, '')
    .replace(/^Ex parte\s+/i, '')
    .replace(/^People v\.\s+/i, '')
    .replace(/^State v\.\s+/i, '')
    .replace(/^United States v\.\s+/i, '')
    .replace(/^U\.S\. v\.\s+/i, '');
  
  // Extract first party (before " v. ")
  const vIndex = caseName.indexOf(' v. ');
  if (vIndex > 0) {
    caseName = caseName.substring(0, vIndex);
  }
  
  return caseName.trim().toLowerCase();
}

/**
 * Compares two statute citations for alphabetization
 * 
 * RULES:
 * - Sort by code abbreviation first
 * - Then by section number (numerical if possible)
 * 
 * @param a - First statute citation
 * @param b - Second statute citation
 * @returns -1 if a < b, 1 if a > b, 0 if equal
 */
function compareStatute(a: string, b: string): number {
  const keyA = getStatuteSortKey(a);
  const keyB = getStatuteSortKey(b);
  
  // Compare code
  if (keyA.code !== keyB.code) {
    return keyA.code.localeCompare(keyB.code, 'en', { sensitivity: 'base' });
  }
  
  // Compare section numerically if possible
  const numA = parseFloat(keyA.section);
  const numB = parseFloat(keyB.section);
  
  if (!isNaN(numA) && !isNaN(numB)) {
    return numA - numB;
  }
  
  // Fallback to string comparison
  return keyA.section.localeCompare(keyB.section);
}

/**
 * Extracts sort key components from statute citation
 * 
 * @param citation - Full statute citation
 * @returns Object with code and section for sorting
 */
function getStatuteSortKey(citation: string): { code: string; section: string } {
  // Extract code (before §)
  const sectionIndex = citation.indexOf('§');
  if (sectionIndex === -1) {
    return { code: citation.toLowerCase(), section: '' };
  }
  
  const code = citation.substring(0, sectionIndex).trim().toLowerCase();
  
  // Extract section number (after §, before space or parenthesis)
  let section = citation.substring(sectionIndex + 1).trim();
  const spaceIndex = section.indexOf(' ');
  if (spaceIndex > 0) {
    section = section.substring(0, spaceIndex);
  }
  const parenIndex = section.indexOf('(');
  if (parenIndex > 0) {
    section = section.substring(0, parenIndex);
  }
  
  return { code, section: section.toLowerCase() };
}

/**
 * Merges multiple citation arrays into a single deduplicated array
 * 
 * Useful when collecting citations from multiple document sections.
 * 
 * @param citationArrays - Multiple arrays of citations to merge
 * @returns Single deduplicated array
 */
export function mergeCitations(...citationArrays: CitationNode[][]): CitationNode[] {
  const seen = new Set<string>();
  const merged: CitationNode[] = [];
  
  for (const array of citationArrays) {
    for (const node of array) {
      if (!seen.has(node.citation)) {
        seen.add(node.citation);
        merged.push(node);
      }
    }
  }
  
  return merged;
}

/**
 * Converts a simple array of citation strings to CitationNode array
 * 
 * Attempts to detect citation type from format.
 * Falls back to 'other' if type cannot be determined.
 * 
 * @param citations - Array of citation strings
 * @returns Array of CitationNode objects
 */
export function toCitationNodes(citations: string[]): CitationNode[] {
  return citations.map(citation => ({
    type: detectCitationType(citation),
    citation,
  }));
}

/**
 * Detects citation type from citation string format
 * 
 * HEURISTICS:
 * - Contains " v. " → likely case
 * - Contains "§" → likely statute or regulation
 * - Contains "C.F.R." → regulation
 * - Contains "U.S. Const." or "Cal. Const." → constitution
 * - Contains "Fed. R." or "Cal. R." → court rule
 * 
 * @param citation - Citation string
 * @returns Detected citation type
 */
function detectCitationType(citation: string): CitationNode['type'] {
  const lower = citation.toLowerCase();
  
  // Constitution
  if (lower.includes('const.')) {
    return 'constitution';
  }
  
  // Regulation
  if (lower.includes('c.f.r.')) {
    return 'regulation';
  }
  
  // Court rule
  if (lower.includes('fed. r.') || lower.includes('cal. r.') || lower.includes('frcp') || lower.includes('frcrp')) {
    return 'rule';
  }
  
  // Case (has " v. ")
  if (citation.includes(' v. ')) {
    return 'case';
  }
  
  // Statute (has section symbol)
  if (citation.includes('§')) {
    return 'statute';
  }
  
  // Default
  return 'other';
}

/**
 * Validates that Table of Authorities has at least one authority
 * 
 * @param nodes - Citation nodes
 * @returns true if ToA would have content
 */
export function hasAuthorities(nodes: CitationNode[]): boolean {
  return nodes.length > 0;
}

/**
 * Counts authorities by type
 * 
 * Useful for document statistics or validation.
 * 
 * @param nodes - Citation nodes
 * @returns Count of each authority type
 */
export function countAuthoritiesByType(nodes: CitationNode[]): Record<CitationNode['type'], number> {
  const counts: Record<string, number> = {
    case: 0,
    statute: 0,
    regulation: 0,
    constitution: 0,
    rule: 0,
    other: 0,
  };
  
  for (const node of nodes) {
    counts[node.type] = (counts[node.type] || 0) + 1;
  }
  
  return counts as Record<CitationNode['type'], number>;
}


