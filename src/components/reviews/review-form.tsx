'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { CreateReviewPayload, Review } from '@/types/review'

interface ReviewFormProps {
  /** ID of the case being reviewed */
  caseId: string
  /** Optional callback invoked after successful review creation */
  onCreated?: (review: Review) => void
}

/**
 * ReviewForm: Form for creating paralegal/attorney reviews
 * Supports role selection, status tracking, and structured feedback
 */
export function ReviewForm({ caseId, onCreated }: ReviewFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state matching CreateReviewPayload
  const [formData, setFormData] = useState<CreateReviewPayload>({
    role: 'paralegal',
    summary: '',
    missing_documents: [],
    timeline_gaps: [],
    recommended_actions: [],
    notes: '',
    status: 'open',
  })

  // Temporary string inputs for JSON arrays (comma-separated tags)
  const [missingDocsText, setMissingDocsText] = useState('')
  const [timelineGapsText, setTimelineGapsText] = useState('')
  const [actionsText, setActionsText] = useState('')

  /**
   * Handles form submission - creates new review via API
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    // Validate required field
    if (!formData.role) {
      setError('Role is required')
      setSubmitting(false)
      return
    }

    // Check if at least summary or notes is provided
    if (!formData.summary?.trim() && !formData.notes?.trim()) {
      setError('Please provide at least a summary or notes')
      setSubmitting(false)
      return
    }

    try {
      // Parse comma-separated text into arrays
      const payload: CreateReviewPayload = {
        ...formData,
        missing_documents: missingDocsText
          ? missingDocsText.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        timeline_gaps: timelineGapsText
          ? timelineGapsText.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        recommended_actions: actionsText
          ? actionsText.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      }

      const response = await fetch(`/api/reviews/${caseId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.status === 401) {
        setError('Please log in to submit a review')
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit review')
      }

      const { review } = await response.json()

      // Clear form
      setFormData({
        role: 'paralegal',
        summary: '',
        missing_documents: [],
        timeline_gaps: [],
        recommended_actions: [],
        notes: '',
        status: 'open',
      })
      setMissingDocsText('')
      setTimelineGapsText('')
      setActionsText('')

      setSuccessMessage('Review submitted successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)

      // Notify parent component
      if (onCreated) {
        onCreated(review)
      }
    } catch (err) {
      console.error('Error submitting review:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Submit New Review</h3>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {successMessage && (
        <Alert className="mb-4 border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Selection */}
        <div>
          <Label htmlFor="role">Reviewer Role *</Label>
          <Select
            value={formData.role}
            onValueChange={(value) => setFormData({ ...formData, role: value as 'paralegal' | 'attorney' })}
          >
            <SelectTrigger id="role" className="w-full mt-1">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paralegal">Paralegal</SelectItem>
              <SelectItem value="attorney">Attorney</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Selection */}
        <div>
          <Label htmlFor="status">Review Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as any })}
          >
            <SelectTrigger id="status" className="w-full mt-1">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="needs_records">Needs Records</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <div>
          <Label htmlFor="summary">Review Summary *</Label>
          <Textarea
            id="summary"
            placeholder="Provide an overall assessment of case readiness, strength, or areas requiring attention..."
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            rows={4}
            className="mt-1"
          />
        </div>

        {/* Missing Documents (comma-separated tags) */}
        <div>
          <Label htmlFor="missing_docs">Missing Documents (comma-separated)</Label>
          <Textarea
            id="missing_docs"
            placeholder="e.g., MRI Report from 2023-05-10, Billing statement Dr. Smith, Deposition transcript"
            value={missingDocsText}
            onChange={(e) => setMissingDocsText(e.target.value)}
            rows={2}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple items with commas
          </p>
        </div>

        {/* Timeline Gaps (comma-separated tags) */}
        <div>
          <Label htmlFor="timeline_gaps">Timeline Gaps (comma-separated)</Label>
          <Textarea
            id="timeline_gaps"
            placeholder="e.g., Missing visits June 2023, Gap between 2023-07-01 and 2023-09-15, No records for Q3"
            value={timelineGapsText}
            onChange={(e) => setTimelineGapsText(e.target.value)}
            rows={2}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple gaps with commas
          </p>
        </div>

        {/* Recommended Actions (comma-separated tags) */}
        <div>
          <Label htmlFor="actions">Recommended Actions (comma-separated)</Label>
          <Textarea
            id="actions"
            placeholder="e.g., Request records from Hospital X, Schedule deposition with witness Y, Retain expert"
            value={actionsText}
            onChange={(e) => setActionsText(e.target.value)}
            rows={2}
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple actions with commas
          </p>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any additional observations or comments..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <MessageSquare className="mr-2 h-4 w-4" />
                Submit Review
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}

