import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { extractTextFromDocument } from '@/lib/pdf-processor'
import { extractMedicalEvents, calculateSignificance } from '@/lib/medical-extractor'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseId, documentIds, options } = await request.json()

    if (!caseId || !documentIds || !Array.isArray(documentIds)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    const startTime = Date.now()
    const allEvents: any[] = []
    const processedDocs: string[] = []

    // Process each document
    for (const documentId of documentIds) {
      try {
        // Get document from database
        const { data: document, error: docError } = await supabase
          .from('documents')
          .select('*')
          .eq('id', documentId)
          .eq('user_id', user.id)
          .single()

        if (docError || !document) {
          console.error(`Document ${documentId} not found or unauthorized`)
          continue
        }

        // Download file from storage
        const { data: fileData, error: storageError } = await supabase.storage
          .from('documents')
          .download(document.storage_path)

        if (storageError || !fileData) {
          console.error(`Failed to download document ${documentId}:`, storageError)
          continue
        }

        // Convert to buffer
        const buffer = Buffer.from(await fileData.arrayBuffer())

        // Extract text
        const extractedDoc = await extractTextFromDocument(buffer, document.file_type)

        // Update document with extracted text
        await supabase
          .from('documents')
          .update({
            extracted_text: extractedDoc.text.substring(0, 100000), // Limit size
            page_count: extractedDoc.numPages,
          })
          .eq('id', documentId)

        // Extract medical events (with privacy guard)
        const events = await extractMedicalEvents(extractedDoc.text, {
          extractCodes: options?.extractCodes,
          caseId: caseId,
          documentId: documentId,
          userId: user.id,
        })

        // Add document reference
        events.forEach(event => {
          allEvents.push({
            ...event,
            documentId,
          })
        })

        processedDocs.push(documentId)
      } catch (error) {
        console.error(`Error processing document ${documentId}:`, error)
      }
    }

    // Remove duplicates (simple text-based comparison)
    const uniqueEvents = removeDuplicateEvents(allEvents)
    const duplicatesFound = allEvents.length - uniqueEvents.length

    // Insert events into database
    const eventsToInsert = uniqueEvents.map(event => ({
      case_id: caseId,
      document_id: event.documentId,
      event_date: event.date,
      event_time: event.time || null,
      provider_name: event.provider || null,
      facility: event.facility || null,
      event_type: event.eventType || null,
      description: event.description,
      significance_score: event.significance || calculateSignificance(event),
      icd_codes: event.icdCodes || null,
      cpt_codes: event.cptCodes || null,
      is_duplicate: false,
    }))

    const { data: insertedEvents, error: insertError } = await supabase
      .from('medical_events')
      .insert(eventsToInsert)
      .select()

    if (insertError) {
      console.error('Error inserting events:', insertError)
      return NextResponse.json({ error: 'Failed to save events' }, { status: 500 })
    }

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      events: insertedEvents,
      stats: {
        totalEvents: insertedEvents?.length || 0,
        duplicatesFound,
        processingTime,
        documentsProcessed: processedDocs.length,
      },
    })
  } catch (error) {
    console.error('Chronology processing error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

function removeDuplicateEvents(events: any[]): any[] {
  const seen = new Set<string>()
  return events.filter(event => {
    // Create a key based on date, description, and provider
    const key = `${event.date}-${event.description.substring(0, 50)}-${event.provider || ''}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

