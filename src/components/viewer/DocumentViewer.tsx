/**
 * Document Viewer Component with Deep-Linking Support
 * 
 * PURPOSE: Displays PDF documents with navigation to specific pages, Bates numbers,
 * and line-level highlighting. Supports deep-linking via URL query parameters.
 * 
 * QUERY PARAMETERS:
 * - ?page=23 - Navigate to page 23
 * - ?bates=0045 - Navigate to Bates number 0045
 * - ?hl=L7-L19 - Highlight lines 7 through 19
 * - ?doc=abc123 - Load specific document by ID
 * - ?exhibit=A - Load specific exhibit
 * 
 * USAGE:
 * <DocumentViewer documentId="abc123" />
 * 
 * URL: /viewer?doc=abc123&page=23&hl=L7-L19
 * Opens document abc123, page 23, with lines 7-19 highlighted
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { parseViewerQuery, type SourceAnchor } from '@/lib/citations';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

interface DocumentViewerProps {
  documentId?: string;      // Document ID to load
  documentUrl?: string;     // Direct URL to PDF
  initialPage?: number;     // Starting page (1-indexed)
  showControls?: boolean;   // Show navigation controls
  className?: string;       // Custom CSS class
}

/**
 * Document Viewer Component
 * 
 * Reads query parameters on mount and navigates/highlights accordingly.
 * Uses basic PDF rendering (can be enhanced with react-pdf or pdf.js).
 */
export function DocumentViewer({
  documentId,
  documentUrl,
  initialPage = 1,
  showControls = true,
  className = '',
}: DocumentViewerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Parse query parameters for deep-linking
  const anchor: SourceAnchor = parseViewerQuery(searchParams?.toString() || '');
  
  // State
  const [currentPage, setCurrentPage] = useState<number>(anchor.page || initialPage);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(100);
  const [loading, setLoading] = useState<boolean>(true);
  const [highlightLines, setHighlightLines] = useState<{ start: number; end: number } | null>(null);
  
  // Refs
  const viewerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  
  // Load document and apply deep-linking on mount
  useEffect(() => {
    // Apply query param navigation
    if (anchor.page && anchor.page !== currentPage) {
      setCurrentPage(anchor.page);
    }
    
    // Apply highlight if specified
    if (anchor.lineStart !== undefined) {
      setHighlightLines({
        start: anchor.lineStart,
        end: anchor.lineEnd || anchor.lineStart,
      });
    }
    
    // TODO: If anchor.bates is specified, resolve Bates to page number
    // This would require a mapping of Bates numbers to pages in the document
    
    // Simulate document loading (replace with actual PDF loading)
    setTimeout(() => {
      setLoading(false);
      setTotalPages(100); // Mock total pages
      
      // Scroll to highlighted region after document loads
      if (highlightRef.current) {
        highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 500);
  }, [anchor]);
  
  // Navigation handlers
  const goToPage = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    
    // Update URL query param
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', validPage.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };
  
  const previousPage = () => goToPage(currentPage - 1);
  const nextPage = () => goToPage(currentPage + 1);
  
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  
  const handleDownload = () => {
    // TODO: Implement document download
    console.log('Download document:', documentId || documentUrl);
  };
  
  if (loading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading document...</p>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <div className={`flex flex-col ${className}`}>
      {/* Toolbar */}
      {showControls && (
        <Card className="p-4 mb-4">
          <div className="flex items-center justify-between">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button className="" variant="outline"
                size="sm"
                onClick={previousPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                <Input className="" type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value, 10);
                    if (!isNaN(page)) goToPage(page);
                  }}
                  className="w-16 text-center"
                  min={1}
                  max={totalPages}
                />
                <span className="text-sm text-gray-600">/ {totalPages}</span>
              </div>
              
              <Button className="" variant="outline"
                size="sm"
                onClick={nextPage}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Zoom */}
            <div className="flex items-center gap-2">
              <Button className="" variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 w-16 text-center">{zoom}%</span>
              <Button className="" variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Download */}
            <Button className="" variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          
          {/* Bates/Highlight info */}
          {(anchor.bates || highlightLines) && (
            <div className="mt-2 pt-2 border-t text-sm text-gray-600">
              {anchor.bates && <span className="mr-4">Bates: {anchor.bates}</span>}
              {highlightLines && (
                <span>
                  Highlighted: Lines {highlightLines.start}
                  {highlightLines.end !== highlightLines.start && `–${highlightLines.end}`}
                </span>
              )}
            </div>
          )}
        </Card>
      )}
      
      {/* Document Display Area */}
      <Card className="flex-1 overflow-auto">
        <div
          ref={viewerRef}
          className="p-8"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        >
          {/* Mock document page */}
          <div className="bg-white shadow-lg mx-auto" style={{ width: '8.5in', minHeight: '11in' }}>
            <div className="p-8">
              <div className="text-sm text-gray-500 mb-4">
                Page {currentPage} of {totalPages}
              </div>
              
              {/* Document content would go here */}
              {/* This is a placeholder - integrate with actual PDF renderer */}
              <div className="space-y-4">
                <p className="text-gray-800">
                  [Document content for page {currentPage}]
                </p>
                
                {/* Highlight region if specified */}
                {highlightLines && (
                  <div
                    ref={highlightRef}
                    className="bg-yellow-200 border-l-4 border-yellow-500 p-4 my-4"
                  >
                    <p className="text-sm font-mono text-gray-700">
                      Lines {highlightLines.start}–{highlightLines.end}
                    </p>
                    <p className="text-gray-800 mt-2">
                      [Highlighted content from lines {highlightLines.start} to {highlightLines.end}]
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      This region was highlighted via deep-link query parameter: ?hl=L{highlightLines.start}
                      {highlightLines.end !== highlightLines.start && `-L${highlightLines.end}`}
                    </p>
                  </div>
                )}
                
                <p className="text-gray-600 text-sm">
                  [More document content...]
                </p>
              </div>
              
              {/* Bates number footer */}
              {anchor.bates && (
                <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
                  Bates No. {anchor.bates}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Integration notes */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
        <p className="font-semibold mb-2">📄 DocumentViewer Integration Notes:</p>
        <ul className="list-disc list-inside space-y-1 text-xs">
          <li>Replace mock content with actual PDF rendering (react-pdf, pdf.js, etc.)</li>
          <li>Implement Bates-to-page mapping for ?bates= navigation</li>
          <li>Add OCR text layer for line-number-based highlighting</li>
          <li>Connect to document storage/API to load by documentId</li>
          <li>Enhance highlighting with precise line coordinates</li>
        </ul>
      </div>
    </div>
  );
}

/**
 * Example usage in a page component:
 * 
 * ```tsx
 * // app/documents/[id]/page.tsx
 * import { DocumentViewer } from '@/components/viewer/DocumentViewer'
 * 
 * export default function ViewDocumentPage({ params }: { params: { id: string } }) {
 *   return (
 *     <div className="container mx-auto py-8">
 *       <h1 className="text-2xl font-bold mb-4">Document Viewer</h1>
 *       <DocumentViewer documentId={params.id} />
 *     </div>
 *   )
 * }
 * ```
 * 
 * Deep-linking examples:
 * - /documents/abc123?page=23 → Opens page 23
 * - /documents/abc123?page=23&hl=L7-L19 → Opens page 23, highlights lines 7-19
 * - /documents/abc123?bates=0045&hl=L10 → Opens Bates 0045, highlights line 10
 */

export default DocumentViewer;


