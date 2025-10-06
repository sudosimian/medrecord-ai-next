'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Calendar, 
  User, 
  FileText, 
  Clock, 
  Briefcase, 
  ArrowLeft,
  Building,
  FileCheck,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default function CaseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const caseId = params.id as string

  const [caseData, setCaseData] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCaseData()
    fetchDocuments()
    fetchEvents()
  }, [caseId])

  const fetchCaseData = async () => {
    try {
      const response = await fetch(`/api/cases/${caseId}`)
      const data = await response.json()
      setCaseData(data.case)
    } catch (error) {
      console.error('Error fetching case:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?caseId=${caseId}`)
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/chronology?caseId=${caseId}`)
      const data = await response.json()
      setEvents(data.events || [])
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCaseTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      personal_injury: 'Personal Injury',
      workers_comp: 'Workers Comp',
      medical_malpractice: 'Medical Malpractice',
      other: 'Other',
    }
    return labels[type] || type
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      archived: 'bg-slate-100 text-slate-800',
    }
    return colors[status] || colors.active
  }

  if (!caseData) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/cases')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{caseData.case_number}</h1>
            <Badge className={getStatusColor(caseData.status)}>
              {caseData.status}
            </Badge>
          </div>
          <p className="text-gray-600 mt-1">{getCaseTypeLabel(caseData.case_type)}</p>
        </div>
        <Link href={`/chronology?caseId=${caseId}`}>
          <Button>
            <Activity className="mr-2 h-4 w-4" />
            View Chronology
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <User className="h-5 w-5 text-gray-400" />
            <span className="font-semibold">Patient</span>
          </div>
          {caseData.patients && (
            <div>
              <p className="text-lg">
                {caseData.patients.last_name}, {caseData.patients.first_name}
              </p>
              {caseData.patients.date_of_birth && (
                <p className="text-sm text-gray-600">
                  DOB: {format(new Date(caseData.patients.date_of_birth), 'MM/dd/yyyy')}
                </p>
              )}
              {caseData.patients.phone && (
                <p className="text-sm text-gray-600">{caseData.patients.phone}</p>
              )}
              {caseData.patients.email && (
                <p className="text-sm text-gray-600">{caseData.patients.email}</p>
              )}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="font-semibold">Incident Date</span>
          </div>
          {caseData.incident_date ? (
            <p className="text-lg">
              {format(new Date(caseData.incident_date), 'MMM dd, yyyy')}
            </p>
          ) : (
            <p className="text-gray-400">Not specified</p>
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="h-5 w-5 text-gray-400" />
            <span className="font-semibold">Created</span>
          </div>
          <p className="text-lg">
            {format(new Date(caseData.created_at), 'MMM dd, yyyy')}
          </p>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="documents">
            Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="events">
            Timeline ({events.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {caseData.attorney_name && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Attorney</label>
                  <p className="mt-1">{caseData.attorney_name}</p>
                </div>
              )}

              {caseData.insurance_company && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Insurance Company</label>
                  <p className="mt-1 flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    {caseData.insurance_company}
                  </p>
                </div>
              )}

              {caseData.claim_number && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Claim Number</label>
                  <p className="mt-1">{caseData.claim_number}</p>
                </div>
              )}

              {caseData.notes && (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-600">Notes</label>
                  <p className="mt-1 text-gray-700 whitespace-pre-wrap">{caseData.notes}</p>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="p-6">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No documents uploaded yet
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium">{doc.filename}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(doc.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{doc.document_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card className="p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading timeline...
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-8">
                <FileCheck className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-500">No medical events extracted yet</p>
                <Link href={`/chronology?caseId=${caseId}`}>
                  <Button className="mt-4">
                    <Activity className="mr-2 h-4 w-4" />
                    Process Documents
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {events.slice(0, 5).map((event) => (
                  <div key={event.id} className="flex gap-3 pb-4 border-b last:border-0">
                    <Calendar className="h-5 w-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium">
                        {format(new Date(event.event_date), 'MMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{event.description}</p>
                      {event.provider_name && (
                        <p className="text-sm text-gray-600 mt-1">
                          {event.provider_name}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {events.length > 5 && (
                  <Link href={`/chronology?caseId=${caseId}`}>
                    <Button variant="outline" className="w-full">
                      View All {events.length} Events
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

