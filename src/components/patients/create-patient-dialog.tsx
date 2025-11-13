'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface CreatePatientDialogProps {
  onPatientCreated?: () => void
}

export function CreatePatientDialog({ onPatientCreated }: CreatePatientDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setOpen(false)
        setFormData({
          first_name: '',
          last_name: '',
          date_of_birth: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          state: '',
          zip: '',
          notes: '',
        })
        onPatientCreated?.()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to create patient')
      }
    } catch (error) {
      console.error('Error creating patient:', error)
      alert('Failed to create patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="" variant="outline" size="default">
          <Plus className="mr-2 h-4 w-4" />
          New Patient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name" className="">First Name *</Label>
              <Input className="" id="first_name"
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="last_name" className="">Last Name *</Label>
              <Input className="" id="last_name"
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date_of_birth" className="">Date of Birth</Label>
              <Input className="" id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="phone" className="">Phone</Label>
              <Input className="" id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="">Email</Label>
            <Input className="" id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="address" className="">Address</Label>
              <Input className="" id="address"
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="city" className="">City</Label>
              <Input className="" id="city"
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="state" className="">State</Label>
              <Input className="" id="state"
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                maxLength={2}
              />
            </div>

            <div>
              <Label htmlFor="zip" className="">ZIP</Label>
              <Input className="" id="zip"
                type="text"
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
              />
            </div>
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
              {loading ? 'Creating...' : 'Create Patient'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

