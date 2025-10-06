import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { identifyOvercharges } from '@/lib/rate-analyzer'
import { BillingSummary, ProviderSummary, ServiceTypeSummary } from '@/types/billing'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const caseId = searchParams.get('caseId')

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 })
    }

    // Fetch all bills for case
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('*')
      .eq('case_id', caseId)
      .order('bill_date', { ascending: true })

    if (billsError) {
      console.error('Query error:', billsError)
      return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 })
    }

    if (!bills || bills.length === 0) {
      return NextResponse.json({
        summary: {
          case_id: caseId,
          total_billed: 0,
          total_paid: 0,
          total_balance: 0,
          num_bills: 0,
          date_range: { start: '', end: '' },
          by_provider: [],
          by_service_type: [],
          duplicates: [],
          overcharges: [],
        },
      })
    }

    // Calculate totals
    const totalBilled = bills.reduce((sum, bill) => sum + (bill.charge_amount || 0), 0)
    const totalPaid = bills.reduce((sum, bill) => sum + (bill.paid_amount || 0), 0)
    const totalBalance = bills.reduce((sum, bill) => sum + (bill.balance || bill.charge_amount || 0), 0)

    // Date range
    const dates = bills.map(b => b.bill_date).sort()
    const dateRange = {
      start: dates[0],
      end: dates[dates.length - 1],
    }

    // Group by provider
    const providerMap = new Map<string, ProviderSummary>()
    for (const bill of bills) {
      const provider = bill.provider_name || 'Unknown'
      if (!providerMap.has(provider)) {
        providerMap.set(provider, {
          provider_name: provider,
          total_billed: 0,
          num_bills: 0,
          visit_count: 0,
        })
      }
      const summary = providerMap.get(provider)!
      summary.total_billed += bill.charge_amount || 0
      summary.num_bills += 1
      summary.visit_count += 1
    }
    const byProvider = Array.from(providerMap.values())
      .sort((a, b) => b.total_billed - a.total_billed)

    // Group by service type
    const serviceTypeMap = new Map<string, ServiceTypeSummary>()
    for (const bill of bills) {
      const serviceType = bill.service_type || 'Other'
      if (!serviceTypeMap.has(serviceType)) {
        serviceTypeMap.set(serviceType, {
          service_type: serviceType,
          total_billed: 0,
          num_bills: 0,
          percentage: 0,
        })
      }
      const summary = serviceTypeMap.get(serviceType)!
      summary.total_billed += bill.charge_amount || 0
      summary.num_bills += 1
    }
    const byServiceType = Array.from(serviceTypeMap.values())
      .map(s => ({
        ...s,
        percentage: Math.round((s.total_billed / totalBilled) * 100 * 10) / 10,
      }))
      .sort((a, b) => b.total_billed - a.total_billed)

    // Find duplicates
    const duplicateBills = bills.filter(b => b.is_duplicate)
    const duplicates = duplicateBills.map(bill => ({
      bill1_id: bill.id,
      bill2_id: bill.id, // Simplified - would need to track original
      similarity: 1.0,
      type: 'exact' as const,
      potential_overcharge: bill.charge_amount || 0,
    }))

    // Identify overcharges
    const overcharges = identifyOvercharges(bills)

    const summary: BillingSummary = {
      case_id: caseId,
      total_billed: Math.round(totalBilled * 100) / 100,
      total_paid: Math.round(totalPaid * 100) / 100,
      total_balance: Math.round(totalBalance * 100) / 100,
      num_bills: bills.length,
      date_range: dateRange,
      by_provider: byProvider,
      by_service_type: byServiceType,
      duplicates: duplicates,
      overcharges: overcharges,
    }

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('Error generating summary:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

