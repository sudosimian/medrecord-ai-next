/**
 * California Demand Pack Templates & Validators
 * 
 * LEGAL PURPOSE:
 * - Policy Limits Demands: CA requires specific language and disclosures when making
 *   time-limited policy limits demands to avoid bad faith claims (Brown v. Superior Court)
 * - CCP § 998 Integration: Structured for potential statutory offer compliance
 * - Insurance Fair Claims Practices: CA Ins. Code §§ 790.03 ensures proper disclosure
 *   requests and deadline language to preserve bad faith claims
 * - Proof of Service: Essential for establishing timeline and preserving offer validity
 */

/**
 * CA_DEMAND_TEMPLATES: Pre-structured sections for California policy limits demands
 * 
 * Each section uses placeholder tokens that must be replaced with case-specific data:
 * - {{insured_name}}: Name of insured defendant
 * - {{claim_number}}: Insurance claim reference number
 * - {{deadline_date}}: Policy limits offer expiration (typically 30 days)
 * - {{policy_limits}}: Confirmed or estimated policy limits amount
 * - {{accident_date}}: Date of incident
 * - {{plaintiff_name}}: Injured party name
 * - {{total_damages}}: Total special and general damages claimed
 * - {{treatment_summary}}: Brief medical treatment overview
 * - {{liability_basis}}: Legal basis for defendant liability
 */
