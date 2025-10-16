'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  AlertCircle, 
  Clock, 
  CheckCircle2,
  Loader2,
  MessageSquare,
  FileWarning,
  TrendingUp
} from 'lucide-react'
import { format } from 'date-fns'
import { Review } from '@/types/review'

interface ParalegalReviewsProps {
  caseId: string
}

export function ParalegalReviews({ caseId }: ParalegalReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    review_summary: '',
    missing_documents: '',
    timeline_gaps: '',
    recommended_actions: '',
  })

  useEffect(() => {
    fetchReviews()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

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
      setReviews(data)
    } catch (err) {
      console.error('Error fetching reviews:', err)
      setError('Failed to load reviews. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccessMessage(null)

    // Check if at least one field is filled
    const hasContent = Object.values(formData).some(value => value.trim() !== '')
    if (!hasContent) {
      setError('Please fill in at least one field')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch(`/api/reviews/${caseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.status === 401) {
        setError('Please log in to submit a review')
        return
      }

      if (response.status === 404) {
        setError('Case not found or access denied')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to submit review')
      }

      const newReview = await response.json()
      
      // Add new review to the top of the list
      setReviews([newReview, ...reviews])
      
      // Reset form
      setFormData({
        review_summary: '',
        missing_documents: '',
        timeline_gaps: '',
        recommended_actions: '',
      })
      
      setSuccessMessage('Review submitted successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error submitting review:', err)
      setError('Failed to submit review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* New Review Form */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Submit New Review</h3>
        </div>
        
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-4 border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="review_summary">Overall Review Summary</Label>
            <Textarea
              id="review_summary"
              placeholder="Provide an overall assessment of case strength, readiness for trial, settlement potential, or areas requiring attention..."
              value={formData.review_summary}
              onChange={(e) => setFormData({ ...formData, review_summary: e.target.value })}
              rows={4}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="missing_documents">Missing Documents</Label>
            <Textarea
              id="missing_documents"
              placeholder="List any missing or incomplete medical records, bills, depositions, expert reports, or other documentation..."
              value={formData.missing_documents}
              onChange={(e) => setFormData({ ...formData, missing_documents: e.target.value })}
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="timeline_gaps">Timeline Gaps</Label>
            <Textarea
              id="timeline_gaps"
              placeholder="Identify gaps in the medical timeline, treatment periods without records, or inconsistencies that need clarification..."
              value={formData.timeline_gaps}
              onChange={(e) => setFormData({ ...formData, timeline_gaps: e.target.value })}
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="recommended_actions">Recommended Actions</Label>
            <Textarea
              id="recommended_actions"
              placeholder="Suggest next steps: additional records to request, depositions to schedule, expert witnesses to retain, etc..."
              value={formData.recommended_actions}
              onChange={(e) => setFormData({ ...formData, recommended_actions: e.target.value })}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Submit Review
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Existing Reviews List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Review History</h3>
        
        {loading ? (
          <Card className="p-8">
            <div className="flex items-center justify-center text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading reviews...
            </div>
          </Card>
        ) : reviews.length === 0 ? (
          <Card className="p-8">
            <div className="text-center text-gray-500">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p>No reviews yet</p>
              <p className="text-sm mt-1">Submit the first review for this case above.</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50">
                      <Clock className="mr-1 h-3 w-3" />
                      {format(new Date(review.created_at), 'MMM dd, yyyy h:mm a')}
                    </Badge>
                  </div>
                  {review.updated_at !== review.created_at && (
                    <span className="text-xs text-gray-500">
                      Updated {format(new Date(review.updated_at), 'MMM dd, yyyy h:mm a')}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {review.review_summary && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold text-sm">Overall Summary</h4>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap pl-6">
                        {review.review_summary}
                      </p>
                    </div>
                  )}

                  {review.missing_documents && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <FileWarning className="h-4 w-4 text-orange-600" />
                          <h4 className="font-semibold text-sm">Missing Documents</h4>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap pl-6">
                          {review.missing_documents}
                        </p>
                      </div>
                    </>
                  )}

                  {review.timeline_gaps && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <h4 className="font-semibold text-sm">Timeline Gaps</h4>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap pl-6">
                          {review.timeline_gaps}
                        </p>
                      </div>
                    </>
                  )}

                  {review.recommended_actions && (
                    <>
                      <Separator />
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <h4 className="font-semibold text-sm">Recommended Actions</h4>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap pl-6">
                          {review.recommended_actions}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

