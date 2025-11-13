-- ============================================================
-- PRIVILEGE & PHI PROTECTION LAYER
-- Purpose: Add attorney-client privilege and HIPAA PHI tracking
--          to prevent unauthorized external AI processing
-- ============================================================

-- Add privilege and PHI columns to cases
ALTER TABLE public.cases
  ADD COLUMN IF NOT EXISTS is_privileged BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS privilege_notes TEXT,
  ADD COLUMN IF NOT EXISTS phi_level TEXT DEFAULT 'high' CHECK (phi_level IN ('none', 'low', 'high')),
  ADD COLUMN IF NOT EXISTS allow_external_ai BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.cases.is_privileged IS 'Attorney-client privileged case - restrict external AI';
COMMENT ON COLUMN public.cases.phi_level IS 'PHI sensitivity: none (de-identified), low (limited), high (full PHI)';
COMMENT ON COLUMN public.cases.allow_external_ai IS 'Explicit consent to use external AI (OpenAI, etc.) - requires BAA';

-- Add privilege and PHI columns to documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS is_privileged BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_attorney_work_product BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS phi_level TEXT DEFAULT 'high' CHECK (phi_level IN ('none', 'low', 'high')),
  ADD COLUMN IF NOT EXISTS allow_external_ai BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS redaction_status TEXT DEFAULT 'pending' CHECK (redaction_status IN ('pending', 'in_progress', 'completed', 'not_required'));

COMMENT ON COLUMN public.documents.is_privileged IS 'Attorney-client privileged document';
COMMENT ON COLUMN public.documents.is_attorney_work_product IS 'Attorney work product - additional protection';
COMMENT ON COLUMN public.documents.phi_level IS 'PHI sensitivity level for HIPAA compliance';
COMMENT ON COLUMN public.documents.allow_external_ai IS 'Explicit consent for external AI processing';
COMMENT ON COLUMN public.documents.redaction_status IS 'Status of PHI redaction for external processing';

-- Add privilege tracking to legal documents
ALTER TABLE public.legal_documents
  ADD COLUMN IF NOT EXISTS is_privileged BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_attorney_work_product BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_external_ai BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
  ADD COLUMN IF NOT EXISTS review_role TEXT CHECK (review_role IN ('paralegal', 'attorney_us', 'attorney_state'));

COMMENT ON COLUMN public.legal_documents.is_privileged IS 'Legal documents are privileged by default';
COMMENT ON COLUMN public.legal_documents.is_attorney_work_product IS 'Work product protection';
COMMENT ON COLUMN public.legal_documents.review_role IS 'Level of review required/completed';

-- Add indexes for privilege/PHI queries
CREATE INDEX IF NOT EXISTS idx_documents_privileged ON public.documents(is_privileged) WHERE is_privileged = true;
CREATE INDEX IF NOT EXISTS idx_documents_phi_level ON public.documents(phi_level);
CREATE INDEX IF NOT EXISTS idx_documents_redaction_status ON public.documents(redaction_status);
CREATE INDEX IF NOT EXISTS idx_cases_privileged ON public.cases(is_privileged) WHERE is_privileged = true;
CREATE INDEX IF NOT EXISTS idx_cases_allow_external_ai ON public.cases(allow_external_ai);

-- ============================================================
-- DEMAND SERVICE TRACKING
-- Purpose: Track California policy-limits demand service,
--          deadlines, and carrier responses
-- ============================================================

CREATE TABLE IF NOT EXISTS public.demand_service (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  legal_document_id UUID REFERENCES public.legal_documents(id) ON DELETE SET NULL,
  
  -- Service details
  served_at TIMESTAMPTZ NOT NULL,
  service_method TEXT NOT NULL CHECK (service_method IN (
    'certified_mail',
    'email',
    'personal_service',
    'fax',
    'overnight_courier'
  )),
  service_address TEXT,
  tracking_number TEXT,
  
  -- Demand specifics
  demand_amount NUMERIC(12,2),
  policy_limit_demand BOOLEAN DEFAULT false,
  time_limited BOOLEAN DEFAULT false,
  deadline_at TIMESTAMPTZ,
  deadline_timezone TEXT DEFAULT 'America/Los_Angeles',
  
  -- Parties
  carrier_name TEXT,
  adjuster_name TEXT,
  adjuster_email TEXT,
  adjuster_phone TEXT,
  claim_number TEXT,
  policy_number TEXT,
  
  -- Response tracking
  response_received BOOLEAN DEFAULT false,
  response_at TIMESTAMPTZ,
  response_type TEXT CHECK (response_type IN (
    'acceptance',
    'counter_offer',
    'rejection',
    'request_extension',
    'request_more_info'
  )),
  response_amount NUMERIC(12,2),
  response_notes TEXT,
  
  -- Bad-faith tracking (CA specific)
  bad_faith_language_included BOOLEAN DEFAULT false,
  policy_disclosure_requested BOOLEAN DEFAULT false,
  policy_disclosure_received BOOLEAN DEFAULT false,
  
  -- Status
  status TEXT DEFAULT 'sent' CHECK (status IN (
    'sent',
    'delivered',
    'pending_response',
    'responded',
    'accepted',
    'rejected',
    'expired',
    'withdrawn'
  )),
  
  -- Proof of service
  proof_of_service_path TEXT,
  proof_verified BOOLEAN DEFAULT false,
  
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.demand_service IS 'Track CA policy-limits demand service, deadlines, and responses for bad-faith leverage';

-- RLS for demand_service
ALTER TABLE public.demand_service ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own demand service records"
  ON public.demand_service FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = demand_service.case_id 
    AND cases.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own demand service records"
  ON public.demand_service FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = case_id 
    AND cases.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own demand service records"
  ON public.demand_service FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = demand_service.case_id 
    AND cases.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own demand service records"
  ON public.demand_service FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.cases 
    WHERE cases.id = demand_service.case_id 
    AND cases.user_id = auth.uid()
  ));

