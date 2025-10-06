import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { exportNarrativeToWord } from '@/lib/export-utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { case_id } = body

    if (!case_id) {
      return NextResponse.json({ error: 'case_id is required' }, { status: 400 })
    }

    // Get case data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*, patients(*)')
      .eq('id', case_id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Get narrative
    const { data: narrative, error: narrativeError } = await supabase
      .from('narratives')
      .select('*')
      .eq('case_id', case_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (narrativeError || !narrative) {
      return NextResponse.json({ error: 'Narrative not found' }, { status: 404 })
    }

    const caseInfo = {
      case_number: caseData.case_number,
      patient_name: `${caseData.patients.first_name} ${caseData.patients.last_name}`,
      incident_date: caseData.incident_date,
    }

    const fileBuffer = await exportNarrativeToWord(narrative, caseInfo)
    const filename = `narrative_${caseData.case_number}_${new Date().toISOString().split('T')[0]}.docx`

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting narrative:', error)
    return NextResponse.json(
      { error: 'Failed to export narrative' },
      { status: 500 }
    )
  }
}

