'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { FileText, DollarSign, Calendar, TrendingUp } from 'lucide-react'

export default function SynopsisPage() {
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [synopsis, setSynopsis] = useState<any>(null)
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

  const fetchSynopsis = async (caseId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/synopsis/${caseId}`)
      const data = await response.json()
      setSynopsis(data)
    } catch (error) {
      console.error('Error fetching synopsis:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCaseChange = (caseId: string) => {
    setSelectedCase(caseId)
    fetchSynopsis(caseId)
  }

  const getCaseStrengthColor = (strength: string) => {
    switch (strength) {
      case 'compelling': return 'bg-green-100 text-green-800'
      case 'strong': return 'bg-blue-100 text-blue-800'
      case 'moderate': return 'bg-yellow-100 text-yellow-800'
      case 'weak': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Medical Synopsis</h1>
        <p className="text-gray-600 mt-1">
          Ultra-brief AI case summary for quick review
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
        </div>
      </Card>

      {synopsis && (
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Case Synopsis</h2>
            <p className="text-gray-700 leading-relaxed">{synopsis.executive_summary}</p>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Case Strength</p>
                  <Badge className={getCaseStrengthColor(synopsis.case_strength)}>
                    {synopsis.case_strength}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Medical Costs</p>
                  <p className="text-lg font-bold">
                    ${synopsis.total_medical_costs.toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Treatment Days</p>
                  <p className="text-lg font-bold">{synopsis.total_treatment_days}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Providers</p>
                  <p className="text-lg font-bold">{synopsis.key_providers.length}</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-3">Key Injuries</h3>
              <ul className="space-y-2">
                {synopsis.key_injuries.map((injury: string, index: number) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-600">•</span>
                    <span>{injury}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="font-semibold mb-3">Key Providers</h3>
              <ul className="space-y-2">
                {synopsis.key_providers.map((provider: string, index: number) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-green-600">•</span>
                    <span>{provider}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

