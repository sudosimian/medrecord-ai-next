import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { mergePDFs } from '@/lib/pdf-merger'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { document_ids, case_id, output_filename } = body

    if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json({ error: 'document_ids array is required' }, { status: 400 })
    }

    // Download all PDFs
    const pdfBuffers: Buffer[] = []
    
    for (const docId of document_ids) {
      const { data: docData } = await supabase
        .from('documents')
        .select('file_path')
        .eq('id', docId)
        .eq('user_id', user.id)
        .single()

      if (docData) {
        const { data: fileData } = await supabase.storage
          .from('documents')
          .download(docData.file_path)

        if (fileData) {
          pdfBuffers.push(Buffer.from(await fileData.arrayBuffer()))
        }
      }
    }

    // Merge PDFs
    const mergedPdf = await mergePDFs(pdfBuffers)

    // Upload merged PDF
    const filename = output_filename || `merged_${Date.now()}.pdf`
    const filePath = `${user.id}/${case_id}/${filename}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, mergedPdf, { contentType: 'application/pdf' })

    if (uploadError) {
      return NextResponse.json({ error: 'Failed to upload merged PDF' }, { status: 500 })
    }

    // Create document record
    const { data: newDoc, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        case_id,
        original_filename: filename,
        file_path: filePath,
        file_size: mergedPdf.length,
        mime_type: 'application/pdf',
        document_type: 'merged',
      })
      .select()
      .single()

    if (docError) {
      return NextResponse.json({ error: 'Failed to create document record' }, { status: 500 })
    }

    return NextResponse.json({ document: newDoc })
  } catch (error) {
    console.error('Error merging PDFs:', error)
    return NextResponse.json({ error: 'Failed to merge PDFs' }, { status: 500 })
  }
}

