'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Building, Phone, Calendar, DollarSign, User, Download } from 'lucide-react'
import * as XLSX from 'xlsx'

export default function ProvidersPage() {
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [providers, setProviders] = useState<any[]>([])
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

  const fetchProviders = async (caseId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/providers/${caseId}`)
      const data = await response.json()
      setProviders(data.providers || [])
    } catch (error) {
      console.error('Error fetching providers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCaseChange = (caseId: string) => {
    setSelectedCase(caseId)
    fetchProviders(caseId)
  }

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      providers.map(p => ({
        Name: p.name,
        Specialty: p.specialty,
        Facility: p.facility || 'N/A',
        'First Visit': new Date(p.first_visit).toLocaleDateString(),
        'Last Visit': new Date(p.last_visit).toLocaleDateString(),
        'Visit Count': p.visit_count,
        'Total Charges': p.total_charges ? `$${p.total_charges.toFixed(2)}` : 'N/A',
      }))
    )
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Providers')
    XLSX.writeFile(workbook, `providers_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Provider List</h1>
        <p className="text-gray-600 mt-1">
          Complete roster of healthcare providers with visit history
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

          {providers.length > 0 && (
            <Button className="" onClick={exportToExcel} variant="outline" size="default">
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          )}
        </div>
      </Card>

      {providers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {providers.map((provider) => (
            <Card key={provider.id} className="p-6">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{provider.name}</h3>
                    <Badge className="" variant="outline">{provider.specialty}</Badge>
                  </div>
                  <User className="h-5 w-5 text-gray-400" />
                </div>

                {provider.facility && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="h-4 w-4" />
                    <span>{provider.facility}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(provider.first_visit).toLocaleDateString()} - 
                    {new Date(provider.last_visit).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Visits: {provider.visit_count}</span>
                  {provider.total_charges && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>${provider.total_charges.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!loading && selectedCase && providers.length === 0 && (
        <Card className="p-12 text-center">
          <User className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <h3 className="text-lg font-medium">No providers found</h3>
          <p className="text-gray-600 mt-2">
            Process medical chronology to extract provider information
          </p>
        </Card>
      )}
    </div>
  )
}

