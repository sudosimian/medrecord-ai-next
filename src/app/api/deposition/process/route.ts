import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { processDepositionTranscript } from '@/lib/deposition-processor'
import { extractTextFromPDF } from '@/lib/pdf-processor'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { case_id, document_id, witness_name, witness_role, deposition_date } = body

    if (!case_id || !document_id || !witness_name || !witness_role || !deposition_date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get document from storage
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError || !docData) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Download file from storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('documents')
      .download(docData.file_path)

    if (fileError || !fileData) {
      return NextResponse.json({ error: 'Failed to download document' }, { status: 500 })
    }

    // Extract text from PDF
    const buffer = Buffer.from(await fileData.arrayBuffer())
    const extractedText = await extractTextFromPDF(buffer)

    // Get case data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', case_id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Process deposition
    const witnessData = {
      name: witness_name,
      role: witness_role,
      deposition_date,
    }

    const depositionData = await processDepositionTranscript(
      extractedText,
      witnessData,
      caseData
    )

    // Save to database
    const { data: savedDeposition, error: saveError } = await supabase
      .from('depositions')
      .insert({
        case_id,
        user_id: user.id,
        document_id,
        ...depositionData,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving deposition:', saveError)
      return NextResponse.json({ error: 'Failed to save deposition summary' }, { status: 500 })
    }

    return NextResponse.json(savedDeposition)
  } catch (error) {
    console.error('Error processing deposition:', error)
    return NextResponse.json(
      { error: 'Failed to process deposition' },
      { status: 500 }
    )
  }
}

