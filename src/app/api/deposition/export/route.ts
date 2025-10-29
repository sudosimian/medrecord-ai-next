import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { exportDepositionToExcel } from '@/lib/export-utils'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { deposition_id } = body

    if (!deposition_id) {
      return NextResponse.json({ error: 'deposition_id is required' }, { status: 400 })
    }

    // Get deposition
    const { data: deposition, error: depositionError } = await supabase
      .from('depositions')
      .select('*, cases(case_number)')
      .eq('id', deposition_id)
      .single()

    if (depositionError || !deposition) {
      return NextResponse.json({ error: 'Deposition not found' }, { status: 404 })
    }

    const fileBuffer = exportDepositionToExcel(deposition)
    const witnessName = deposition.witness.name.replace(/\s+/g, '_')
    const filename = `deposition_${witnessName}_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting deposition:', error)
    return NextResponse.json(
      { error: 'Failed to export deposition' },
      { status: 500 }
    )
  }
}

