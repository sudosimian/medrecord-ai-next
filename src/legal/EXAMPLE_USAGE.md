# California Demand Pack - Example Usage

This document demonstrates how to use the California jurisdiction-aware demand pack system.

## Example 1: Validate a Partial Demand (API Call)

```typescript
// POST /api/demand/validate
const response = await fetch('/api/demand/validate', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    state: 'CA',
    sections: {
      // Only providing 2 out of 6 required sections
      policy_limits_demand: 'We hereby offer to settle all claims for the policy limits of $25,000.',
      liability: 'Defendant negligently rear-ended plaintiff causing severe injuries.'
    },
    caseData: {
      insuranceCompany: 'State Farm Insurance',
      claimNumber: 'SF-2024-12345',
      adjusterName: 'John Claims',
      insuredName: 'Jane Smith'
    }
  })
})

const result = await response.json()
console.log(result)
```

**Expected Response:**
```json
{
  "ok": false,
  "missing": [
    "deadline_language",
    "proof_of_service",
    "policy_disclosure_request",
    "damages_summary"
  ],
  "warnings": [
    "Consider including \"bad_faith_notice\" section to document carrier obligations.",
    "Consider including \"medical_summary\" to demonstrate injury severity."
  ],
  "checklist": [
    {
      "item": "Mailing Method Confirmed",
      "required": true,
      "description": "Use certified mail with return receipt OR overnight delivery with signature confirmation..."
    },
    {
      "item": "All Addresses Verified",
      "required": true,
      "description": "Verify current addresses for: (1) Claims adjuster - John Claims..."
    },
    // ... 7 more checklist items
  ],
  "message": "Demand pack incomplete. Missing 4 required section(s)."
}
```

## Example 2: Generate California Demand Letter

```typescript
import { generateDemandLetter } from '@/lib/demand-letter-generator'
import { DemandLetterData } from '@/types/demand-letter'

const californiaCase: DemandLetterData = {
  // Basic case info
  case_id: 'case-abc-123',
  case_type: 'motor_vehicle',
  case_number: '2024-CV-45678',
  
  // IMPORTANT: Set jurisdiction to 'CA' to trigger CA templates
  jurisdiction: 'CA',
  policy_limits_demand: true, // Flag as policy limits demand
  
  // Parties
  plaintiff_name: 'Maria Rodriguez',
  defendant_name: 'John Driver',
  attorney_name: 'Sarah Attorney',
  attorney_firm: 'Rodriguez & Associates',
  insurance_company: 'GEICO Insurance',
  claim_number: 'GEI-2024-88888',
  
  // Incident details
  incident_date: '2024-03-15T14:30:00Z',
  incident_location: 'Intersection of Wilshire Blvd and Western Ave, Los Angeles, CA',
  incident_description: 'Defendant ran red light at high speed and T-boned plaintiff vehicle on driver side door, causing severe injuries including broken ribs, internal bleeding, and traumatic brain injury.',
  
  // Medical treatment
  chronology_summary: `
    3/15/2024 - Emergency transport to Cedars-Sinai Medical Center
    3/15/2024-3/20/2024 - Hospitalized for TBI, internal injuries, surgery
    3/21/2024-5/15/2024 - Physical therapy 3x/week for mobility
    4/1/2024-present - Neurologist visits monthly for TBI monitoring
    5/1/2024-present - Pain management specialist bi-weekly
  `,
  
  // Damages
  total_medical_expenses: 125000,
  medical_expenses: 125000,
  future_medical_expenses: 75000,
  past_lost_wages: 35000,
  lost_wages: 35000,
  future_lost_wages: 100000,
  property_damage: 18000,
  pain_suffering: 450000,
  total_damages: 803000, // Far exceeds policy limits
  
  // Policy limits (known from disclosure)
  policy_limits: 100000, // $100k policy
  settlement_deadline: '2024-12-31T17:00:00Z', // 30 days from demand
  
  // Liability
  liability_theory: 'Negligence per se - violation of CVC § 21453(a) (running red light)',
  defendant_negligence: 'Defendant violated traffic laws and duty of care',
  causation_statement: 'Direct and proximate cause of all injuries and damages',
  
  // Settlement
  demand_amount: 100000,
  
  // Not used but required by interface
  pain_suffering_multiplier: 3.5,
}

// Generate the demand letter
const demand = await generateDemandLetter(californiaCase, 'stowers')

console.log('Generated sections:', demand.sections.length)
console.log('Section titles:', demand.sections.map(s => s.title))

// Check if compliance check was included
const hasComplianceCheck = demand.sections.some(s => 
  s.title.includes('COMPLIANCE CHECK')
)
console.log('Has compliance warnings:', hasComplianceCheck)

// Output the full demand
console.log('\n=== FULL DEMAND TEXT ===\n')
console.log(demand.full_text)
```

