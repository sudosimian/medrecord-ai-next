export interface Provider {
  id: string
  name: string
  specialty: string
  npi?: string
  facility?: string
  address?: string
  phone?: string
  first_visit: string
  last_visit: string
  visit_count: number
  total_charges?: number
}

export interface ProviderList {
  id: string
  case_id: string
  user_id: string
  providers: Provider[]
  created_at: string
  updated_at: string
}

