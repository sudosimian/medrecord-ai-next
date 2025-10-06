// OpenAI API Integration for MedRecord AI
// This service handles all AI-powered medical document processing and analysis

class OpenAIService {
  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY
    this.apiUrl = 'https://api.openai.com/v1'
    this.model = 'gpt-4o' // Latest GPT-4 Optimized model
    
    if (!this.apiKey) {
      console.warn('OpenAI API key not configured. AI features will not work.')
    }
  }

  // Generic OpenAI API request
  async makeRequest(endpoint, data) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is not configured')
    }

    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || `API request failed: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('OpenAI API Error:', error)
      throw error
    }
  }

  // Chat completion with structured output
  async chatCompletion(messages, options = {}) {
    const data = {
      model: options.model || this.model,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
      ...options
    }

    return this.makeRequest('/chat/completions', data)
  }

  // Extract structured medical data from text
  async extractMedicalData(text, type = 'general') {
    const systemPrompts = {
      general: `You are a medical AI assistant specialized in extracting structured medical data from documents. 
Extract patient information, diagnoses, treatments, medications, and billing information in JSON format.`,
      
      chronology: `You are a medical-legal AI assistant. Extract chronological medical events from this document.
Include dates, providers, diagnoses (with ICD-10 codes), treatments (with CPT codes), and legal significance.`,
      
      billing: `You are a medical billing AI assistant. Extract all billing information including:
- Service dates
- Providers
- Procedure codes (CPT)
- Diagnosis codes (ICD-10)
- Amounts charged, paid, and outstanding
- Insurance information`,
      
      injuries: `You are a medical AI specialized in injury assessment. Extract:
- All injuries and body parts affected
- Severity of each injury
- ICD-10 codes
- Causation information
- Pre-existing conditions`
    }

    const messages = [
      {
        role: 'system',
        content: systemPrompts[type] || systemPrompts.general
      },
      {
        role: 'user',
        content: `Extract structured medical data from this text:\n\n${text}\n\nReturn ONLY valid JSON.`
      }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.3,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error extracting medical data:', error)
      throw error
    }
  }

  // Generate medical chronology from documents
  async generateChronology(documentsText, patientInfo = {}) {
    const prompt = `As a medical-legal AI assistant, create a comprehensive chronological medical timeline.

Patient: ${patientInfo.name || 'Unknown'}
DOB: ${patientInfo.dob || 'Unknown'}

Medical Records:
${documentsText}

Generate a chronological timeline with these fields for each event:
- date (YYYY-MM-DD)
- time (HH:MM if available)
- provider (name and specialty)
- facility
- event (brief description)
- diagnosis (with ICD-10 codes)
- treatment (with CPT codes if applicable)
- outcome
- billing (estimated cost if mentioned)
- significance (high/medium/low based on legal importance)
- notes (additional relevant information)

Return as JSON with "events" array.`

    const messages = [
      { role: 'system', content: 'You are a medical-legal AI creating chronological timelines for legal proceedings.' },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.5,
        maxTokens: 4000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error generating chronology:', error)
      throw error
    }
  }

  // Analyze symptoms and suggest diagnoses
  async analyzeSymptoms(symptoms, patientData = {}) {
    const prompt = `Patient Information:
${patientData.age ? `Age: ${patientData.age}` : ''}
${patientData.gender ? `Gender: ${patientData.gender}` : ''}
${patientData.medicalHistory ? `Medical History: ${patientData.medicalHistory}` : ''}

Presenting Symptoms:
${symptoms}

Provide a medical analysis with:
1. Suggested diagnoses (with ICD-10 codes, severity, confidence percentage)
2. Recommended diagnostic tests
3. Treatment recommendations
4. Risk factors to consider
5. Red flags requiring immediate attention

Format as JSON.`

    const messages = [
      { 
        role: 'system', 
        content: 'You are an AI medical assistant. Provide differential diagnoses and recommendations. Always remind users to consult healthcare professionals.' 
      },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.6,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error analyzing symptoms:', error)
      throw error
    }
  }

  // Check drug interactions
  async checkDrugInteractions(medications) {
    const prompt = `Analyze drug interactions for these medications:
