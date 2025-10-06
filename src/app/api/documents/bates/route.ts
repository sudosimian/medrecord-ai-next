import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { generateDocumentBatesNumbers } from '@/lib/bates-numbering'
import { extractPDFText } from '@/lib/pdf-processor'

/**
 * Apply Bates numbering to documents in a case
 * This is a critical legal feature for source citations
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { caseId, prefix } = body

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 })
    }

    // Get case data for prefix
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('case_number, patients(last_name)')
      .eq('id', caseId)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Use patient last name or custom prefix
    const batesPrefix = prefix || caseData.patients?.last_name?.toUpperCase() || 'CASE'

    // Get all documents for case
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: true })

    if (docsError || !documents) {
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    let currentBatesNumber = 1
    const numberedDocuments = []

    // Process each document
    for (const doc of documents) {
      try {
        // Download PDF to count pages
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('documents')
          .download(doc.storage_path)

        if (downloadError || !fileData) {
          console.error(`Failed to download document ${doc.id}:`, downloadError)
          continue
        }

        // Extract PDF to count pages
        const buffer = Buffer.from(await fileData.arrayBuffer())
        const { pageCount } = await extractPDFText(buffer)

        // Generate Bates numbers for this document
        const batesInfo = generateDocumentBatesNumbers(
          doc.id,
          pageCount,
          batesPrefix,
          currentBatesNumber
        )

        // Update document with Bates range
        const { error: updateError } = await supabase
          .from('documents')
          .update({
            metadata: {
              ...doc.metadata,
              bates_prefix: batesPrefix,
              bates_start: currentBatesNumber,
              bates_end: currentBatesNumber + pageCount - 1,
              bates_range: batesInfo.range.formatted,
              page_count: pageCount,
              bates_pages: batesInfo.pages,
            },
          })
          .eq('id', doc.id)

        if (updateError) {
          console.error(`Failed to update document ${doc.id}:`, updateError)
        }

        numberedDocuments.push({
          id: doc.id,
          filename: doc.filename,
          pageCount,
          batesRange: batesInfo.range.formatted,
        })

        // Increment for next document
        currentBatesNumber += pageCount
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error)
        continue
      }
    }

    return NextResponse.json({
      success: true,
      prefix: batesPrefix,
      documentsProcessed: numberedDocuments.length,
      totalPages: currentBatesNumber - 1,
      documents: numberedDocuments,
    })
  } catch (error) {
    console.error('Error applying Bates numbering:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

