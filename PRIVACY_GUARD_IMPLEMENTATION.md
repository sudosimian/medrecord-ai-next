# Privacy Guard Implementation Guide

## Overview

This document describes the **Attorney-Client Privilege and HIPAA PHI Protection Layer** added to MedRecord AI. This system prevents unauthorized external AI processing of privileged or high-PHI content.

## What Was Added

### 1. Database Schema Changes (`supabase/migrations/20251111000000_add_privilege_phi_tracking.sql`)

#### New Columns on `cases`:
- `is_privileged` (boolean) - Attorney-client privileged case
- `privilege_notes` (text) - Notes about privilege status
- `phi_level` (text) - 'none', 'low', or 'high'
- `allow_external_ai` (boolean) - Explicit consent for external AI

#### New Columns on `documents`:
- `is_privileged` (boolean) - Attorney-client privileged document
- `is_attorney_work_product` (boolean) - Work product protection
- `phi_level` (text) - 'none', 'low', or 'high'
- `allow_external_ai` (boolean) - Explicit consent
- `redaction_status` (text) - 'pending', 'in_progress', 'completed', 'not_required'

#### New Columns on `legal_documents`:
- `is_privileged` (boolean, default true)
- `is_attorney_work_product` (boolean, default true)
- `allow_external_ai` (boolean, default false)
- `reviewed_by` (UUID) - Who reviewed this document
- `reviewed_at` (timestamp)
- `jurisdiction` (text)
- `review_role` (text) - 'paralegal', 'attorney_us', 'attorney_state'

