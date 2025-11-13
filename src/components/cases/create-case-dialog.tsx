'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface CreateCaseDialogProps {
  onCaseCreated?: () => void
}

export function CreateCaseDialog({ onCaseCreated }: CreateCaseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [formData, setFormData] = useState({
    patient_id: '',
    case_number: '',
    case_type: 'personal_injury',
    incident_date: '',
    attorney_name: '',
    insurance_company: '',
    claim_number: '',
    notes: '',
  })

  useEffect(() => {
    if (open) {
      fetchPatients()
    }
  }, [open])

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients')
      const data = await response.json()
      setPatients(data.patients || [])
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          patient_id: '',
          case_number: '',
          case_type: 'personal_injury',
          incident_date: '',
          attorney_name: '',
          insurance_company: '',
          claim_number: '',
          notes: '',
        })
        onCaseCreated?.()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create case')
      }
    } catch (error) {
      console.error('Error creating case:', error)
      alert('Failed to create case')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Case</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patient_id" className="">Patient *</Label>
            <Select
              value={formData.patient_id}
              onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem className="" key={patient.id} value={patient.id}>
                    {patient.last_name}, {patient.first_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="case_number" className="">Case Number</Label>
              <Input className="" id="case_number"
                type="text"
                value={formData.case_number}
                onChange={(e) => setFormData({ ...formData, case_number: e.target.value })}
                placeholder="Auto-generated if empty"
              />
            </div>

            <div>
              <Label htmlFor="case_type" className="">Case Type *</Label>
              <Select
                value={formData.case_type}
                onValueChange={(value) => setFormData({ ...formData, case_type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="" value="personal_injury">Personal Injury</SelectItem>
                  <SelectItem className="" value="workers_comp">Workers Compensation</SelectItem>
                  <SelectItem className="" value="medical_malpractice">Medical Malpractice</SelectItem>
                  <SelectItem className="" value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="incident_date" className="">Incident Date</Label>
            <Input className="" id="incident_date"
              type="date"
              value={formData.incident_date}
              onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="attorney_name" className="">Attorney Name</Label>
              <Input className="" id="attorney_name"
                type="text"
                value={formData.attorney_name}
                onChange={(e) => setFormData({ ...formData, attorney_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="insurance_company" className="">Insurance Company</Label>
              <Input className="" id="insurance_company"
                type="text"
                value={formData.insurance_company}
                onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="claim_number" className="">Claim Number</Label>
              <Input className="" id="claim_number"
                type="text"
                value={formData.claim_number}
                onChange={(e) => setFormData({ ...formData, claim_number: e.target.value })}
              />
          </div>

          <div>
            <Label htmlFor="notes" className="">Notes</Label>
            <Textarea className=""
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button className="" type="button" variant="outline" size="default" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="" type="submit" disabled={loading} variant="default" size="default">
              {loading ? 'Creating...' : 'Create Case'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

