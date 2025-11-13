import OpenAI from 'openai'
import {
  DepositionSummary,
  DepositionIssue,
  DepositionQA,
  DepositionContradiction,
} from '@/types/deposition'

// Lazy-load OpenAI client to avoid build-time errors
function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set')
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

export async function processDepositionTranscript(
  transcriptText: string,
  witnessData: any,
  caseData: any
): Promise<Omit<DepositionSummary, 'id' | 'case_id' | 'user_id' | 'created_at' | 'updated_at'>> {
  
  // Extract Q&A pairs
  const qaPairs = await extractQAPairs(transcriptText)
  
  // Organize by issue
  const issues = await organizeByIssue(qaPairs, caseData)
  
  // Detect contradictions
  const contradictions = await detectContradictions(qaPairs)
  
  // Extract key admissions and denials
  const { admissions, denials } = await extractAdmissionsAndDenials(qaPairs)
  
  // Generate executive summary
  const executiveSummary = await generateDepositionExecutiveSummary({
    witness: witnessData,
    issues,
    admissions,
    denials,
    contradictions,
  })
  
  // Generate issue summaries
  const issueSummaries = await generateIssueSummaries(issues, qaPairs)
  
  return {
    witness: witnessData,
    total_pages: estimatePageCount(transcriptText),
    deposition_date: witnessData.deposition_date,
    issues,
    qa_pairs: qaPairs,
    contradictions,
    key_admissions: admissions,
    key_denials: denials,
    executive_summary: executiveSummary,
    issue_summaries: issueSummaries,
  }
}

function estimatePageCount(text: string): number {
  // Rough estimate: 25 lines per page, 50 chars per line
  const linesPerPage = 25
  const lines = text.split('\n').length
  return Math.ceil(lines / linesPerPage)
}

async function extractQAPairs(transcriptText: string): Promise<DepositionQA[]> {
  // Split into manageable chunks for AI processing
  const chunks = splitTranscriptIntoChunks(transcriptText, 4000)
  const allQAPairs: DepositionQA[] = []
  
  for (let i = 0; i < chunks.length; i++) {
    const prompt = `Extract question-and-answer pairs from deposition transcript.

Transcript (pages ${i * 10 + 1}-${(i + 1) * 10}):
${chunks[i]}

Return JSON array:
[
  {
    "page": 15,
    "line": 10,
    "question": "Q: Where were you when the accident occurred?",
    "answer": "A: I was stopped at the red light on Main Street.",
    "significance": "important",
    "tags": ["accident_scene", "plaintiff_testimony"]
  }
]

Significance: critical (impeachment, admission), important (case facts), routine (background)
Tags: Relevant topics like "liability", "causation", "damages", "treatment", etc.`

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a legal assistant. Extract Q&A pairs from deposition transcripts.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })

    const result = JSON.parse(response.choices[0].message.content || '{"qa_pairs":[]}')
    allQAPairs.push(...(result.qa_pairs || []))
  }
  
  return allQAPairs
}

function splitTranscriptIntoChunks(text: string, chunkSize: number): string[] {
  const chunks: string[] = []
  const lines = text.split('\n')
  let currentChunk = ''
  
  for (const line of lines) {
    if (currentChunk.length + line.length > chunkSize) {
      chunks.push(currentChunk)
      currentChunk = line + '\n'
    } else {
      currentChunk += line + '\n'
    }
  }
  
  if (currentChunk) chunks.push(currentChunk)
  return chunks
}

async function organizeByIssue(
  qaPairs: DepositionQA[],
  caseData: any
): Promise<DepositionIssue[]> {
  const prompt = `Organize deposition testimony by legal issue.

Q&A Pairs:
${JSON.stringify(qaPairs.slice(0, 50), null, 2)}

Case Type: ${caseData.case_type}

Return JSON array of issues:
[
  {
    "issue": "Liability - Defendant ran red light",
    "category": "liability",
    "page_references": [15, 23, 45],
    "key_quotes": [
      "I saw the defendant's vehicle enter the intersection against a red light",
      "The light had been red for at least 3 seconds"
    ]
  }
]

Categories: liability, causation, damages, treatment, background`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a legal analyst. Organize deposition testimony by legal issues.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{"issues":[]}')
  return result.issues || []
}

async function detectContradictions(qaPairs: DepositionQA[]): Promise<DepositionContradiction[]> {
  const prompt = `Identify contradictions in deposition testimony.

Q&A Pairs:
${JSON.stringify(qaPairs, null, 2)}

Return JSON array:
[
  {
    "issue": "Speed of defendant's vehicle",
    "statement1": {
      "text": "I was going about 25 mph",
      "page": 15,
      "context": "Direct examination"
    },
    "statement2": {
      "text": "I may have been going 35-40 mph",
      "page": 67,
      "context": "Cross examination"
    },
    "severity": "major"
  }
]

Severity: minor (clarification), moderate (inconsistency), major (direct contradiction)`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a legal analyst. Identify contradictions and inconsistencies in testimony.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{"contradictions":[]}')
  return result.contradictions || []
}

async function extractAdmissionsAndDenials(qaPairs: DepositionQA[]): Promise<{
  admissions: string[]
  denials: string[]
}> {
  const prompt = `Extract key admissions and denials from testimony.

Q&A Pairs:
${JSON.stringify(qaPairs, null, 2)}

Return JSON:
{
  "admissions": [
    "Admitted running the red light (page 45)",
    "Acknowledged not seeing plaintiff's vehicle (page 52)"
  ],
  "denials": [
    "Denied being distracted by phone (page 67)",
    "Denied consuming alcohol prior to accident (page 23)"
  ]
}

Include page references in parentheses.`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a legal analyst. Extract admissions and denials from deposition testimony.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  })

  const result = JSON.parse(response.choices[0].message.content || '{"admissions":[],"denials":[]}')
  return {
    admissions: result.admissions || [],
    denials: result.denials || [],
  }
}

async function generateDepositionExecutiveSummary(data: any): Promise<string> {
  const prompt = `Write executive summary of deposition (2-3 paragraphs).

Witness: ${data.witness.name} (${data.witness.role})
Date: ${data.witness.deposition_date}

Issues Covered: ${data.issues.length}
Key Admissions: ${data.admissions.length}
Key Denials: ${data.denials.length}
Contradictions: ${data.contradictions.length}

Data:
${JSON.stringify(data, null, 2)}

Include:
1. Witness background and role
2. Key testimony on liability/causation/damages
3. Critical admissions or denials
4. Contradictions or weaknesses
5. Overall assessment

Professional, objective tone.`

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'You are a legal analyst. Write clear deposition executive summaries for attorneys.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.5,
    max_tokens: 600,
  })

  return response.choices[0].message.content || 'Executive summary not available.'
}

async function generateIssueSummaries(
  issues: DepositionIssue[],
  qaPairs: DepositionQA[]
): Promise<{ issue: string; summary: string }[]> {
  const summaries = []
  
  for (const issue of issues) {
    // Find relevant Q&A pairs
    const relevantQAs = qaPairs.filter(qa =>
      issue.page_references.includes(qa.page)
    )
    
    const prompt = `Summarize testimony on this issue (1 paragraph).

Issue: ${issue.issue}
Category: ${issue.category}

Relevant Testimony:
${JSON.stringify(relevantQAs, null, 2)}

Key Quotes:
${issue.key_quotes.join('\n')}

Write concise summary of witness testimony on this issue. Include page references.`

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a legal writer. Summarize deposition testimony by issue.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    })

    summaries.push({
      issue: issue.issue,
      summary: response.choices[0].message.content || 'Summary not available.',
    })
  }
  
  return summaries
}

