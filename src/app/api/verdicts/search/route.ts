/**
 * Verdict & Settlement Search API
 * 
 * PURPOSE: Provides API endpoint for searching comparable verdicts and settlements
 * to support damages analysis in demand letters.
 * 
 * LEGAL CONTEXT:
 * Attorneys use comparable verdict and settlement data to:
 * 1. Establish reasonable damages expectations in settlement negotiations
 * 2. Demonstrate that their demand is supported by similar case outcomes
 * 3. Provide objective benchmarks for jury awards if case goes to trial
 * 4. Strengthen their position by showing precedent in the jurisdiction
 * 
 * USAGE:
 * GET /api/verdicts/search?state=CA&injuries=cervical%20strain,soft%20tissue
 * 
 * QUERY PARAMETERS:
 * - state (required): State/jurisdiction code (e.g., "CA", "NY")
 * - injuries (required): Comma-separated list of injury types
 * - incidentFacts (optional): Description of incident for context
 * - minAmount (optional): Minimum verdict/settlement amount
 * - maxAmount (optional): Maximum verdict/settlement amount
 * - yearFrom (optional): Earliest year to include
 * - yearTo (optional): Latest year to include
 * - limit (optional): Maximum results to return (default: 10)
 * 
 * RESPONSE:
 * {
 *   items: VerdictItem[],
 *   count: number,
 *   state: string,
 *   injuries: string[],
 *   stats: {
 *     average: number,
 *     median: number,
 *     min: number,
 *     max: number
 *   }
 * }
 * 
 * AUTHENTICATION:
 * Currently requires authenticated Supabase session to prevent abuse.
 * Consider rate limiting for production use.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  findComparableVerdicts,
  calculateAverageAmount,
  calculateMedianAmount,
  type VerdictItem,
  type VerdictSearchParams,
} from '@/lib/verdicts';

/**
 * Response type for verdict search endpoint
 */
interface VerdictSearchResponse {
  items: VerdictItem[];
  count: number;
  state: string;
  injuries: string[];
  stats: {
    average: number;
    median: number;
    min: number;
    max: number;
  };
  message?: string;
}

/**
 * GET /api/verdicts/search
 * 
 * Searches for comparable verdicts and settlements based on injury types and jurisdiction
 * 
 * @example
 * GET /api/verdicts/search?state=CA&injuries=cervical%20strain,herniated%20disc
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to access verdict data.' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    // Required parameters
    const state = searchParams.get('state');
    const injuriesParam = searchParams.get('injuries');
    
    if (!state) {
      return NextResponse.json(
        { error: 'Missing required parameter: state' },
        { status: 400 }
      );
    }
    
    if (!injuriesParam) {
      return NextResponse.json(
        { error: 'Missing required parameter: injuries (comma-separated)' },
        { status: 400 }
      );
    }

    // Parse injuries from CSV
    const injuries = injuriesParam
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    if (injuries.length === 0) {
      return NextResponse.json(
        { error: 'At least one injury type must be specified' },
        { status: 400 }
      );
    }

    // Optional parameters
    const incidentFacts = searchParams.get('incidentFacts') || undefined;
    const minAmount = searchParams.get('minAmount')
      ? parseInt(searchParams.get('minAmount')!, 10)
      : undefined;
    const maxAmount = searchParams.get('maxAmount')
      ? parseInt(searchParams.get('maxAmount')!, 10)
      : undefined;
    const yearFrom = searchParams.get('yearFrom')
      ? parseInt(searchParams.get('yearFrom')!, 10)
      : undefined;
    const yearTo = searchParams.get('yearTo')
      ? parseInt(searchParams.get('yearTo')!, 10)
      : undefined;
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 10;

    // Build search params
    const searchOptions: VerdictSearchParams = {
      state,
      injuries,
      incidentFacts,
      minAmount,
      maxAmount,
      yearFrom,
      yearTo,
      limit,
    };

    // Search for verdicts
    const items = await findComparableVerdicts(searchOptions);

    // Calculate statistics
    const stats = {
      average: calculateAverageAmount(items),
      median: calculateMedianAmount(items),
      min: items.length > 0 ? Math.min(...items.map(v => v.amount)) : 0,
      max: items.length > 0 ? Math.max(...items.map(v => v.amount)) : 0,
    };

    // Build response
    const response: VerdictSearchResponse = {
      items,
      count: items.length,
      state,
      injuries,
      stats,
    };

    // Add informational message if using stub data
    if (items.length > 0) {
      response.message = 'Using stub data. Replace with Westlaw/VerdictSearch API for production.';
    } else {
      response.message = `No comparable verdicts found for ${state} with injuries: ${injuries.join(', ')}`;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('[verdicts/search] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search verdicts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/verdicts/search (alternative method for complex queries)
 * 
 * Accepts JSON body with full VerdictSearchParams
 * 
 * @example
 * POST /api/verdicts/search
 * {
 *   "state": "CA",
 *   "injuries": ["cervical strain", "herniated disc"],
 *   "incidentFacts": "Rear-end collision on highway",
 *   "minAmount": 50000,
 *   "maxAmount": 500000,
 *   "yearFrom": 2018,
 *   "limit": 5
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to access verdict data.' },
        { status: 401 }
      );
    }

    // Parse JSON body
    const body = await request.json();
    const { state, injuries, incidentFacts, minAmount, maxAmount, yearFrom, yearTo, limit } = body;

    // Validate required fields
    if (!state) {
      return NextResponse.json(
        { error: 'Missing required field: state' },
        { status: 400 }
      );
    }

    if (!injuries || !Array.isArray(injuries) || injuries.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid required field: injuries (must be non-empty array)' },
        { status: 400 }
      );
    }

    // Build search params
    const searchOptions: VerdictSearchParams = {
      state,
      injuries,
      incidentFacts,
      minAmount,
      maxAmount,
      yearFrom,
      yearTo,
      limit: limit || 10,
    };

    // Search for verdicts
    const items = await findComparableVerdicts(searchOptions);

    // Calculate statistics
    const stats = {
      average: calculateAverageAmount(items),
      median: calculateMedianAmount(items),
      min: items.length > 0 ? Math.min(...items.map(v => v.amount)) : 0,
      max: items.length > 0 ? Math.max(...items.map(v => v.amount)) : 0,
    };

    // Build response
    const response: VerdictSearchResponse = {
      items,
      count: items.length,
      state,
      injuries,
      stats,
    };

    // Add informational message if using stub data
    if (items.length > 0) {
      response.message = 'Using stub data. Replace with Westlaw/VerdictSearch API for production.';
    } else {
      response.message = `No comparable verdicts found for ${state} with injuries: ${injuries.join(', ')}`;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('[verdicts/search] POST Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to search verdicts',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

