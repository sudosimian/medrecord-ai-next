/**
 * Demand Pack Validation API Route
 * 
 * POST /api/demand/validate
 * 
 * PURPOSE: Validates jurisdiction-specific demand letters to ensure all required
 * legal elements are present before demand is finalized and served.
 * 
 * LEGAL CONTEXT:
 * - Prevents sending deficient demands that could be rejected by carriers
 * - Ensures compliance with state-specific bad faith and settlement offer requirements
 * - Provides proof-of-service checklist for proper documentation
 * 
 * SECURITY: Requires authenticated user (Supabase auth)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { validateDemandPack } from '@/legal/validator';
import { buildCAProofOfServiceChecklist } from '@/legal/ca/demand-pack';

/**
 * Request body interface
 */
interface ValidateRequest {
  state: string;
  sections: Record<string, string>;
  caseData?: {
    insuranceCompany?: string;
    claimNumber?: string;
    adjusterName?: string;
    insuredName?: string;
    plaintiffName?: string;
  };
}

/**
 * Response interface
 */
interface ValidateResponse {
  ok: boolean;
  missing: string[];
  warnings?: string[];
  checklist?: Array<{
    item: string;
    required: boolean;
    description: string;
  }>;
  message?: string;
}

/**
 * POST handler for demand validation
 * 
 * Validates that all jurisdiction-specific required sections are present
 * and returns a proof-of-service checklist for the attorney/staff.
 * 
 * @param request - NextRequest with JSON body { state, sections, caseData? }
 * @returns JSON response with validation results and checklist
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          ok: false, 
          missing: [],
          message: 'Authentication required. Please log in to validate demand packs.' 
        },
        { status: 401 }
      );
    }

    // Parse request body
    const body: ValidateRequest = await request.json();
    
    // Validate request structure
    if (!body.state) {
      return NextResponse.json(
        {
          ok: false,
          missing: [],
          message: 'State jurisdiction is required for validation.'
        },
        { status: 400 }
      );
    }
    
    if (!body.sections || typeof body.sections !== 'object') {
      return NextResponse.json(
        {
          ok: false,
          missing: [],
          message: 'Sections object is required with section names as keys and content as values.'
        },
        { status: 400 }
      );
    }

    // Perform validation
    const validationResult = validateDemandPack({
      state: body.state,
      filledSections: body.sections
    });

    // Build state-specific checklist
    let checklist: ValidateResponse['checklist'];
    
    if (body.state.toUpperCase() === 'CA') {
      // California proof of service checklist
      checklist = buildCAProofOfServiceChecklist({
        insuranceCompany: body.caseData?.insuranceCompany,
        claimNumber: body.caseData?.claimNumber,
        adjusterName: body.caseData?.adjusterName,
        insuredName: body.caseData?.insuredName
      });
    } else {
      // Generic checklist for other states (can be expanded)
      checklist = [
        {
          item: 'Service Method Documented',
          required: true,
          description: 'Document method of service (certified mail, personal service, etc.)'
        },
        {
          item: 'Service Date Recorded',
          required: true,
          description: 'Record exact date and time demand was served'
        },
        {
          item: 'Proof of Delivery Obtained',
          required: true,
          description: 'Obtain confirmation of delivery and signature if applicable'
        }
      ];
    }

    // Construct response
    const response: ValidateResponse = {
      ok: validationResult.ok,
      missing: validationResult.missing,
      warnings: validationResult.warnings,
      checklist,
      message: validationResult.ok 
        ? 'Demand pack validation successful. All required sections present.'
        : `Demand pack incomplete. Missing ${validationResult.missing.length} required section(s).`
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Demand validation error:', error);
    
    return NextResponse.json(
      {
        ok: false,
        missing: [],
        message: 'Internal server error during validation. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - returns validation requirements for a state
 * 
 * Query params: ?state=CA
 * 
 * Returns list of required sections for the specified jurisdiction
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get state from query params
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state');

    if (!state) {
      return NextResponse.json(
        { message: 'State parameter required' },
        { status: 400 }
      );
    }

    // Import required elements dynamically based on state
    let requiredElements: readonly string[] = [];
    let description = '';

    if (state.toUpperCase() === 'CA') {
      const { CA_REQUIRED_ELEMENTS } = await import('@/legal/ca/demand-pack');
      requiredElements = CA_REQUIRED_ELEMENTS;
      description = 'California policy limits demand requirements include time-limited offers, policy disclosure requests, and proof of service documentation to establish bad faith timeline.';
    } else {
      description = `No specific validation requirements defined for ${state}. Standard demand letter best practices apply.`;
    }

    return NextResponse.json({
      state: state.toUpperCase(),
      requiredElements: Array.from(requiredElements),
      description,
      supported: requiredElements.length > 0
    });

  } catch (error) {
    console.error('Error fetching validation requirements:', error);
    return NextResponse.json(
      { 
        message: 'Error fetching requirements',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

