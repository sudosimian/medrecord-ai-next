'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, FileText, Calendar, User } from 'lucide-react'

export default function MissingRecordsPage() {
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [missingRecords, setMissingRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/cases')
      const data = await response.json()
      setCases(data.cases || [])
    } catch (error) {
      console.error('Error fetching cases:', error)
    }
  }

  const fetchMissingRecords = async (caseId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/missing-records/${caseId}`)
      const data = await response.json()
      setMissingRecords(data.missing_records || [])
    } catch (error) {
      console.error('Error fetching missing records:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCaseChange = (caseId: string) => {
    setSelectedCase(caseId)
    fetchMissingRecords(caseId)
  }

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'important': return 'bg-yellow-100 text-yellow-800'
      case 'routine': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Missing Records</h1>
        <p className="text-gray-600 mt-1">
          AI-detected gaps in medical documentation
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Case</label>
            <Select value={selectedCase} onValueChange={handleCaseChange}>
              <SelectTrigger className="">
                <SelectValue placeholder="Choose a case..." />
              </SelectTrigger>
              <SelectContent className="">
                {cases.map((c) => (
                  <SelectItem className="" key={c.id} value={c.id}>
                    {c.case_number} - {c.patients?.last_name}, {c.patients?.first_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {missingRecords.length > 0 && (
        <Alert className="bg-amber-50 border-amber-200" variant="default">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            Found {missingRecords.length} potentially missing records. Review and request from providers as needed.
          </AlertDescription>
        </Alert>
      )}

      {missingRecords.length > 0 && (
        <div className="space-y-4">
          {missingRecords.map((record, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-5 w-5 text-gray-600" />
                    <h3 className="font-semibold">{record.type}</h3>
                  </div>
                  <p className="text-gray-700">{record.description}</p>
                </div>
                <Badge className={getImportanceColor(record.importance)} variant="default">
                  {record.importance}
                </Badge>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {record.expected_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Expected: {new Date(record.expected_date).toLocaleDateString()}</span>
                  </div>
                )}
                {record.provider && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Provider: {record.provider}</span>
                  </div>
                )}
                <p className="text-gray-500 italic">{record.reason}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && selectedCase && missingRecords.length === 0 && (
        <Card className="p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-green-600 mb-3" />
          <h3 className="text-lg font-medium">No Missing Records Detected</h3>
          <p className="text-gray-600 mt-2">
            All expected medical records appear to be present
          </p>
        </Card>
      )}
    </div>
  )
}

