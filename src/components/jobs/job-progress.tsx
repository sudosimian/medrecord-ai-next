'use client'

import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { format } from 'date-fns'
import { Job } from '@/types/jobs'

interface JobProgressProps {
  /** ID of the case to fetch jobs for */
  caseId: string
}

/**
 * JobProgress: Displays background job status with polling
 * Shows latest 5 jobs with type, status, progress, and timestamps
 * Polls every 8 seconds for updates
 */
export function JobProgress({ caseId }: JobProgressProps) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Initial fetch
    fetchJobs()

    // Set up polling every 8 seconds
    intervalRef.current = setInterval(() => {
      fetchJobs(true) // Silent fetch (no loading state)
    }, 8000)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId])

  /**
   * Fetches jobs from API
   * @param silent - If true, don't update loading state
   */
  const fetchJobs = async (silent = false) => {
    if (!silent) {
      setLoading(true)
    }
    setError(null)

    try {
      const response = await fetch(`/api/jobs/${caseId}`)

      if (response.status === 401) {
        setError('Unauthorized')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }

      const data = await response.json()
      // Only show the latest 5 jobs
      setJobs((data.jobs || []).slice(0, 5))
    } catch (err) {
      console.error('Error fetching jobs:', err)
      if (!silent) {
        setError('Failed to load jobs')
      }
    } finally {
      if (!silent) {
        setLoading(false)
      }
    }
  }

  /**
   * Manual refresh handler
   */
  const handleRefresh = () => {
    fetchJobs()
  }

  /**
   * Returns icon component for job status
   */
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-3 w-3" />
      case 'processing':
        return <Loader2 className="h-3 w-3 animate-spin" />
      case 'done':
        return <CheckCircle2 className="h-3 w-3" />
      case 'failed':
        return <XCircle className="h-3 w-3" />
      case 'needs_attention':
        return <AlertTriangle className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  /**
   * Returns badge styling for job status
   */
  const getStatusBadgeClass = (status: string) => {
    const classes: Record<string, string> = {
      queued: 'bg-gray-100 text-gray-700',
      processing: 'bg-blue-100 text-blue-700',
      done: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      needs_attention: 'bg-orange-100 text-orange-700',
    }
    return classes[status] || classes.queued
  }

  /**
   * Formats job type for display
   */
  const formatJobType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  /**
   * Formats status for display
   */
  const formatStatus = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Initial loading state
  if (loading && jobs.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading jobs...</span>
        </div>
      </Card>
    )
  }

  // Error state
  if (error && jobs.length === 0) {
    return (
      <Card className="p-4">
        <div className="text-sm text-red-600">{error}</div>
      </Card>
    )
  }

  // No jobs state
  if (jobs.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Background Processing</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="h-7 w-7 p-0"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-gray-500">No active jobs</p>
      </Card>
    )
  }

  // Jobs list
  return (
    <Card className="p-4">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-700">Background Processing</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
          className="h-7 w-7 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Jobs list */}
      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="space-y-1.5">
            {/* Job header: type, status, timestamp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">
                  {formatJobType(job.type)}
                </span>
                <Badge className={`text-xs px-1.5 py-0 ${getStatusBadgeClass(job.status)}`} variant="default">
                  <span className="flex items-center gap-1">
                    {getStatusIcon(job.status)}
                    {formatStatus(job.status)}
                  </span>
                </Badge>
              </div>
              <span className="text-xs text-gray-500">
                {format(new Date(job.created_at), 'HH:mm')}
              </span>
            </div>

            {/* Progress bar (only show if in progress or queued) */}
            {(job.status === 'processing' || job.status === 'queued') && (
              <Progress value={job.progress} className="h-1.5" />
            )}

            {/* Error message if failed */}
            {job.error && (
              <p className="text-xs text-red-600 truncate" title={job.error}>
                {job.error}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Auto-refresh indicator */}
      <div className="mt-3 pt-2 border-t">
        <p className="text-xs text-gray-400 text-center">
          Auto-refreshing every 8s
        </p>
      </div>
    </Card>
  )
}

