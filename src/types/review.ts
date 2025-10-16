/**
 * Review Types
 * 
 * Reviews allow paralegals and attorneys to provide structured feedback on cases,
 * identify missing documentation, highlight timeline gaps, and recommend next actions.
 * This ensures thorough case preparation and quality control throughout the litigation process.
 */

/**
 * Review interface for paralegal/attorney case feedback
 * 
 * Reviews serve as quality control checkpoints where legal professionals can:
 * - Summarize their assessment of case readiness
 * - Identify missing or incomplete documentation
 * - Flag gaps in the medical timeline that need investigation
 * - Provide actionable recommendations for case progression
 */
export interface Review {
  /** Unique identifier for the review */
  id: string;

  /** 
   * Reference to the case being reviewed
   * Links to the cases table for relationship integrity
   */
  case_id: string;

  /** 
   * ID of the paralegal or attorney who created the review
   * Links to auth.users to track who provided the feedback
   */
  user_id: string;

  /** 
   * Overall summary of the case review
   * High-level assessment of case strength, readiness for trial,
   * settlement potential, or areas requiring attention
   */
  review_summary: string | null;

  /** 
   * List of missing or incomplete documents
   * Identifies gaps in medical records, bills, depositions, expert reports,
   * or other documentation needed to strengthen the case
   */
  missing_documents: string | null;

  /** 
   * Identified gaps in the medical timeline
   * Highlights periods where treatment records are absent, inconsistencies
   * in the chronology, or unexplained gaps that opposing counsel might exploit
   */
  timeline_gaps: string | null;

  /** 
   * Recommended next steps and actions
   * Concrete suggestions for case progression such as:
   * - Additional records to request
   * - Depositions to schedule
   * - Expert witnesses to retain
   * - Settlement negotiations to initiate
   * - Legal research to conduct
   */
  recommended_actions: string | null;

  /** Timestamp when the review was created */
  created_at: string;

  /** Timestamp when the review was last updated */
  updated_at: string;
}

