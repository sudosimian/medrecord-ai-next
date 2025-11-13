import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { generateNarrativeSummary } from '@/lib/narrative-generator'
import { checkAIProcessingAllowed } from '@/lib/ai-privacy-guard'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
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

    // PRIVACY GUARD: Check if AI processing is allowed for this case
    const privacyCheck = await checkAIProcessingAllowed(
      {
        caseId: case_id,
        processingType: 'narrative',
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
      }, { status: 403 })
    }

    // Get case data
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', case_id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 })
    }

    // Get chronology data
    const { data: events, error: eventsError } = await supabase
      .from('medical_events')
      .select('*')
      .eq('case_id', case_id)
      .order('event_date', { ascending: true })

    if (eventsError) {
      return NextResponse.json({ error: 'Failed to fetch medical events' }, { status: 500 })
    }

    // Generate narrative
    const narrativeData = await generateNarrativeSummary(
      { events },
      caseData
    )

    // Save to database
    const { data: savedNarrative, error: saveError } = await supabase
      .from('narratives')
      .insert({
        case_id,
        user_id: user.id,
        ...narrativeData,
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving narrative:', saveError)
      return NextResponse.json({ error: 'Failed to save narrative' }, { status: 500 })
    }

    return NextResponse.json(savedNarrative)
  } catch (error) {
    console.error('Error generating narrative:', error)
    return NextResponse.json(
      { error: 'Failed to generate narrative summary' },
      { status: 500 }
    )
  }
}

