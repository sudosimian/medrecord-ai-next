-- MedRecord AI Database Schema
-- note: Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cases table
CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  case_number TEXT UNIQUE,
  case_type TEXT CHECK (case_type IN ('personal_injury', 'workers_comp', 'medical_malpractice', 'other')),
  incident_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  attorney_name TEXT,
  insurance_company TEXT,
  claim_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  document_type TEXT CHECK (document_type IN ('medical_record', 'bill', 'imaging', 'lab_report', 'deposition', 'legal', 'other')),
  page_count INTEGER,
  extracted_text TEXT,
  ocr_completed BOOLEAN DEFAULT FALSE,
  classified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical Events table (for chronologies)
CREATE TABLE IF NOT EXISTS public.medical_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  provider_name TEXT,
  facility TEXT,
  event_type TEXT,
  description TEXT NOT NULL,
  significance_score INTEGER CHECK (significance_score >= 1 AND significance_score <= 5),
  icd_codes TEXT[],
  cpt_codes TEXT[],
  is_duplicate BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  provider_name TEXT,
  bill_date DATE,
  service_date DATE,
  bill_amount DECIMAL(10,2),
  paid_amount DECIMAL(10,2),
  outstanding_amount DECIMAL(10,2),
  cpt_code TEXT,
  description TEXT,
  is_duplicate BOOLEAN DEFAULT FALSE,
  is_reasonable BOOLEAN,
  medicare_rate DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Analysis Results table
CREATE TABLE IF NOT EXISTS public.ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  analysis_type TEXT CHECK (analysis_type IN ('chronology', 'billing', 'demand_letter', 'narrative', 'medical_opinion', 'deposition')),
  input_data JSONB,
  output_data JSONB,
  ai_model TEXT,
  confidence_score DECIMAL(3,2),
  reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Legal Documents table
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE,
  document_type TEXT CHECK (document_type IN ('demand_letter', 'expert_opinion', 'narrative_summary', 'deposition_summary')),
  content JSONB,
  exported_path TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'final')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Annotations table
CREATE TABLE IF NOT EXISTS public.annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  page_number INTEGER,
  x_position DECIMAL(5,2),
  y_position DECIMAL(5,2),
  width DECIMAL(5,2),
  height DECIMAL(5,2),
  annotation_type TEXT CHECK (annotation_type IN ('highlight', 'note', 'redaction')),
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) Policies

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Patients policies
CREATE POLICY "Users can view own patients" ON public.patients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patients" ON public.patients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own patients" ON public.patients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own patients" ON public.patients FOR DELETE USING (auth.uid() = user_id);

-- Cases policies
CREATE POLICY "Users can view own cases" ON public.cases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cases" ON public.cases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cases" ON public.cases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cases" ON public.cases FOR DELETE USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- Medical Events policies
CREATE POLICY "Users can view own medical events" ON public.medical_events FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = medical_events.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can insert own medical events" ON public.medical_events FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can update own medical events" ON public.medical_events FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = medical_events.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can delete own medical events" ON public.medical_events FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = medical_events.case_id AND cases.user_id = auth.uid()));

-- Bills policies
CREATE POLICY "Users can view own bills" ON public.bills FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = bills.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can insert own bills" ON public.bills FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can update own bills" ON public.bills FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = bills.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can delete own bills" ON public.bills FOR DELETE 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = bills.case_id AND cases.user_id = auth.uid()));

-- AI Analyses policies
CREATE POLICY "Users can view own analyses" ON public.ai_analyses FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = ai_analyses.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can insert own analyses" ON public.ai_analyses FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_id AND cases.user_id = auth.uid()));

-- Legal Documents policies
CREATE POLICY "Users can view own legal docs" ON public.legal_documents FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = legal_documents.case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can insert own legal docs" ON public.legal_documents FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = case_id AND cases.user_id = auth.uid()));
CREATE POLICY "Users can update own legal docs" ON public.legal_documents FOR UPDATE 
  USING (EXISTS (SELECT 1 FROM public.cases WHERE cases.id = legal_documents.case_id AND cases.user_id = auth.uid()));

-- Annotations policies
CREATE POLICY "Users can view own annotations" ON public.annotations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own annotations" ON public.annotations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own annotations" ON public.annotations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own annotations" ON public.annotations FOR DELETE USING (auth.uid() = user_id);

-- Functions and Triggers

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_medical_events_updated_at BEFORE UPDATE ON public.medical_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bills_updated_at BEFORE UPDATE ON public.bills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ai_analyses_updated_at BEFORE UPDATE ON public.ai_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_legal_documents_updated_at BEFORE UPDATE ON public.legal_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_annotations_updated_at BEFORE UPDATE ON public.annotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_patients_user_id ON public.patients(user_id);
CREATE INDEX idx_cases_user_id ON public.cases(user_id);
CREATE INDEX idx_cases_patient_id ON public.cases(patient_id);
CREATE INDEX idx_documents_case_id ON public.documents(case_id);
CREATE INDEX idx_documents_patient_id ON public.documents(patient_id);
CREATE INDEX idx_medical_events_case_id ON public.medical_events(case_id);
CREATE INDEX idx_medical_events_event_date ON public.medical_events(event_date);
CREATE INDEX idx_bills_case_id ON public.bills(case_id);
CREATE INDEX idx_ai_analyses_case_id ON public.ai_analyses(case_id);
CREATE INDEX idx_legal_documents_case_id ON public.legal_documents(case_id);

