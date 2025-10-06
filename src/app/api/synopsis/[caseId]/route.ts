import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateMedicalSynopsis } from '@/lib/medical-synopsis-generator'

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

    // Get case data
    const { data: caseData } = await supabase
      .from('cases')
      .select('*, patients(*)')
      .eq('id', params.caseId)
      .single()

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Get chronology
    const { data: events } = await supabase
      .from('medical_events')
      .select('*')
      .eq('case_id', params.caseId)
      .order('event_date', { ascending: true })

    // Get billing summary
    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .eq('case_id', params.caseId)

    const billingData = {
      total_billed: bills?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0,
      num_providers: new Set(bills?.map(b => b.provider_name)).size || 0,
    }

    const synopsis = await generateMedicalSynopsis(
      caseData,
      { events },
      billingData
    )

    return NextResponse.json(synopsis)
  } catch (error) {
    console.error('Error generating synopsis:', error)
    return NextResponse.json({ error: 'Failed to generate synopsis' }, { status: 500 })
  }
}