${medications.map((med, i) => `${i + 1}. ${med}`).join('\n')}

Provide:
1. All potential drug interactions (severity: major/moderate/minor)
2. Mechanism of interaction
3. Clinical significance
4. Recommendations for each interaction
5. General warnings

Format as JSON with "interactions" array and "warnings" array.`

    const messages = [
      { 
        role: 'system', 
        content: 'You are a clinical pharmacology AI assistant specialized in drug interactions. Provide accurate, detailed interaction analysis.' 
      },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.4,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error checking drug interactions:', error)
      throw error
    }
  }

  // Generate settlement demand letter
  async generateDemandLetter(caseData) {
    const prompt = `Generate a professional settlement demand letter for this case:

Incident Type: ${caseData.incidentType}
Incident Date: ${caseData.incidentDate}
Description: ${caseData.incidentDescription}

Injuries:
${caseData.injuries.map(inj => `- ${inj.bodyPart}: ${inj.description} (${inj.icdCode})`).join('\n')}

Damages:
- Medical Expenses (Past): $${caseData.totalMedicalExpenses.toLocaleString()}
- Medical Expenses (Future): $${caseData.futureMedicalExpenses.toLocaleString()}
- Lost Wages (Past): $${caseData.lostWages.toLocaleString()}
- Lost Wages (Future): $${caseData.futureLostWages.toLocaleString()}
- Pain & Suffering: $${caseData.painSuffering.toLocaleString()}
- Property Damage: $${caseData.propertyDamage.toLocaleString()}
Total Demand: $${caseData.totalDemand.toLocaleString()}

Demand Type: ${caseData.demandType}
${caseData.demandType === 'stowers' ? 'Include Stowers language and 30-day deadline.' : ''}

Generate a comprehensive, professional settlement demand letter with:
1. Professional header
2. Incident description
3. Liability analysis
4. Injuries and medical treatment summary
5. Damages breakdown
6. Demand amount with justification
7. Deadline for response (if applicable)

Return as JSON with sections: header, liability, medical, damages, demand, deadline.`

    const messages = [
      { 
        role: 'system', 
        content: 'You are a legal AI assistant specializing in personal injury settlement demand letters. Write professional, persuasive letters.' 
      },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.7,
        maxTokens: 4000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error generating demand letter:', error)
      throw error
    }
  }

  // Calculate recommended settlement demand
  async calculateDemandRecommendation(damages, caseStrength, jurisdiction) {
    const prompt = `As a legal AI consultant, recommend a settlement demand amount.

Economic Damages:
- Past Medical: $${damages.pastMedical}
- Future Medical: $${damages.futureMedical}
- Past Lost Wages: $${damages.pastLostWages}
- Future Lost Wages: $${damages.futureLostWages}
Total Economic: $${damages.economic}

Non-Economic Damages:
- Pain & Suffering: $${damages.painSuffering}

Case Strength: ${caseStrength}/10
Jurisdiction: ${jurisdiction}

Calculate:
1. Recommended demand amount with multiplier
2. Expected settlement range (low, mid, high)
3. Justification for demand
4. Negotiation strategy
5. Comparable case references

Return as JSON.`

    const messages = [
      { 
        role: 'system', 
        content: 'You are a legal AI specializing in case valuation and settlement strategy.' 
      },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.5,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error calculating demand recommendation:', error)
      throw error
    }
  }

  // Extract text from image using GPT-4 Vision
  async extractTextFromImage(imageUrl) {
    const messages = [
      {
        role: 'system',
        content: 'You are an AI specialized in extracting text from medical documents. Extract all visible text accurately.'
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all text from this medical document. Preserve formatting and structure. Return as plain text.'
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          }
        ]
      }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        model: 'gpt-4o',
        maxTokens: 4000
      })

      return response.choices[0].message.content
    } catch (error) {
      console.error('Error extracting text from image:', error)
      throw error
    }
  }

  // Generate expert medical opinion
  async generateExpertOpinion(opinionData) {
    const prompt = `Generate a professional expert medical opinion for this case:

Case Type: ${opinionData.caseType}
Question Presented: ${opinionData.questionPresented}

Medical History:
${opinionData.medicalHistory}

