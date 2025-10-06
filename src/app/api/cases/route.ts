import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')

    let query = supabase
      .from('cases')
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (patientId) {
      query = query.eq('patient_id', patientId)
    }

    const { data: cases, error } = await query

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
    }

    return NextResponse.json({ cases: cases || [] })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      patient_id,
      case_number,
      case_type,
      incident_date,
      status,
      attorney_name,
      insurance_company,
      claim_number,
      notes,
    } = body

    if (!patient_id || !case_type) {
      return NextResponse.json({ error: 'Patient ID and case type required' }, { status: 400 })
    }

    // Generate case number if not provided
    const caseNumber = case_number || `CASE-${Date.now()}`

    const { data: newCase, error } = await supabase
      .from('cases')
      .insert({
        user_id: user.id,
        patient_id,
        case_number: caseNumber,
        case_type,
        incident_date: incident_date || null,
        status: status || 'active',
        attorney_name: attorney_name || null,
        insurance_company: insurance_company || null,
        claim_number: claim_number || null,
        notes: notes || null,
      })
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
      console.error('Insert error:', error)
      return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
    }

    return NextResponse.json({ case: newCase }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

