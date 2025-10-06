// Client-side OpenAI service that calls Next.js API routes
class OpenAIService {
  private async callAPI(action: string, params: any) {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...params }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'API request failed')
      }

      return await response.json()
    } catch (error: any) {
      console.error('OpenAI API call failed:', error)
      throw new Error(`OpenAI API error: ${error.message || error}`)
    }
  }

  async analyzeSymptoms(symptoms: string, patientData: any) {
    return this.callAPI('analyzeSymptoms', { symptoms, patientData })
  }

  async checkDrugInteractions(medications: string[]) {
    return this.callAPI('checkDrugInteractions', { medications })
  }

  async generateDemandLetter(caseData: any) {
    return this.callAPI('generateDemandLetter', { caseData })
  }

  async generateChronology(medicalRecordsText: string, patientInfo: any) {
    return this.callAPI('generateChronology', { medicalRecordsText, patientInfo })
  }

  async generateExpertOpinion(opinionData: any) {
    return this.callAPI('generateExpertOpinion', { opinionData })
  }

  async extractBills(documentText: string) {
    return this.callAPI('extractBills', { documentText })
  }

  async detectDuplicateCharges(bills: any[]) {
    return this.callAPI('detectDuplicateCharges', { bills })
  }

  async analyzeReasonableRates(bills: any[], region: string = 'US') {
    return this.callAPI('analyzeReasonableRates', { bills, region })
  }

  async identifyMissingRecords(chronologyEvents: any[], caseType: string = 'personal_injury') {
    return this.callAPI('identifyMissingRecords', { chronologyEvents, caseType })
  }

  async findComparableCases(caseData: any) {
    return this.callAPI('findComparableCases', { caseData })
  }

  async recommendDemandAmount(caseData: any, comparables: any = null) {
    return this.callAPI('recommendDemandAmount', { caseData, comparables })
  }
}

export const openaiService = new OpenAIService()

