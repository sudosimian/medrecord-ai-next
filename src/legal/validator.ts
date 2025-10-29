/**
 * Legal Demand Pack Validator
 * 
 * PURPOSE: Ensures jurisdiction-specific demand letters meet all legal requirements
 * before being sent to opposing counsel or insurance carriers.
 * 
 * EXTENSIBILITY: Designed to support multiple jurisdictions (CA, NY, TX, etc.)
 * by allowing state-specific validation rules while maintaining consistent interface.
 */

import { CA_REQUIRED_ELEMENTS, type CARequiredElement } from './ca/demand-pack';

/**
 * Validation result structure
 */
export interface ValidationResult {
  ok: boolean;
  missing: string[];
  warnings?: string[];
}

/**
 * Input structure for demand pack validation
 */
export interface DemandPackInput {
  state: string;
  filledSections: Record<string, string>;
}

/**
 * Validates a demand pack meets jurisdiction-specific requirements
 * 
 * LEGAL PURPOSE:
 * - Ensures all mandatory sections are present before sending demand
 * - Prevents deficient demands that could be rejected or deemed ambiguous
 * - Reduces malpractice risk by catching missing elements before service
 * 
 * CALIFORNIA-SPECIFIC:
 * - Validates presence of all CA_REQUIRED_ELEMENTS
 * - Checks that sections are not just present but contain substantive content
 * - Returns specific missing elements for attorney review
 * 
 * FUTURE STATES:
 * - Add NY validation (different bad faith standards)
 * - Add TX validation (proportionate responsibility considerations)
 * - Add FL validation (PIP implications)
 * 
 * @param input - Object containing state code and filled sections
 * @returns ValidationResult with ok status and array of missing required elements
 * 
 * @example
 * ```typescript
 * const result = validateDemandPack({
 *   state: 'CA',
 *   filledSections: {
 *     policy_limits_demand: '... content ...',
 *     liability: '... content ...'
 *     // missing other required sections
 *   }
 * });
 * // result.ok === false
 * // result.missing === ['deadline_language', 'proof_of_service', ...]
 * ```
 */
export function validateDemandPack(input: DemandPackInput): ValidationResult {
  const { state, filledSections } = input;
  
  // Normalize state to uppercase
  const normalizedState = state?.toUpperCase();
  
  // Handle California validation
  if (normalizedState === 'CA') {
    return validateCaliforniaDemand(filledSections);
  }
  
  // Future state validations would go here
  // if (normalizedState === 'NY') {
  //   return validateNewYorkDemand(filledSections);
  // }
  // if (normalizedState === 'TX') {
  //   return validateTexasDemand(filledSections);
  // }
  
  // Unknown state - provide warning but allow to proceed
  return {
    ok: true,
    missing: [],
    warnings: [`No specific validation rules defined for state: ${state}. Please manually verify demand completeness.`]
  };
}

/**
 * Validates California-specific demand requirements
 * 
 * CA LEGAL REQUIREMENTS:
 * 1. Clear policy limits demand with specific dollar amount
 * 2. Definite deadline (triggers bad faith duties)
 * 3. Proof of service documentation (establishes timeline)
 * 4. Policy disclosure request (ensures all coverage known)
 * 5. Damages summary showing value exceeds limits
 * 6. Liability analysis showing clear basis for coverage
 * 
 * @param filledSections - Record of section keys to their content
 * @returns ValidationResult
 */
function validateCaliforniaDemand(filledSections: Record<string, string>): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  
  // Check each required element
  for (const element of CA_REQUIRED_ELEMENTS) {
    const content = filledSections[element];
    
    // Check if section exists
    if (!content) {
      missing.push(element);
      continue;
    }
    
    // Check if section has substantive content (not just whitespace or placeholder)
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      missing.push(element);
      continue;
    }
    
    // Check for common placeholder patterns that indicate unfilled template
    const hasUnfilledPlaceholders = /\{\{[^}]+\}\}/g.test(trimmedContent);
    if (hasUnfilledPlaceholders) {
      warnings.push(`Section "${element}" contains unfilled placeholders ({{...}}). Please complete all required fields.`);
    }
    
    // Section-specific validations
    if (element === 'policy_limits_demand') {
      // Should contain dollar amount
      if (!/\$[\d,]+/.test(trimmedContent)) {
        warnings.push(`"policy_limits_demand" should specify a dollar amount for the demand.`);
      }
    }
    
    if (element === 'deadline_language') {
      // Should contain a specific date or deadline
      if (!/deadline|expire|expiration/i.test(trimmedContent)) {
        warnings.push(`"deadline_language" should include clear expiration deadline.`);
      }
    }
    
    if (element === 'proof_of_service') {
      // Should contain service details
      if (!/service|mailed|delivered|sent/i.test(trimmedContent)) {
        warnings.push(`"proof_of_service" should document method and date of service.`);
      }
    }
  }
  
  // Additional California-specific checks
  
  // Recommend including bad_faith_notice (not required but strongly advised)
  if (!filledSections['bad_faith_notice'] || filledSections['bad_faith_notice'].trim().length === 0) {
    warnings.push('Consider including "bad_faith_notice" section to document carrier obligations and preserve insured rights.');
  }
  
  // Recommend medical summary for injury cases
  if (!filledSections['medical_summary'] || filledSections['medical_summary'].trim().length === 0) {
    warnings.push('Consider including "medical_summary" to demonstrate injury severity and damages basis.');
  }
  
  return {
    ok: missing.length === 0,
    missing,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Helper function to format validation results for display
 * 
 * @param result - ValidationResult from validateDemandPack
 * @returns Human-readable summary string
 */
export function formatValidationResult(result: ValidationResult): string {
  if (result.ok) {
    let message = '✓ Demand pack validation passed. All required sections present.';
    if (result.warnings && result.warnings.length > 0) {
      message += '\n\nWarnings:\n' + result.warnings.map(w => `• ${w}`).join('\n');
    }
    return message;
  }
  
  let message = '✗ Demand pack validation failed.\n\n';
  message += `Missing required sections (${result.missing.length}):\n`;
  message += result.missing.map(m => `• ${m}`).join('\n');
  
  if (result.warnings && result.warnings.length > 0) {
    message += '\n\nAdditional warnings:\n' + result.warnings.map(w => `• ${w}`).join('\n');
  }
  
  return message;
}

/**
 * Type guard to check if a state is supported for validation
 */
export function isSupportedState(state: string): boolean {
  const supported = ['CA']; // Add more as implemented
  return supported.includes(state.toUpperCase());
}

/**
 * Gets list of required elements for a given state
 * Returns empty array if state not supported or has no specific requirements
 */
export function getRequiredElements(state: string): readonly string[] {
  const normalizedState = state?.toUpperCase();
  
  if (normalizedState === 'CA') {
    return CA_REQUIRED_ELEMENTS;
  }
  
  // Future states would return their required elements here
  
  return [];
}

