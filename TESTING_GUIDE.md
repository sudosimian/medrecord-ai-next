# Testing Guide - MedRecord AI

## Server Running
- Local: http://localhost:3001
- Network: http://192.168.1.238:3001

## Test Scenario: Complete Case Workflow

### Prerequisites
- Supabase database is set up
- OpenAI API key is configured in .env.local
- Dev server is running

### Test Case: John Doe - Motor Vehicle Accident

#### Phase 1: Authentication & Setup (5 min)

**Step 1.1: Sign Up / Login**
- Navigate to http://localhost:3001
- Click "Login" or go to /login
- Create account or sign in with existing credentials
- Expected: Redirect to /dashboard

**Step 1.2: Verify Dashboard**
- Check dashboard displays welcome message
- Verify navigation sidebar is visible
- Expected: All 11 navigation items visible

#### Phase 2: Case Creation (5 min)

**Step 2.1: Create Patient**
- Navigate to /cases
- Click "New Patient"
- Fill in:
  - First Name: John
  - Last Name: Doe
  - DOB: 01/15/1985
  - Phone: 555-123-4567
  - Email: john.doe@example.com
- Click "Create"
- Expected: Success message, patient appears in list

**Step 2.2: Create Case**
- Click "New Case"
- Fill in:
  - Patient: John Doe
  - Case Type: Personal Injury
  - Status: Active
  - Incident Date: 03/15/2024
  - Incident Location: Main St & 5th Ave, City, State
  - Incident Description: Defendant ran red light and struck plaintiff's vehicle
  - Defendant Name: Jane Smith
  - Insurance Company: State Farm
  - Claim Number: SF-123456
  - Policy Limit: 100000
- Click "Create Case"
- Expected: Case number generated (e.g., DOE-001), redirect to case detail

#### Phase 3: Document Upload (5 min)

**Step 3.1: Upload Medical Records**
- Navigate to /records
- Select Case: DOE-001
- Drag and drop or select PDFs:
  - Emergency room report
  - Orthopedic consultation notes
  - X-ray reports
  - Physical therapy notes
  - Medical bills
- Expected: Files upload successfully, see file list

**Step 3.2: Verify Upload**
- Check document count
- Verify file names are correct
- Expected: All files listed with correct names and sizes

#### Phase 4: Medical Chronology (10 min)

**Step 4.1: Apply Bates Numbering**
- Navigate to /chronology
- Select Case: DOE-001
- Click "Apply Bates Numbers"
- Wait 5-10 seconds
- Expected: Success alert with page count and prefix (DOE)

**Step 4.2: Process Documents**
- Click "Process Documents"
- Wait 30-60 seconds
- Expected: Progress indicator, then success message

**Step 4.3: Review Timeline**
- Scroll through timeline events
- Check for:
  - Chronological order
  - Provider names
  - Event descriptions
  - ICD-10/CPT codes
  - Significance badges (Critical/Important/Routine)
  - Bates numbers/page references
- Expected: Events displayed with all metadata

**Step 4.4: Test Clickable Links**
- Click on a Bates number in source reference
- Expected: Opens signed URL to source document in new tab

**Step 4.5: Export Chronology**
- Click "Export Excel"
- Expected: Downloads .xlsx file with all events
- Click "Export Word"
- Expected: Downloads .docx file with formatted chronology

#### Phase 5: Billing Summary (10 min)

**Step 5.1: Extract Bills**
- Navigate to /billing
- Select Case: DOE-001
- Click "Extract Bills"
- Wait 15-30 seconds
- Expected: Bills extracted and displayed

**Step 5.2: Review Summary**
- Check stats:
  - Total Billed
  - Number of Bills
  - Duplicates (if any)
  - Overcharges (if any)
- View charts:
  - Cost by Provider (bar chart)
  - Cost by Service Type (pie chart)
- Expected: All data displays correctly

**Step 5.3: Export Billing**
- Click "Export Excel"
- Expected: Downloads .xlsx with 2 sheets (Bills + Summary)

#### Phase 6: Narrative Summary (10 min)

**Step 6.1: Generate Narrative**
- Navigate to /narrative
- Select Case: DOE-001
- Click "Generate Narrative"
- Wait 30-60 seconds
- Expected: AI generates comprehensive narrative

**Step 6.2: Review Content**
- Check sections:
  - Executive Summary
  - Injuries by Category (with severity badges)
  - Causation Analysis (with scores)
  - Full Narrative
- Expected: All sections populated with relevant content

**Step 6.3: Export Narrative**
- Click "Export Word"
- Expected: Downloads .docx file

#### Phase 7: Deposition Summary (15 min)

**Step 7.1: Process Deposition**
- Navigate to /depositions
- Select Case: DOE-001
- Select deposition transcript document
- Fill in:
  - Witness Name: Jane Smith
  - Witness Role: Defendant
  - Deposition Date: 09/15/2024
- Click "Process Deposition"
- Wait 60-120 seconds
- Expected: Deposition processed successfully

**Step 7.2: Review Summary**
- Check:
  - Executive Summary
  - Number of Issues
  - Number of Admissions
  - Number of Contradictions
- Expected: All statistics displayed

**Step 7.3: Export Deposition**
- Click "Export Excel"
- Expected: Downloads .xlsx with 3 sheets (Q&A, Issues, Contradictions)

#### Phase 8: Demand Letter (10 min)

