# Attorney Workflow Guide

## 🎯 Optimal Use Flow

This platform is designed for attorneys to process personal injury cases from intake to demand letter. Follow this step-by-step workflow:

---

## Step 1: Dashboard 📊
**What:** Overview of all your cases and recent activity  
**Why:** See case status at a glance  
**Action:** Review your cases, see what needs attention

---

## Step 2: Cases ⚖️
**What:** Create and manage legal cases  
**Why:** Start here - every document and analysis ties to a case  
**Actions:**
1. Click "New Patient" (if patient doesn't exist)
2. Click "New Case" 
3. Select patient, enter case details (incident date, defendant, insurance)
4. Click "Create Case"

**💡 Tip:** The case number is auto-generated. Keep incident date accurate for timeline analysis.

---

## Step 3: Records 📁
**What:** Upload medical records and bills  
**Why:** AI needs source documents to extract data  
**Actions:**
1. Select your case from dropdown
2. Drag & drop PDF files (or click to browse)
3. Upload medical records, bills, police reports, etc.
4. Files are stored securely with automatic Bates numbering available

**💡 Tip:** Upload in batches by type (all medical records, then all bills). PDFs work best - scanned images require OCR.

---

## Step 4: Chronology 📅
**What:** AI-powered medical timeline extraction  
**Why:** Organizes medical events chronologically with ICD-10 codes  
**Actions:**
1. Select your case
2. Click "Apply Bates Numbers" (for legal citations)
3. Click "Process Documents" 
4. Wait 30-60 seconds for AI extraction
5. Review timeline with significance highlighting
6. Filter by critical/important/routine events

**💡 Tip:** Bates numbering adds source citations (e.g., SMITH-001234) required for legal work product.

**Output:** 
- Interactive timeline with events
- Color-coded by significance
- ICD-10 and CPT codes
- Provider tracking
- Source document references

---

## Step 5: Billing 💰
**What:** Automated bill extraction and overcharge detection  
**Why:** Calculate economic damages, find duplicates, identify overcharges  
**Actions:**
1. Select your case
2. Click "Extract Bills"
3. Wait 15-30 seconds for AI processing
4. Review:
   - Total medical expenses
   - Cost by provider (bar chart)
   - Cost by service type (pie chart)
   - Duplicate charges
   - Overcharges vs. Medicare rates

**💡 Tip:** Use this data to calculate economic damages for demand letters.

**Output:**
- Itemized medical expenses
- Provider breakdown
- Duplicate detection
- Overcharge analysis
- Charts and visualizations

---

## Step 6: Demand Letter 📝
**What:** Professional settlement demand letter generation  
**Why:** Final work product for insurance negotiations  
**Actions:**
1. Select your case
2. Choose demand type:
   - **Standard** - Normal settlement demand
   - **UIM** - Underinsured motorist claim
   - **Stowers** - Time-limited policy limits demand
3. Fill in details:
   - Defendant name
   - Incident description and location
   - Property damage
   - Lost wages (past and future)
   - Future medical expenses
   - Injury severity (minor/moderate/severe/catastrophic)
   - Liability strength (weak/moderate/strong/clear)
4. Demand amount (leave blank for AI calculation)
5. Click "Generate Demand Letter"
6. Wait 60-90 seconds for AI generation
7. Review and edit letter
8. Download as document

**💡 Tip:** AI pulls data from chronology and billing automatically. You just fill in case-specific details.

**Output:**
- Professional demand letter matching industry standards
- Includes:
  - Facts & Liability section
  - ICD-10 coded injuries
  - Chronological treatment narrative
  - Medical expenses table
  - Lifestyle impact (pain & suffering)
  - Damages summary
  - Settlement demand with deadline
  - Exhibits list

---

## 🔄 Complete Workflow Example

### Case: John Doe - Motor Vehicle Accident

**Step 1: Dashboard**
- Login → See "0 cases" → Click "Get Started"

**Step 2: Cases** (5 minutes)
- Click "New Patient"
  - Name: John Doe
  - DOB: 01/15/1980
  - Phone: 555-1234
  - Save
- Click "New Case"
  - Patient: John Doe
  - Type: Personal Injury
  - Incident: 03/15/2024
  - Defendant: Jane Smith
  - Insurance: State Farm
  - Claim #: SF-123456
  - Save

**Step 3: Records** (5 minutes)
- Select Case: DOE-001
- Upload 10 files:
  - Police report (1 PDF)
  - Emergency room records (2 PDFs)
  - Orthopedic records (4 PDFs)
  - Physical therapy notes (2 PDFs)
  - Medical bills (1 PDF)
- Status: 10 files uploaded ✅

**Step 4: Chronology** (2 minutes)
- Select Case: DOE-001
- Click "Apply Bates Numbers"
  - Result: 237 pages numbered with prefix "DOE"
- Click "Process Documents"
  - AI processing: 45 seconds
  - Result: 34 medical events extracted
- Review timeline:
  - 3 critical events (red): ER visit, surgery, MRI
  - 12 important events (yellow): specialist visits
  - 19 routine events (green): follow-ups
- Filter to "Critical" to see key events

**Step 5: Billing** (1 minute)
- Select Case: DOE-001
- Click "Extract Bills"
  - AI processing: 20 seconds
  - Result: 45 line items extracted
- Review summary:
  - Total Billed: $18,456.74
  - 2 duplicate charges found: $540.00
  - 3 overcharges detected: $1,200.00
  - Net reasonable amount: $16,716.74

**Step 6: Demand Letter** (3 minutes)
- Select Case: DOE-001
- Demand Type: Standard
- Fill in:
  - Defendant: Jane Smith
  - Location: Main St & 5th Ave
  - Incident: "Defendant ran red light and struck plaintiff's vehicle"
  - Property damage: $5,000
  - Past lost wages: $3,200
  - Future medical: $5,000
  - Injury severity: Moderate
  - Liability: Clear
- Click "Generate"
  - AI processing: 75 seconds
  - AI recommended demand: $85,000
- Review 8-page demand letter
- Edit liability section to add details
- Download as Markdown/PDF

**Total Time: ~15-20 minutes** (vs. 20-30 hours manual)

---

## 💡 Pro Tips

### For Best Results:
1. **Complete case details upfront** - Accurate dates and party info improve AI extraction
2. **Upload PDFs, not images** - Text-based PDFs extract better (OCR coming soon)
3. **Group documents by type** - Easier to track what's uploaded
4. **Apply Bates numbers before chronology** - Ensures proper source citations
5. **Review AI output** - Always verify extracted data for accuracy
6. **Edit demand letters** - AI generates 85-90% accurate drafts, you polish the rest

### Troubleshooting:
- **No events extracted?** Make sure documents contain medical records (not just bills)
- **No bills found?** Upload itemized statements, not just EOBs
- **Poor extraction?** Scanned images need OCR - use text-based PDFs
- **Wrong patient data?** Edit case details in Cases page

### Keyboard Shortcuts:
- `Ctrl+K` or `Cmd+K` - Quick search
- `Ctrl+N` or `Cmd+N` - New case
- `Ctrl+U` or `Cmd+U` - Upload documents

---

## 📊 What Each Service Generates

| Service | Input | Output | Time | Use For |
|---------|-------|--------|------|---------|
| **Chronology** | Medical records | Timeline with events | 30-60s | Trial prep, case review |
| **Billing** | Medical bills | Cost summary + analysis | 15-30s | Economic damages |
| **Demand Letter** | Case data + chronology + billing | Professional letter | 60-90s | Settlement negotiations |

---

## 🎓 Training Resources

### New Users:
1. Read this guide
2. Create test case with sample data
3. Process sample documents
4. Watch video tutorial (coming soon)

### Advanced Users:
- Batch processing (coming soon)
- Custom templates (coming soon)
- API access (enterprise only)

---

## 📞 Support

**Questions?** 
- Email: support@medrecordai.com
- Live chat: Available 9am-5pm EST
- Documentation: /docs

**Feature Requests?**
- Submit via feedback button
- Vote on roadmap: /roadmap

---

**Last Updated:** October 3, 2025  
**Version:** 1.0 MVP

