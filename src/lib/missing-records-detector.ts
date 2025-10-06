export interface MissingRecord {
  type: string
  description: string
  expected_date?: string
  provider?: string
  importance: 'critical' | 'important' | 'routine'
  reason: string
}

export async function detectMissingRecords(
  events: any[],
  documents: any[]
): Promise<MissingRecord[]> {
  const missing: MissingRecord[] = []
  
  // Check for initial ER visit
  const hasERVisit = events.some(e => 
    e.event_type?.toLowerCase().includes('emergency') ||
    e.facility_name?.toLowerCase().includes('emergency')
  )
  
  if (!hasERVisit) {
    missing.push({
      type: 'Emergency Room Visit',
      description: 'Initial emergency room visit records',
      importance: 'critical',
      reason: 'No emergency room visit found despite injury case'
    })
  }
  
  // Check for follow-up visits mentioned but not documented
  for (const event of events) {
    if (event.description?.toLowerCase().includes('follow up') || 
        event.description?.toLowerCase().includes('return in')) {
      const followUpDate = extractFollowUpDate(event.description, event.event_date)
      if (followUpDate) {
        const hasFollowUp = events.some(e => 
          new Date(e.event_date).toDateString() === followUpDate.toDateString()
        )
        if (!hasFollowUp) {
          missing.push({
            type: 'Follow-up Visit',
            description: `Follow-up visit mentioned in ${event.provider_name} notes`,
            expected_date: followUpDate.toISOString(),
            provider: event.provider_name,
            importance: 'important',
            reason: 'Follow-up visit referenced but not found in records'
          })
        }
      }
    }
  }
  
  // Check for imaging mentioned but not included
  const imagingMentions = events.filter(e => 
    e.description?.match(/x-ray|mri|ct scan|ultrasound/i)
  )
  
  for (const mention of imagingMentions) {
    const hasImagingReport = events.some(e => 
      e.event_type?.toLowerCase().includes('imaging') &&
      Math.abs(new Date(e.event_date).getTime() - new Date(mention.event_date).getTime()) < 7 * 24 * 60 * 60 * 1000
    )
    
    if (!hasImagingReport) {
      const imagingType = mention.description.match(/(x-ray|mri|ct scan|ultrasound)/i)?.[0]
      missing.push({
        type: 'Diagnostic Imaging',
        description: `${imagingType} report`,
        expected_date: mention.event_date,
        provider: mention.provider_name,
        importance: 'important',
        reason: 'Imaging study mentioned but report not found'
      })
    }
  }
  
  // Check for specialist referrals without reports
  const referralMentions = events.filter(e =>
    e.description?.match(/refer|consult|see specialist/i)
  )
  
  for (const referral of referralMentions) {
    const specialtyMatch = referral.description.match(/orthopedic|neurolog|cardio|psychi/i)
    if (specialtyMatch) {
      const hasSpecialistVisit = events.some(e =>
        e.provider_specialty?.toLowerCase().includes(specialtyMatch[0].toLowerCase()) &&
        new Date(e.event_date) > new Date(referral.event_date)
      )
      
      if (!hasSpecialistVisit) {
        missing.push({
          type: 'Specialist Consultation',
          description: `${specialtyMatch[0]} consultation`,
          expected_date: referral.event_date,
          provider: referral.provider_name,
          importance: 'important',
          reason: 'Referral made but specialist visit not documented'
        })
      }
    }
  }
  
  // Check for physical therapy if mentioned
  const ptMentioned = events.some(e => 
    e.description?.match(/physical therapy|pt|rehabilitation/i)
  )
  
  if (ptMentioned) {
    const hasPTRecords = events.some(e =>
      e.event_type?.toLowerCase().includes('therapy') ||
      e.provider_specialty?.toLowerCase().includes('physical therapy')
    )
    
    if (!hasPTRecords) {
      missing.push({
        type: 'Physical Therapy Records',
        description: 'Physical therapy treatment notes',
        importance: 'important',
        reason: 'Physical therapy recommended but no PT records found'
      })
    }
  }
  
  // Sort by importance
  return missing.sort((a, b) => {
    const importance = { critical: 3, important: 2, routine: 1 }
    return importance[b.importance] - importance[a.importance]
  })
}

function extractFollowUpDate(description: string, currentDate: string): Date | null {
  const daysMatch = description.match(/(\d+)\s*days?/i)
  const weeksMatch = description.match(/(\d+)\s*weeks?/i)
  
  if (daysMatch) {
    const days = parseInt(daysMatch[1])
    const date = new Date(currentDate)
    date.setDate(date.getDate() + days)
    return date
  }
  
  if (weeksMatch) {
    const weeks = parseInt(weeksMatch[1])
    const date = new Date(currentDate)
    date.setDate(date.getDate() + (weeks * 7))
    return date
  }
  
  return null
}

