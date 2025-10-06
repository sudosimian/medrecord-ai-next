'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Scale,
  Activity,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function CaseSummaryPage() {
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchCases()
  }, [])

  const fetchCases = async () => {
    try {
      const response = await fetch('/api/cases')
      const data = await response.json()
      setCases(data)
    } catch (error) {
      console.error('Error fetching cases:', error)
    }
  }

  const fetchSummary = async (caseId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/case-summary/${caseId}`)
      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      } else {
        setSummary(null)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }

  const generateSummary = async () => {
    if (!selectedCase) return

    setGenerating(true)
    try {
      const response = await fetch(`/api/case-summary/${selectedCase}`, {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setSummary(data)
      } else {
        alert(data.error || 'Failed to generate summary')
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      alert('Failed to generate summary')
    } finally {
      setGenerating(false)
    }
  }

  const handleCaseSelect = (caseId: string) => {
    setSelectedCase(caseId)
    setSummary(null)
    fetchSummary(caseId)
  }

  const formatCurrency = (num: number) => `$${num.toLocaleString()}`

  const getLiabilityColor = (strength: string) => {
    switch (strength) {
      case 'Compelling':
        return 'bg-green-600 text-white'
      case 'Strong':
        return 'bg-green-500 text-white'
      case 'Moderate':
        return 'bg-yellow-500 text-white'
      case 'Weak':
        return 'bg-red-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Catastrophic':
        return 'bg-red-600 text-white'
      case 'Severe':
        return 'bg-red-500 text-white'
      case 'Moderate':
        return 'bg-yellow-500 text-white'
      case 'Minor':
        return 'bg-green-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const summaryData = summary?.summary_data || summary?.output_data

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Case Summary (Blackbox)</h1>
        <p className="text-gray-600 mt-1">
          AI-generated executive summary for quick case review and decision-making
        </p>
      </div>

      {/* Case Selection */}
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Select Case</label>
            <Select value={selectedCase} onValueChange={handleCaseSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a case..." />
              </SelectTrigger>
              <SelectContent>
                {cases.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.case_number} - {c.patients?.first_name} {c.patients?.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={generateSummary}
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
                  Generate Case Summary
                </>
              )}
            </Button>

            {summary && (
              <Button variant="outline" disabled={!selectedCase || loading}>
                Refresh
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Display */}
      {loading && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <Clock className="h-12 w-12 animate-spin mb-4" />
            <p>Loading summary...</p>
          </div>
        </Card>
      )}

      {!loading && summaryData && (
        <div className="space-y-6">
          {/* Executive Overview */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Executive Overview
            </h2>
            <p className="text-gray-700">{summaryData.executive_overview}</p>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Liability</p>
                  <Badge className={`${getLiabilityColor(summaryData.liability_assessment.strength)} mt-1`}>
                    {summaryData.liability_assessment.strength}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {summaryData.liability_assessment.score}/100
                  </p>
                </div>
                <Scale className="h-8 w-8 text-gray-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Injury Severity</p>
                  <Badge className={`${getSeverityColor(summaryData.injury_summary.severity)} mt-1`}>
                    {summaryData.injury_summary.severity}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {summaryData.injury_summary.treatment_duration_days} days
                  </p>
                </div>
                <Activity className="h-8 w-8 text-gray-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Damages</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(summaryData.damages_overview.total_damages_range.low)}
                  </p>
                  <p className="text-xs text-gray-500">
                    to {formatCurrency(summaryData.damages_overview.total_damages_range.high)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-gray-400" />
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Settlement Target</p>
                  <p className="text-lg font-semibold mt-1">
                    {formatCurrency(summaryData.settlement_analysis.expected_settlement_range.high)}
                  </p>
                  <p className="text-xs text-gray-500">Expected</p>
                </div>
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
            </Card>
          </div>

          {/* Liability Assessment */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Scale className="h-5 w-5 mr-2" />
              Liability Assessment
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Strength:</span>
                <Badge className={getLiabilityColor(summaryData.liability_assessment.strength)}>
                  {summaryData.liability_assessment.strength} ({summaryData.liability_assessment.score}/100)
                </Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Key Factors:</p>
                <ul className="space-y-1">
                  {summaryData.liability_assessment.factors.map((factor: string, i: number) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start">
                      <span className="mr-2">•</span>
                      <span>{factor}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Injury Summary */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Injury Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Severity</p>
                <Badge className={`${getSeverityColor(summaryData.injury_summary.severity)} mt-1`}>
                  {summaryData.injury_summary.severity}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Treatment Duration</p>
                <p className="font-medium mt-1">{summaryData.injury_summary.treatment_duration_days} days</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Permanent Impairment</p>
                <Badge className={summaryData.injury_summary.permanent_impairment ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}>
                  {summaryData.injury_summary.permanent_impairment ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Key Injuries:</p>
              <div className="flex flex-wrap gap-2">
                {summaryData.injury_summary.key_injuries.map((injury: string, i: number) => (
                  <Badge key={i} variant="outline">{injury}</Badge>
                ))}
              </div>
            </div>
          </Card>

          {/* Damages Breakdown */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Damages Overview
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Past Medical:</span>
                <span className="font-medium">{formatCurrency(summaryData.damages_overview.total_medical)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Future Medical (Projected):</span>
                <span className="font-medium">{formatCurrency(summaryData.damages_overview.projected_future_medical)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Lost Wages:</span>
                <span className="font-medium">{formatCurrency(summaryData.damages_overview.lost_wages)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Economic Damages:</span>
                <span className="font-semibold">{formatCurrency(summaryData.damages_overview.economic_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Pain & Suffering (Est):</span>
                <span className="font-medium">{formatCurrency(summaryData.damages_overview.non_economic_estimate)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-bold text-lg">Total Damages Range:</span>
                <span className="font-bold text-lg">
                  {formatCurrency(summaryData.damages_overview.total_damages_range.low)} - {formatCurrency(summaryData.damages_overview.total_damages_range.high)}
                </span>
              </div>
            </div>
          </Card>

          {/* Settlement Analysis */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Settlement Analysis
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Recommended Demand:</span>
                <span className="font-bold text-lg text-blue-600">
                  {formatCurrency(summaryData.settlement_analysis.recommended_demand)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expected Settlement Range:</span>
                <span className="font-medium">
                  {formatCurrency(summaryData.settlement_analysis.expected_settlement_range.low)} - {formatCurrency(summaryData.settlement_analysis.expected_settlement_range.high)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Comparable Cases Average:</span>
                <span className="font-medium">{formatCurrency(summaryData.settlement_analysis.comparable_cases_average)}</span>
              </div>
              {summaryData.settlement_analysis.policy_limits && (
                <div className="flex justify-between pt-3 border-t">
                  <span className="text-gray-600">Policy Limits:</span>
                  <span className="font-medium">{formatCurrency(summaryData.settlement_analysis.policy_limits)}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center text-green-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                Key Strengths
              </h3>
              <ul className="space-y-2">
                {summaryData.key_strengths.map((strength: string, i: number) => (
                  <li key={i} className="text-sm flex items-start">
                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                Key Weaknesses
              </h3>
              <ul className="space-y-2">
                {summaryData.key_weaknesses.map((weakness: string, i: number) => (
                  <li key={i} className="text-sm flex items-start">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-red-600 flex-shrink-0" />
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {/* Action Items */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Critical Action Items
            </h2>
            <ol className="space-y-2">
              {summaryData.critical_action_items.map((item: string, i: number) => (
                <li key={i} className="flex items-start">
                  <span className="font-medium mr-2">{i + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
          </Card>

          {/* ROI Analysis */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">ROI Analysis</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Attorney Hours Invested:</span>
                <span className="font-medium">{summaryData.roi_analysis.attorney_hours_invested} hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Costs Advanced:</span>
                <span className="font-medium">{formatCurrency(summaryData.roi_analysis.costs_advanced)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="font-semibold">Estimated Attorney Fee (33%):</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(summaryData.roi_analysis.estimated_fee)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Estimated Client Recovery:</span>
                <span className="font-semibold">{formatCurrency(summaryData.roi_analysis.estimated_net_recovery)}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {!loading && !summary && selectedCase && (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-gray-500">
            <FileText className="h-12 w-12 mb-4" />
            <p className="text-lg mb-2">No summary generated yet</p>
            <p className="text-sm">Click Generate Case Summary to create AI-powered analysis</p>
          </div>
        </Card>
      )}
    </div>
  )
}

