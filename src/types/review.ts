/**
 * Review types for paralegal/attorney feedback on cases
 */

/**
 * Role of the reviewer conducting the case review
 */
export type ReviewerRole = 'paralegal' | 'attorney'

/**
 * Current status of the review process
 * - open: Review has been created but not yet started
 * - in_review: Review is actively being conducted
 * - approved: Review is complete and case is approved
 * - needs_records: Review identified missing records that must be obtained
 */
export type ReviewStatus = 'open' | 'in_review' | 'approved' | 'needs_records'

/**
 * Review record tracking human-in-the-loop feedback on a case
 */
export interface Review {
  /** Unique identifier for the review */
  id: string

  /** ID of the case being reviewed */
  case_id: string

  /** ID of the user who created the review */
  user_id: string

  /** Role of the person conducting the review */
  role: ReviewerRole

  /** Current status of the review */
  status: ReviewStatus

  /** Short summary of the review findings */
  summary: string | null

  /** List of document types or records still needed (JSON array) */
  missing_documents: unknown[] | null

  /** Places where dates or visits are missing in the timeline (JSON array) */
  timeline_gaps: unknown[] | null

  /** Next steps or actions recommended (e.g., request X, follow-up, etc.) */
  recommended_actions: unknown[] | null

  /** Freeform notes from the reviewer */
  notes: string | null

  /** Timestamp when the review was created */
  created_at: string

  /** Timestamp when the review was last updated */
  updated_at: string
}

/**
 * Payload for creating a new review
 */
export interface CreateReviewPayload {
  /** Role of the person conducting the review */
  role: ReviewerRole

  /** Short summary of the review findings */
  summary?: string

  /** List of document types or records still needed */
  missing_documents?: unknown[]

  /** Places where dates or visits are missing in the timeline */
  timeline_gaps?: unknown[]

  /** Next steps or actions recommended */
  recommended_actions?: unknown[]

  /** Freeform notes from the reviewer */
  notes?: string

  /** Current status of the review (defaults to 'open') */
  status?: ReviewStatus
}
