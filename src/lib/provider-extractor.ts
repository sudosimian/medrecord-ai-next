import { Provider } from '@/types/provider'

export async function extractProviderList(events: any[], bills: any[]): Promise<Provider[]> {
  const providerMap = new Map<string, Provider>()
  
  // Extract from medical events
  for (const event of events) {
    if (event.provider_name) {
      const key = normalizeProviderName(event.provider_name)
      
      if (!providerMap.has(key)) {
        providerMap.set(key, {
          id: generateId(),
          name: event.provider_name,
          specialty: event.provider_specialty || 'Unknown',
          facility: event.facility_name,
          first_visit: event.event_date,
          last_visit: event.event_date,
          visit_count: 1,
        })
      } else {
        const provider = providerMap.get(key)!
        provider.visit_count++
        if (new Date(event.event_date) < new Date(provider.first_visit)) {
          provider.first_visit = event.event_date
        }
        if (new Date(event.event_date) > new Date(provider.last_visit)) {
          provider.last_visit = event.event_date
        }
      }
    }
  }
  
  // Add billing information
  for (const bill of bills) {
    if (bill.provider_name) {
      const key = normalizeProviderName(bill.provider_name)
      const provider = providerMap.get(key)
      
      if (provider) {
        provider.total_charges = (provider.total_charges || 0) + (bill.amount || 0)
      }
    }
  }
  
  return Array.from(providerMap.values()).sort((a, b) => 
    new Date(a.first_visit).getTime() - new Date(b.first_visit).getTime()
  )
}

function normalizeProviderName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

