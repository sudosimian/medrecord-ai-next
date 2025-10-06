import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const caseId = searchParams.get('caseId')

    // Build query
    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    if (caseId) {
      query = query.eq('case_id', caseId)
    }

    const { data: documents, error } = await query

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
    }

    return NextResponse.json({ documents })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('id')

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 })
    }

    // Get document to find storage path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('storage_path, user_id')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Verify ownership
    if (document.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([document.storage_path])

    if (storageError) {
      console.error('Storage deletion error:', storageError)
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Document deleted' })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

