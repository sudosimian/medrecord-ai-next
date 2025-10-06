import pdf from 'pdf-parse'

export interface ExtractedPage {
  pageNumber: number
  text: string
  metadata?: Record<string, any>
}

export interface ProcessedDocument {
  text: string
  pages: ExtractedPage[]
  numPages: number
  metadata: {
    title?: string
    author?: string
    creator?: string
    producer?: string
    creationDate?: Date
  }
}

export async function extractTextFromPDF(buffer: Buffer): Promise<ProcessedDocument> {
  try {
    const data = await pdf(buffer)

    // Parse pages (pdf-parse doesn't give per-page text by default)
    const pages: ExtractedPage[] = []
    const textContent = data.text
    
    // Simple page splitting - in production, use a more sophisticated method
    const pageTexts = textContent.split('\f') // Form feed character often separates pages
    
    pageTexts.forEach((pageText, index) => {
      if (pageText.trim()) {
        pages.push({
          pageNumber: index + 1,
          text: pageText.trim(),
        })
      }
    })

    return {
      text: data.text,
      pages,
      numPages: data.numpages,
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
      },
    }
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

export async function extractTextFromDocument(buffer: Buffer, mimeType: string): Promise<ProcessedDocument> {
  if (mimeType === 'application/pdf') {
    return extractTextFromPDF(buffer)
  }
  
  // For now, only support PDF
  // Future: Add support for Word docs, images with OCR, etc.
  throw new Error(`Unsupported document type: ${mimeType}`)
}

