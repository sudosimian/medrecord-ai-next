# Jurisdiction-Aware Demand Pack System

This system provides state-specific demand letter templates and validators to ensure legal compliance for personal injury demands.

## Overview

The demand pack system includes:
- **Templates**: Pre-structured, legally-compliant sections with placeholder tokens
- **Validators**: Ensure all required elements are present before sending
- **Proof-of-Service Checklists**: Track service requirements for each jurisdiction
- **Integration**: Automatic injection into demand letter generator

## California Policy Limits Demands

### Legal Requirements

California policy limits demands must include specific elements to trigger bad faith duties under *Comunale v. Traders & General Ins. Co.* and *Crisci v. Security Ins. Co.*:

1. **Clear Policy Limits Offer**: Unambiguous offer to settle for full policy limits
2. **Time Limitation**: Definite expiration date creating urgency
3. **Proof of Service**: Documentation establishing timeline
4. **Policy Disclosure Request**: Request for all available coverage (CA Ins. Code § 790.03)
5. **Damages Showing Value Exceeds Limits**: Demonstrate claim value supports settlement
6. **Clear Liability**: Show exposure is not speculative

### Usage

#### 1. Generate California Demand

```typescript
import { generateDemandLetter } from '@/lib/demand-letter-generator'

const demandData = {
  // Basic case info
  case_id: 'case-123',
  case_type: 'motor_vehicle',
  case_number: '2024-CV-12345',
  
  // Set jurisdiction to CA
  jurisdiction: 'CA',
  policy_limits_demand: true, // Flag as policy limits demand
  
  // Parties
  plaintiff_name: 'John Doe',
  defendant_name: 'Jane Smith',
  insurance_company: 'State Farm Insurance',
  claim_number: 'SF-2024-98765',
  
  // Incident
  incident_date: '2024-01-15',
  incident_location: 'Los Angeles, CA',
  incident_description: 'Rear-end collision on I-405',
  
  // Damages
  medical_expenses: 45000,
  future_medical_expenses: 15000,
  lost_wages: 12000,
  property_damage: 8000,
  pain_suffering: 150000,
  total_damages: 230000,
  
  // Policy
  policy_limits: 25000, // Known policy limits
  settlement_deadline: '2024-12-31', // 30 days from demand
  
  // Medical
  chronology_summary: '...',
  
  // Other required fields...
}

const result = await generateDemandLetter(demandData, 'stowers')
// Returns CA-compliant demand with all required sections
```

#### 2. Validate Demand Completeness

##### Via API Route (Recommended)

```typescript
// POST /api/demand/validate
const response = await fetch('/api/demand/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    state: 'CA',
    sections: {
      policy_limits_demand: '... content ...',
      deadline_language: '... content ...',
      // ... other sections
    },
    caseData: {
      insuranceCompany: 'State Farm',
      claimNumber: 'SF-2024-98765',
      adjusterName: 'John Claims',
      insuredName: 'Jane Smith',
    }
  })
})

const result = await response.json()
// {
//   ok: false,
//   missing: ['proof_of_service', 'policy_disclosure_request'],
//   warnings: ['Section "deadline_language" contains unfilled placeholders'],
//   checklist: [ /* proof of service checklist items */ ],
//   message: 'Demand pack incomplete. Missing 2 required section(s).'
// }
```

##### Direct Validator Usage

```typescript
import { validateDemandPack } from '@/legal/validator'

const result = validateDemandPack({
  state: 'CA',
  filledSections: {
    policy_limits_demand: '... filled content ...',
    liability: '... filled content ...',
    // ... other sections
  }
})

if (!result.ok) {
  console.log('Missing sections:', result.missing)
  console.log('Warnings:', result.warnings)
}
```

#### 3. Get Proof-of-Service Checklist

```typescript
import { buildCAProofOfServiceChecklist } from '@/legal/ca/demand-pack'

const checklist = buildCAProofOfServiceChecklist({
  insuranceCompany: 'State Farm Insurance',
  claimNumber: 'SF-2024-98765',
  adjusterName: 'John Claims',
  insuredName: 'Jane Smith'
})

checklist.forEach(item => {
  console.log(`[${item.required ? 'REQUIRED' : 'OPTIONAL'}] ${item.item}`)
  console.log(`  ${item.description}`)
})
```

### Template Customization

Templates are located in `src/legal/ca/demand-pack.ts` and use `{{placeholder}}` tokens:

```typescript
import { CA_DEMAND_TEMPLATES } from '@/legal/ca/demand-pack'

// Access individual sections
const coverLetter = CA_DEMAND_TEMPLATES.cover_letter
const badFaithNotice = CA_DEMAND_TEMPLATES.bad_faith_notice

// Replace placeholders
const filled = coverLetter
  .replace(/\{\{plaintiff_name\}\}/g, 'John Doe')
  .replace(/\{\{insured_name\}\}/g, 'Jane Smith')
  // ... etc
```

### Available Placeholders

All templates support these tokens:

**Party Information**
- `{{plaintiff_name}}` - Injured party
- `{{insured_name}}` - Defendant
- `{{insurance_company_name}}` - Carrier name
- `{{insurance_company_address}}` - Carrier address
- `{{claim_number}}` - Claim reference

**Dates**
- `{{current_date}}` - Date of demand
- `{{accident_date}}` - Date of incident
- `{{deadline_date}}` - Offer expiration
- `{{deadline_days}}` - Number of days until deadline

**Financial**
- `{{policy_limits}}` - Policy limits amount
- `{{total_damages}}` - Total damages claimed
- `{{medical_specials}}` - Medical expenses
- `{{past_medical}}` - Past medical costs
- `{{future_medical}}` - Future medical costs

