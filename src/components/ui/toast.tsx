'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToastProps {
  title?: string
  description?: string
  type?: 'success' | 'error' | 'info' | 'warning'
  onClose?: () => void
}

export function Toast({ title, description, type = 'info', onClose }: ToastProps) {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      onClose?.()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  if (!isVisible) return null

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500',
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 w-full max-w-sm rounded-lg shadow-lg p-4 text-white',
        colors[type]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          {description && <p className="text-sm opacity-90">{description}</p>}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            onClose?.()
          }}
          className="ml-4 hover:opacity-80"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([])

  const toast = React.useCallback((props: ToastProps) => {
    const id = Math.random()
    setToasts((prev) => [...prev, { ...props, onClose: () => setToasts((t) => t.filter((_, i) => i !== 0)) }])
  }, [])

  return {
    toast,
    toasts,
  }
}

