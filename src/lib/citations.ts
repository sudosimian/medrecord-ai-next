/**
 * Inline Citation Chips with Deep-Linking
 * 
 * PURPOSE: Generates inline citation chips that link factual assertions in legal
 * documents to specific locations in source documents (medical records, depositions, etc.).
 * 
 * FUNCTIONALITY:
 * - Renders citation chips with Bates numbers, page numbers, and line numbers
 * - Generates query strings for deep-linking to document viewer
 * - Supports highlighting specific line ranges in viewer
 * 
 * USE CASE: In a demand letter, attorney writes "Plaintiff sustained severe injuries
 * [Bates 0045, p.12, L7-L19]" and clicking the chip opens the medical record at
 * that exact location with lines 7-19 highlighted.
 * 
 * FUTURE ENHANCEMENTS:
 * - Support for multiple source anchors in single chip
 * - Exhibit letters/numbers (e.g., "Ex. A")
 * - Deposition transcript citations with Q&A numbers
 * - Video/audio timestamps for multimedia evidence
 */

/**
 * Source anchor pointing to specific location in a document
 * 
 * Supports various citation formats:
 * - Bates numbering (standard for discovery documents)
 * - Page numbers (for native PDFs, deposition transcripts)
 * - Line numbers (for transcripts, line-numbered documents)
 */
export interface SourceAnchor {
  bates?: string;        // Bates number (e.g., "SMITH000123", "DEF-0045")
  batesEnd?: string;     // Ending Bates for multi-page cite
  page?: number;         // Page number (1-indexed)
  pageEnd?: number;      // Ending page for multi-page cite
  lineStart?: number;    // Starting line number
  lineEnd?: number;      // Ending line number
  exhibitId?: string;    // Exhibit identifier (e.g., "A", "1", "Exhibit A")
  documentId?: string;   // Internal document ID for linking
}

/**
 * Inline citation with label and source anchor
 * 
 * Label is human-readable description (e.g., "Medical Records", "Deposition of Dr. Smith").
 * Anchor pinpoints exact location.
 */
export interface InlineCite {
  label: string;         // Human-readable label
  anchor: SourceAnchor;  // Location reference
}

/**
 * Renders an inline citation chip as formatted text
 * 
 * FORMAT EXAMPLES:
 * - "[Bates 0023]" - Single Bates page
 * - "[Bates 0023-0024]" - Bates range
 * - "[p.23]" - Single page
 * - "[pp.23-25]" - Page range
 * - "[Bates 0023, L7-L19]" - Bates with line numbers
 * - "[p.23, L7-L19]" - Page with line numbers
 * - "[Ex. A, p.12, L5]" - Exhibit with page and line
 * 
 * PRIORITY: Bates > Exhibit > Page
 * Always show line numbers if provided.
 * 
 * @param cite - Inline citation object
 * @returns Formatted citation chip string
 * 
 * @example
 * renderInlineCiteChip({
 *   label: 'Medical Records',
 *   anchor: { bates: '0023', lineStart: 7, lineEnd: 19 }
 * })
 * // Returns: "[Bates 0023, L7–L19]"
 * 
 * @example
 * renderInlineCiteChip({
 *   label: 'Deposition',
 *   anchor: { page: 23, pageEnd: 24 }
 * })
 * // Returns: "[pp.23–24]"
 */
export function renderInlineCiteChip(cite: InlineCite): string {
  const { anchor } = cite;
  const parts: string[] = [];
  
  // Priority 1: Bates numbering
  if (anchor.bates) {
    if (anchor.batesEnd && anchor.batesEnd !== anchor.bates) {
      parts.push(`Bates ${anchor.bates}–${anchor.batesEnd}`);
    } else {
      parts.push(`Bates ${anchor.bates}`);
    }
  }
  // Priority 2: Exhibit identifier
  else if (anchor.exhibitId) {
    parts.push(`Ex. ${anchor.exhibitId}`);
    
    // Add page within exhibit if specified
    if (anchor.page) {
      if (anchor.pageEnd && anchor.pageEnd !== anchor.page) {
        parts.push(`pp.${anchor.page}–${anchor.pageEnd}`);
      } else {
        parts.push(`p.${anchor.page}`);
      }
    }
  }
  // Priority 3: Page numbers
  else if (anchor.page) {
    if (anchor.pageEnd && anchor.pageEnd !== anchor.page) {
      parts.push(`pp.${anchor.page}–${anchor.pageEnd}`);
    } else {
      parts.push(`p.${anchor.page}`);
    }
  }
  
  // Always add line numbers if present
  if (anchor.lineStart !== undefined) {
    if (anchor.lineEnd !== undefined && anchor.lineEnd !== anchor.lineStart) {
      parts.push(`L${anchor.lineStart}–L${anchor.lineEnd}`);
    } else {
      parts.push(`L${anchor.lineStart}`);
    }
  }
  
  // Join parts with comma-space
  return `[${parts.join(', ')}]`;
}