-- Indexes for demand service
CREATE INDEX idx_demand_service_case_id ON public.demand_service(case_id);
CREATE INDEX idx_demand_service_deadline ON public.demand_service(deadline_at) WHERE deadline_at IS NOT NULL;
CREATE INDEX idx_demand_service_status ON public.demand_service(status);
CREATE INDEX idx_demand_service_carrier ON public.demand_service(carrier_name);

-- Trigger for updated_at
CREATE TRIGGER update_demand_service_updated_at 
  BEFORE UPDATE ON public.demand_service 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- AI PROCESSING LOG
-- Purpose: Audit trail of all AI processing for compliance
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_processing_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- What was processed
  processing_type TEXT NOT NULL CHECK (processing_type IN (
    'ocr',
    'extraction',
    'chronology',
    'billing',
    'narrative',
    'demand_letter',
    'deposition_summary',
    'redaction_detection'
  )),
  
  -- Where it went
  ai_provider TEXT NOT NULL CHECK (ai_provider IN (
    'openai',
    'azure_openai',
    'anthropic',
    'internal',
    'none'
  )),
  model_used TEXT,
  
  -- Privacy checks
  was_privileged BOOLEAN DEFAULT false,
  phi_level TEXT CHECK (phi_level IN ('none', 'low', 'high')),
  was_redacted BOOLEAN DEFAULT false,
  external_ai_consent BOOLEAN DEFAULT false,
  
  -- Result
  processing_result TEXT CHECK (processing_result IN (
    'success',
    'failed',
    'blocked_privileged',
    'blocked_phi',
    'blocked_no_consent',
    'queued_human_review'
  )),
  error_message TEXT,
  
  tokens_used INTEGER,
  cost_cents INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.ai_processing_log IS 'Compliance audit trail for all AI processing operations';

-- RLS for ai_processing_log
ALTER TABLE public.ai_processing_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI processing logs"
  ON public.ai_processing_log FOR SELECT
  USING (
    user_id = auth.uid() 
    OR 
    EXISTS (
      SELECT 1 FROM public.cases 
      WHERE cases.id = ai_processing_log.case_id 
      AND cases.user_id = auth.uid()
    )
  );

-- Only system/admin can insert logs
CREATE POLICY "System can insert AI processing logs"
  ON public.ai_processing_log FOR INSERT
  WITH CHECK (true);

-- Indexes for ai_processing_log
CREATE INDEX idx_ai_log_case_id ON public.ai_processing_log(case_id);
CREATE INDEX idx_ai_log_document_id ON public.ai_processing_log(document_id);
CREATE INDEX idx_ai_log_user_id ON public.ai_processing_log(user_id);
CREATE INDEX idx_ai_log_result ON public.ai_processing_log(processing_result);
CREATE INDEX idx_ai_log_created_at ON public.ai_processing_log(created_at DESC);

-- ============================================================
-- HELPER VIEWS
-- ============================================================

-- View: Active demands approaching deadline
CREATE OR REPLACE VIEW public.active_demands_expiring_soon AS
SELECT 
  ds.*,
  c.case_number,
  c.patient_id,
  EXTRACT(EPOCH FROM (ds.deadline_at - NOW())) / 3600 AS hours_until_deadline,
  CASE 
    WHEN ds.deadline_at < NOW() THEN 'expired'
    WHEN ds.deadline_at < NOW() + INTERVAL '24 hours' THEN 'critical'
    WHEN ds.deadline_at < NOW() + INTERVAL '72 hours' THEN 'urgent'
    ELSE 'active'
  END AS urgency
FROM public.demand_service ds
JOIN public.cases c ON c.id = ds.case_id
WHERE ds.time_limited = true
  AND ds.status IN ('sent', 'delivered', 'pending_response')
  AND ds.response_received = false
ORDER BY ds.deadline_at ASC;

COMMENT ON VIEW public.active_demands_expiring_soon IS 'Dashboard view for CA time-limited demands needing attention';

