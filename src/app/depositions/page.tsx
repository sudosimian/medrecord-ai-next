'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, AlertCircle, CheckCircle, Users } from 'lucide-react'

export default function DepositionsPage() {
  const [cases, setCases] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  const [depositions, setDepositions] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [selectedDocument, setSelectedDocument] = useState<string>('')
  const [witnessName, setWitnessName] = useState('')
  const [witnessRole, setWitnessRole] = useState('')
  const [depositionDate, setDepositionDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

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

  const fetchDocuments = async (caseId: string) => {
    try {
      const response = await fetch(`/api/documents?caseId=${caseId}`)
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const fetchDepositions = async (caseId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/deposition/${caseId}`)
      const data = await response.json()
      setDepositions(data.depositions || [])
    } catch (error) {
      console.error('Error fetching depositions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCaseChange = (caseId: string) => {
    setSelectedCase(caseId)
    fetchDocuments(caseId)
    fetchDepositions(caseId)
  }

  const processDeposition = async () => {
    if (!selectedCase || !selectedDocument || !witnessName || !witnessRole || !depositionDate) {
      alert('Please fill in all fields')
      return
    }

    setProcessing(true)
    try {
      const response = await fetch('/api/deposition/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: selectedCase,
          document_id: selectedDocument,
          witness_name: witnessName,
          witness_role: witnessRole,
          deposition_date: depositionDate,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Deposition processed successfully!')
        fetchDepositions(selectedCase)
        // Reset form
        setWitnessName('')
        setWitnessRole('')
        setDepositionDate('')
        setSelectedDocument('')
      } else {
        alert(data.error || 'Failed to process deposition')
      }
    } catch (error) {
      console.error('Error processing deposition:', error)
      alert('Failed to process deposition')
    } finally {
      setProcessing(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'plaintiff': return 'bg-blue-100 text-blue-800'
      case 'defendant': return 'bg-red-100 text-red-800'
      case 'expert': return 'bg-purple-100 text-purple-800'
      case 'treating_physician': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Deposition Summaries</h1>
        <p className="text-gray-600 mt-1">
          AI-powered deposition analysis with issue organization and contradiction detection
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Process New Deposition</h2>
        <div className="space-y-4">
          <div>
            <Label>Select Case</Label>
            <Select value={selectedCase} onValueChange={handleCaseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a case..." />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.case_number} - {c.patients?.last_name}, {c.patients?.first_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCase && (
            <>
              <div>
                <Label>Deposition Transcript Document</Label>
                <Select value={selectedDocument} onValueChange={setSelectedDocument}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose transcript..." />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map((doc) => (
                      <SelectItem key={doc.id} value={doc.id}>
                        {doc.original_filename}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Witness Name</Label>
                <Input
                  value={witnessName}
                  onChange={(e) => setWitnessName(e.target.value)}
                  placeholder="e.g., Dr. John Smith"
                />
              </div>

              <div>
                <Label>Witness Role</Label>
                <Select value={witnessRole} onValueChange={setWitnessRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plaintiff">Plaintiff</SelectItem>
                    <SelectItem value="defendant">Defendant</SelectItem>
                    <SelectItem value="expert">Expert Witness</SelectItem>
                    <SelectItem value="fact_witness">Fact Witness</SelectItem>
                    <SelectItem value="treating_physician">Treating Physician</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Deposition Date</Label>
                <Input
                  type="date"
                  value={depositionDate}
                  onChange={(e) => setDepositionDate(e.target.value)}
                />
              </div>

              <Button
                onClick={processDeposition}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Process Deposition
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center p-12">
          <Clock className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && depositions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Processed Depositions</h2>
          {depositions.map((dep: any) => (
            <Card key={dep.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold">{dep.witness.name}</h3>
                    <Badge className={getRoleBadgeColor(dep.witness.role)}>
                      {dep.witness.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Date: {new Date(dep.deposition_date).toLocaleDateString()} | Pages: {dep.total_pages}
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/deposition/export', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ deposition_id: dep.id }),
                      })
                      if (response.ok) {
                        const blob = await response.blob()
                        const url = window.URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `deposition_${dep.witness.name.replace(/\s+/g, '_')}.xlsx`
                        document.body.appendChild(a)
                        a.click()
                        window.URL.revokeObjectURL(url)
                        document.body.removeChild(a)
                      }
                    } catch (error) {
                      alert('Failed to export deposition')
                    }
                  }}
                  variant="outline"
                  size="sm"
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Export Excel
                </Button>
              </div>

              {dep.executive_summary && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Executive Summary</h4>
                  <p className="text-sm text-gray-700">{dep.executive_summary}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="border rounded p-3">
                  <p className="text-2xl font-bold">{dep.issues?.length || 0}</p>
                  <p className="text-sm text-gray-600">Issues</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-2xl font-bold">{dep.key_admissions?.length || 0}</p>
                  <p className="text-sm text-gray-600">Admissions</p>
                </div>
                <div className="border rounded p-3">
                  <p className="text-2xl font-bold">{dep.contradictions?.length || 0}</p>
                  <p className="text-sm text-gray-600">Contradictions</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && selectedCase && depositions.length === 0 && (
        <Card className="p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium">No depositions processed yet</h3>
          <p className="text-gray-600 mt-2">
            Process a deposition transcript to generate AI-powered summaries
          </p>
        </Card>
      )}
    </div>
  )
}

