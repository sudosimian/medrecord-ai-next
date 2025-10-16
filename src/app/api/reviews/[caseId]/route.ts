import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

/**
 * GET /api/reviews/[caseId]
 * Fetches all reviews for a specific case
 */
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

    // Fetch all reviews for the case, ordered by creation date (newest first)
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      )
    }

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
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

    // Parse request body
    const body = await request.json()
    const { review_summary, missing_documents, timeline_gaps, recommended_actions } = body

    // Validate that the case exists and belongs to the user
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .eq('user_id', user.id)
      .single()

    if (caseError || !caseData) {
      return NextResponse.json(
        { error: 'Case not found or access denied' },
        { status: 404 }
      )
    }

    // Insert new review
    const { data: newReview, error: insertError } = await supabase
      .from('reviews')
      .insert({
        case_id: caseId,
        user_id: user.id,
        review_summary: review_summary || null,
        missing_documents: missing_documents || null,
        timeline_gaps: timeline_gaps || null,
        recommended_actions: recommended_actions || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating review:', insertError)
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      )
    }

    return NextResponse.json(newReview, { status: 201 })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}

