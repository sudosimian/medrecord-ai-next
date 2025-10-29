/**
 * Damages Reasonableness Table Component
 * 
 * PURPOSE: Displays medical charges reasonableness analysis comparing billed
 * amounts to CMS Medicare fee schedule benchmarks.
 * 
 * FEATURES:
 * - Color-coded variance indicators (green/yellow/red)
 * - Sortable columns
 * - Collapsible methodology footnotes
 * - Summary statistics
 * - Export to CSV functionality
 * 
 * USAGE:
 * <DamagesReasonablenessTable caseId="case-123" />
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Info, Download, AlertCircle } from 'lucide-react';
import type { ReasonablenessRow } from '@/lib/damages-reasonableness';

interface DamagesReasonablenessTableProps {
  caseId: string;
}

interface ReasonablenessData {
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
  locality: string;
}

type SortColumn = 'cpt' | 'provider' | 'billed' | 'cms' | 'variance';
type SortDirection = 'asc' | 'desc';

export function DamagesReasonablenessTable({ caseId }: DamagesReasonablenessTableProps) {
  const [data, setData] = useState<ReasonablenessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFootnotes, setShowFootnotes] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('variance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Fetch reasonableness data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/cases/${caseId}/reasonableness`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to load reasonableness analysis');
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching reasonableness data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    if (caseId) {
      fetchData();
    }
  }, [caseId]);
  
  // Sort rows
  const sortedRows = data?.rows ? [...data.rows].sort((a, b) => {
    let aVal: any, bVal: any;
    
    switch (sortColumn) {
      case 'cpt':
        aVal = a.cpt;
        bVal = b.cpt;
        break;
      case 'provider':
        aVal = a.provider;
        bVal = b.provider;
        break;
      case 'billed':
        aVal = a.billed;
        bVal = b.billed;
        break;
      case 'cms':
        aVal = a.cms || 0;
        bVal = b.cms || 0;
        break;
      case 'variance':
        aVal = a.variancePct || -999;
        bVal = b.variancePct || -999;
        break;
    }
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  }) : [];
  
  // Handle column header click
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };
  
  // Get variance badge color
  const getVarianceBadge = (flag?: ReasonablenessRow['flag'], variancePct?: number | null) => {
    if (variancePct === null || variancePct === undefined) {
      return <Badge className="" variant="outline">N/A</Badge>;
    }
    
    switch (flag) {
      case 'reasonable':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100" variant="default">
            {variancePct > 0 ? '+' : ''}{variancePct.toFixed(1)}%
          </Badge>
        );
      case 'high':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100" variant="default">
            {variancePct > 0 ? '+' : ''}{variancePct.toFixed(1)}%
          </Badge>
        );
      case 'excessive':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100" variant="default">
            {variancePct > 0 ? '+' : ''}{variancePct.toFixed(1)}%
          </Badge>
        );
      default:
        return (
          <Badge className="" variant="outline">
            {variancePct > 0 ? '+' : ''}{variancePct.toFixed(1)}%
          </Badge>
        );
    }
  };
  
  // Export to CSV
  const handleExport = () => {
    if (!data) return;
    
    const csv = [
      ['CPT Code', 'Description', 'Provider', 'Date of Service', 'Billed', 'CMS Benchmark', 'Variance %', 'Variance $', 'Flag'],
      ...data.rows.map(row => [
        row.cpt,
        row.cptDescription || '',
        row.provider,
        row.dateOfService || '',
        row.billed.toFixed(2),
        row.cms?.toFixed(2) || 'N/A',
        row.variancePct?.toFixed(1) || 'N/A',
        row.varianceAmount?.toFixed(2) || 'N/A',
        row.flag || 'N/A',
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reasonableness-analysis-${caseId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reasonableness Analysis</CardTitle>
          <CardDescription>Loading medical charges analysis...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="">
          <strong>Error loading reasonableness analysis:</strong> {error}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!data || data.rows.length === 0) {
    return (
      <Alert className="border-blue-200 bg-blue-50" variant="default">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          No medical charges found for this case. Add billing records to generate reasonableness analysis.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Medical Charges Reasonableness Analysis</CardTitle>
              <CardDescription>
                Comparing billed charges to CMS Medicare fee schedule (Locality: {data.locality})
              </CardDescription>
            </div>
            <Button className="" variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Total Billed</div>
              <div className="text-2xl font-bold">${data.summary.totalBilled.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">CMS Benchmark</div>
              <div className="text-2xl font-bold">${data.summary.totalCMS.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Overall Variance</div>
              <div className={`text-2xl font-bold ${
                data.summary.overallVariancePct <= 150 ? 'text-green-600' :
                data.summary.overallVariancePct <= 250 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                +{data.summary.overallVariancePct.toFixed(1)}%
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Charge Summary</div>
              <div className="text-sm">
                <span className="text-green-600 font-semibold">{data.summary.reasonableCount}</span> reasonable,{' '}
                <span className="text-yellow-600 font-semibold">{data.summary.highCount}</span> high,{' '}
                <span className="text-red-600 font-semibold">{data.summary.excessiveCount}</span> excessive
              </div>
            </div>
          </div>
          
          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th 
                    className="text-left p-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('cpt')}
                  >
                    CPT Code {sortColumn === 'cpt' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left p-3">Description</th>
                  <th 
                    className="text-left p-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('provider')}
                  >
                    Provider {sortColumn === 'provider' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right p-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('billed')}
                  >
                    Billed {sortColumn === 'billed' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right p-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('cms')}
                  >
                    CMS Benchmark {sortColumn === 'cms' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="text-right p-3 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('variance')}
                  >
                    Variance {sortColumn === 'variance' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono font-semibold">{row.cpt}</td>
                    <td className="p-3 text-sm text-gray-600">
                      {row.cptDescription || 'Medical Service'}
                    </td>
                    <td className="p-3 text-sm">{row.provider}</td>
                    <td className="p-3 text-right font-semibold">
                      ${row.billed.toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      {row.cms !== null ? `$${row.cms.toFixed(2)}` : 'N/A'}
                    </td>
                    <td className="p-3 text-right">
                      {getVarianceBadge(row.flag, row.variancePct)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Methodology Footnotes */}
      <Card>
        <CardHeader>
          <Button variant="ghost"
            className="w-full flex items-center justify-between p-0 hover:bg-transparent"
            size="default" onClick={() => setShowFootnotes(!showFootnotes)}
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">Methodology & Footnotes</span>
            </div>
            {showFootnotes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CardHeader>
        {showFootnotes && (
          <CardContent className="prose prose-sm max-w-none">
            <div 
              className="text-sm text-gray-700"
              dangerouslySetInnerHTML={{ 
                __html: data.footnotes
                  .replace(/\n/g, '<br />')
                  .replace(/### /g, '<h4 class="font-semibold mt-4 mb-2">')
                  .replace(/## /g, '<h3 class="font-bold text-lg mt-6 mb-3">')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
              }}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default DamagesReasonablenessTable;

