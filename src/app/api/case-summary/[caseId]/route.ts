import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateCaseSummary, generateCaseSummaryDocument } from '@/lib/case-summary-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caseId = params.caseId

    // Check if summary already exists
    const { data: existing } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('case_id', caseId)
      .eq('analysis_type', 'case_summary')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existing) {
      return NextResponse.json(existing)
    }

    return NextResponse.json({ error: 'Summary not found' }, { status: 404 })
  } catch (error) {
    console.error('Error fetching case summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch case summary' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const caseId = params.caseId

    // Fetch case details
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*, patients(*)')
      .eq('id', caseId)
      .eq('user_id', user.id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Fetch chronology events
    const { data: events } = await supabase
      .from('medical_events')
      .select('*')
      .eq('case_id', caseId)
      .order('event_date', { ascending: true })

    // Fetch billing data
    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .eq('case_id', caseId)

    // Fetch narrative
    const { data: narrative } = await supabase
      .from('narratives')
      .select('*')
      .eq('case_id', caseId)
      .single()

    // Fetch depositions
    const { data: depositions } = await supabase
      .from('depositions')
      .select('*')
      .eq('case_id', caseId)

    // Prepare data for summary generation
    const summaryInput = {
      case_id: caseId,
      case_number: caseData.case_number,
      patient_name: `${caseData.patients.first_name} ${caseData.patients.last_name}`,
      incident_date: caseData.incident_date,
      incident_type: caseData.case_type || 'Personal Injury',
      incident_description: caseData.incident_description || '',
      defendant_name: caseData.defendant_name,
      insurance_company: caseData.insurance_company,
      chronology_summary: events?.length
        ? `${events.length} medical events documented`
        : undefined,
      injuries: events?.map((e: any) => e.description).slice(0, 5),
      total_medical_expenses: bills?.reduce((sum: number, b: any) => sum + (b.amount || 0), 0),
      num_bills: bills?.length || 0,
      narrative_summary: narrative?.executive_summary,
      depositions: depositions || [],
      policy_limit: caseData.policy_limit,
    }

    // Generate AI summary
    const summaryData = await generateCaseSummary(summaryInput)

    // Generate document text
    const generatedText = await generateCaseSummaryDocument(summaryData)

    // Save to database
    const { data: savedSummary, error: saveError } = await supabase
      .from('ai_analyses')
      .insert({
        case_id: caseId,
        user_id: user.id,
        analysis_type: 'case_summary',
        input_data: summaryInput,
        output_data: summaryData,
        confidence_score: summaryData.liability_assessment.score / 100,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving summary:', saveError)
      return NextResponse.json(
        { error: 'Failed to save summary' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...savedSummary,
      generated_text: generatedText,
      summary_data: summaryData,
    })
  } catch (error) {
    console.error('Error generating case summary:', error)
    return NextResponse.json(
      { error: 'Failed to generate case summary' },
      { status: 500 }
    )
  }
}

