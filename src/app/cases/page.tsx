'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreateCaseDialog } from '@/components/cases/create-case-dialog'
import { CreatePatientDialog } from '@/components/patients/create-patient-dialog'
import { Briefcase, Calendar, User, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default function CasesPage() {
  const [cases, setCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/cases')
      const data = await response.json()
      setCases(data.cases || [])
    } catch (error) {
      console.error('Error fetching cases:', error)
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cases</h1>
          <p className="text-gray-600 mt-1">
            Manage legal cases and medical analysis
          </p>
        </div>
        <div className="flex gap-3">
          <CreatePatientDialog onPatientCreated={fetchCases} />
          <CreateCaseDialog onCaseCreated={fetchCases} />
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading cases...</p>
        </div>
      )}

      {!loading && cases.length === 0 && (
        <Card className="p-12 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No cases yet</h3>
          <p className="mt-2 text-gray-600">
            Create a patient first, then create a case to get started
          </p>
        </Card>
      )}

      {!loading && cases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((caseItem) => (
            <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <span className="font-semibold">{caseItem.case_number}</span>
                  </div>
                  <Badge className={getStatusColor(caseItem.status)}>
                    {caseItem.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {caseItem.patients && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>
                        {caseItem.patients.last_name}, {caseItem.patients.first_name}
                      </span>
                    </div>
                  )}

                  <Badge variant="outline">
                    {getCaseTypeLabel(caseItem.case_type)}
                  </Badge>

                  {caseItem.incident_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Incident: {format(new Date(caseItem.incident_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}

                  {caseItem.attorney_name && (
                    <p className="text-sm text-gray-600">
                      Attorney: {caseItem.attorney_name}
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

