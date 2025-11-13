import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { generateDemandLetter } from '@/lib/demand-letter-generator'
import { DemandLetterData, calculateDamages } from '@/types/demand-letter'
import { checkAIProcessingAllowed } from '@/lib/ai-privacy-guard'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { caseId, demandType, options } = body

    if (!caseId) {
      return NextResponse.json({ error: 'Case ID required' }, { status: 400 })
    }

    // PRIVACY GUARD: Check if AI processing is allowed for this case
    const privacyCheck = await checkAIProcessingAllowed(
      {
        caseId: caseId,
        processingType: 'demand_letter',
        aiProvider: 'openai',
        modelUsed: 'gpt-4o',
      },
      user.id
    )

    if (!privacyCheck.allowed) {
      return NextResponse.json({
        error: 'AI processing blocked',
        reason: privacyCheck.reason,
        requiresHumanReview: privacyCheck.requiresHumanReview,
        requiresRedaction: privacyCheck.requiresRedaction,
      }, { status: 403 })
    }

    // If redaction required, warn the user
    if (privacyCheck.requiresRedaction) {
      console.warn(`Demand letter generation for case ${caseId}: PHI redaction recommended`)
    }

    // Fetch case data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select(`
        *,
        patients (
          id,
          first_name,
          last_name
        )
      `)
      .eq('id', caseId)
      .eq('user_id', user.id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Fetch medical chronology summary
    const { data: events } = await supabase
      .from('medical_events')
      .select('*')
      .eq('case_id', caseId)
      .order('event_date', { ascending: true })
    
    const chronologySummary = events?.map(e => 
      `${e.event_date}: ${e.description} (${e.provider_name || 'Unknown Provider'})`
    ).join('\n') || 'Medical chronology not yet generated.'

    // Fetch billing summary
    const { data: bills } = await supabase
      .from('bills')
      .select('*')
      .eq('case_id', caseId)
    
    const totalMedical = bills?.reduce((sum, b) => sum + (b.charge_amount || 0), 0) || 0

    // Prepare demand letter data
    const demandData: DemandLetterData = {
      case_id: caseId,
      case_type: caseData.case_type,
      case_number: caseData.case_number,
      
      // Parties
      plaintiff_name: caseData.patients ? 
        `${caseData.patients.first_name} ${caseData.patients.last_name}` : 
        'Client',
      defendant_name: options?.defendant_name || undefined,
      attorney_name: caseData.attorney_name || options?.attorney_name || '[Attorney Name]',
      insurance_company: caseData.insurance_company || undefined,
      claim_number: caseData.claim_number || undefined,
      
      // Incident
      incident_date: caseData.incident_date || new Date().toISOString(),
      incident_location: options?.incident_location || undefined,
      incident_description: options?.incident_description || undefined,
      
      // Medical
      chronology_summary: chronologySummary,
      total_medical_expenses: totalMedical,
      future_medical_expenses: options?.future_medical_expenses || 0,
      
      // Damages
      past_lost_wages: options?.past_lost_wages || 0,
      future_lost_wages: options?.future_lost_wages || 0,
      property_damage: options?.property_damage || 0,
      pain_suffering_multiplier: options?.pain_suffering_multiplier || 3.0,
      
      // Liability
      liability_theory: options?.liability_theory || undefined,
      defendant_negligence: options?.defendant_negligence || undefined,
      causation_statement: options?.causation_statement || undefined,
      
      // Settlement
      demand_amount: options?.demand_amount || 0,
      comparable_cases: options?.comparable_cases || undefined,
    }

    // Calculate recommended demand if not provided
    if (!demandData.demand_amount) {
      const damages = calculateDamages({
        past_medical: totalMedical,
        future_medical: demandData.future_medical_expenses,
        past_wages: demandData.past_lost_wages,
        future_wages: demandData.future_lost_wages,
        property: demandData.property_damage,
        injury_severity: options?.injury_severity || 'moderate',
        liability_strength: options?.liability_strength || 'strong',
      })
      demandData.demand_amount = damages.recommended_demand
    }

    // Generate demand letter
    const { sections, full_text } = await generateDemandLetter(
      demandData,
      demandType || 'standard'
    )

    // Save to database
    const { data: savedLetter, error: saveError } = await supabase
      .from('legal_documents')
      .insert({
        case_id: caseId,
        document_type: 'demand_letter',
        title: `Settlement Demand - ${caseData.case_number}`,
        content: full_text,
        metadata: {
          demand_type: demandType,
          demand_amount: demandData.demand_amount,
          sections: sections.map(s => ({
            title: s.title,
            order: s.order,
          })),
        },
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving demand letter:', saveError)
      return NextResponse.json(
        { error: 'Failed to save demand letter' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      letter: savedLetter,
      sections: sections,
      demand_data: demandData,
    })
  } catch (error) {
    console.error('Error generating demand letter:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