export const CA_DEMAND_TEMPLATES = {
  cover_letter: `**POLICY LIMITS DEMAND**
**TIME-LIMITED OFFER**

Date: {{current_date}}

{{insurance_company_name}}
{{insurance_company_address}}

RE: Claimant: {{plaintiff_name}}
    Insured: {{insured_name}}
    Claim Number: {{claim_number}}
    Date of Loss: {{accident_date}}
    Policy Limits Demand

Dear Claims Representative:

This letter constitutes a time-limited offer to settle all claims arising from the above-referenced incident for the full policy limits of **{{policy_limits}}**. This offer is made pursuant to your insured's liability policy and is contingent upon full policy disclosure as requested herein.

**This offer expires on {{deadline_date}} at 5:00 PM Pacific Time and is subject to immediate withdrawal or modification if additional information reveals higher available limits.**

We reserve all rights under California Insurance Bad Faith law should this matter not be resolved within the time specified.`,

  policy_limits_demand: `## POLICY LIMITS SETTLEMENT OFFER

Our client, {{plaintiff_name}}, hereby offers to settle and release all claims against your insured, {{insured_name}}, for the **FULL AVAILABLE POLICY LIMITS** of **{{policy_limits}}** (or such greater amount as may be revealed through the policy disclosure requested below).

### Terms of Settlement:
- Payment of {{policy_limits}} within {{deadline_days}} days
- General release of insured {{insured_name}}
- Dismissal with prejudice of any pending litigation
- No waiver of bad faith claims against carrier if offer not timely accepted

### Time Limitation:
**This offer is irrevocable until {{deadline_date}} at 5:00 PM Pacific Time.** After this deadline, the offer is withdrawn and we will proceed with litigation for the full value of damages, which substantially exceed policy limits.

Your failure to accept this reasonable offer within policy limits may expose your company to bad faith liability under California law (*Comunale v. Traders & General Ins. Co.*, *Crisci v. Security Ins. Co.*).`,

  liability: `## LIABILITY ANALYSIS

### Basis for Insured's Liability:
{{liability_basis}}

### Factual Summary:
On {{accident_date}}, your insured, {{insured_name}}, {{incident_description}}. This incident was caused solely by the negligent conduct of your insured including:

{{negligence_factors}}

### Legal Standards:
Under California law, your insured breached the duty of care owed to {{plaintiff_name}} by {{breach_description}}. This breach was the direct and proximate cause of substantial injuries and damages detailed herein.

### Evidence of Liability:
{{evidence_list}}

**Liability is clear and indisputable.** Any attempt to deny or undervalue this claim based on liability would constitute bad faith claims handling under California Insurance Code § 790.03(h).`,

  medical_summary: `## MEDICAL TREATMENT SUMMARY

### Immediate Treatment:
Following the {{accident_date}} incident, {{plaintiff_name}} received immediate medical attention including:

{{emergency_treatment}}

### Ongoing Treatment:
{{treatment_summary}}

### Diagnoses:
{{diagnoses_list}}

### Permanent Injuries:
{{permanent_injuries}}

### Future Medical Care:
Medical professionals have opined that {{plaintiff_name}} will require:
{{future_treatment}}

**Total Medical Specials: {{medical_specials}}**

*Complete medical records and billing statements are enclosed as Exhibit A.*`,

  damages_summary: `## DAMAGES SUMMARY

### Economic Damages (Special Damages):
- Medical expenses (past): {{past_medical}}
- Future medical care: {{future_medical}}
- Lost earnings: {{lost_earnings}}
- Loss of earning capacity: {{loss_earning_capacity}}
- Property damage: {{property_damage}}
**Total Economic Damages: {{total_economic}}**

### Non-Economic Damages (General Damages):
- Physical pain and suffering: {{pain_suffering}}
- Emotional distress: {{emotional_distress}}
- Loss of enjoyment of life: {{loss_enjoyment}}
- Permanent disability/disfigurement: {{permanent_disability}}
**Total Non-Economic Damages: {{total_noneconomic}}**

### Total Claimed Damages: {{total_damages}}

**The claimed damages substantially exceed the policy limits of {{policy_limits}}.** Settlement at policy limits represents a significant discount and is offered solely to achieve prompt resolution and avoid the time and expense of litigation.`,

  bad_faith_notice: `## BAD FAITH NOTICE TO CARRIER

Please be advised that this time-limited policy limits demand creates specific duties under California law for your company:

### Carrier Obligations:
1. **Immediate Investigation**: You must promptly and thoroughly investigate this claim (*Egan v. Mutual of Omaha Ins. Co.*)
2. **Policy Limits Evaluation**: You must evaluate whether the claim value exceeds available limits (*Comunale v. Traders & General Ins. Co.*)
3. **Insured Protection**: Your duty to your insured to settle within policy limits takes precedence over your financial interests (*Crisci v. Security Ins. Co.*)
4. **Prompt Response**: Failure to timely respond to a reasonable settlement demand may constitute bad faith (*Graciano v. Mercury General Corp.*)

### Preservation of Bad Faith Claims:
**Notice is hereby given** that your handling of this claim is being documented. Should you fail to accept this reasonable policy limits demand, and should a subsequent judgment exceed policy limits, your insured will be notified of:
- Your opportunity to settle within policy limits
- Any unreasonable delay or denial
- Their potential personal exposure
- Their right to independent counsel regarding bad faith claims against you

We will recommend your insured retain independent coverage counsel to monitor your handling if this offer is not promptly accepted.`,

  policy_disclosure_request: `## POLICY DISCLOSURE REQUEST

Pursuant to California Insurance Code § 790.03 and California Civil Code § 3295(c), and to ensure this settlement offer encompasses all available coverage, please provide **within 10 days**:

### Required Disclosures:
1. Complete certified copies of all insurance policies that may provide coverage:
   - Primary liability policy for {{insured_name}}
   - Any excess/umbrella policies
   - Any other policies (homeowner's, commercial, etc.) that may apply
   
2. Policy declarations pages showing:
   - Policy limits (per occurrence and aggregate)
   - Policy period and effective dates
   - Named insureds and additional insureds
   - Any applicable sublimits or exclusions
   
3. Claims made against the policy:
   - Other claims or lawsuits affecting available limits
   - Any erosion of policy limits from defense costs (if applicable)
   - Current available limits after any payments or allocations

### Legal Basis:
Your duty to disclose policy information arises from:
- California's comprehensive bad faith jurisprudence
- Fair claims practices regulations
- Your duty to your insured to make reasonable efforts to settle within policy limits

**Failure to provide complete policy disclosure may result in waiver of policy limits defenses and independent bad faith liability.**`,

  deadline_language: `## ACCEPTANCE DEADLINE & TERMS

### Expiration:
**This offer expires on {{deadline_date}} at 5:00 PM Pacific Time** and is subject to immediate withdrawal or modification if:
- Additional policy limits are discovered
- Additional defendants or liable parties are identified
- Medical condition worsens or additional injuries manifest
- Any material information is discovered that was not available at time of offer

### Method of Acceptance:
Acceptance must be **unconditional** and communicated via:
- Written confirmation to: {{attorney_contact}}
- Accompanied by: Full policy disclosure (if not previously provided)
- Followed by: Policy limits payment within {{payment_days}} days

### Payment Terms:
- Certified check or wire transfer
- Made payable to: {{settlement_payee}}
- Delivered to: {{settlement_address}}
- In exchange for: Fully executed general release

### Conditions Precedent:
This settlement is contingent upon:
1. Verification that {{policy_limits}} represents **all available coverage**
2. Payment of full settlement amount within specified time
3. No liens or subrogation claims exceeding available funds (carrier must assist in resolution)

**Time is of the essence.** Any delay in response or payment may result in withdrawal of this offer.`,

  proof_of_service: `## PROOF OF SERVICE CHECKLIST

**This section tracks service of the demand to establish timeline for bad faith purposes:**

### Service Details:
- **Date Mailed**: {{mail_date}}
- **Time Mailed**: {{mail_time}}
- **Method**: {{service_method}} (Certified Mail, Overnight, Email, etc.)
- **Tracking Number**: {{tracking_number}}

### Recipients:
- **Primary Claims Adjuster**: {{adjuster_name}} - {{adjuster_address}}
- **Claims Supervisor**: {{supervisor_name}} - {{supervisor_address}}
- **Insurance Company**: {{company_name}} - {{company_address}}
- **Insured (copy)**: {{insured_name}} - {{insured_address}}

### Enclosures Served:
☐ Demand Letter ({{page_count}} pages)
☐ Medical Records and Bills (Exhibit A)
☐ Accident/Police Reports (Exhibit B)
☐ Photographs (Exhibit C)
☐ Wage Loss Documentation (Exhibit D)
☐ Expert Reports/Opinions (Exhibit E)
☐ Other: {{other_exhibits}}

### Proof of Delivery:
- **Delivery Date**: {{delivery_date}}
- **Received By**: {{received_by}}
- **Delivery Confirmation**: {{confirmation_number}}

*Certified mail receipt and delivery confirmation attached as Exhibit {{exhibit_letter}}*

---

**Declaration of Service**: I declare under penalty of perjury under the laws of the State of California that I served the foregoing Policy Limits Demand and all exhibits on the above-listed parties on the date and by the method indicated.

Date: {{service_date}}
Served by: {{server_name}}
Title: {{server_title}}`
};

