import { PDFDocument } from 'pdf-lib'

export async function mergePDFs(pdfBuffers: Buffer[]): Promise<Buffer> {
  const mergedPdf = await PDFDocument.create()
  
  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer)
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
    copiedPages.forEach((page) => mergedPdf.addPage(page))
  }
  
  const mergedPdfBytes = await mergedPdf.save()
  return Buffer.from(mergedPdfBytes)
}

export async function sortPDFPages(pdfBuffer: Buffer, pageOrder: number[]): Promise<Buffer> {
  const pdf = await PDFDocument.load(pdfBuffer)
  const sortedPdf = await PDFDocument.create()
  
  for (const pageIndex of pageOrder) {
    const [copiedPage] = await sortedPdf.copyPages(pdf, [pageIndex])
    sortedPdf.addPage(copiedPage)
  }
  
  const sortedPdfBytes = await sortedPdf.save()
  return Buffer.from(sortedPdfBytes)
}

export async function splitPDF(pdfBuffer: Buffer, ranges: { start: number; end: number }[]): Promise<Buffer[]> {
  const pdf = await PDFDocument.load(pdfBuffer)
  const splitPdfs: Buffer[] = []
  
  for (const range of ranges) {
    const newPdf = await PDFDocument.create()
    const pageIndices = Array.from(
      { length: range.end - range.start + 1 },
      (_, i) => range.start + i
    )
    const copiedPages = await newPdf.copyPages(pdf, pageIndices)
    copiedPages.forEach((page) => newPdf.addPage(page))
    
    const pdfBytes = await newPdf.save()
    splitPdfs.push(Buffer.from(pdfBytes))
  }
  
  return splitPdfs
}

