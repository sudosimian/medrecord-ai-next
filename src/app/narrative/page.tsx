'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, AlertCircle, CheckCircle, Download } from 'lucide-react'

export default function NarrativePage() {
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [narrative, setNarrative] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

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

  const fetchNarrative = async (caseId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/narrative/${caseId}`)
      const data = await response.json()
      setNarrative(data)
    } catch (error) {
      console.error('Error fetching narrative:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateNarrative = async () => {
    if (!selectedCase) return

    setGenerating(true)
    try {
      const response = await fetch('/api/narrative/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: selectedCase,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setNarrative(data)
        alert('Narrative summary generated successfully!')
      } else {
        alert(data.error || 'Failed to generate narrative')
      }
    } catch (error) {
      console.error('Error generating narrative:', error)
      alert('Failed to generate narrative')
    } finally {
      setGenerating(false)
    }
  }

  const handleCaseChange = (caseId: string) => {
    setSelectedCase(caseId)
    fetchNarrative(caseId)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'severe': return 'bg-orange-100 text-orange-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'minor': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Narrative Summary</h1>
        <p className="text-gray-600 mt-1">
          AI-generated medical narrative with causation analysis and injury categorization
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select Case</label>
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

          <div className="flex gap-3">
            <Button
              onClick={generateNarrative}
              disabled={!selectedCase || generating}
            >
              {generating ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Narrative
                </>
              )}
            </Button>

            <Button variant="outline" disabled={!selectedCase || loading} onClick={() => fetchNarrative(selectedCase)}>
              Refresh
            </Button>

            {narrative && (
              <Button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/narrative/export', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ case_id: selectedCase }),
                    })
                    if (response.ok) {
                      const blob = await response.blob()
                      const url = window.URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'narrative.docx'
                      document.body.appendChild(a)
                      a.click()
                      window.URL.revokeObjectURL(url)
                      document.body.removeChild(a)
                    }
                  } catch (error) {
                    alert('Failed to export narrative')
                  }
                }}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Word
              </Button>
            )}
          </div>
        </div>
      </Card>

      {loading && (
        <div className="flex items-center justify-center p-12">
          <Clock className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && narrative && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Executive Summary</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{narrative.executive_summary}</p>
          </Card>

          {narrative.injury_categories && narrative.injury_categories.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Injuries by Category</h2>
              <div className="space-y-4">
                {narrative.injury_categories.map((category: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-blue-500 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{category.category}</h3>
                      <Badge className={getSeverityColor(category.severity)}>
                        {category.severity}
                      </Badge>
                    </div>
                    <ul className="list-disc list-inside space-y-1">
                      {category.injuries.map((injury: string, i: number) => (
                        <li key={i} className="text-gray-700">
                          {injury} <span className="text-sm text-gray-500">({category.icd10_codes[i]})</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {narrative.causation_analyses && narrative.causation_analyses.length > 0 && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Causation Analysis</h2>
              <div className="space-y-4">
                {narrative.causation_analyses.map((analysis: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{analysis.injury}</h3>
                      <Badge>
                        {analysis.causation_strength} ({analysis.causation_score}/100)
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Evidence:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {analysis.evidence.map((ev: string, i: number) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {narrative.full_narrative && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Full Narrative</h2>
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                  {narrative.full_narrative}
                </pre>
              </div>
            </Card>
          )}
        </div>
      )}

      {!loading && selectedCase && !narrative && (
        <Card className="p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium">No narrative summary yet</h3>
          <p className="text-gray-600 mt-2 mb-4">
            Click Generate Narrative to create an AI-powered medical summary
          </p>
        </Card>
      )}
    </div>
  )
}

