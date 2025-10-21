import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import { CreateJobPayload } from '@/types/jobs'

/**
 * GET /api/jobs/[caseId]
 * Retrieves the latest jobs for a specific case
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

    // Fetch latest 50 jobs for the case (RLS will ensure user has access)
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to fetch jobs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch jobs' },
        { status: 500 }
      )
    }

    return NextResponse.json({ jobs: jobs || [] })
  } catch (error) {
    console.error('Error in GET /api/jobs/[caseId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/jobs/[caseId]
 * Enqueues a new background job for a case
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
    const body: CreateJobPayload = await request.json()

    // Validate job type
    const validTypes = ['ingest', 'ocr', 'classify', 'extract', 'package']
    const jobType = body.type || 'ingest'

    if (!validTypes.includes(jobType)) {
      return NextResponse.json(
        { error: `Invalid job type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Insert new job (RLS will ensure user has access to the case)
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        case_id: caseId,
        type: jobType,
        status: 'queued',
        progress: 0,
        payload: body.payload || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to enqueue job:', error)
      return NextResponse.json(
        { error: 'Failed to enqueue job. Ensure you have access to this case.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ job }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/jobs/[caseId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

