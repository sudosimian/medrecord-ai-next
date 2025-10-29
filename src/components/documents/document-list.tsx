'use client'

import { useEffect, useState } from 'react'
import { FileText, Download, Trash2, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Document {
  id: string
  file_name: string
  file_size: number
  file_type: string
  document_type: string
  created_at: string
  ocr_completed: boolean
  classified: boolean
}

interface DocumentListProps {
  patientId?: string
  caseId?: string
  refreshTrigger?: number
}

export function DocumentList({ patientId, caseId, refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const fetchDocuments = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (patientId) params.append('patientId', patientId)
      if (caseId) params.append('caseId', caseId)

      const response = await fetch(`/api/documents?${params}`)
      const data = await response.json()

      if (response.ok) {
        setDocuments(data.documents || [])
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [patientId, caseId, refreshTrigger])

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/documents?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDocuments(prev => prev.filter(doc => doc.id !== id))
        setDeleteId(null)
      }
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1024 / 1024).toFixed(1) + ' MB'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDocumentTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      medical_record: 'bg-blue-100 text-blue-800',
      bill: 'bg-green-100 text-green-800',
      imaging: 'bg-purple-100 text-purple-800',
      lab_report: 'bg-yellow-100 text-yellow-800',
      deposition: 'bg-red-100 text-red-800',
      legal: 'bg-gray-100 text-gray-800',
      other: 'bg-slate-100 text-slate-800',
    }
    return colors[type] || colors.other
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      medical_record: 'Medical Record',
      bill: 'Bill',
      imaging: 'Imaging',
      lab_report: 'Lab Report',
      deposition: 'Deposition',
      legal: 'Legal',
      other: 'Other',
    }
    return labels[type] || 'Other'
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-500">Loading documents...</p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">No documents uploaded yet</p>
        <p className="text-xs text-gray-500">Upload documents to get started</p>
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{doc.file_name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getDocumentTypeColor(doc.document_type)} variant="default">
                    {getDocumentTypeLabel(doc.document_type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {formatFileSize(doc.file_size)}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(doc.created_at)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {doc.ocr_completed && (
                      <Badge variant="outline" className="text-xs">
                        OCR
                      </Badge>
                    )}
                    {doc.classified && (
                      <Badge variant="outline" className="text-xs">
                        Classified
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button className="" variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button className="" variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(doc.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDelete(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

