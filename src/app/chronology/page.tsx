'use client'

import { useState, useEffect } from 'react'
import { Calendar, FileText, AlertCircle, CheckCircle, Clock, Hash, Link as LinkIcon, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MedicalEvent, getSignificanceLevel, getSignificanceColor } from '@/types/chronology'
import { format } from 'date-fns'

export default function ChronologyPage() {
  const [events, setEvents] = useState<MedicalEvent[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [applyingBates, setApplyingBates] = useState(false)
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [cases, setCases] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [filterSignificance, setFilterSignificance] = useState<string>('all')
  const [batesInfo, setBatesInfo] = useState<any>(null)

  useEffect(() => {
    fetchCases()
    
    // Check for caseId in URL query
    const urlParams = new URLSearchParams(window.location.search)
    const caseIdParam = urlParams.get('caseId')
    if (caseIdParam) {
      setSelectedCase(caseIdParam)
      fetchChronology(caseIdParam)
    }
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

  const fetchChronology = async (caseId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/chronology?caseId=${caseId}`)
      const data = await response.json()
      
      if (response.ok) {
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error('Error fetching chronology:', error)
    } finally {
      setLoading(false)
    }
  }

  const processDocuments = async () => {
    if (!selectedCase) return

    setProcessing(true)
    try {
      // Get documents for case
      const docsResponse = await fetch(`/api/documents?caseId=${selectedCase}`)
      const docsData = await docsResponse.json()
      
      const documentIds = docsData.documents?.map((d: any) => d.id) || []
      
      if (documentIds.length === 0) {
        alert('No documents found for this case')
        return
      }

      const response = await fetch('/api/chronology/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedCase,
          documentIds,
          options: {
            extractCodes: true,
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
        fetchChronology(selectedCase)
      } else {
        alert(data.error || 'Failed to process documents')
      }
    } catch (error) {
      console.error('Error processing documents:', error)
      alert('Failed to process documents')
    } finally {
      setProcessing(false)
    }
  }

  const applyBatesNumbering = async () => {
    if (!selectedCase) return

    setApplyingBates(true)
    try {
      const response = await fetch('/api/documents/bates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedCase,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setBatesInfo(data)
        alert(`Bates numbering applied! ${data.totalPages} pages numbered with prefix ${data.prefix}`)
        fetchChronology(selectedCase)
      } else {
        alert(data.error || 'Failed to apply Bates numbering')
      }
    } catch (error) {
      console.error('Error applying Bates numbering:', error)
      alert('Failed to apply Bates numbering')
    } finally {
      setApplyingBates(false)
    }
  }

  const exportChronology = async (format: 'excel' | 'word') => {
    if (!selectedCase) return

    try {
      const response = await fetch('/api/chronology/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: selectedCase,
          format,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chronology.${format === 'excel' ? 'xlsx' : 'docx'}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to export chronology')
      }
    } catch (error) {
      console.error('Error exporting chronology:', error)
      alert('Failed to export chronology')
    }
  }

  const filteredEvents = events.filter(event => {
    if (filterSignificance === 'all') return true
    const level = getSignificanceLevel(event.significance_score)
    return level === filterSignificance
  })

  const formatEventDate = (dateStr: string, timeStr?: string) => {
    try {
      const date = new Date(dateStr)
      const formatted = format(date, 'MMM dd, yyyy')
      return timeStr ? `${formatted} at ${timeStr}` : formatted
    } catch {
      return dateStr
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Medical Chronology</h1>
        <p className="text-gray-600 mt-1">
          AI-powered timeline generation for case preparation and trial exhibits
        </p>
      </div>

      {/* Case Selection and Processing */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Case</label>
            <Select value={selectedCase} onValueChange={(value: string) => {
              setSelectedCase(value)
              fetchChronology(value)
            }}>
              <SelectTrigger className="">
                <SelectValue placeholder="Choose a case to analyze" />
              </SelectTrigger>
              <SelectContent className="">
                {cases.length === 0 ? (
                  <SelectItem className="" value="none" disabled>
                    No cases available - Create a case first
                  </SelectItem>
                ) : (
                  cases.map(c => (
                    <SelectItem className="" key={c.id} value={c.id}>
                      {c.case_number} - {c.patients?.last_name}, {c.patients?.first_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button className="" variant="default" size="default"
              onClick={processDocuments}
              disabled={!selectedCase || processing}
            >
              {processing ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Process Documents
                </>
              )}
            </Button>

            <Button className="" variant="outline" size="default"
              onClick={applyBatesNumbering}
              disabled={!selectedCase || applyingBates}
            >
              {applyingBates ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Hash className="mr-2 h-4 w-4" />
                  Apply Bates Numbers
                </>
              )}
            </Button>

                <Button className="" variant="outline" disabled={!selectedCase || loading} size="default" onClick={() => fetchChronology(selectedCase)}>
                  Refresh
                </Button>

                {events.length > 0 && (
                  <>
                    <Button className="" variant="outline" size="default"
                      onClick={() => exportChronology('excel')}
                      disabled={!selectedCase}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Excel
                    </Button>

                    <Button className="" variant="outline" size="default"
                      onClick={() => exportChronology('word')}
                      disabled={!selectedCase}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export Word
                    </Button>
                  </>
                )}
              </div>

          {batesInfo && (
            <Alert className="bg-blue-50 border-blue-200" variant="default">
              <LinkIcon className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Bates numbering applied:</strong> {batesInfo.totalPages} pages numbered with prefix "{batesInfo.prefix}". 
                Citations will now include source document references.
              </AlertDescription>
            </Alert>
          )}

          {stats && (
            <Alert className="" variant="default">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="">
                Processed {stats.documentsProcessed} documents, extracted {stats.totalEvents} events
                {stats.duplicatesFound > 0 && ` (${stats.duplicatesFound} duplicates removed)`}.
                Processing time: {(stats.processingTime / 1000).toFixed(1)}s
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Timeline */}
      {events.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              Timeline ({filteredEvents.length} events)
            </h2>
            
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Filter by significance:</span>
              <Select value={filterSignificance} onValueChange={setFilterSignificance}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="">
                  <SelectItem className="" value="all">All Events</SelectItem>
                  <SelectItem className="" value="critical">Critical</SelectItem>
                  <SelectItem className="" value="important">Important</SelectItem>
                  <SelectItem className="" value="routine">Routine</SelectItem>
                  <SelectItem className="" value="administrative">Administrative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {filteredEvents.map((event, index) => {
              const significance = getSignificanceLevel(event.significance_score)
              const colorClass = getSignificanceColor(significance)

              return (
                <Card key={event.id} className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${significance === 'critical' ? 'bg-red-500' : significance === 'important' ? 'bg-yellow-500' : significance === 'routine' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        {index < filteredEvents.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-2" style={{ minHeight: '40px' }} />
                        )}
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">
                              {formatEventDate(event.event_date, event.event_time || undefined)}
                            </span>
                            <Badge className={colorClass} variant="default">
                              {significance}
                            </Badge>
                            {event.event_type && (
                              <Badge className="" variant="outline">{event.event_type}</Badge>
                            )}
                          </div>
                          
                          {event.provider_name && (
                            <p className="text-sm text-gray-600 mb-2">
                              Provider: {event.provider_name}
                              {event.facility && ` at ${event.facility}`}
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-900 mt-2">{event.description}</p>

                      {(event.icd_codes || event.cpt_codes || event.page_reference || event.bates_number) && (
                        <div className="flex gap-4 mt-3 text-sm">
                          {event.icd_codes && event.icd_codes.length > 0 && (
                            <div>
                              <span className="text-gray-600">ICD-10:</span>{' '}
                              <span className="font-mono">{event.icd_codes.join(', ')}</span>
                            </div>
                          )}
                          {event.cpt_codes && event.cpt_codes.length > 0 && (
                            <div>
                              <span className="text-gray-600">CPT:</span>{' '}
                              <span className="font-mono">{event.cpt_codes.join(', ')}</span>
                            </div>
                          )}
                          {(event.page_reference || event.bates_number) && (
                            <div>
                              <span className="text-gray-600">Source:</span>{' '}
                              {event.document_id ? (
                                <button
                                  onClick={async () => {
                                    try {
                                      const response = await fetch(`/api/documents/${event.document_id}/view`)
                                      if (response.ok) {
                                        const data = await response.json()
                                        window.open(data.url, '_blank')
                                      } else {
                                        alert('Unable to open document')
                                      }
                                    } catch (error) {
                                      console.error('Error opening document:', error)
                                      alert('Unable to open document')
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-800 underline font-mono"
                                >
                                  {event.bates_number || event.page_reference}
                                </button>
                              ) : (
                                <span className="font-mono">{event.bates_number || event.page_reference}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {!loading && events.length === 0 && selectedCase && (
        <Card className="p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No events found</h3>
          <p className="mt-2 text-gray-600">
            Click Process Documents to extract medical events from uploaded records
          </p>
        </Card>
      )}

      {loading && (
        <div className="text-center py-12">
          <Clock className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Loading chronology...</p>
        </div>
      )}
    </div>
  )
}

