'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentUpload } from '@/components/documents/document-upload'
import { DocumentList } from '@/components/documents/document-list'

export default function RecordsPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Medical Records</h1>
        <p className="text-gray-600 mt-1">
          Upload, organize, and manage medical documents
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <DocumentList refreshTrigger={refreshTrigger} />
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Upload Documents</h2>
            <DocumentUpload onUploadComplete={handleUploadComplete} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
