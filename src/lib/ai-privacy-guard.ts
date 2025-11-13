/**
 * AI PRIVACY GUARD
 * 
 * Purpose: Enforce attorney-client privilege and HIPAA PHI boundaries
 *          before sending data to external AI providers.
 * 
 * This module prevents privileged or high-PHI content from being sent
 * to external LLMs (OpenAI, Anthropic, etc.) without explicit consent
 * and proper safeguards.
 */

import { createClient } from '@/lib/supabase-server';

export type PHILevel = 'none' | 'low' | 'high';
export type AIProvider = 'openai' | 'azure_openai' | 'anthropic' | 'internal' | 'none';
export type ProcessingType = 
  | 'ocr'
  | 'extraction'
  | 'chronology'
  | 'billing'
  | 'narrative'
  | 'demand_letter'
  | 'deposition_summary'
  | 'redaction_detection';

export interface AIProcessingRequest {
  caseId: string;
  documentId?: string;
  processingType: ProcessingType;
  aiProvider: AIProvider;
  modelUsed?: string;
  textToProcess?: string;
}

export interface AIProcessingResult {
  allowed: boolean;
  reason?: string;
  requiresRedaction: boolean;
  requiresHumanReview: boolean;
  logId?: string;
  redactedText?: string;
}

/**
 * Check if AI processing is allowed for the given request
 */
export async function checkAIProcessingAllowed(
  request: AIProcessingRequest,
  userId: string
): Promise<AIProcessingResult> {
  const supabase = await createClient();
  
  // Get case privacy settings
  const { data: caseData, error: caseError } = await supabase
    .from('cases')
    .select('is_privileged, phi_level, allow_external_ai')
    .eq('id', request.caseId)
    .single();

  if (caseError || !caseData) {
    return {
      allowed: false,
      reason: 'Case not found or access denied',
      requiresRedaction: false,
      requiresHumanReview: true,
    };
  }

  let documentPrivileged = false;
  let documentPHILevel: PHILevel = 'high';
  let documentAllowAI = false;

  // If document-specific, check document privacy settings
  if (request.documentId) {
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .select('is_privileged, is_attorney_work_product, phi_level, allow_external_ai, redaction_status')
      .eq('id', request.documentId)
      .single();

    if (docError || !docData) {
      return {
        allowed: false,
        reason: 'Document not found or access denied',
        requiresRedaction: false,
        requiresHumanReview: true,
      };
    }

    documentPrivileged = docData.is_privileged || docData.is_attorney_work_product;
    documentPHILevel = docData.phi_level as PHILevel;
    documentAllowAI = docData.allow_external_ai;
  }

  // Determine if external AI is being used
  const isExternalAI = request.aiProvider === 'openai' || 
                       request.aiProvider === 'anthropic' ||
                       request.aiProvider === 'azure_openai';

  // Check HIPAA mode from environment
  const hipaaStrictMode = process.env.AI_ALLOW_EXTERNAL_PHI !== 'true';
  
  // Decision tree for AI processing
  let allowed = true;
  let reason = '';
  let requiresRedaction = false;
  let requiresHumanReview = false;

  // Rule 1: Privileged content cannot go to external AI
  if ((caseData.is_privileged || documentPrivileged) && isExternalAI) {
    allowed = false;
    reason = 'Attorney-client privileged material cannot be sent to external AI providers';
    requiresHumanReview = true;
  }
  
  // Rule 2: High PHI in HIPAA strict mode requires consent or redaction
  else if (hipaaStrictMode && isExternalAI) {
    const phiLevel = documentPHILevel || caseData.phi_level;
    const hasConsent = documentAllowAI || caseData.allow_external_ai;
    
    if (phiLevel === 'high' && !hasConsent) {
      // Check if we have BAA with the provider
      const hasBAA = checkBAA(request.aiProvider);
      
      if (!hasBAA) {
        allowed = false;
        reason = 'High PHI content requires BAA or explicit consent for external AI processing';
        requiresRedaction = true;
        requiresHumanReview = false; // Can be auto-processed after redaction
      }
    }
  }

  // Rule 3: If allowed but contains PHI, recommend redaction
  else if (isExternalAI && (documentPHILevel === 'high' || caseData.phi_level === 'high')) {
    requiresRedaction = true; // Recommend but don't block
  }

  // Log the decision
  const logId = await logAIProcessing(
    supabase,
    {
      ...request,
      userId,
      wasPrivileged: caseData.is_privileged || documentPrivileged,
      phiLevel: documentPHILevel || caseData.phi_level,
      externalAIConsent: documentAllowAI || caseData.allow_external_ai,
      processingResult: allowed ? 'success' : 
                       requiresHumanReview ? 'blocked_privileged' :
                       requiresRedaction ? 'blocked_phi' : 'blocked_no_consent',
    }
  );

  return {
    allowed,
    reason,
    requiresRedaction,
    requiresHumanReview,
    logId,
  };
}

/**
 * Apply automatic PHI redaction to text before AI processing
 */