**Expected Output Sections:**
1. ⚠️ COMPLIANCE CHECK (if incomplete)
2. COVER LETTER
3. POLICY LIMITS SETTLEMENT OFFER
4. LIABILITY ANALYSIS
5. MEDICAL TREATMENT SUMMARY
6. DAMAGES SUMMARY
7. BAD FAITH NOTICE TO CARRIER
8. POLICY DISCLOSURE REQUEST
9. ACCEPTANCE DEADLINE & TERMS
10. PROOF OF SERVICE

## Example 3: Direct Validator Usage (Server-Side)

```typescript
import { validateDemandPack } from '@/legal/validator'
import { CA_DEMAND_TEMPLATES } from '@/legal/ca/demand-pack'

// Simulate filled templates
const filledSections = {
  cover_letter: CA_DEMAND_TEMPLATES.cover_letter
    .replace(/\{\{plaintiff_name\}\}/g, 'Maria Rodriguez')
    .replace(/\{\{insured_name\}\}/g, 'John Driver')
    .replace(/\{\{policy_limits\}\}/g, '$100,000')
    // ... more replacements
    ,
  policy_limits_demand: CA_DEMAND_TEMPLATES.policy_limits_demand
    .replace(/\{\{policy_limits\}\}/g, '$100,000')
    // ... more replacements
    ,
  // Missing other required sections...
}

// Validate
const result = validateDemandPack({
  state: 'CA',
  filledSections
})

if (!result.ok) {
  console.error('❌ Demand incomplete!')
  console.error('Missing:', result.missing)
  
  result.missing.forEach(section => {
    console.log(`\nNeed to fill: ${section}`)
    console.log('Template:', CA_DEMAND_TEMPLATES[section as keyof typeof CA_DEMAND_TEMPLATES])
  })
} else {
  console.log('✅ Demand is complete and ready to send!')
}
```

## Example 4: Get State Requirements

```typescript
// GET /api/demand/validate?state=CA
const response = await fetch('/api/demand/validate?state=CA', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
})

const requirements = await response.json()
console.log(requirements)
```

**Expected Response:**
```json
{
  "state": "CA",
  "requiredElements": [
    "policy_limits_demand",
    "deadline_language",
    "proof_of_service",
    "policy_disclosure_request",
    "damages_summary",
    "liability"
  ],
  "description": "California policy limits demand requirements include time-limited offers, policy disclosure requests, and proof of service documentation to establish bad faith timeline.",
  "supported": true
}
```

## Example 5: Build Proof of Service Checklist

```typescript
import { buildCAProofOfServiceChecklist } from '@/legal/ca/demand-pack'

const checklist = buildCAProofOfServiceChecklist({
  insuranceCompany: 'State Farm Insurance',
  claimNumber: 'SF-2024-12345',
  adjusterName: 'John Claims',
  insuredName: 'Jane Smith'
})

console.log('\n=== PROOF OF SERVICE CHECKLIST ===\n')
checklist.forEach((item, index) => {
  const marker = item.required ? '[ ] REQUIRED' : '[ ] OPTIONAL'
  console.log(`${index + 1}. ${marker} ${item.item}`)
  console.log(`   ${item.description}`)
  console.log()
})
```

**Expected Output:**
```
=== PROOF OF SERVICE CHECKLIST ===

1. [ ] REQUIRED Mailing Method Confirmed
   Use certified mail with return receipt OR overnight delivery with 
   signature confirmation. Email alone is insufficient for policy limits demands.

2. [ ] REQUIRED All Addresses Verified
   Verify current addresses for: (1) Claims adjuster - John Claims, 
   (2) Insurance company claims office, (3) Insured defendant - Jane Smith. 
   Send to all three to avoid disputes over receipt.

3. [ ] REQUIRED Date/Time Documented
   Record exact date and time of mailing. This starts the deadline clock. 
   Keep tracking numbers and photographs of mailed package.

... (9 total items)
```

