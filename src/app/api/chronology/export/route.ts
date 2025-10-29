import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { exportChronologyToExcel, exportChronologyToWord } from '@/lib/export-utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { case_id, format } = body

    if (!case_id || !format) {
      return NextResponse.json({ error: 'case_id and format are required' }, { status: 400 })
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

    // Get medical events
    const { data: events, error: eventsError } = await supabase
      .from('medical_events')
      .select('*')
      .eq('case_id', case_id)
      .order('event_date', { ascending: true })

    if (eventsError) {
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
    }

    const caseInfo = {
      case_number: caseData.case_number,
      patient_name: `${caseData.patients.first_name} ${caseData.patients.last_name}`,
      incident_date: caseData.incident_date,
    }

    let fileBuffer: Buffer
    let filename: string
    let contentType: string

    if (format === 'excel') {
      fileBuffer = exportChronologyToExcel(events)
      filename = `chronology_${caseData.case_number}_${new Date().toISOString().split('T')[0]}.xlsx`
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    } else if (format === 'word') {
      fileBuffer = await exportChronologyToWord(events, caseInfo)
      filename = `chronology_${caseData.case_number}_${new Date().toISOString().split('T')[0]}.docx`
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else {
      return NextResponse.json({ error: 'Invalid format. Use excel or word' }, { status: 400 })
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting chronology:', error)
    return NextResponse.json(
      { error: 'Failed to export chronology' },
      { status: 500 }
    )
  }
}

