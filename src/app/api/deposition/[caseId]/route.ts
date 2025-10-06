import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const supabase = createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('depositions')
      .select('*')
      .eq('case_id', params.caseId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ depositions: data || [] })
  } catch (error) {
    console.error('Error fetching depositions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch depositions' },
      { status: 500 }
    )
  }
}