/**
 * CA_REQUIRED_ELEMENTS: Mandatory sections for a valid California policy limits demand
 * 
 * LEGAL RATIONALE:
 * - policy_limits_demand: Core offer must be clear and unambiguous
 * - deadline_language: Time limitation essential for creating urgency and bad faith timeline
 * - proof_of_service: Required to establish when carrier received demand (starts clock)
 * - policy_disclosure_request: Ensures all coverage is known; protects against later discovery
 * - damages_summary: Carrier must understand value exceeds limits (justifies settlement)
 * - liability: Clear liability showing carrier's exposure is not speculative
 * 
 * Without these elements, demand may be deemed ambiguous or insufficient to trigger
 * bad faith duties under California law.
 */
export const CA_REQUIRED_ELEMENTS = [
  'policy_limits_demand',
  'deadline_language', 
  'proof_of_service',
  'policy_disclosure_request',
  'damages_summary',
  'liability'
] as const;

export type CARequiredElement = typeof CA_REQUIRED_ELEMENTS[number];

/**
 * Builds a proof of service checklist for California demands
 * 
 * PURPOSE: Creates a structured checklist to ensure proper service documentation.
 * Proper service is critical for establishing the timeline of the demand and
 * proving the carrier had adequate time to investigate and respond.
 * 
 * @param data - Case and service information
 * @returns Array of checklist items for attorney/staff to complete
 */
