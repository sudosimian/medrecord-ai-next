import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const patientId = formData.get('patientId') as string | null
    const caseId = formData.get('caseId') as string | null
    const documentType = formData.get('documentType') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Upload failed', details: uploadError.message }, { status: 500 })
    }

    // Create document record in database
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        patient_id: patientId,
        case_id: caseId,
        storage_path: filePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        document_type: documentType || 'other',
        ocr_completed: false,
        classified: false,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Cleanup uploaded file if database insert fails
      await supabase.storage.from('documents').remove([filePath])
      return NextResponse.json({ error: 'Database error', details: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      document,
      message: 'File uploaded successfully' 
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