**Case Details**
- `{{incident_description}}` - How accident occurred
- `{{liability_basis}}` - Legal basis for liability
- `{{treatment_summary}}` - Medical treatment overview

See `CADemandData` interface in `demand-pack.ts` for complete list.

## Compliance Check Box

When demand generator detects missing required sections, it automatically inserts a compliance check box at the top of the draft:

```markdown
> **CALIFORNIA LEGAL COMPLIANCE CHECK**
> 
> ⚠️ This demand is **INCOMPLETE** and may not meet California legal requirements.
> 
> **Missing Required Sections (2):**
> - `proof_of_service` - Required for valid CA policy limits demand
> - `policy_disclosure_request` - Required for valid CA policy limits demand
> 
> **LEGAL RISK:** Sending an incomplete demand may:
> - Allow carrier to reject demand as ambiguous or insufficient
> - Fail to trigger bad faith duties under *Comunale v. Traders* and *Crisci v. Security*
> 
> **ACTION REQUIRED:** Complete all missing sections before serving this demand.
```

This is non-blocking but alerts the attorney to review and complete the demand.

## Adding New Jurisdictions

To add support for another state (e.g., New York):

### 1. Create State Template File

```typescript
// src/legal/ny/demand-pack.ts

export const NY_DEMAND_TEMPLATES = {
  // NY-specific sections
  cover_letter: '...',
  // ...
}

export const NY_REQUIRED_ELEMENTS = [
  'cover_letter',
  // ... NY-specific requirements
]

export function buildNYProofOfServiceChecklist(data) {
  // NY-specific checklist
  return [...]
}
```

### 2. Update Validator

```typescript
// src/legal/validator.ts

import { NY_REQUIRED_ELEMENTS } from './ny/demand-pack'

export function validateDemandPack(input: DemandPackInput): ValidationResult {
  const { state, filledSections } = input
  const normalizedState = state?.toUpperCase()
  
  if (normalizedState === 'CA') {
    return validateCaliforniaDemand(filledSections)
  }
  
  if (normalizedState === 'NY') {
    return validateNewYorkDemand(filledSections) // Add this function
  }
  
  // ...
}
```

### 3. Update API Route

```typescript
// src/app/api/demand/validate/route.ts

if (body.state.toUpperCase() === 'NY') {
  const { buildNYProofOfServiceChecklist } = await import('@/legal/ny/demand-pack')
  checklist = buildNYProofOfServiceChecklist(body.caseData)
}
```

### 4. Update Demand Generator

```typescript
// src/lib/demand-letter-generator.ts

const isNewYorkCase = data.jurisdiction?.toUpperCase() === 'NY' && ...

if (isNewYorkCase) {
  return await generateNewYorkDemand(data, demandType)
}
```

## API Reference

### POST /api/demand/validate

Validates demand pack completeness for a jurisdiction.

**Request Body:**
```typescript
{
  state: string              // State code (e.g., 'CA')
  sections: Record<string, string>  // Section names → content
  caseData?: {               // Optional case context
    insuranceCompany?: string
    claimNumber?: string
    adjusterName?: string
    insuredName?: string
  }
}
```

**Response:**
```typescript
{
  ok: boolean                // true if all required sections present
  missing: string[]          // Array of missing section keys
  warnings?: string[]        // Non-critical warnings
  checklist: Array<{         // Proof of service checklist
    item: string
    required: boolean
    description: string
  }>
  message?: string           // Summary message
}
```

### GET /api/demand/validate?state=CA

Returns validation requirements for a state.

**Response:**
```typescript
{
  state: string              // Normalized state code
  requiredElements: string[] // Array of required section keys
  description: string        // Legal context
  supported: boolean         // Whether state has specific rules
}
```

## Testing

### Test Validation Endpoint

```bash
curl -X POST http://localhost:3000/api/demand/validate \
  -H "Content-Type: application/json" \
  -d '{
    "state": "CA",
    "sections": {
      "policy_limits_demand": "Settlement offer for $25,000...",
      "liability": "Defendant was negligent..."
    },
    "caseData": {
      "insuranceCompany": "State Farm",
      "insuredName": "Jane Smith"
    }
  }'
```

Should return:
```json
{
  "ok": false,
  "missing": [
    "deadline_language",
    "proof_of_service",
    "policy_disclosure_request",
    "damages_summary"
  ],
  "checklist": [ /* 9 checklist items */ ]
}
```

### Test Demand Generation

```typescript
// Test with CA jurisdiction
const testData = {
  jurisdiction: 'CA',
  policy_limits_demand: true,
  // ... minimal required fields
}

const result = await generateDemandLetter(testData, 'stowers')

// Should include CA-specific sections
expect(result.sections.some(s => s.title === 'BAD FAITH NOTICE TO CARRIER')).toBe(true)
expect(result.sections.some(s => s.title === 'POLICY DISCLOSURE REQUEST')).toBe(true)

// Should include compliance check if incomplete
expect(result.sections.some(s => s.title.includes('COMPLIANCE CHECK'))).toBe(true)
```

## Legal Disclaimer

**IMPORTANT:** These templates are provided as starting points and should be reviewed by licensed attorneys familiar with the jurisdiction. Laws change, and each case has unique circumstances. The templates do not constitute legal advice.

Always:
- Review generated demands with supervising attorney
- Verify current law and case citations
- Customize based on case-specific facts
- Obtain policy disclosure before finalizing demand
- Document service properly
- Calendar deadlines carefully

## Support

For questions or issues:
- File an issue in the project repository
- Contact the development team
- Consult with your jurisdiction's legal counsel

---

**Version:** 1.0.0  
**Last Updated:** October 29, 2025  
**Supported Jurisdictions:** California (CA)

