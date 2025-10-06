import * as XLSX from 'xlsx'
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType } from 'docx'

// Excel Export for Chronology
export function exportChronologyToExcel(events: any[]): Buffer {
  const worksheet = XLSX.utils.json_to_sheet(
    events.map(event => ({
      Date: new Date(event.event_date).toLocaleDateString(),
      Provider: event.provider_name || '',
      Facility: event.facility_name || '',
      'Event Type': event.event_type || '',
      Description: event.description || '',
      'ICD-10': event.icd10_codes?.join(', ') || '',
      'CPT': event.cpt_codes?.join(', ') || '',
      Significance: event.significance_score || '',
      'Page Reference': event.page_reference || '',
    }))
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Medical Chronology')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

// Excel Export for Billing
export function exportBillingToExcel(bills: any[], summary: any): Buffer {
  const billsWorksheet = XLSX.utils.json_to_sheet(
    bills.map(bill => ({
      Date: new Date(bill.date_of_service).toLocaleDateString(),
      Provider: bill.provider_name || '',
      'CPT Code': bill.cpt_code || '',
      Description: bill.description || '',
      Amount: bill.amount || 0,
      'Medicare Rate': bill.medicare_rate || 0,
      Variance: bill.variance || 0,
      Status: bill.status || '',
    }))
  )

  const summaryWorksheet = XLSX.utils.json_to_sheet([
    { Metric: 'Total Billed', Value: summary.totalBilled || 0 },
    { Metric: 'Total Duplicates', Value: summary.totalDuplicates || 0 },
    { Metric: 'Total Overcharges', Value: summary.totalOvercharges || 0 },
    { Metric: 'Net Reasonable Amount', Value: summary.netAmount || 0 },
  ])

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, billsWorksheet, 'Bills')
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

// Word Export for Chronology
export async function exportChronologyToWord(events: any[], caseInfo: any): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'MEDICAL CHRONOLOGY',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Case: ${caseInfo.case_number || 'N/A'}`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Patient: ${caseInfo.patient_name || 'N/A'}`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Incident Date: ${caseInfo.incident_date ? new Date(caseInfo.incident_date).toLocaleDateString() : 'N/A'}`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          ...events.flatMap(event => [
            new Paragraph({
              children: [
                new TextRun({
                  text: new Date(event.event_date).toLocaleDateString(),
                  bold: true,
                  size: 24,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Provider: ${event.provider_name || 'Unknown'}`,
                  italics: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Facility: ${event.facility_name || 'Unknown'}`,
                  italics: true,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Type: ${event.event_type || 'N/A'}`,
                }),
              ],
            }),
            new Paragraph({
              text: event.description || 'No description available',
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `ICD-10: ${event.icd10_codes?.join(', ') || 'N/A'}`,
                  size: 20,
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Source: ${event.page_reference || 'N/A'}`,
                  size: 20,
                  color: '666666',
                }),
              ],
            }),
            new Paragraph({ text: '' }),
          ]),
        ],
      },
    ],
  })

  return await Packer.toBuffer(doc)
}

// Word Export for Demand Letter
export async function exportDemandLetterToWord(letterData: any): Promise<Buffer> {
  const sections = letterData.sections || []

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: sections.flatMap((section: any) => [
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: section.content,
          }),
          new Paragraph({ text: '' }),
        ]),
      },
    ],
  })

  return await Packer.toBuffer(doc)
}

// Word Export for Narrative Summary
export async function exportNarrativeToWord(narrativeData: any, caseInfo: any): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: 'NARRATIVE SUMMARY',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Case: ${caseInfo.case_number || 'N/A'}`,
                bold: true,
              }),
            ],
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: 'EXECUTIVE SUMMARY',
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: narrativeData.executive_summary || 'Not available',
          }),
          new Paragraph({ text: '' }),
          new Paragraph({
            text: narrativeData.full_narrative || 'Not available',
          }),
        ],
      },
    ],
  })

  return await Packer.toBuffer(doc)
}

// Excel Export for Deposition Summary
export function exportDepositionToExcel(depositionData: any): Buffer {
  // Q&A Pairs worksheet
  const qaPairsWorksheet = XLSX.utils.json_to_sheet(
    depositionData.qa_pairs?.map((qa: any) => ({
      Page: qa.page || '',
      Line: qa.line || '',
      Question: qa.question || '',
      Answer: qa.answer || '',
      Significance: qa.significance || '',
      Tags: qa.tags?.join(', ') || '',
    })) || []
  )

  // Issues worksheet
  const issuesWorksheet = XLSX.utils.json_to_sheet(
    depositionData.issues?.map((issue: any) => ({
      Issue: issue.issue || '',
      Category: issue.category || '',
      'Page References': issue.page_references?.join(', ') || '',
      'Key Quotes': issue.key_quotes?.join(' | ') || '',
    })) || []
  )

  // Contradictions worksheet
  const contradictionsWorksheet = XLSX.utils.json_to_sheet(
    depositionData.contradictions?.map((c: any) => ({
      Issue: c.issue || '',
      'Statement 1': c.statement1?.text || '',
      'Page 1': c.statement1?.page || '',
      'Statement 2': c.statement2?.text || '',
      'Page 2': c.statement2?.page || '',
      Severity: c.severity || '',
    })) || []
  )

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, qaPairsWorksheet, 'Q&A Pairs')
  XLSX.utils.book_append_sheet(workbook, issuesWorksheet, 'Issues')
  XLSX.utils.book_append_sheet(workbook, contradictionsWorksheet, 'Contradictions')

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
}

