import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
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

    const { id: eventId } = await params
    const updates = await request.json()

    // Verify event belongs to user (via case)
    const { data: event, error: fetchError } = await supabase
      .from('medical_events')
      .select('case_id, cases(user_id)')
      .eq('id', eventId)
      .single()

    if (fetchError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Update event
    const { data: updatedEvent, error: updateError } = await supabase
      .from('medical_events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating event:', updateError)
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 })
    }

    return NextResponse.json({ event: updatedEvent })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    const { id: eventId } = await params

    // Verify event belongs to user (via case)
    const { data: event, error: fetchError } = await supabase
      .from('medical_events')
      .select('case_id, cases(user_id)')
      .eq('id', eventId)
      .single()

    if (fetchError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Delete event
    const { error: deleteError } = await supabase
      .from('medical_events')
      .delete()
      .eq('id', eventId)

    if (deleteError) {
      console.error('Error deleting event:', deleteError)
      return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

