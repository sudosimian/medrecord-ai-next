# Environment Configuration for HIPAA Compliance

## Required Environment Variables

Add these to your `.env.local` file:

### HIPAA / Privacy Compliance

```bash
# Set to 'true' to allow external AI processing of PHI (requires BAA)
# Set to 'false' for strict HIPAA mode (blocks external AI on high PHI)
AI_ALLOW_EXTERNAL_PHI=false

# BAA (Business Associate Agreement) status with AI providers
# Set to 'true' only if you have signed BAA with the provider
OPENAI_BAA_ENABLED=false
AZURE_OPENAI_BAA_ENABLED=false
ANTHROPIC_BAA_ENABLED=false
```

### AI Provider Configuration

```bash
# OpenAI (default)
OPENAI_API_KEY=your_openai_api_key

# Azure OpenAI (recommended for enterprise HIPAA compliance)
# AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
# AZURE_OPENAI_API_KEY=your_azure_openai_key
# AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o

# Anthropic Claude (alternative)
# ANTHROPIC_API_KEY=your_anthropic_api_key
```

### Legal Research (Optional)

```bash
# WestLaw API credentials
# WESTLAW_API_KEY=your_westlaw_key
# WESTLAW_CLIENT_ID=your_westlaw_client_id

# VerdictSearch / Jury Verdict Database
# VERDICT_SEARCH_API_KEY=your_verdict_search_key
```

## Privacy Modes Explained

### Strict HIPAA Mode (Recommended for Real Client Data)

```bash
AI_ALLOW_EXTERNAL_PHI=false
OPENAI_BAA_ENABLED=false
```

**Behavior:**
- Documents with `phi_level='high'` will NOT be sent to external AI
- Documents marked `is_privileged=true` will NOT be sent to external AI
- Processing blocked with error: "High PHI content requires BAA or explicit consent"
- User must manually review or mark documents as `allow_external_ai=true`

### Permissive Mode (Demo/Testing Only)

```bash
AI_ALLOW_EXTERNAL_PHI=true
```

**Behavior:**
- PHI will be automatically redacted before sending to external AI
- Privileged documents are still blocked
- Only use in demo/development environments

### BAA-Protected Mode (Production with Signed BAA)

```bash
AI_ALLOW_EXTERNAL_PHI=false
OPENAI_BAA_ENABLED=true  # or AZURE_OPENAI_BAA_ENABLED=true
```

**Behavior:**
- PHI can be sent to external AI because you have a signed BAA
- All processing is logged in `ai_processing_log` table
- Privileged documents are still blocked unless explicitly allowed

## Attorney-Client Privilege Protection

**Regardless of HIPAA settings, these rules ALWAYS apply:**

1. **Privileged documents are blocked from external AI**
   - Documents with `is_privileged=true` cannot be sent to OpenAI/Anthropic
   - Documents with `is_attorney_work_product=true` cannot be sent externally
   - Cases marked `is_privileged=true` block ALL AI processing on that case

2. **Audit trail is required**
   - Every AI processing attempt is logged in `ai_processing_log`
   - Includes: what was processed, where it went, privacy flags, result
   - Use `/api/ai-processing-log?caseId=XXX` to review

3. **Explicit consent required**
   - For privileged content, user must explicitly set `allow_external_ai=true`
   - This should only be done with client consent and documented approval

## Production Deployment Checklist

- [ ] Set `AI_ALLOW_EXTERNAL_PHI=false`
- [ ] Verify you have signed BAA with your AI provider
- [ ] Set appropriate `*_BAA_ENABLED=true` flag
- [ ] Run migration to add privilege/PHI columns: `20251111000000_add_privilege_phi_tracking.sql`
- [ ] Review all cases and mark privileged ones with `is_privileged=true`
- [ ] Train staff on when to mark documents as privileged
- [ ] Implement regular review of `ai_processing_log` table
- [ ] Consider Azure OpenAI in your own tenant for maximum data control

## Testing Privacy Controls

### Test 1: Block privileged document

```sql
UPDATE documents SET is_privileged = true WHERE id = 'test-doc-id';
```

Try to process → should get error "Attorney-client privileged material cannot be sent to external AI"

### Test 2: Block high PHI without BAA

```sql
UPDATE documents SET phi_level = 'high', allow_external_ai = false WHERE id = 'test-doc-id';
```

With `AI_ALLOW_EXTERNAL_PHI=false` and `OPENAI_BAA_ENABLED=false`:
Try to process → should get error "High PHI content requires BAA or explicit consent"

### Test 3: Allow with consent

```sql
UPDATE documents SET allow_external_ai = true WHERE id = 'test-doc-id';
```

Should now process successfully (with automatic redaction)

### Test 4: Check audit log

```sql
SELECT * FROM ai_processing_log 
WHERE case_id = 'your-case-id' 
ORDER BY created_at DESC;
```

Should see all processing attempts, their results, and privacy flags.

