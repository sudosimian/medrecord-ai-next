import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { extractProviderList } from '@/lib/provider-extractor'

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const supabase = createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get medical events
    const { data: events } = await supabase
      .from('medical_events')
      .select('*')
      .eq('case_id', params.caseId)
      .eq('user_id', user.id)

    // Get bills
    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .eq('case_id', params.caseId)
      .eq('user_id', user.id)

    const providers = await extractProviderList(events || [], bills || [])

    return NextResponse.json({ providers })
  } catch (error) {
    console.error('Error fetching providers:', error)
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 })
  }
}

