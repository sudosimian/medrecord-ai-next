'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface DocumentUploadProps {
  patientId?: string
  caseId?: string
  onUploadComplete?: (document: any) => void
}

interface UploadFile {
  file: File
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
  documentId?: string
}

export function DocumentUpload({ patientId, caseId, onUploadComplete }: DocumentUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [documentType, setDocumentType] = useState<string>('other')

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      status: 'pending' as const,
      progress: 0,
    }))
    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  })

  const uploadFile = async (index: number) => {
    const uploadFile = files[index]
    
    setFiles(prev => prev.map((f, i) => 
      i === index ? { ...f, status: 'uploading' as const } : f
    ))

    try {
      const formData = new FormData()
      formData.append('file', uploadFile.file)
      if (patientId) formData.append('patientId', patientId)
      if (caseId) formData.append('caseId', caseId)
      formData.append('documentType', documentType)

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      setFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'success' as const, 
          progress: 100,
          documentId: data.document.id 
        } : f
      ))

      if (onUploadComplete) {
        onUploadComplete(data.document)
      }
    } catch (error) {
      setFiles(prev => prev.map((f, i) => 
        i === index ? { 
          ...f, 
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Upload failed'
        } : f
      ))
    }
  }

  const uploadAll = async () => {
    for (let i = 0; i < files.length; i++) {
      if (files[i].status === 'pending') {
        await uploadFile(i)
      }
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'))
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Document Type</label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="" value="medical_record">Medical Record</SelectItem>
              <SelectItem className="" value="bill">Bill</SelectItem>
              <SelectItem className="" value="imaging">Imaging</SelectItem>
              <SelectItem className="" value="lab_report">Lab Report</SelectItem>
              <SelectItem className="" value="deposition">Deposition</SelectItem>
              <SelectItem className="" value="legal">Legal Document</SelectItem>
              <SelectItem className="" value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive ? 'Drop files here' : 'Drag and drop files here, or click to select'}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          PDF, Images, Word documents
        </p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Files ({files.length})</h3>
            <div className="flex gap-2">
              {files.some(f => f.status === 'success') && (
                <Button className="" variant="outline" size="sm" onClick={clearCompleted}>
                  Clear Completed
                </Button>
              )}
              {files.some(f => f.status === 'pending') && (
                <Button className="" size="sm" onClick={uploadAll} variant="default">
                  Upload All
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {files.map((uploadFile, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-white border rounded-lg"
              >
                <FileText className="h-8 w-8 text-gray-400 flex-shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  
                  {uploadFile.status === 'uploading' && (
                    <Progress value={uploadFile.progress} className="mt-2" />
                  )}
                  
                  {uploadFile.status === 'error' && (
                    <p className="text-xs text-red-600 mt-1">
                      {uploadFile.error}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {uploadFile.status === 'pending' && (
                    <Button className="" size="sm"
                      variant="outline"
                      onClick={() => uploadFile(index)}
                    >
                      Upload
                    </Button>
                  )}
                  
                  {uploadFile.status === 'uploading' && (
                    <div className="text-sm text-gray-500">Uploading...</div>
                  )}
                  
                  {uploadFile.status === 'success' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  
                  {uploadFile.status === 'error' && (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  
                  <Button className="" size="sm"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