#### New Table: `demand_service`
Tracks California policy-limits demand service, deadlines, and carrier responses:
- Service details (date, method, tracking)
- Demand specifics (amount, time-limited, deadline)
- Parties (carrier, adjuster, claim #)
- Response tracking
- Bad-faith tracking (CA specific)
- Proof of service

#### New Table: `ai_processing_log`
Compliance audit trail for all AI processing:
- What was processed (type, case, document)
- Where it went (AI provider, model)
- Privacy flags (privileged, PHI level, redacted)
- Result (success, blocked, queued)
- Tokens/cost

#### New View: `active_demands_expiring_soon`
Dashboard for CA time-limited demands approaching deadline

### 2. Privacy Guard Middleware (`src/lib/ai-privacy-guard.ts`)

Core functions:

#### `checkAIProcessingAllowed(request, userId)`
Main decision engine that checks:
1. **Privilege Rule**: Privileged content CANNOT go to external AI
2. **HIPAA Rule**: High PHI requires BAA or consent in strict mode
3. **Recommendation**: Suggests redaction even when allowed

Returns:
```typescript
{
  allowed: boolean,
  reason?: string,
  requiresRedaction: boolean,
  requiresHumanReview: boolean,
  logId?: string
}
```

#### `callAIWithPrivacyGuard(request, aiFunction)`
Wrapper for AI calls that:
1. Checks if processing is allowed
2. Applies automatic PHI redaction if required
3. Logs the processing attempt
4. Catches and logs errors

#### `redactPHIForAI(text, documentId?)`
Automatic redaction of:
- SSNs → `[SSN REDACTED]`
- DOBs → `[DATE REDACTED]`
- MRNs → `[MRN REDACTED]`
- Phone numbers → `[PHONE REDACTED]`

#### `getAIProcessingHistory(caseId)`
Get audit trail for a case

#### `getComplianceReport(userId)`
Find any blocked processing attempts for compliance review

### 3. Updated API Routes

The following routes now have privacy guards:

#### `/api/chronology/process`
- Passes `caseId`, `documentId`, `userId` to `extractMedicalEvents`
- Privacy guard runs before OpenAI call

#### `/api/demand-letter/generate`
- Checks case-level privilege before generating demand
- Blocks if case is privileged
- Logs all attempts

#### `/api/narrative/generate`
- Checks case-level privilege before narrative generation
- Blocks privileged cases

#### `/api/deposition/process`
- Checks both case and document privilege
- Deposition transcripts often contain sensitive testimony

### 4. Updated `extractMedicalEvents` Function

Now accepts:
```typescript
{
  extractCodes?: boolean,
  caseId?: string,
  documentId?: string,
  userId?: string,
  skipPrivacyGuard?: boolean  // for backwards compatibility
}
```

If `caseId` and `userId` provided, runs through privacy guard before OpenAI.

### 5. Environment Configuration (`ENV_CONFIG.md`)

New environment variables:
```bash
AI_ALLOW_EXTERNAL_PHI=false        # Strict HIPAA mode
OPENAI_BAA_ENABLED=false           # Have signed BAA?
AZURE_OPENAI_BAA_ENABLED=false
ANTHROPIC_BAA_ENABLED=false
```

## Decision Tree

```
AI Processing Request
├─ Is case/document privileged?
│  ├─ YES + external AI → BLOCK (always)
│  └─ NO → continue
│
├─ Is external AI provider?
│  ├─ NO (internal) → ALLOW
│  └─ YES → continue
│
├─ Is HIPAA strict mode? (AI_ALLOW_EXTERNAL_PHI=false)
│  ├─ NO → ALLOW (with redaction recommendation)
│  └─ YES → continue
│
├─ Is PHI level = high?
│  ├─ NO → ALLOW
│  └─ YES → continue
│
├─ Have explicit consent? (allow_external_ai=true)
│  ├─ YES → ALLOW
│  └─ NO → continue
│
├─ Have BAA with provider? (*_BAA_ENABLED=true)
│  ├─ YES → ALLOW
│  └─ NO → BLOCK (suggest redaction)
```

## How to Use

### For New Cases

1. **Mark privileged cases:**
```sql
UPDATE cases 
SET is_privileged = true, 
    privilege_notes = 'Attorney work product - trial prep',
    allow_external_ai = false
WHERE id = 'case-id';
```

2. **Set PHI level:**
```sql
UPDATE cases 
SET phi_level = 'high'  -- 'none', 'low', or 'high'
WHERE id = 'case-id';
```

3. **For documents:**
```sql
UPDATE documents 
SET is_privileged = true,
    is_attorney_work_product = true,
    phi_level = 'high',
    allow_external_ai = false
WHERE id = 'doc-id';
```

### For Production Deployment

1. **Run the migration:**
```bash
# In Supabase SQL Editor:
\i supabase/migrations/20251111000000_add_privilege_phi_tracking.sql
```

2. **Set environment variables:**
```bash
AI_ALLOW_EXTERNAL_PHI=false
OPENAI_BAA_ENABLED=true  # if you have BAA
```

3. **Mark existing privileged content:**
```sql
-- Example: Mark all legal documents as privileged
UPDATE legal_documents SET is_privileged = true;

-- Example: Mark specific case types as high-PHI
UPDATE cases SET phi_level = 'high' 
WHERE case_type IN ('medical_malpractice', 'personal_injury');
```

4. **Test the guard:**
```bash
curl -X POST http://localhost:3000/api/chronology/process \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"caseId": "privileged-case-id", "documentIds": [...]}'
  
# Should return 403 if case is privileged
```

5. **Review logs regularly:**
```sql
SELECT * FROM ai_processing_log 
WHERE processing_result IN ('blocked_privileged', 'blocked_phi', 'blocked_no_consent')
ORDER BY created_at DESC;
```

## API Error Responses

When AI processing is blocked, you'll get:

```json
{
  "error": "AI processing blocked",
  "reason": "Attorney-client privileged material cannot be sent to external AI providers",
  "requiresHumanReview": true,
  "requiresRedaction": false
}
```

Status code: `403 Forbidden`

## California Demand Service Tracking

New workflow for CA policy-limits demands:

1. **Generate demand** (as usual via `/api/demand-letter/generate`)

2. **Record service:**
```sql
INSERT INTO demand_service (
  case_id,
  legal_document_id,
  served_at,
  service_method,
  demand_amount,
  policy_limit_demand,
  time_limited,
  deadline_at,
  carrier_name,
  claim_number
) VALUES (
  'case-id',
  'legal-doc-id',
  NOW(),
  'certified_mail',
  500000.00,
  true,
  true,
  NOW() + INTERVAL '15 days',
  'State Farm',
  'CLM-12345'
);
```

3. **Monitor deadlines:**
```sql
SELECT * FROM active_demands_expiring_soon 
WHERE urgency IN ('critical', 'urgent');
```

4. **Record response:**
```sql
UPDATE demand_service 
SET response_received = true,
    response_at = NOW(),
    response_type = 'acceptance',
    status = 'accepted'
WHERE id = 'demand-service-id';
```

## Migration Path for Existing Codebase

Your partner's code already has:
- ✅ Multiple AI processing endpoints
- ✅ OpenAI integration
- ✅ Redaction helper (stub)
- ✅ Demand letter generator

What was added:
- ✅ Privilege/PHI columns in database
- ✅ Privacy guard middleware
- ✅ Privacy checks in API routes
- ✅ Audit logging
- ✅ CA demand service tracking

What remains (optional):
- Real Westlaw integration (currently stub)
- Real verdict database (currently stub)
- UI for marking documents as privileged
- UI for reviewing AI processing logs
- Automated PHI detection (currently regex-based)

## Compliance Checklist

- [ ] Run database migration
- [ ] Set `AI_ALLOW_EXTERNAL_PHI=false`
- [ ] Verify BAA status with AI providers
- [ ] Mark existing privileged content
- [ ] Train staff on privilege marking
- [ ] Implement regular log review process
- [ ] Document client consent procedures
- [ ] Test privilege blocks
- [ ] Test PHI blocks
- [ ] Test audit trail completeness

## Support

For questions about:
- **Legal requirements**: Consult your jurisdiction's ethics rules on AI and privilege
- **HIPAA compliance**: Consult HIPAA counsel and review BAAs with AI providers
- **Technical implementation**: Review this guide and `src/lib/ai-privacy-guard.ts`

## Related Files

- `supabase/migrations/20251111000000_add_privilege_phi_tracking.sql` - Database schema
- `src/lib/ai-privacy-guard.ts` - Core privacy guard logic
- `src/lib/medical-extractor.ts` - Example of guarded AI function
- `ENV_CONFIG.md` - Environment variable guide
- `src/app/api/chronology/process/route.ts` - Example guarded route
- `src/app/api/demand-letter/generate/route.ts` - Example guarded route
- `src/app/api/narrative/generate/route.ts` - Example guarded route
- `src/app/api/deposition/process/route.ts` - Example guarded route

