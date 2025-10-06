import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { extractPDFText } from '@/lib/pdf-processor'
import { extractBillsFromText, detectDuplicateBills } from '@/lib/bill-extractor'
import { categorizeServiceType } from '@/types/billing'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { caseId, documentIds } = body

    if (!caseId || !documentIds || documentIds.length === 0) {
      return NextResponse.json(
        { error: 'Case ID and document IDs required' },
        { status: 400 }
      )
    }

    // Fetch documents
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('*')
      .in('id', documentIds)
      .eq('user_id', user.id)

    if (docError || !documents || documents.length === 0) {
      return NextResponse.json({ error: 'Documents not found' }, { status: 404 })
    }

    const allExtractedBills: any[] = []

    // Process each document
    for (const doc of documents) {
      try {
        // Download PDF from storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('documents')
          .download(doc.storage_path)

        if (downloadError || !fileData) {
          console.error(`Failed to download document ${doc.id}:`, downloadError)
          continue
        }

        // Extract text from PDF
        const buffer = Buffer.from(await fileData.arrayBuffer())
        const { fullText } = await extractPDFText(buffer)

        // Extract bills using GPT-4o
        const extractedBills = await extractBillsFromText(fullText)

        // Add to collection with document reference
        for (const bill of extractedBills) {
          allExtractedBills.push({
            ...bill,
            document_id: doc.id,
          })
        }
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error)
        continue
      }
    }

    if (allExtractedBills.length === 0) {
      return NextResponse.json({
        success: true,
        bills: [],
        stats: {
          total_documents: documents.length,
          bills_extracted: 0,
          duplicates_found: 0,
          overcharges_found: 0,
          processing_time: Date.now() - startTime,
        },
      })
    }

    // Detect duplicates
    const duplicates = await detectDuplicateBills(allExtractedBills)

    // Mark duplicates
    const duplicateIndices = new Set<number>()
    for (const dup of duplicates) {
      duplicateIndices.add(dup.index2) // Mark the second occurrence as duplicate
    }

    // Insert bills into database
    const billsToInsert = allExtractedBills.map((bill, index) => ({
      case_id: caseId,
      document_id: bill.document_id,
      bill_date: bill.bill_date,
      provider_name: bill.provider_name,
      service_description: bill.service_description,
      service_type: bill.cpt_code ? categorizeServiceType(bill.cpt_code, bill.service_description) : 'Other',
      cpt_code: bill.cpt_code || null,
      icd_code: bill.icd_code || null,
      units: bill.units || 1,
      charge_amount: bill.charge_amount,
      paid_amount: bill.paid_amount || null,
      balance: bill.balance || null,
      is_duplicate: duplicateIndices.has(index),
    }))

    const { data: insertedBills, error: insertError } = await supabase
      .from('bills')
      .insert(billsToInsert)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save bills' },
        { status: 500 }
      )
    }

    const processingTime = Date.now() - startTime

    return NextResponse.json({
      success: true,
      bills: insertedBills,
      stats: {
        total_documents: documents.length,
        bills_extracted: insertedBills?.length || 0,
        duplicates_found: duplicates.length,
        overcharges_found: 0, // Will be calculated in summary
        processing_time: processingTime,
      },
    })
  } catch (error) {
    console.error('Error processing billing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

