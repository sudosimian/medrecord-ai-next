'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  Scale, 
  FileText,
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Circle,
  ArrowRight,
  Plus,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentCases, setRecentCases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch cases
      const casesRes = await fetch('/api/cases')
      const casesData = await casesRes.json()
      const cases = casesData.cases || []
      
      // Get recent 3 cases
      setRecentCases(cases.slice(0, 3))
      
      // Calculate stats
      setStats({
        totalCases: cases.length,
        activeCases: cases.filter((c: any) => c.status === 'active').length,
        completedServices: 0, // TODO: Track per case
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Workflow steps for guidance
  const workflowSteps = [
    {
      id: 1,
      title: 'Create Case',
      description: 'Add patient and case details',
      icon: Scale,
      href: '/cases',
      status: stats?.totalCases > 0 ? 'complete' : 'pending',
      action: 'New Case',
    },
    {
      id: 2,
      title: 'Upload Records',
      description: 'Upload medical records and bills',
      icon: FileText,
      href: '/records',
      status: stats?.totalCases > 0 ? 'pending' : 'locked',
      action: 'Upload',
    },
    {
      id: 3,
      title: 'Extract Timeline',
      description: 'AI processes medical events',
      icon: Calendar,
      href: '/chronology',
      status: 'pending',
      action: 'Process',
    },
    {
      id: 4,
      title: 'Analyze Billing',
      description: 'Calculate economic damages',
      icon: DollarSign,
      href: '/billing',
      status: 'pending',
      action: 'Extract',
    },
    {
      id: 5,
      title: 'Generate Demand',
      description: 'Create settlement letter',
      icon: FileText,
      href: '/demand-letter',
      status: 'pending',
      action: 'Generate',
    },
  ]

  const getStatusIcon = (status: string) => {
    if (status === 'complete') return <CheckCircle2 className="h-5 w-5 text-green-600" />
    if (status === 'locked') return <Circle className="h-5 w-5 text-gray-300" />
    return <Circle className="h-5 w-5 text-blue-600" />
  }

  const getStatusColor = (status: string) => {
    if (status === 'complete') return 'bg-green-50 border-green-200'
    if (status === 'locked') return 'bg-gray-50 border-gray-200'
    return 'bg-blue-50 border-blue-200'
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  // First-time user (no cases)
  if (stats?.totalCases === 0) {
    return (
      <div className="p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome to MedRecord AI</h1>
          <p className="text-gray-600 mt-1">
            AI-powered medical-legal services for attorneys
          </p>
        </div>

        {/* Getting Started */}
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">🚀 Get Started in 3 Steps</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold">Create Your First Case</h3>
                  <p className="text-sm text-gray-700">
                    Add patient details and case information (incident date, defendant, insurance)
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold">Upload Medical Records</h3>
                  <p className="text-sm text-gray-700">
                    Upload PDFs of medical records, bills, and police reports
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold">Generate Legal Work Product</h3>
                  <p className="text-sm text-gray-700">
                    Extract chronology, analyze billing, create demand letters - all AI-powered
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Link href="/cases">
                <Button className="" size="lg" variant="default">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Case
                </Button>
              </Link>
              <Link href="/workflow-guide">
                <Button className="" variant="outline" size="lg">
                  View Workflow Guide
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Features Overview */}
        <div>
          <h2 className="text-xl font-semibold mb-4">What You Can Do</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <Calendar className="h-10 w-10 text-blue-600 mb-3" />
              <h3 className="font-semibold mb-2">Medical Chronology</h3>
              <p className="text-sm text-gray-600">
                AI extracts medical events, organizes chronologically with ICD-10 codes
              </p>
              <p className="text-xs text-blue-600 mt-2 font-medium">12-24x faster than manual</p>
            </Card>

            <Card className="p-6">
              <DollarSign className="h-10 w-10 text-green-600 mb-3" />
              <h3 className="font-semibold mb-2">Billing Summary</h3>
              <p className="text-sm text-gray-600">
                Extract bills, detect duplicates, identify overcharges vs Medicare rates
              </p>
              <p className="text-xs text-green-600 mt-2 font-medium">10-20x faster than manual</p>
            </Card>

            <Card className="p-6">
              <FileText className="h-10 w-10 text-purple-600 mb-3" />
              <h3 className="font-semibold mb-2">Demand Letters</h3>
              <p className="text-sm text-gray-600">
                Generate professional settlement demands with industry-standard format
              </p>
              <p className="text-xs text-purple-600 mt-2 font-medium">6-10x faster than manual</p>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Existing user with cases
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Overview of your cases and workflow progress
          </p>
        </div>
        <Link href="/cases">
          <Button className="" variant="default" size="default">
            <Plus className="mr-2 h-4 w-4" />
            New Case
        </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Cases</p>
              <p className="text-3xl font-bold mt-1">{stats?.totalCases || 0}</p>
            </div>
            <Scale className="h-10 w-10 text-blue-600 opacity-20" />
          </div>
            </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Cases</p>
              <p className="text-3xl font-bold mt-1">{stats?.activeCases || 0}</p>
      </div>
            <TrendingUp className="h-10 w-10 text-green-600 opacity-20" />
              </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
              <div>
              <p className="text-sm text-gray-600">Time Saved</p>
              <p className="text-3xl font-bold mt-1">~20hrs</p>
              <p className="text-xs text-gray-500 mt-1">vs. manual processing</p>
            </div>
            <Clock className="h-10 w-10 text-purple-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Workflow Progress */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Workflow Guide</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon
            const isLast = index === workflowSteps.length - 1
            
            return (
              <div key={step.id} className="relative">
                <Link href={step.status !== 'locked' ? step.href : '#'}>
                  <Card 
                    className={`p-4 transition-all hover:shadow-md ${getStatusColor(step.status)} ${
                      step.status === 'locked' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {getStatusIcon(step.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className="h-4 w-4 text-gray-600" />
                          <p className="text-sm font-semibold">{step.title}</p>
              </div>
                        <p className="text-xs text-gray-600">{step.description}</p>
                        {step.status !== 'locked' && step.status !== 'complete' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="mt-3 w-full text-xs"
                          >
                            {step.action}
                          </Button>
                        )}
                        {step.status === 'complete' && (
                          <Badge className="mt-2 bg-green-100 text-green-800 text-xs" variant="default">
                            Complete
                          </Badge>
                        )}
              </div>
            </div>
                  </Card>
                </Link>
                
                {!isLast && (
                  <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Recent Cases */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Recent Cases</h2>
          <Link href="/cases">
            <Button className="" variant="ghost" size="sm">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {recentCases.length === 0 ? (
          <Card className="p-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium">No cases yet</h3>
            <p className="text-gray-600 mt-2 mb-4">
              Create your first case to get started
            </p>
            <Link href="/cases">
              <Button className="" variant="default" size="default">
                <Plus className="mr-2 h-4 w-4" />
                Create Case
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentCases.map((caseItem) => (
              <Link key={caseItem.id} href={`/cases/${caseItem.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
              <div>
                      <p className="font-semibold">{caseItem.case_number}</p>
                      <p className="text-sm text-gray-600">
                        {caseItem.patients?.last_name}, {caseItem.patients?.first_name}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800" variant="default">
                      {caseItem.status}
                    </Badge>
              </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {new Date(caseItem.incident_date || caseItem.created_at).toLocaleDateString()}
                    </span>
            </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="font-semibold mb-3">💡 Quick Tip</h3>
        <p className="text-sm text-gray-700 mb-4">
          For best results, follow the workflow in order: Create Case → Upload Records → 
          Process Chronology → Analyze Billing → Generate Demand Letter
        </p>
        <div className="flex gap-3">
          <Link href="/workflow-guide">
            <Button className="" variant="outline" size="sm">
              View Full Guide
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}
