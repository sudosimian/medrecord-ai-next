import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { proposeRedactions } from '@/lib/redaction'

/**
 * GET /api/documents/[id]/redactions
 * Proposes redaction boxes for PII/PHI detected in document's extracted text
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: documentId } = await params

    // Fetch document with extracted text (RLS ensures user has access)
    const { data: document, error } = await supabase
      .from('documents')
      .select('id, extracted_text, user_id')
      .eq('id', documentId)
      .single()

    if (error || !document) {
      console.error('Failed to fetch document:', error)
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Verify ownership (redundant with RLS but explicit)
    if (document.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Extract text and propose redactions
    const extractedText = document.extracted_text || ''
    const proposals = proposeRedactions(extractedText)

    return NextResponse.json({ proposals })
  } catch (error) {
    console.error('Error in GET /api/documents/[id]/redactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