/**
 * Converts a SourceAnchor to a URL query string for deep-linking
 * 
 * QUERY PARAMETERS:
 * - page: Page number to navigate to
 * - bates: Bates number to locate
 * - hl: Highlight specification (e.g., "L7-L19" for lines 7-19)
 * - exhibit: Exhibit identifier
 * - doc: Document ID
 * 
 * The viewer component reads these parameters and:
 * 1. Navigates to specified page/Bates
 * 2. Scrolls to make it visible
 * 3. Highlights specified lines/region
 * 
 * @param anchor - Source anchor to convert
 * @returns Query string (without leading "?")
 * 
 * @example
 * toViewerQuery({ page: 23, lineStart: 7, lineEnd: 19, bates: '0023' })
 * // Returns: "page=23&hl=L7-L19&bates=0023"
 * 
 * @example
 * toViewerQuery({ page: 12, exhibitId: 'A', documentId: 'doc-123' })
 * // Returns: "doc=doc-123&exhibit=A&page=12"
 */
export function toViewerQuery(anchor: SourceAnchor): string {
  const params = new URLSearchParams();
  
  // Document ID (if linking to specific document)
  if (anchor.documentId) {
    params.append('doc', anchor.documentId);
  }
  
  // Exhibit identifier
  if (anchor.exhibitId) {
    params.append('exhibit', anchor.exhibitId);
  }
  
  // Bates number
  if (anchor.bates) {
    params.append('bates', anchor.bates);
    // If bates range, include end
    if (anchor.batesEnd) {
      params.append('batesEnd', anchor.batesEnd);
    }
  }
  
  // Page number
  if (anchor.page) {
    params.append('page', anchor.page.toString());
    // If page range, include end
    if (anchor.pageEnd) {
      params.append('pageEnd', anchor.pageEnd.toString());
    }
  }
  
  // Highlight specification (line numbers)
  if (anchor.lineStart !== undefined) {
    if (anchor.lineEnd !== undefined && anchor.lineEnd !== anchor.lineStart) {
      params.append('hl', `L${anchor.lineStart}-L${anchor.lineEnd}`);
    } else {
      params.append('hl', `L${anchor.lineStart}`);
    }
  }
  
  return params.toString();
}

/**
 * Generates a full viewer URL with anchor query parameters
 * 
 * @param baseUrl - Base viewer URL (e.g., "/viewer" or "/documents/view/123")
 * @param anchor - Source anchor
 * @returns Complete URL with query string
 * 
 * @example
 * toViewerUrl('/documents/view/abc123', { page: 23, lineStart: 7 })
 * // Returns: "/documents/view/abc123?page=23&hl=L7"
 */
export function toViewerUrl(baseUrl: string, anchor: SourceAnchor): string {
  const query = toViewerQuery(anchor);
  return query ? `${baseUrl}?${query}` : baseUrl;
}

/**
 * Parses a viewer query string into a SourceAnchor
 * 
 * Useful for document viewer component to extract navigation parameters.
 * 
 * @param queryString - Query string (with or without leading "?")
 * @returns Parsed SourceAnchor
 * 
 * @example
 * parseViewerQuery('?page=23&hl=L7-L19&bates=0023')
 * // Returns: { page: 23, lineStart: 7, lineEnd: 19, bates: '0023' }
 */
export function parseViewerQuery(queryString: string): SourceAnchor {
  const params = new URLSearchParams(queryString.replace(/^\?/, ''));
  const anchor: SourceAnchor = {};
  
  // Document ID
  if (params.has('doc')) {
    anchor.documentId = params.get('doc') || undefined;
  }
  
  // Exhibit
  if (params.has('exhibit')) {
    anchor.exhibitId = params.get('exhibit') || undefined;
  }
  
  // Bates
  if (params.has('bates')) {
    anchor.bates = params.get('bates') || undefined;
  }
  if (params.has('batesEnd')) {
    anchor.batesEnd = params.get('batesEnd') || undefined;
  }
  
  // Page
  if (params.has('page')) {
    const page = parseInt(params.get('page') || '0', 10);
    if (!isNaN(page)) {
      anchor.page = page;
    }
  }
  if (params.has('pageEnd')) {
    const pageEnd = parseInt(params.get('pageEnd') || '0', 10);
    if (!isNaN(pageEnd)) {
      anchor.pageEnd = pageEnd;
    }
  }
  
  // Highlight (line numbers)
  if (params.has('hl')) {
    const hl = params.get('hl') || '';
    const lineMatch = hl.match(/L(\d+)(?:-L(\d+))?/);
    if (lineMatch) {
      anchor.lineStart = parseInt(lineMatch[1], 10);
      if (lineMatch[2]) {
        anchor.lineEnd = parseInt(lineMatch[2], 10);
      }
    }
  }
  
  return anchor;
}