**Step 8.1: Generate Demand**
- Navigate to /demand-letter
- Select Case: DOE-001
- Choose Type: Standard
- Fill in:
  - Property Damage: 5000
  - Past Lost Wages: 3200
  - Future Medical Expenses: 5000-10000
  - Injury Severity: Moderate
  - Liability Strength: Strong
  - Demand Amount: (leave blank for AI recommendation)
- Click "Generate Demand Letter"
- Wait 60-90 seconds
- Expected: Multi-page demand letter generated

**Step 8.2: Review Letter**
- Check sections:
  - Header with RE: line
  - Liability section
  - Medical treatment section
  - Damages calculation
  - Demand amount
  - Deadline
- Expected: Professional format, all sections complete

#### Phase 9: Utility Services (10 min)

**Step 9.1: Provider List**
- Navigate to /providers
- Select Case: DOE-001
- Review provider cards:
  - Names and specialties
  - Facilities
  - Visit dates
  - Visit counts
  - Total charges
- Click "Export Excel"
- Expected: Downloads provider roster

**Step 9.2: Missing Records**
- Navigate to /missing-records
- Select Case: DOE-001
- Review detected gaps:
  - Type of missing record
  - Importance level (Critical/Important/Routine)
  - Expected date
  - Provider
  - Reason
- Expected: AI-detected missing records listed

**Step 9.3: Medical Synopsis**
- Navigate to /synopsis
- Select Case: DOE-001
- Wait 10-20 seconds for generation
- Review:
  - Executive summary (3-5 sentences)
  - Case strength badge
  - Medical costs
  - Treatment days
  - Key injuries
  - Key providers
- Expected: Concise case overview

#### Phase 10: Edge Cases & Error Handling (10 min)

**Step 10.1: Test Without Data**
- Select a case with no documents uploaded
- Try to process chronology
- Expected: Appropriate error message or empty state

**Step 10.2: Test Invalid Inputs**
- Try to create case without required fields
- Expected: Validation errors

**Step 10.3: Test Loading States**
- Trigger long operations (chronology, demand letter)
- Check loading spinners and disabled buttons
- Expected: UI indicates processing state

**Step 10.4: Test Export Functions**
- Export from multiple services
- Open exported files
- Verify data integrity
- Expected: All exports contain correct data

#### Phase 11: Multi-User Testing (10 min)

**Step 11.1: Create Second User**
- Open incognito window
- Sign up with different email
- Create a case
- Expected: Cannot see first user's cases

**Step 11.2: Verify RLS**
- Try to access first user's case ID via URL
- Expected: 404 or unauthorized

## Performance Benchmarks

**Expected Processing Times:**
- Document Upload (10 files): < 10 seconds
- Bates Numbering (100 pages): 5-10 seconds
- Chronology Processing (100 pages): 30-60 seconds
- Billing Extraction (20 bills): 15-30 seconds
- Narrative Generation: 30-60 seconds
- Deposition Processing (200 pages): 60-120 seconds
- Demand Letter Generation: 60-90 seconds
- Provider List: < 3 seconds
- Missing Records Detection: < 5 seconds
- Synopsis Generation: 10-20 seconds

## Common Issues & Solutions

**Issue 1: "Unauthorized" Errors**
- Solution: Check Supabase connection, verify user is logged in

**Issue 2: Slow AI Processing**
- Solution: Check OpenAI API key, verify API limits not reached

**Issue 3: Export Not Downloading**
- Solution: Check browser pop-up blocker, verify file generation

**Issue 4: Documents Not Uploading**
- Solution: Check Supabase storage bucket exists, verify RLS policies

**Issue 5: Missing Navigation Items**
- Solution: Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

## Success Criteria

**All Tests Pass If:**
- [ ] User can sign up and log in
- [ ] Case and patient creation works
- [ ] Documents upload successfully
- [ ] Bates numbering applies correctly
- [ ] Chronology generates with events
- [ ] Clickable source links work
- [ ] Billing summary extracts bills
- [ ] Narrative generates successfully
- [ ] Deposition processes correctly
- [ ] Demand letter generates
- [ ] All exports download and open
- [ ] Provider list displays
- [ ] Missing records detected
- [ ] Synopsis generates
- [ ] RLS prevents cross-user access
- [ ] No console errors
- [ ] Loading states work
- [ ] Empty states display correctly

## Test Data Recommendations

**Sample Medical Records:**
- Emergency room report (3-5 pages)
- Physician consultation (2-3 pages)
- Diagnostic imaging report (2-4 pages)
- Physical therapy notes (5-10 pages)
- Medical bills (3-5 documents)
- Deposition transcript (50-200 pages)

**Total Test Documents:** 15-25 PDFs, 100-300 pages

## Automated Testing (Future)

**Unit Tests:** API routes, utility functions
**Integration Tests:** Database operations, AI processing
**E2E Tests:** Full workflow with Playwright or Cypress

## Reporting Issues

**Issue Template:**
1. Service/Page affected
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots (if applicable)
6. Console errors
7. Browser and OS

## Testing Complete

**After all tests pass:**
- Document any issues found
- Note performance observations
- Suggest improvements
- Mark platform as QA approved

---

**Testing Duration:** 90-120 minutes
**Tester:** QA Team / Product Owner
**Environment:** Development (localhost:3001)
**Date:** October 3, 2025

