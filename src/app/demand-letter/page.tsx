'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Download, 
  Clock,
  DollarSign,
  Scale,
  CheckCircle,
  Edit
} from 'lucide-react'
import { formatCurrency, DEMAND_LETTER_TYPES, INJURY_SEVERITY, LIABILITY_STRENGTH } from '@/types/demand-letter'

export default function DemandLetterPage() {
  const [cases, setCases] = useState<any[]>([])
  const [selectedCase, setSelectedCase] = useState<string>('')
  const [demandType, setDemandType] = useState<'standard' | 'uim' | 'stowers'>('standard')
  const [generating, setGenerating] = useState(false)
  const [generatedLetter, setGeneratedLetter] = useState<any>(null)
  const [editing, setEditing] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    defendant_name: '',
    incident_description: '',
    incident_location: '',
    property_damage: '',
    past_lost_wages: '',
    future_lost_wages: '',
    future_medical_expenses: '',
    injury_severity: 'moderate' as keyof typeof INJURY_SEVERITY,
    liability_strength: 'strong' as keyof typeof LIABILITY_STRENGTH,
    demand_amount: '',
  })

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

  const handleGenerate = async () => {
    if (!selectedCase) return

    setGenerating(true)
    try {
      const response = await fetch('/api/demand-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId: selectedCase,
          demandType,
          options: {
            defendant_name: formData.defendant_name || undefined,
            incident_description: formData.incident_description || undefined,
            incident_location: formData.incident_location || undefined,
            property_damage: formData.property_damage ? parseFloat(formData.property_damage) : 0,
            past_lost_wages: formData.past_lost_wages ? parseFloat(formData.past_lost_wages) : 0,
            future_lost_wages: formData.future_lost_wages ? parseFloat(formData.future_lost_wages) : 0,
            future_medical_expenses: formData.future_medical_expenses ? parseFloat(formData.future_medical_expenses) : 0,
            injury_severity: formData.injury_severity,
            liability_strength: formData.liability_strength,
            demand_amount: formData.demand_amount ? parseFloat(formData.demand_amount) : undefined,
          },
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setGeneratedLetter(data)
      } else {
        alert(data.error || 'Failed to generate demand letter')
      }
    } catch (error) {
      console.error('Error generating demand letter:', error)
      alert('Failed to generate demand letter')
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedLetter) return

    const blob = new Blob([generatedLetter.letter.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Demand-Letter-${selectedCase}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settlement Demand Letter</h1>
        <p className="text-gray-600 mt-1">
          Generate professional demand letters for insurance settlement negotiations
        </p>
      </div>

      {!generatedLetter ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Case Information</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="case" className="">Select Case *</Label>
                  <Select value={selectedCase} onValueChange={setSelectedCase}>
                    <SelectTrigger className="">
                      <SelectValue placeholder="Choose a case" />
                    </SelectTrigger>
                    <SelectContent className="">
                      {cases.length === 0 ? (
                        <SelectItem className="" value="none" disabled>
                          No cases available
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

                <div>
                  <Label htmlFor="demandType" className="">Demand Type *</Label>
                  <Select value={demandType} onValueChange={(value: any) => setDemandType(value)}>
                    <SelectTrigger className="">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="">
                      {Object.entries(DEMAND_LETTER_TYPES).map(([key, value]) => (
                        <SelectItem className="" key={key} value={key}>
                          {value.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 mt-1">
                    {DEMAND_LETTER_TYPES[demandType].description}
                  </p>
                </div>

                <div>
                  <Label htmlFor="defendant" className="">Defendant Name</Label>
                  <Input className="" id="defendant"
                    value={formData.defendant_name}
                    type="text" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, defendant_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <Label htmlFor="location" className="">Incident Location</Label>
                  <Input className="" id="location"
                    value={formData.incident_location}
                    type="text" onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, incident_location: e.target.value })}
                    placeholder="123 Main St, City, State"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="">Incident Description</Label>
                  <Textarea className=""
                    id="description"
                    value={formData.incident_description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, incident_description: e.target.value })}
                    placeholder="Describe how the accident occurred..."
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Damages</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="property" className="">Property Damage</Label>
                  <Input className="" id="property"
                    type="number"
                    value={formData.property_damage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, property_damage: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="pastWages" className="">Past Lost Wages</Label>
                  <Input className="" id="pastWages"
                    type="number"
                    value={formData.past_lost_wages}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, past_lost_wages: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="futureWages" className="">Future Lost Wages</Label>
                  <Input className="" id="futureWages"
                    type="number"
                    value={formData.future_lost_wages}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, future_lost_wages: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="futureMedical" className="">Future Medical Expenses</Label>
                  <Input className="" id="futureMedical"
                    type="number"
                    value={formData.future_medical_expenses}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, future_medical_expenses: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="severity" className="">Injury Severity</Label>
                  <Select value={formData.injury_severity} onValueChange={(value: any) => 
                    setFormData({ ...formData, injury_severity: value })
                  }>
                    <SelectTrigger className="">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="">
                      {Object.entries(INJURY_SEVERITY).map(([key, value]) => (
                        <SelectItem className="" key={key} value={key}>
                          {value.description}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="liability" className="">Liability Strength</Label>
                  <Select value={formData.liability_strength} onValueChange={(value: any) => 
                    setFormData({ ...formData, liability_strength: value })
                  }>
                    <SelectTrigger className="">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="">
                      {Object.entries(LIABILITY_STRENGTH).map(([key, value]) => (
                        <SelectItem className="" key={key} value={key}>
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="demand" className="">Demand Amount (leave blank for auto-calculation)</Label>
                  <Input className="" id="demand"
                    type="number"
                    value={formData.demand_amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, demand_amount: e.target.value })}
                    placeholder="Auto-calculated if empty"
                  />
                </div>
              </div>
            </Card>

            <Button className="w-full" variant="default" size="lg"
              onClick={handleGenerate}
              disabled={!selectedCase || generating}
            >
              {generating ? (
                <>
                  <Clock className="mr-2 h-5 w-5 animate-spin" />
                  Generating Demand Letter...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generate Demand Letter
                </>
              )}
            </Button>
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Scale className="h-8 w-8 text-blue-600" />
                <h3 className="text-lg font-semibold">What You'll Get</h3>
              </div>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Professional header with case details</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Facts and liability section</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Detailed injury summary with ICD-10 codes</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Chronological treatment narrative</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Itemized medical expenses</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Lifestyle impact (pain & suffering)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Damages summary table</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Settlement demand with deadline</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Exhibits list</span>
                </li>
              </ul>
            </Card>

            <Card className="p-6 bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Based on industry standard:</strong> This format matches professional demand letters used by legal nurse consultants, including proper sections, medical terminology, and persuasive legal language.
              </p>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Success Banner */}
          <Alert className="bg-green-50 border-green-200" variant="default">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="">
              <strong>Demand letter generated successfully!</strong> Demand amount: {formatCurrency(generatedLetter.demand_data.demand_amount)}
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="" variant="default" size="default" onClick={() => setGeneratedLetter(null)}>
              Generate New Letter
            </Button>
            <Button className="" variant="outline" onClick={handleDownload} size="default">
              <Download className="mr-2 h-4 w-4" />
              Download as Markdown
            </Button>
            <Button className="" variant="outline" size="default" onClick={() => setEditing(!editing)}>
              <Edit className="mr-2 h-4 w-4" />
              {editing ? 'View Only' : 'Edit'}
            </Button>
          </div>

          {/* Letter Preview */}
          <Card className="p-8">
            {editing ? (
              <Textarea className="font-mono text-sm"
                value={generatedLetter.letter.content}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setGeneratedLetter({
                    ...generatedLetter,
                    letter: {
                      ...generatedLetter.letter,
                      content: e.target.value,
                    },
                  })
                }}
                rows={30}
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {generatedLetter.letter.content}
                </pre>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}

