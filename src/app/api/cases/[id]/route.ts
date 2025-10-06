import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caseId = params.id

    const { data: caseData, error } = await supabase
      .from('cases')
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name,
          date_of_birth,
          phone,
          email
        )
      `)
      .eq('id', caseId)
      .eq('user_id', user.id)
      .single()

    if (error || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    return NextResponse.json({ case: caseData })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caseId = params.id
    const updates = await request.json()

    // Remove fields that shouldn't be updated
    delete updates.id
    delete updates.user_id
    delete updates.created_at
    delete updates.updated_at

    const { data: updatedCase, error } = await supabase
      .from('cases')
      .update(updates)
      .eq('id', caseId)
      .eq('user_id', user.id)
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name
        )
      `)
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update case' }, { status: 500 })
    }

    return NextResponse.json({ case: updatedCase })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caseId = params.id

    const { error } = await supabase
      .from('cases')
      .delete()
      .eq('id', caseId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete error:', error)
      return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