/**
 * Renders a clickable inline citation chip with HTML
 * 
 * Generates an anchor tag that opens the viewer with appropriate query params.
 * 
 * @param cite - Inline citation
 * @param viewerBaseUrl - Base URL for document viewer
 * @returns HTML string for clickable chip
 * 
 * @example
 * renderClickableCiteChip(
 *   { label: 'Medical Records', anchor: { page: 23 } },
 *   '/documents/view/abc123'
 * )
 * // Returns: '<a href="/documents/view/abc123?page=23" class="cite-chip">[p.23]</a>'
 */
export function renderClickableCiteChip(cite: InlineCite, viewerBaseUrl: string): string {
  const chipText = renderInlineCiteChip(cite);
  const url = toViewerUrl(viewerBaseUrl, cite.anchor);
  
  return `<a href="${url}" class="cite-chip" title="${cite.label}">${chipText}</a>`;
}

/**
 * Validates that a SourceAnchor has at least one location reference
 * 
 * @param anchor - Anchor to validate
 * @returns true if anchor has valid location data
 */
export function isValidAnchor(anchor: SourceAnchor): boolean {
  return !!(
    anchor.bates ||
    anchor.page ||
    anchor.exhibitId ||
    anchor.documentId
  );
}

/**
 * Normalizes Bates numbering format
 * 
 * Converts various Bates formats to standardized format:
 * - Removes prefixes/suffixes if consistent
 * - Zero-pads numbers to consistent width
 * - Handles ranges
 * 
 * @param bates - Raw Bates number
 * @param padWidth - Desired zero-padding width (default: 4)
 * @returns Normalized Bates number
 * 
 * @example
 * normalizeBates('DEF-45', 6)
 * // Returns: "DEF-000045"
 * 
 * @example
 * normalizeBates('123', 4)
 * // Returns: "0123"
 */
export function normalizeBates(bates: string, padWidth: number = 4): string {
  // Extract numeric portion
  const numMatch = bates.match(/(\d+)$/);
  if (!numMatch) return bates;
  
  const num = numMatch[1];
  const prefix = bates.substring(0, bates.length - num.length);
  
  // Pad numeric portion
  const padded = num.padStart(padWidth, '0');
  
  return prefix + padded;
}

/**
 * Creates a citation chip from simple parameters
 * 
 * Helper function to avoid verbose object creation.
 * 
 * @param label - Citation label
 * @param bates - Bates number (optional)
 * @param page - Page number (optional)
 * @param lineStart - Starting line (optional)
 * @param lineEnd - Ending line (optional)
 * @returns Inline citation object
 */
export function createCite(
  label: string,
  options: {
    bates?: string;
    page?: number;
    lineStart?: number;
    lineEnd?: number;
    documentId?: string;
  }
): InlineCite {
  return {
    label,
    anchor: {
      bates: options.bates,
      page: options.page,
      lineStart: options.lineStart,
      lineEnd: options.lineEnd,
      documentId: options.documentId,
    },
  };
}

/**
 * Common citation chip patterns
 * 
 * Predefined styles for common citation types in legal documents.
 */
export const CITE_PATTERNS = {
  /**
   * Medical record citation
   */
  medicalRecord: (bates: string, page?: number, lineStart?: number, lineEnd?: number): InlineCite => ({
    label: 'Medical Records',
    anchor: { bates, page, lineStart, lineEnd },
  }),
  
  /**
   * Deposition transcript citation
   */
  deposition: (witnessName: string, page: number, lineStart?: number, lineEnd?: number): InlineCite => ({
    label: `Dep. of ${witnessName}`,
    anchor: { page, lineStart, lineEnd },
  }),
  
  /**
   * Police/accident report citation
   */
  policeReport: (page: number, lineStart?: number): InlineCite => ({
    label: 'Police Report',
    anchor: { page, lineStart },
  }),
  
  /**
   * Expert report citation
   */
  expertReport: (expertName: string, page: number): InlineCite => ({
    label: `Report of ${expertName}`,
    anchor: { page },
  }),
  
  /**
   * Exhibit citation
   */
  exhibit: (exhibitId: string, page?: number): InlineCite => ({
    label: `Exhibit ${exhibitId}`,
    anchor: { exhibitId, page },
  }),
};