export function buildCAProofOfServiceChecklist(data: {
  insuranceCompany?: string;
  claimNumber?: string;
  adjusterName?: string;
  insuredName?: string;
}): Array<{ item: string; required: boolean; description: string }> {
  return [
    {
      item: 'Mailing Method Confirmed',
      required: true,
      description: 'Use certified mail with return receipt OR overnight delivery with signature confirmation. Email alone is insufficient for policy limits demands.'
    },
    {
      item: 'All Addresses Verified',
      required: true,
      description: `Verify current addresses for: (1) Claims adjuster - ${data.adjusterName || '[Name TBD]'}, (2) Insurance company claims office, (3) Insured defendant - ${data.insuredName || '[Name TBD]'}. Send to all three to avoid disputes over receipt.`
    },
    {
      item: 'Date/Time Documented',
      required: true,
      description: 'Record exact date and time of mailing. This starts the deadline clock. Keep tracking numbers and photographs of mailed package.'
    },
    {
      item: 'All Enclosures Included',
      required: true,
      description: 'Verify demand includes: (1) Demand letter, (2) Medical records/bills, (3) Accident reports, (4) Wage loss docs, (5) Photos of injuries/damage, (6) Any expert reports. Incomplete demands may be rejected.'
    },
    {
      item: 'Exhibits Properly Marked',
      required: true,
      description: 'Number all exhibits sequentially (A, B, C, etc.) and reference in demand letter. Create index of exhibits for easy reference.'
    },
    {
      item: 'Delivery Confirmation Obtained',
      required: true,
      description: 'Obtain signature confirmation showing date/time delivered and name of person who signed. Follow up within 48 hours if not delivered.'
    },
    {
      item: 'Service Declaration Prepared',
      required: false,
      description: 'Prepare declaration of service stating who served demand, when, where, and by what method. Useful for later bad faith litigation.'
    },
    {
      item: 'Insured Copy Sent',
      required: true,
      description: `Send courtesy copy to insured defendant (${data.insuredName || '[Name TBD]'}) at known address. This prevents carrier from claiming insured was unaware of excess exposure.`
    },
    {
      item: 'File Documentation Complete',
      required: true,
      description: 'File should contain: (1) Copy of complete demand as sent, (2) Certified mail receipts, (3) Delivery confirmations, (4) Proof insured was copied, (5) Calendar entry for deadline date.'
    }
  ];
}

/**
 * Type definition for demand pack data used in template rendering
 */
export interface CADemandData {
  // Party Information
  plaintiff_name?: string;
  insured_name?: string;
  insurance_company_name?: string;
  insurance_company_address?: string;
  claim_number?: string;
  
  // Dates
  current_date?: string;
  accident_date?: string;
  deadline_date?: string;
  deadline_days?: string;
  
  // Financial
  policy_limits?: string;
  total_damages?: string;
  medical_specials?: string;
  past_medical?: string;
  future_medical?: string;
  lost_earnings?: string;
  loss_earning_capacity?: string;
  property_damage?: string;
  total_economic?: string;
  pain_suffering?: string;
  emotional_distress?: string;
  loss_enjoyment?: string;
  permanent_disability?: string;
  total_noneconomic?: string;
  
  // Case Details
  incident_description?: string;
  negligence_factors?: string;
  breach_description?: string;
  liability_basis?: string;
  evidence_list?: string;
  
  // Medical
  emergency_treatment?: string;
  treatment_summary?: string;
  diagnoses_list?: string;
  permanent_injuries?: string;
  future_treatment?: string;
  
  // Service/Contact
  attorney_contact?: string;
  settlement_payee?: string;
  settlement_address?: string;
  payment_days?: string;
  
  // Service details
  mail_date?: string;
  mail_time?: string;
  service_method?: string;
  tracking_number?: string;
  adjuster_name?: string;
  adjuster_address?: string;
  supervisor_name?: string;
  supervisor_address?: string;
  company_name?: string;
  company_address?: string;
  insured_address?: string;
  page_count?: string;
  other_exhibits?: string;
  delivery_date?: string;
  received_by?: string;
  confirmation_number?: string;
  exhibit_letter?: string;
  service_date?: string;
  server_name?: string;
  server_title?: string;
}

