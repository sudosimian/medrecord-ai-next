import { createWorker } from 'tesseract.js'
import { PDFDocument } from 'pdf-lib'

export async function extractTextWithOCR(pdfBuffer: Buffer): Promise<string> {
  try {
    // Load PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const pageCount = pdfDoc.getPageCount()
    
    // Initialize Tesseract worker
    const worker = await createWorker('eng')
    
    let fullText = ''
    
    // Process each page
    for (let i = 0; i < pageCount; i++) {
      try {
        // Extract page as image (simplified - in production, use pdf2image or similar)
        // For now, we'll note that this requires additional setup
        console.log(`Processing page ${i + 1} of ${pageCount} with OCR`)
        
        // Note: Full OCR implementation would require:
        // 1. Convert PDF page to image (using pdf2pic or similar)
        // 2. Run Tesseract on the image
        // 3. Combine results
        
        // Placeholder for now - would need pdf2pic package
        fullText += `\n\n--- Page ${i + 1} ---\n\n`
        
      } catch (pageError) {
        console.error(`Error processing page ${i + 1}:`, pageError)
        fullText += `\n\n[Error processing page ${i + 1}]\n\n`
      }
    }
    
    await worker.terminate()
    
    return fullText
  } catch (error) {
    console.error('OCR processing error:', error)
    throw new Error('Failed to process document with OCR')
  }
}

export async function detectScannedPDF(pdfBuffer: Buffer): Promise<boolean> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    const page = pdfDoc.getPage(0)
    
    // Check if page has text content
    // If no text content, likely scanned
    const pageText = await extractTextFromPage(page)
    
    return pageText.trim().length < 50 // If very little text, probably scanned
  } catch (error) {
    console.error('Error detecting scanned PDF:', error)
    return false
  }
}

async function extractTextFromPage(page: any): Promise<string> {
  // Simplified text extraction
  // In production, use proper PDF text extraction
  return ''
}

export function shouldUseOCR(extractedText: string, fileSize: number): boolean {
  // Heuristic: if very little text extracted but file is large, likely scanned
  const textLength = extractedText.trim().length
  const fileSizeKB = fileSize / 1024
  
  // If less than 100 chars but file > 100KB, probably scanned
  if (textLength < 100 && fileSizeKB > 100) {
    return true
  }
  
  // If text/size ratio is very low, probably scanned
  const ratio = textLength / fileSizeKB
  return ratio < 1 // Less than 1 character per KB suggests scanned
}

