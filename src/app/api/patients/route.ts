import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: patients, error } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user.id)
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Query error:', error)
      return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
    }

    return NextResponse.json({ patients: patients || [] })
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
      first_name,
      last_name,
      date_of_birth,
      phone,
      email,
      address,
      city,
      state,
      zip,
      notes,
    } = body

    if (!first_name || !last_name) {
      return NextResponse.json({ error: 'First name and last name required' }, { status: 400 })
    }

    const { data: newPatient, error } = await supabase
      .from('patients')
      .insert({
        user_id: user.id,
        first_name,
        last_name,
        date_of_birth: date_of_birth || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
    }

    return NextResponse.json({ patient: newPatient }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

