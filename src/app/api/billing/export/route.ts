import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { exportBillingToExcel } from '@/lib/export-utils'

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
      .select('case_number')
      .eq('id', case_id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Get bills
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('*')
      .eq('case_id', case_id)
      .order('date_of_service', { ascending: true })

    if (billsError) {
      return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
    }

    // Calculate summary
    const summary = {
      totalBilled: bills.reduce((sum, bill) => sum + (bill.amount || 0), 0),
      totalDuplicates: bills.filter(b => b.status === 'duplicate').reduce((sum, bill) => sum + (bill.amount || 0), 0),
      totalOvercharges: bills.reduce((sum, bill) => sum + (bill.variance || 0), 0),
      netAmount: 0,
    }
    summary.netAmount = summary.totalBilled - summary.totalDuplicates - summary.totalOvercharges

    const fileBuffer = exportBillingToExcel(bills, summary)
    const filename = `billing_${caseData.case_number}_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting billing:', error)
    return NextResponse.json(
      { error: 'Failed to export billing' },
      { status: 500 }
    )
  }
}

