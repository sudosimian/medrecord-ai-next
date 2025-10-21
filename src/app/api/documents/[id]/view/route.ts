import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get document metadata
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Generate signed URL for viewing (valid for 1 hour)
    const { data, error } = await supabase
      .storage
      .from('documents')
      .createSignedUrl(document.file_path, 3600)

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to generate view URL' }, { status: 500 })
    }

    return NextResponse.json({
      url: data.signedUrl,
      filename: document.original_filename,
      document_id: document.id,
    })
  } catch (error) {
    console.error('Error generating document view URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate view URL' },
      { status: 500 }
    )
  }
}

