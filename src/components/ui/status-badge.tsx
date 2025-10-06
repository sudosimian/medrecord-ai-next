'use client'

import { cn } from '@/lib/utils'
import { Badge } from './badge'

interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'pending'
  children: React.ReactNode
  className?: string
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-800 hover:bg-green-100',
    error: 'bg-red-100 text-red-800 hover:bg-red-100',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
    info: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
    pending: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
  }

  return (
    <Badge className={cn(variants[status], className)} variant="secondary">
      {children}
    </Badge>
  )
}

