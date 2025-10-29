import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { detectMissingRecords } from '@/lib/missing-records-detector'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseId } = await params

    const { data: events } = await supabase
      .from('medical_events')
      .select('*')
      .eq('case_id', caseId)
      .eq('user_id', user.id)

    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('case_id', caseId)
      .eq('user_id', user.id)

    const missingRecords = await detectMissingRecords(events || [], documents || [])

    return NextResponse.json({ missing_records: missingRecords })
  } catch (error) {
    console.error('Error detecting missing records:', error)
    return NextResponse.json({ error: 'Failed to detect missing records' }, { status: 500 })
  }
}