## Example 6: Test Complete vs Incomplete Demand

```typescript
// INCOMPLETE DEMAND - Will show compliance check box
const incompleteDemand = await generateDemandLetter({
  ...californiaCase,
  jurisdiction: 'CA',
  policy_limits_demand: true,
  // Missing data means templates won't be fully filled
  insurance_company: undefined,
  defendant_name: undefined,
}, 'stowers')

console.log('Has compliance check:', 
  incompleteDemand.sections[0].title.includes('COMPLIANCE CHECK')
) // true

// COMPLETE DEMAND - No compliance check box
const completeDemand = await generateDemandLetter({
  ...californiaCase,
  jurisdiction: 'CA',
  policy_limits_demand: true,
  // All required data provided
}, 'stowers')

console.log('Has compliance check:', 
  completeDemand.sections[0].title.includes('COMPLIANCE CHECK')
) // false - first section is COVER LETTER
```

## Example 7: Non-CA Case (Standard Demand)

```typescript
// NOT California - uses standard demand template
const texasCase: DemandLetterData = {
  ...californiaCase,
  jurisdiction: 'TX', // Different state
  policy_limits_demand: false,
}

const standardDemand = await generateDemandLetter(texasCase, 'standard')

console.log('Uses CA templates:', 
  standardDemand.sections.some(s => s.title === 'BAD FAITH NOTICE TO CARRIER')
) // false - standard structure used

console.log('Sections:', standardDemand.sections.map(s => s.title))
// ['HEADER', 'INTRODUCTION', 'FACTS AND LIABILITY', 'MEDICAL EXPENSES', ...]
```

## Testing the Validation Endpoint

You can test the validation endpoint using curl:

```bash
# Test with partial sections (should fail)
curl -X POST http://localhost:3000/api/demand/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "state": "CA",
    "sections": {
      "policy_limits_demand": "Settlement offer content...",
      "liability": "Liability analysis content..."
    },
    "caseData": {
      "insuranceCompany": "State Farm",
      "insuredName": "Jane Smith"
    }
  }'

# Expected: ok: false, missing: [4 sections]
```

```bash
# Get requirements for CA
curl -X GET "http://localhost:3000/api/demand/validate?state=CA" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN"

# Expected: List of 6 required elements
```

## Integration with UI

If you have a demand letter editor UI, you can integrate validation:

```typescript
// In your demand editor component
const [sections, setSections] = useState<Record<string, string>>({})
const [validationResult, setValidationResult] = useState(null)

const validateDemand = async () => {
  const response = await fetch('/api/demand/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      state: 'CA',
      sections,
      caseData: {
        insuranceCompany: formData.insuranceCompany,
        insuredName: formData.insuredName,
        claimNumber: formData.claimNumber,
        adjusterName: formData.adjusterName,
      }
    })
  })
  
  const result = await response.json()
  setValidationResult(result)
  
  if (!result.ok) {
    alert(`Missing required sections:\n${result.missing.join('\n')}`)
  }
}

return (
  <div>
    {/* Demand editor fields */}
    
    <button onClick={validateDemand}>
      Validate Before Sending
    </button>
    
    {validationResult && !validationResult.ok && (
      <div className="alert alert-warning">
        <h4>Demand Incomplete</h4>
        <ul>
          {validationResult.missing.map(m => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </div>
    )}
  </div>
)
```

---

## Key Points

1. **Set `jurisdiction: 'CA'`** and **`policy_limits_demand: true`** to trigger CA templates
2. **Validation is non-blocking** - generates demand with compliance check box if incomplete
3. **API endpoint** available at `/api/demand/validate` for real-time validation
4. **Proof of service checklist** helps ensure proper documentation
5. **All templates** include legal citations and explanations in comments
6. **Extensible** - easy to add NY, TX, or other state templates following same pattern

## Next Steps

1. Test the endpoint with your authentication
2. Integrate into your demand letter UI
3. Add additional state templates as needed (see README.md for instructions)
4. Consider adding template customization UI for attorneys

