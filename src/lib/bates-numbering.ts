/**
 * Bates Numbering System
 * Legal document numbering standard for source citations
 * 
 * Example: BATES-001234 or SMITH-001234
 * Used to uniquely identify pages in medical records for legal reference
 */

export interface BatesNumber {
  prefix: string
  number: number
  formatted: string
}

export interface BatesRange {
  start: BatesNumber
  end: BatesNumber
  formatted: string
}

export function generateBatesNumber(prefix: string, number: number, padding: number = 6): BatesNumber {
  const paddedNumber = number.toString().padStart(padding, '0')
  const formatted = `${prefix}-${paddedNumber}`
  
  return {
    prefix,
    number,
    formatted,
  }
}

export function generateBatesRange(prefix: string, startNumber: number, endNumber: number): BatesRange {
  const start = generateBatesNumber(prefix, startNumber)
  const end = generateBatesNumber(prefix, endNumber)
  const formatted = `${start.formatted} to ${end.formatted}`
  
  return {
    start,
    end,
    formatted,
  }
}

export function parseBatesNumber(batesString: string): BatesNumber | null {
  const match = batesString.match(/^([A-Z]+)-(\d+)$/)
  if (!match) return null
  
  const prefix = match[1]
  const number = parseInt(match[2], 10)
  
  return {
    prefix,
    number,
    formatted: batesString,
  }
}

/**
 * Generate Bates numbers for a document
 * @param documentId Unique document identifier
 * @param pageCount Number of pages in the document
 * @param casePrefix Case-specific prefix (e.g., "SMITH" for Smith v. Jones)
 * @param startNumber Starting Bates number
 */
export function generateDocumentBatesNumbers(
  documentId: string,
  pageCount: number,
  casePrefix: string,
  startNumber: number
): {
  documentId: string
  pages: Array<{
    pageNumber: number
    batesNumber: BatesNumber
  }>
  range: BatesRange
} {
  const pages = []
  
  for (let i = 0; i < pageCount; i++) {
    const pageNumber = i + 1
    const batesNumber = generateBatesNumber(casePrefix, startNumber + i)
    pages.push({
      pageNumber,
      batesNumber,
    })
  }
  
  const range = generateBatesRange(casePrefix, startNumber, startNumber + pageCount - 1)
  
  return {
    documentId,
    pages,
    range,
  }
}

/**
 * Format citation with Bates reference
 * Used in chronologies and demand letters
 */
export function formatSourceCitation(
  description: string,
  documentName: string,
  batesRange: string,
  pageNumber?: number
): string {
  let citation = description
  
  if (pageNumber) {
    citation += ` (${documentName}, p. ${pageNumber}, ${batesRange})`
  } else {
    citation += ` (${documentName}, ${batesRange})`
  }
  
  return citation
}

/**
 * Generate hyperlink reference for PDF
 * Format: #page=5 for internal PDF navigation
 */
export function generatePDFHyperlink(batesNumber: string, pageNumber: number): string {
  return `#page=${pageNumber}&bates=${batesNumber}`
}

/**
 * Example usage in chronology entry:
 * 
 * "On 03/15/2024, patient presented to Memorial Hospital emergency room 
 * complaining of severe neck pain (Medical Records, p. 45, SMITH-001234)"
 * 
 * The "SMITH-001234" is clickable and links to page 45 of the source PDF
 */

