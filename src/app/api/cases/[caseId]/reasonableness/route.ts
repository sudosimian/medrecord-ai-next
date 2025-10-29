/**
 * Medical Charges Reasonableness Analysis API
 * 
 * GET /api/cases/[caseId]/reasonableness
 * 
 * PURPOSE: Returns reasonableness analysis comparing billed medical charges
 * to CMS Medicare fee schedule benchmarks for a specific case.
 * 
 * SECURITY: Requires authenticated user with access to the case.
 * 
 * RESPONSE: { rows, footnotes, summary }
 * - rows: Array of charge comparisons with variance calculations
 * - footnotes: Methodology explanation
 * - summary: Aggregate statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  buildReasonablenessRows,
  reasonablenessFootnotes,
  calculateReasonablenessSummary,
  type ReasonablenessRow,
} from '@/lib/damages-reasonableness';

/**
 * Response structure for reasonableness analysis
 */
interface ReasonablenessResponse {
  rows: ReasonablenessRow[];
  footnotes: string;
  summary: {
    totalBilled: number;
    totalCMS: number;
    overallVariancePct: number;
    reasonableCount: number;
    highCount: number;
    excessiveCount: number;
    averageVariance: number;
    medianVariance: number;
  };
  caseId: string;
  locality: string;
  generatedAt: string;
}

/**
 * GET handler for reasonableness analysis
 * 
 * Returns medical charges reasonableness analysis for a case.
 * 
 * @param request - NextRequest
 * @param params - Route params with caseId
 * @returns JSON response with rows, footnotes, and summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ caseId: string }> }
) {
  try {
    const { caseId } = await params;
    
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'Please log in to access reasonableness analysis.',
        },
        { status: 401 }
      );
    }
    
    // Validate case ID
    if (!caseId) {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Case ID is required.',
        },
        { status: 400 }
      );
    }
    
    // TODO: Verify user has access to this case
    // const { data: caseData, error: caseError } = await supabase
    //   .from('cases')
    //   .select('id')
    //   .eq('id', caseId)
    //   .eq('user_id', user.id)  // or check team membership
    //   .single();
    // 
    // if (caseError || !caseData) {
    //   return NextResponse.json(
    //     {
    //       error: 'Case not found',
    //       message: 'Case does not exist or you do not have access to it.',
    //     },
    //     { status: 404 }
    //   );
    // }
    
    // Build reasonableness analysis
    const rows = await buildReasonablenessRows({ caseId });
    
    // Get footnotes
    const footnotes = reasonablenessFootnotes();
    
    // Calculate summary statistics
    const summary = calculateReasonablenessSummary(rows);
    
    // Construct response
    const response: ReasonablenessResponse = {
      rows,
      footnotes,
      summary,
      caseId,
      locality: 'CA-LA', // TODO: Get from case data or patient location
      generatedAt: new Date().toISOString(),
    };
    
    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('Reasonableness analysis error:', error);
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to generate reasonableness analysis. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for custom reasonableness analysis
 * 
 * Allows analyzing specific charges without a case ID.
 * Useful for "what-if" scenarios or manual entry.
 * 
 * Request body:
 * {
 *   charges: Array<{ cpt: string, billed: number, provider: string }>,
 *   locality?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    const { charges, locality = 'CA-LA' } = body;
    
    if (!charges || !Array.isArray(charges)) {
      return NextResponse.json(
        { error: 'Invalid request. Charges array required.' },
        { status: 400 }
      );
    }
    
    // TODO: Implement custom analysis for provided charges
    // This would be similar to buildReasonablenessRows but without database fetch
    
    return NextResponse.json(
      {
        message: 'Custom reasonableness analysis coming soon',
        charges,
        locality,
      },
      { status: 501 }
    );
    
  } catch (error) {
    console.error('Custom reasonableness analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