export async function redactPHIForAI(
  text: string,
  documentId?: string
): Promise<{ redacted: string; redactions: number }> {
  // Import the existing redaction helper
  const { detectSensitiveInfo } = await import('./redaction');
  
  // Detect sensitive patterns
  const sensitiveInfo = await detectSensitiveInfo(text);
  
  let redacted = text;
  let redactionCount = 0;

  // Replace SSNs
  for (const ssn of sensitiveInfo.ssns) {
    redacted = redacted.replace(ssn, '[SSN REDACTED]');
    redactionCount++;
  }

  // Replace DOBs
  for (const dob of sensitiveInfo.datesOfBirth) {
    redacted = redacted.replace(dob, '[DATE REDACTED]');
    redactionCount++;
  }

  // Replace MRNs
  for (const mrn of sensitiveInfo.medicalRecordNumbers) {
    redacted = redacted.replace(mrn, '[MRN REDACTED]');
    redactionCount++;
  }

  // Replace phone numbers
  for (const phone of sensitiveInfo.phoneNumbers) {
    redacted = redacted.replace(phone, '[PHONE REDACTED]');
    redactionCount++;
  }

  return {
    redacted,
    redactions: redactionCount,
  };
}

/**
 * Wrapper for OpenAI calls that enforces privacy guard
 */
export async function callAIWithPrivacyGuard(
  request: AIProcessingRequest & { userId: string },
  aiFunction: (text: string) => Promise<any>
): Promise<{ success: boolean; result?: any; error?: string }> {
  
  // Check if processing is allowed
  const guard = await checkAIProcessingAllowed(request, request.userId);
  
  if (!guard.allowed) {
    return {
      success: false,
      error: guard.reason || 'AI processing not allowed for this content',
    };
  }

  // Apply redaction if required
  let textToProcess = request.textToProcess || '';
  
  if (guard.requiresRedaction && textToProcess) {
    const { redacted } = await redactPHIForAI(textToProcess, request.documentId);
    textToProcess = redacted;
  }

  // Call the AI function
  try {
    const result = await aiFunction(textToProcess);
    
    // Log success
    if (guard.logId) {
      const supabase = await createClient();
      await supabase
        .from('ai_processing_log')
        .update({ 
          processing_result: 'success',
          tokens_used: result.usage?.total_tokens,
        })
        .eq('id', guard.logId);
    }
    
    return {
      success: true,
      result,
    };
  } catch (error) {
    // Log failure
    if (guard.logId) {
      const supabase = await createClient();
      await supabase
        .from('ai_processing_log')
        .update({ 
          processing_result: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', guard.logId);
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'AI processing failed',
    };
  }
}

/**
 * Check if we have a BAA with the AI provider
 */
function checkBAA(provider: AIProvider): boolean {
  // In production, this would check against a configuration/database
  // For now, check environment variables
  switch (provider) {
    case 'openai':
      return process.env.OPENAI_BAA_ENABLED === 'true';
    case 'azure_openai':
      return process.env.AZURE_OPENAI_BAA_ENABLED === 'true';
    case 'anthropic':
      return process.env.ANTHROPIC_BAA_ENABLED === 'true';
    case 'internal':
      return true; // Internal models are always compliant
    default:
      return false;
  }
}

/**
 * Log AI processing attempt to compliance audit trail
 */
async function logAIProcessing(
  supabase: any,
  params: {
    caseId: string;
    documentId?: string;
    userId: string;
    processingType: ProcessingType;
    aiProvider: AIProvider;
    modelUsed?: string;
    wasPrivileged: boolean;
    phiLevel: PHILevel;
    externalAIConsent: boolean;
    processingResult: string;
  }
): Promise<string> {
  const { data, error } = await supabase
    .from('ai_processing_log')
    .insert({
      case_id: params.caseId,
      document_id: params.documentId,
      user_id: params.userId,
      processing_type: params.processingType,
      ai_provider: params.aiProvider,
      model_used: params.modelUsed || 'unknown',
      was_privileged: params.wasPrivileged,
      phi_level: params.phiLevel,
      was_redacted: false, // Updated later if redaction applied
      external_ai_consent: params.externalAIConsent,
      processing_result: params.processingResult,
    })
    .select('id')
    .single();

  return data?.id || '';
}

/**
 * Get AI processing history for a case (for attorney review)
 */
export async function getAIProcessingHistory(caseId: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('ai_processing_log')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching AI processing history:', error);
    return [];
  }

  return data || [];
}

/**
 * Compliance report: Find any potentially improper AI processing
 */
export async function getComplianceReport(userId: string) {
  const supabase = await createClient();
  
  // Find cases where privileged content was sent to external AI
  const { data: violations, error } = await supabase
    .from('ai_processing_log')
    .select('*, cases(case_number, patient_id)')
    .eq('user_id', userId)
    .in('processing_result', ['blocked_privileged', 'blocked_phi', 'blocked_no_consent'])
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching compliance report:', error);
    return { violations: [], summary: {} };
  }

  // Summarize
  const summary = {
    totalViolations: violations?.length || 0,
    privilegedBlocked: violations?.filter(v => v.processing_result === 'blocked_privileged').length || 0,
    phiBlocked: violations?.filter(v => v.processing_result === 'blocked_phi').length || 0,
    noConsentBlocked: violations?.filter(v => v.processing_result === 'blocked_no_consent').length || 0,
  };

  return { violations: violations || [], summary };
}