Current Condition:
${opinionData.currentCondition}

Causation Analysis:
${opinionData.causation}

Standard of Care:
${opinionData.standardOfCare}

Generate a comprehensive expert medical opinion with:
1. Professional introduction
2. Materials reviewed
3. Medical history summary
4. Current condition assessment
5. Causation analysis (to reasonable medical certainty)
6. Standard of care analysis
7. Conclusions and opinions
8. Basis for opinions (medical literature, clinical experience)

Confidence Level: ${opinionData.confidence}

Return as JSON with structured sections.`

    const messages = [
      { 
        role: 'system', 
        content: 'You are an AI medical expert witness assistant. Generate professional medical opinions that meet legal standards.' 
      },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.6,
        maxTokens: 4000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error generating expert opinion:', error)
      throw error
    }
  }

  // Extract and analyze medical bills from text or documents
  async extractBills(documentText) {
    const prompt = `Extract all medical billing information from this document.

Document text:
${documentText}

Extract and return JSON with array of bills, each containing:
- date (service date)
- provider (provider/facility name)
- procedure (procedure/service description)
- cptCode (CPT code if present)
- icdCode (ICD-10 code if present)
- amount (dollar amount)
- insurance (insurance information if present)
- status (paid/pending/denied if determinable)

Return format: { "bills": [...] }`

    const messages = [
      { 
        role: 'system', 
        content: 'You are a medical billing AI expert. Extract all billing information accurately from medical documents.' 
      },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.3,
        maxTokens: 3000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error extracting bills:', error)
      throw error
    }
  }

  // Detect duplicate charges in billing records
  async detectDuplicateCharges(bills) {
    const billsText = JSON.stringify(bills, null, 2)
    
    const prompt = `Analyze these medical bills for duplicate charges:

${billsText}

Identify:
1. Exact duplicates (same date, provider, service, amount)
2. Near duplicates (same service, similar amount, close dates)
3. Potential unbundling (services that should be bundled)
4. Potential upcoding (higher-level service than appropriate)

Return JSON with:
{
  "duplicates": [
    {
      "type": "exact|near|unbundling|upcoding",
      "bill1_index": number,
      "bill2_index": number,
      "description": "explanation",
      "potential_overcharge": number
    }
  ],
  "total_potential_savings": number,
  "summary": "brief analysis"
}`

    const messages = [
      { 
        role: 'system', 
        content: 'You are a medical billing auditor AI. Identify duplicate charges and billing errors with precision.' 
      },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.4,
        maxTokens: 2000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error detecting duplicates:', error)
      throw error
    }
  }

  // Analyze reasonable and customary rates
  async analyzeReasonableRates(bills, region = 'US') {
    const billsText = JSON.stringify(bills, null, 2)
    
    const prompt = `Analyze if these medical charges are reasonable for ${region}:

${billsText}

For each bill, compare to typical Medicare rates (multiplied by 2-3x for commercial insurance).

Return JSON with:
{
  "analysis": [
    {
      "bill_index": number,
      "charged": number,
      "typical_range_low": number,
      "typical_range_high": number,
      "assessment": "reasonable|high|excessive",
      "explanation": "brief explanation"
    }
  ],
  "total_potential_overcharges": number,
  "summary": "overall assessment"
}`

    const messages = [
      { 
        role: 'system', 
        content: 'You are a healthcare cost analysis AI with knowledge of Medicare rates and commercial insurance pricing.' 
      },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.4,
        maxTokens: 2000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error analyzing rates:', error)
      throw error
    }
  }

  // Identify missing medical records
  async identifyMissingRecords(chronologyEvents, caseType = 'personal_injury') {
    const eventsText = JSON.stringify(chronologyEvents, null, 2)
    
    const prompt = `Analyze this medical chronology for missing records:

Case Type: ${caseType}
Events:
${eventsText}

Identify expected but missing records based on:
- Gaps in timeline
- Mentioned but not included records (e.g., "MRI ordered" but no MRI report)
- Standard medical protocols for this case type
- Referrals without follow-up
- Incomplete diagnostic workups

