/**
 * Job types for background processing tasks
 */

/**
 * Type of background job
 * - ingest: Initial document ingestion
 * - ocr: OCR text extraction
 * - classify: Document classification
 * - extract: Data extraction (medical events, bills, etc.)
 * - package: Package/export case data
 */
export type JobType = 'ingest' | 'ocr' | 'classify' | 'extract' | 'package'

/**
 * Current status of the job
 * - queued: Job is waiting to be processed
 * - processing: Job is currently being processed
 * - needs_attention: Job requires manual intervention
 * - done: Job completed successfully
 * - failed: Job failed with error
 */
export type JobStatus = 'queued' | 'processing' | 'needs_attention' | 'done' | 'failed'

/**
 * Job record for background processing
 */
export interface Job {
  /** Unique identifier for the job */
  id: string

  /** ID of the case this job belongs to (nullable for system jobs) */
  case_id: string | null

  /** Type of job being processed */
  type: JobType

  /** Current status of the job */
  status: JobStatus

  /** Progress percentage (0-100) */
  progress: number

  /** Error message if job failed or needs attention */
  error: string | null

  /** Additional job parameters/context as JSON */
  payload: Record<string, unknown>

  /** Timestamp when job was created */
  created_at: string

  /** Timestamp when job processing started */
  started_at: string | null

  /** Timestamp when job finished (success or failure) */
  finished_at: string | null
}

/**
 * Payload for creating a new job
 */
export interface CreateJobPayload {
  /** Type of job to create */
  type: JobType

  /** Optional additional parameters/context */
  payload?: Record<string, unknown>
}

