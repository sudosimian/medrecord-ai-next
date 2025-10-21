'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Building,
  Download
} from 'lucide-react'
import { BillingSummary, formatCurrency } from '@/types/billing'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export default function BillingPage() {
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [summary, setSummary] = useState<BillingSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [stats, setStats] = useState<any>(null)

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

  const fetchSummary = async (caseId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/billing/summary?caseId=${caseId}`)
      const data = await response.json()
      setSummary(data.summary)
    } catch (error) {
      console.error('Error fetching summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const processDocuments = async () => {
    if (!selectedCase) return

    setProcessing(true)
    try {
      const docsResponse = await fetch(`/api/documents?caseId=${selectedCase}`)
      const docsData = await docsResponse.json()
      
      const documentIds = docsData.documents?.map((d: any) => d.id) || []
      
      if (documentIds.length === 0) {
        alert('No documents found for this case')
        return
      }

      const response = await fetch('/api/billing/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedCase,
          documentIds,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStats(data.stats)
        fetchSummary(selectedCase)
      } else {
        alert(data.error || 'Failed to process billing documents')
      }
    } catch (error) {
      console.error('Error processing documents:', error)
      alert('Failed to process billing documents')
    } finally {
      setProcessing(false)
    }
  }

  const exportBilling = async () => {
    if (!selectedCase) return

    try {
      const response = await fetch('/api/billing/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: selectedCase,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `billing.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('Failed to export billing')
      }
    } catch (error) {
      console.error('Error exporting billing:', error)
      alert('Failed to export billing')
    }
  }

  const prepareProviderChartData = () => {
    if (!summary) return []
    return summary.by_provider.slice(0, 8).map(p => ({
      name: p.provider_name.length > 20 ? p.provider_name.slice(0, 17) + '...' : p.provider_name,
      amount: p.total_billed,
    }))
  }

  const prepareServiceTypeChartData = () => {
    if (!summary) return []
    return summary.by_service_type.map(s => ({
      name: s.service_type,
      value: s.total_billed,
      percentage: s.percentage,
    }))
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Billing Summary</h1>
        <p className="text-gray-600 mt-1">
          Calculate economic damages with AI-powered bill extraction and overcharge detection
        </p>
      </div>

      {/* Case Selection */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Case</label>
            <Select value={selectedCase} onValueChange={(value: string) => {
              setSelectedCase(value)
              fetchSummary(value)
            }}>
              <SelectTrigger className="">
                <SelectValue placeholder="Choose a case to analyze" />
              </SelectTrigger>
              <SelectContent className="">
                {cases.length === 0 ? (
                  <SelectItem value="none" disabled className="">
                    No cases available
                  </SelectItem>
                ) : (
                  cases.map(c => (
                    <SelectItem key={c.id} value={c.id} className="">
                      {c.case_number} - {c.patients?.last_name}, {c.patients?.first_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
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
                  Extract Bills
                </>
              )}
            </Button>

            <Button variant="outline" disabled={!selectedCase || loading} onClick={() => fetchSummary(selectedCase)}>
              Refresh
            </Button>

            {summary && summary.num_bills > 0 && (
              <Button
                onClick={exportBilling}
                disabled={!selectedCase}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
            )}
          </div>

          {stats && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Extracted {stats.bills_extracted} bills from {stats.total_documents} documents
                {stats.duplicates_found > 0 && ` (${stats.duplicates_found} duplicates found)`}.
                Processing time: {(stats.processing_time / 1000).toFixed(1)}s
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Summary Cards */}
      {summary && summary.num_bills > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Billed</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(summary.total_billed)}
                  </p>
                </div>
                <DollarSign className="h-10 w-10 text-blue-600 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summary.total_paid)}
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-600 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Balance Due</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(summary.total_balance)}
                  </p>
                </div>
                <TrendingUp className="h-10 w-10 text-orange-600 opacity-20" />
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Bills</p>
                  <p className="text-2xl font-bold">
                    {summary.num_bills}
                  </p>
                </div>
                <FileText className="h-10 w-10 text-gray-600 opacity-20" />
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Provider Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Cost by Provider</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prepareProviderChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis tickFormatter={(value) => `$${value.toLocaleString()}`} />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Service Type Breakdown */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Cost by Service Type</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={prepareServiceTypeChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {prepareServiceTypeChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Provider List */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building className="h-5 w-5" />
              Provider Details
            </h3>
            <div className="space-y-2">
              {summary.by_provider.map((provider, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{provider.provider_name}</p>
                    <p className="text-sm text-gray-600">
                      {provider.num_bills} bills • {provider.visit_count} visits
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(provider.total_billed)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Issues */}
          {(summary.duplicates.length > 0 || summary.overcharges.length > 0) && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Issues Found
              </h3>
              
              {summary.duplicates.length > 0 && (
                <Alert className="mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{summary.duplicates.length} duplicate charges</strong> found.
                    Potential savings: {formatCurrency(summary.duplicates.reduce((sum, d) => sum + d.potential_overcharge, 0))}
                  </AlertDescription>
                </Alert>
              )}

              {summary.overcharges.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{summary.overcharges.length} potential overcharges</strong> detected.
                    Total overcharge amount: {formatCurrency(summary.overcharges.reduce((sum, o) => sum + o.overcharge_amount, 0))}
                  </AlertDescription>
                </Alert>
              )}

              {summary.overcharges.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="font-medium text-sm text-gray-700">Overcharge Details:</p>
                  {summary.overcharges.slice(0, 5).map((overcharge, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded bg-red-50"
                    >
                      <div>
                        <p className="font-medium">CPT {overcharge.cpt_code}</p>
                        <p className="text-sm text-gray-600">
                          Charged: {formatCurrency(overcharge.charged_amount)} • 
                          Reasonable: {formatCurrency(overcharge.reasonable_rate)}
                        </p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        +{overcharge.overcharge_percentage}%
                      </Badge>
                    </div>
                  ))}
                  {summary.overcharges.length > 5 && (
                    <p className="text-sm text-gray-600 text-center">
                      and {summary.overcharges.length - 5} more...
                    </p>
                  )}
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {loading && (
        <div className="text-center py-12">
          <Clock className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-2 text-gray-600">Loading billing summary...</p>
        </div>
      )}

      {!loading && selectedCase && summary && summary.num_bills === 0 && (
        <Card className="p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No bills found</h3>
          <p className="mt-2 text-gray-600">
            Click Extract Bills to process medical billing documents
          </p>
        </Card>
      )}
    </div>
  )
}

