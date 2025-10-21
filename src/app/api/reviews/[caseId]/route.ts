import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { CreateReviewPayload } from '@/types/review'

/**
 * GET /api/reviews/[caseId]
 * Retrieves all reviews for a specific case
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseId } = await params

    // Fetch reviews for the case (RLS will ensure user has access)
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch reviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    return NextResponse.json({ reviews: reviews || [] })
  } catch (error) {
    console.error('Error in GET /api/reviews/[caseId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/reviews/[caseId]
 * Creates a new review for a specific case
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { caseId } = await params
    const body: CreateReviewPayload = await request.json()

    // Validate required fields
    if (!body.role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      )
    }

    if (!['paralegal', 'attorney'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "paralegal" or "attorney"' },
        { status: 400 }
      )
    }

    // Insert new review (RLS will ensure user has access to the case)
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        case_id: caseId,
        user_id: user.id,
        role: body.role,
        summary: body.summary || null,
        missing_documents: body.missing_documents || [],
        timeline_gaps: body.timeline_gaps || [],
        recommended_actions: body.recommended_actions || [],
        notes: body.notes || null,
        status: body.status || 'open',
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create review:', error)
      return NextResponse.json(
        { error: 'Failed to create review. Ensure you have access to this case.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ review }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/reviews/[caseId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