Return JSON with:
{
  "missing_records": [
    {
      "type": "record type (e.g., MRI report, specialist consultation)",
      "expected_date": "approximate date",
      "provider": "likely provider if determinable",
      "importance": "high|medium|low",
      "reason": "why this record is expected",
      "impact": "impact on case if missing"
    }
  ],
  "timeline_gaps": [
    {
      "gap_start": "date",
      "gap_end": "date",
      "duration_days": number,
      "significance": "assessment of gap significance"
    }
  ],
  "summary": "overall assessment of record completeness"
}`

    const messages = [
      { 
        role: 'system', 
        content: 'You are a medical-legal records analyst AI. Identify missing records that could strengthen a case.' 
      },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.5,
        maxTokens: 2500,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error identifying missing records:', error)
      throw error
    }
  }

  // Find comparable legal cases for settlement analysis
  async findComparableCases(caseData) {
    const prompt = `Based on this case information, suggest comparable cases for settlement valuation:

Case Type: ${caseData.incidentType}
Jurisdiction: ${caseData.jurisdiction || 'General US'}
Injuries: ${JSON.stringify(caseData.injuries)}
Medical Expenses: $${caseData.totalMedicalExpenses}
Liability Strength: ${caseData.liabilityStrength || 'moderate'}

Provide 3-5 hypothetical comparable cases based on typical verdicts/settlements in similar cases.

Return JSON with:
{
  "comparable_cases": [
    {
      "case_summary": "brief description",
      "jurisdiction": "state/region",
      "injuries": ["list of injuries"],
      "verdict_amount": number,
      "year": year,
      "relevance_score": number (0-100)
    }
  ],
  "statistics": {
    "average_verdict": number,
    "median_verdict": number,
    "range_low": number,
    "range_high": number
  },
  "analysis": "brief analysis of comparables"
}`

    const messages = [
      { 
        role: 'system', 
        content: 'You are a legal case valuation AI with knowledge of personal injury verdicts and settlements. Base recommendations on typical ranges for similar cases.' 
      },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.6,
        maxTokens: 2500,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error finding comparable cases:', error)
      throw error
    }
  }

  // Recommend settlement demand amount with strategy
  async recommendDemandAmount(caseData, comparables = null) {
    const prompt = `Recommend a settlement demand amount for this case:

Case Details:
- Type: ${caseData.incidentType}
- Total Medical: $${caseData.totalMedicalExpenses}
- Future Medical: $${caseData.futureMedicalExpenses || 0}
- Lost Wages: $${caseData.lostWages || 0}
- Future Lost Wages: $${caseData.futureLostWages || 0}
- Pain & Suffering: $${caseData.painSuffering || 0}
- Property Damage: $${caseData.propertyDamage || 0}
- Total Damages: $${caseData.totalDemand}
- Liability Strength: ${caseData.liabilityStrength || 'moderate'}
- Injury Severity: ${caseData.injurySeverity || 'moderate'}
${comparables ? `\nComparable Cases: ${JSON.stringify(comparables)}` : ''}

Recommend:
1. Demand amount (typically 2-4x total damages based on case strength)
2. Expected settlement range
3. Multiplier justification
4. Negotiation strategy

Return JSON with:
{
  "recommended_demand": number,
  "multiplier": number,
  "expected_settlement_low": number,
  "expected_settlement_mid": number,
  "expected_settlement_high": number,
  "justification": "explanation for demand amount",
  "strategy": "negotiation strategy recommendations",
  "strengths": ["case strengths"],
  "weaknesses": ["case weaknesses"]
}`

    const messages = [
      { 
        role: 'system', 
        content: 'You are a legal settlement strategy AI specializing in personal injury case valuation. Provide realistic recommendations based on case strength.' 
      },
      { role: 'user', content: prompt }
    ]

    try {
      const response = await this.chatCompletion(messages, {
        temperature: 0.5,
        maxTokens: 2000,
        response_format: { type: 'json_object' }
      })

      const content = response.choices[0].message.content
      return JSON.parse(content)
    } catch (error) {
      console.error('Error recommending demand amount:', error)
      throw error
    }
  }
}

// Export singleton instance
export const openaiService = new OpenAIService()

// Export class for testing
export { OpenAIService }