-- Narrative Summaries table
CREATE TABLE public.narratives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  injury_categories JSONB,
  causation_analyses JSONB,
  pre_existing_conditions JSONB,
  treatment_phases JSONB,
  functional_impacts JSONB,
  comparative_analysis JSONB,
  executive_summary TEXT,
  full_narrative TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deposition Summaries table
CREATE TABLE public.depositions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  witness JSONB NOT NULL,
  total_pages INTEGER,
  deposition_date DATE,
  location TEXT,
  issues JSONB,
  qa_pairs JSONB,
  contradictions JSONB,
  key_admissions JSONB,
  key_denials JSONB,
  executive_summary TEXT,
  issue_summaries JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table (paralegal/attorney feedback)
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_summary TEXT,
  missing_documents TEXT,
  timeline_gaps TEXT,
  recommended_actions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for narratives
ALTER TABLE public.narratives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own narratives"
  ON public.narratives FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own narratives"
  ON public.narratives FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own narratives"
  ON public.narratives FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own narratives"
  ON public.narratives FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for depositions
ALTER TABLE public.depositions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own depositions"
  ON public.depositions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own depositions"
  ON public.depositions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own depositions"
  ON public.depositions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own depositions"
  ON public.depositions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER update_narratives_updated_at BEFORE UPDATE ON public.narratives FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_depositions_updated_at BEFORE UPDATE ON public.depositions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_narratives_case_id ON public.narratives(case_id);
CREATE INDEX idx_narratives_user_id ON public.narratives(user_id);
CREATE INDEX idx_depositions_case_id ON public.depositions(case_id);
CREATE INDEX idx_depositions_user_id ON public.depositions(user_id);
CREATE INDEX idx_reviews_case_id ON public.reviews(case_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);

-- =========================
-- REVIEWS: Paralegal/Attorney review records
-- Purpose: track human-in-the-loop feedback on a case (gaps, actions, notes)
-- =========================
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text CHECK (role IN ('paralegal','attorney')) NOT NULL,  -- reviewer role
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_review','approved','needs_records')),
  summary text,                              -- short summary of findings
  missing_documents jsonb NOT NULL DEFAULT '[]'::jsonb,  -- list of doc types/records still needed
  timeline_gaps jsonb NOT NULL DEFAULT '[]'::jsonb,      -- places dates/visits are missing
  recommended_actions jsonb NOT NULL DEFAULT '[]'::jsonb,-- next steps (request X, follow-up, etc.)
  notes text,                                  -- freeform notes
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS: reviewers can see their own; case owners can see reviews on their cases
CREATE POLICY "reviewer_read_own_or_case_owner" ON public.reviews
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id
     OR EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.user_id = auth.uid()));

CREATE POLICY "reviewer_insert_own" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviewer_update_own" ON public.reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_case_id ON public.reviews(case_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- keep updated_at fresh
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- =========================
-- JOBS: background work (ingest/ocr/classify/extract/package)
-- Purpose: handle big case processing asynchronously; show progress to users
-- =========================
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.cases(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('ingest','ocr','classify','extract','package')),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','needs_attention','done','failed')),
  progress int DEFAULT 0,          -- 0..100
  error text,                      -- last error message if any
  payload jsonb DEFAULT '{}'::jsonb,  -- params/context
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_rw_case_owner" ON public.jobs
  USING (case_id IS NULL OR EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.user_id = auth.uid()))
  WITH CHECK (case_id IS NULL OR EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_jobs_case_id ON public.jobs(case_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

-- Job events (logs) for transparency/debug
CREATE TABLE IF NOT EXISTS public.job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  level text CHECK (level IN ('info','warn','error')) DEFAULT 'info',
  message text NOT NULL,
  at timestamptz DEFAULT now()
);
ALTER TABLE public.job_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_job_events_job_id ON public.job_events(job_id);

CREATE POLICY "job_events_read_case_owner" ON public.job_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.jobs j
            JOIN public.cases c ON c.id = j.case_id
           WHERE j.id = job_id AND c.user_id = auth.uid())
  );


-- =========================
-- QUOTES: per-case pricing (pages, complexity, review level, state)
-- Purpose: instant estimate for your per-case pricing model
-- =========================
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  pages int,
  passengers int,
  providers int,
  review_level text CHECK (review_level IN ('ai_only','paralegal','us_attorney','state_attorney')) NOT NULL,
  state text,
  base_price numeric(10,2),
  labor_price numeric(10,2),
  jurisdiction_uplift numeric(10,2),
  total numeric(10,2),
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quotes_by_owner" ON public.quotes
  USING (case_id IS NULL OR EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.user_id = auth.uid()))
  WITH CHECK (case_id IS NULL OR EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.user_id = auth.uid()));
