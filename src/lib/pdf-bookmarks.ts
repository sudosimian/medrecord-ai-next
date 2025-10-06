import { PDFDocument, PDFName, PDFDict, PDFArray, PDFRef } from 'pdf-lib'

export interface Bookmark {
  title: string
  pageNumber: number
  children?: Bookmark[]
}

export async function addBookmarksToPDF(
  pdfBuffer: Buffer,
  bookmarks: Bookmark[]
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer)
  
  // Create outline dictionary
  const outlineDict = pdfDoc.context.obj({})
  const outlineRef = pdfDoc.context.register(outlineDict)
  
  let firstRef: PDFRef | undefined
  let lastRef: PDFRef | undefined
  let count = 0
  
  for (const bookmark of bookmarks) {
    const { ref, itemCount } = createBookmarkItem(
      pdfDoc,
      bookmark,
      outlineRef
    )
    
    if (!firstRef) firstRef = ref
    lastRef = ref
    count += itemCount
  }
  
  if (firstRef && lastRef) {
    outlineDict.set(PDFName.of('First'), firstRef)
    outlineDict.set(PDFName.of('Last'), lastRef)
    outlineDict.set(PDFName.of('Count'), count)
  }
  
  // Add outline to catalog
  const catalog = pdfDoc.catalog
  catalog.set(PDFName.of('Outlines'), outlineRef)
  
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

function createBookmarkItem(
  pdfDoc: PDFDocument,
  bookmark: Bookmark,
  parentRef: PDFRef,
  prevRef?: PDFRef
): { ref: PDFRef; itemCount: number } {
  const page = pdfDoc.getPage(bookmark.pageNumber)
  const pageRef = pdfDoc.getPageRef(bookmark.pageNumber)
  
  const itemDict = pdfDoc.context.obj({
    Title: bookmark.title,
    Parent: parentRef,
    Dest: [pageRef, 'XYZ', null, null, null],
  })
  
  if (prevRef) {
    itemDict.set(PDFName.of('Prev'), prevRef)
  }
  
  const itemRef = pdfDoc.context.register(itemDict)
  
  let count = 1
  
  if (bookmark.children && bookmark.children.length > 0) {
    let firstChildRef: PDFRef | undefined
    let lastChildRef: PDFRef | undefined
    let childCount = 0
    let prevChildRef: PDFRef | undefined
    
    for (const child of bookmark.children) {
      const { ref: childRef, itemCount } = createBookmarkItem(
        pdfDoc,
        child,
        itemRef,
        prevChildRef
      )
      
      if (!firstChildRef) firstChildRef = childRef
      lastChildRef = childRef
      childCount += itemCount
      prevChildRef = childRef
    }
    
    if (firstChildRef && lastChildRef) {
      itemDict.set(PDFName.of('First'), firstChildRef)
      itemDict.set(PDFName.of('Last'), lastChildRef)
      itemDict.set(PDFName.of('Count'), childCount)
    }
    
    count += childCount
  }
  
  return { ref: itemRef, itemCount: count }
}

export function generateChronologyBookmarks(events: any[]): Bookmark[] {
  const bookmarks: Bookmark[] = []
  let currentYear: string | null = null
  let yearBookmark: Bookmark | null = null
  
  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    const eventDate = new Date(event.event_date)
    const year = eventDate.getFullYear().toString()
    
    if (year !== currentYear) {
      if (yearBookmark) {
        bookmarks.push(yearBookmark)
      }
      yearBookmark = {
        title: year,
        pageNumber: i,
        children: []
      }
      currentYear = year
    }
    
    yearBookmark?.children?.push({
      title: `${eventDate.toLocaleDateString()} - ${event.event_type || 'Medical Event'}`,
      pageNumber: i
    })
  }
  
  if (yearBookmark) {
    bookmarks.push(yearBookmark)
  }
  
  return bookmarks
}

