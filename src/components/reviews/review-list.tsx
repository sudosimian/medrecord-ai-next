'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  FileText,
  AlertCircle,
  Clock,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  FileWarning,
  TrendingUp,
  Calendar,
  StickyNote,
} from 'lucide-react'
import { format } from 'date-fns'
import { Review } from '@/types/review'

interface ReviewListProps {
  /** ID of the case to fetch reviews for */
  caseId: string
  /** Optional callback to trigger refetch from parent */
  refreshTrigger?: number
}

/**
 * ReviewList: Displays all reviews for a case with collapsible details
 * Shows status badges, timestamps, and expandable arrays/notes
 */
export function ReviewList({ caseId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, refreshTrigger])

  /**
   * Fetches reviews from API
   */
  const fetchReviews = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/reviews/${caseId}`)

      if (response.status === 401) {
        setError('Please log in to view reviews')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }

      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Failed to load reviews. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Adds a review to the list (called from parent after creation)
   */
  const addReview = (review: Review) => {
    setReviews([review, ...reviews])
  }

  /**
   * Toggles expanded state for a review
   */
  const toggleExpanded = (reviewId: string) => {
    const newExpanded = new Set(expandedReviews)
    if (newExpanded.has(reviewId)) {
      newExpanded.delete(reviewId)
    } else {
      newExpanded.add(reviewId)
    }
    setExpandedReviews(newExpanded)
  }

  /**
   * Returns appropriate styling for review status badge
   */
  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      in_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      needs_records: 'bg-orange-100 text-orange-800',
    }
    return classes[status] || classes.open
  }

  /**
   * Formats status for display
   */
  const formatStatus = (status: string) => {
    const labels: Record<string, string> = {
      open: 'Open',
      in_review: 'In Review',
      approved: 'Approved',
      needs_records: 'Needs Records',
    }
    return labels[status] || status
  }

  // Loading state
  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center text-gray-500">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading reviews...
        </div>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Alert className="" variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="">{error}</AlertDescription>
      </Alert>
    )
  }

  // Empty state
  if (reviews.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-gray-500">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm mt-1">Submit the first review for this case above.</p>
        </div>
      </Card>
    )
  }

  // Reviews list
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Review History ({reviews.length})</h3>

      {reviews.map((review) => {
        const isExpanded = expandedReviews.has(review.id)
        const hasArrayData =
          (review.missing_documents && review.missing_documents.length > 0) ||
          (review.timeline_gaps && review.timeline_gaps.length > 0) ||
          (review.recommended_actions && review.recommended_actions.length > 0)

        return (
          <Card key={review.id} className="p-6">
            {/* Header: Status, Role, Timestamp */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getStatusBadgeClass(review.status)} variant="default">
                  {formatStatus(review.status)}
                </Badge>
                <Badge className="" variant="outline">
                  <User className="mr-1 h-3 w-3" />
                  {review.role.charAt(0).toUpperCase() + review.role.slice(1)}
                </Badge>
                <Badge variant="outline" className="bg-gray-50">
                  <Clock className="mr-1 h-3 w-3" />
                  {format(new Date(review.created_at), 'MMM dd, yyyy h:mm a')}
                </Badge>
              </div>
              {review.updated_at !== review.created_at && (
                <span className="text-xs text-gray-500">
                  Updated {format(new Date(review.updated_at), 'MMM dd, yyyy')}
                </span>
              )}
            </div>

            {/* Summary - Always visible */}
            {review.summary && (
              <div className="mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{review.summary}</p>
              </div>
            )}

            {/* Expandable section for arrays and notes */}
            {(hasArrayData || review.notes) && (
              <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(review.id)}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors">
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Show Details
                    </>
                  )}
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-4 space-y-4">
                  {/* Missing Documents */}
                  {review.missing_documents && review.missing_documents.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileWarning className="h-4 w-4 text-orange-600" />
                          <h4 className="font-semibold text-sm">Missing Documents</h4>
                        </div>
                        <ul className="pl-6 space-y-1">
                          {review.missing_documents.map((doc, idx) => (
                            <li key={idx} className="text-gray-700 text-sm list-disc">
                              {typeof doc === 'string' ? doc : JSON.stringify(doc)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {/* Timeline Gaps */}
                  {review.timeline_gaps && review.timeline_gaps.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar className="h-4 w-4 text-red-600" />
                          <h4 className="font-semibold text-sm">Timeline Gaps</h4>
                        </div>
                        <ul className="pl-6 space-y-1">
                          {review.timeline_gaps.map((gap, idx) => (
                            <li key={idx} className="text-gray-700 text-sm list-disc">
                              {typeof gap === 'string' ? gap : JSON.stringify(gap)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {/* Recommended Actions */}
                  {review.recommended_actions && review.recommended_actions.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <h4 className="font-semibold text-sm">Recommended Actions</h4>
                        </div>
                        <ul className="pl-6 space-y-1">
                          {review.recommended_actions.map((action, idx) => (
                            <li key={idx} className="text-gray-700 text-sm list-disc">
                              {typeof action === 'string' ? action : JSON.stringify(action)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}

                  {/* Notes */}
                  {review.notes && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <StickyNote className="h-4 w-4 text-blue-600" />
                          <h4 className="font-semibold text-sm">Additional Notes</h4>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap pl-6 text-sm">
                          {review.notes}
                        </p>
                      </div>
                    </>
                  )}
                </CollapsibleContent>
              </Collapsible>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// Export addReview method for parent components
export type ReviewListRef = {
  addReview: (review: Review) => void
}

