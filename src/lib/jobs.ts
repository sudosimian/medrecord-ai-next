import { createClient } from '@/lib/supabase-server'
import { JobType } from '@/types/jobs'

/**
 * Enqueues a background job for processing
 * 
 * @param caseId - The ID of the case this job belongs to
 * @param type - The type of job to enqueue (ingest, ocr, classify, extract, package)
 * @param payload - Optional additional parameters/context for the job
 * @returns The created job record or null if failed
 */
export async function enqueueJob(
  caseId: string,
  type: JobType,
  payload?: Record<string, unknown>
) {
  try {
    const supabase = await createClient()

    // Insert new job into the jobs table
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        case_id: caseId,
        type,
        status: 'queued',
        progress: 0,
        payload: payload || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to enqueue job:', error)
      return null
    }

    return job
  } catch (error) {
    console.error('Error enqueuing job:', error)
    return null
  }
}

