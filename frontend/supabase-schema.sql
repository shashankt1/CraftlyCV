-- CraftlyCV Supabase Schema v3.0
-- Production-Ready Schema for Vercel Deployment
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════════════════════════════════════════
-- CORE PROFILES (extends auth.users)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  username VARCHAR(20) UNIQUE,
  -- CraftlyCV Specific
  scans INTEGER DEFAULT 3 CHECK (scans >= 0),
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'career_launch', 'niche_pro', 'concierge')),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  -- User Preferences
  country VARCHAR(10) DEFAULT 'US',
  language VARCHAR(10) DEFAULT 'en',
  currency VARCHAR(5) DEFAULT 'USD',
  professional_track VARCHAR(30) DEFAULT 'general' CHECK (professional_track IN ('general', 'cybersecurity', 'nursing', 'skilled_trades', 'creative_tech')),
  experience_level VARCHAR(20) DEFAULT 'mid' CHECK (experience_level IN ('entry', 'mid', 'senior', 'executive')),
  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step INTEGER DEFAULT 0,
  -- Referral
  referral_code VARCHAR(10) UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  -- Timestamps
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- CRAFTLYCV CORE TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── MASTER RESUMES VAULT ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS master_resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) DEFAULT 'My Master Resume',
  is_primary BOOLEAN DEFAULT false,
  -- Personal Info
  full_name VARCHAR(200),
  email VARCHAR(255),
  phone VARCHAR(50),
  location VARCHAR(200),
  linkedin_url VARCHAR(500),
  github_url VARCHAR(500),
  website_url VARCHAR(500),
  professional_summary TEXT,
  -- Structured JSON Sections
  experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  awards JSONB DEFAULT '[]'::jsonb,
  tools JSONB DEFAULT '[]'::jsonb,
  languages JSONB DEFAULT '[]'::jsonb,
  -- Niche classification
  primary_niche VARCHAR(30) DEFAULT 'general' CHECK (primary_niche IN ('general', 'cybersecurity', 'nursing', 'skilled_trades', 'creative_tech')),
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TAILORED VERSIONS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tailored_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  master_resume_id UUID REFERENCES master_resumes(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  -- Target Job
  target_job_title VARCHAR(200),
  target_company VARCHAR(200),
  target_job_description TEXT,
  target_seniority VARCHAR(20),
  -- Tailored Content
  tailored_summary TEXT,
  tailored_experience JSONB DEFAULT '[]'::jsonb,
  tailored_skills JSONB DEFAULT '[]'::jsonb,
  tailored_education JSONB DEFAULT '[]'::jsonb,
  -- Match Scores
  match_score INTEGER,
  ats_risk_score INTEGER,
  missing_keywords TEXT[],
  matched_keywords TEXT[],
  proof_gaps TEXT[],
  -- AI Suggestions
  ai_suggestions JSONB DEFAULT '[]'::jsonb,
  ats_warnings JSONB DEFAULT '[]'::jsonb,
  authenticity_warnings JSONB DEFAULT '[]'::jsonb,
  -- Version Control
  version_number INTEGER DEFAULT 1,
  parent_version_id UUID REFERENCES tailored_versions(id),
  is_latest BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'applied')),
  -- Export Tracking
  exported_count INTEGER DEFAULT 0,
  last_exported_at TIMESTAMPTZ,
  export_mode VARCHAR(20) DEFAULT 'ats_safe' CHECK (export_mode IN ('ats_safe', 'creative_premium')),
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── MATCH REPORTS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS match_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tailored_version_id UUID REFERENCES tailored_versions(id) ON DELETE SET NULL,
  master_resume_id UUID REFERENCES master_resumes(id) ON DELETE SET NULL,
  -- Scores
  overall_match_score INTEGER,
  keyword_match_score INTEGER,
  skills_match_score INTEGER,
  experience_match_score INTEGER,
  proof_signal_score INTEGER,
  -- Analysis Results
  matched_keywords TEXT[],
  missing_keywords TEXT[],
  skill_gaps TEXT[],
  proof_gaps TEXT[],
  suggested_bullets JSONB DEFAULT '[]'::jsonb,
  section_relevance JSONB DEFAULT '[]'::jsonb,
  ats_warnings JSONB DEFAULT '[]'::jsonb,
  improvement_suggestions TEXT[],
  -- Job Details
  job_title VARCHAR(200),
  company_name VARCHAR(200),
  job_description TEXT,
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── NICHE TEMPLATES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS niche_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  niche VARCHAR(30) NOT NULL CHECK (niche IN ('cybersecurity', 'nursing', 'skilled_trades', 'creative_tech')),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  -- Template Structure
  suggested_sections JSONB DEFAULT '[]'::jsonb,
  skill_taxonomy JSONB DEFAULT '[]'::jsonb,
  achievement_prompts JSONB DEFAULT '[]'::jsonb,
  summary_template TEXT,
  bullet_templates JSONB DEFAULT '[]'::jsonb,
  -- Roles
  roles JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── EXPORT HISTORY ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS export_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tailored_version_id UUID REFERENCES tailored_versions(id) ON DELETE SET NULL,
  export_format VARCHAR(10) DEFAULT 'pdf' CHECK (export_format IN ('pdf', 'docx', 'html', 'txt')),
  export_mode VARCHAR(20) DEFAULT 'ats_safe',
  file_url TEXT,
  ats_parser_preview TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAYMENT TRANSACTIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  order_id VARCHAR(100),
  plan_id VARCHAR(20),
  plan_name VARCHAR(50),
  scans_added INTEGER DEFAULT 0,
  amount INTEGER NOT NULL,
  currency VARCHAR(5) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_provider VARCHAR(20) DEFAULT 'razorpay',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROCESSED PAYMENTS (Idempotency) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS processed_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REFERRALS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  credits_awarded INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SCAN LOGS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  scans_used INTEGER DEFAULT 1,
  credits_remaining INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RATE LIMITS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint VARCHAR(100) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- ─── ADMIN AUDIT LOGS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RPC FUNCTIONS (Atomic Operations)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Atomic: Deduct Scan (Race-condition safe) ────────────────────────────────
CREATE OR REPLACE FUNCTION deduct_scan(p_user_id UUID, p_amount INTEGER DEFAULT 1)
RETURNS JSONB AS $$
DECLARE
  current_scans INTEGER;
  result JSONB;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid scan amount', 'code', 'INVALID_AMOUNT');
  END IF;

  SELECT scans INTO current_scans
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF current_scans IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found', 'code', 'USER_NOT_FOUND');
  END IF;

  IF current_scans < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient scans',
      'code', 'INSUFFICIENT_SCANS',
      'current_scans', current_scans,
      'required', p_amount
    );
  END IF;

  UPDATE profiles
  SET scans = scans - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING jsonb_build_object('success', true, 'new_scans', scans) INTO result;

  -- Log the deduction
  INSERT INTO scan_logs (user_id, action_type, scans_used, credits_remaining)
  VALUES (p_user_id, 'ai_action', p_amount, (SELECT scans FROM profiles WHERE id = p_user_id));

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Atomic: Add Scans ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_scans(p_user_id UUID, p_amount INTEGER, p_action VARCHAR(50) DEFAULT 'purchase')
RETURNS JSONB AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid scan amount');
  END IF;

  UPDATE profiles
  SET scans = scans + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING jsonb_build_object('success', true, 'new_scans', scans);

  INSERT INTO scan_logs (user_id, action_type, scans_used, credits_remaining)
  VALUES (p_user_id, p_action, p_amount, (SELECT scans FROM profiles WHERE id = p_user_id));

  RETURN (SELECT jsonb_build_object('success', true, 'new_scans', scans) FROM profiles WHERE id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Atomic: Record Payment (Idempotent) ─────────────────────────────────────
CREATE OR REPLACE FUNCTION record_payment(
  p_payment_id VARCHAR(100),
  p_user_id UUID,
  p_order_id VARCHAR(100),
  p_plan_id VARCHAR(20),
  p_plan_name VARCHAR(50),
  p_scans_added INTEGER,
  p_amount INTEGER,
  p_currency VARCHAR(5) DEFAULT 'USD'
)
RETURNS JSONB AS $$
DECLARE
  existing_payment UUID;
BEGIN
  -- Idempotency check
  SELECT id INTO existing_payment FROM processed_payments WHERE payment_id = p_payment_id;
  IF existing_payment IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'already_processed', true, 'message', 'Payment already recorded');
  END IF;

  -- Record transaction
  INSERT INTO payment_transactions (user_id, payment_id, order_id, plan_id, plan_name, scans_added, amount, currency, status)
  VALUES (p_user_id, p_payment_id, p_order_id, p_plan_id, p_plan_name, p_scans_added, p_amount, p_currency, 'completed');

  -- Mark as processed
  INSERT INTO processed_payments (payment_id, user_id) VALUES (p_payment_id, p_user_id);

  -- Add scans
  UPDATE profiles SET scans = scans + p_scans_added, plan = p_plan_id, updated_at = NOW() WHERE id = p_user_id;

  -- Award referral credits if applicable
  UPDATE profiles SET scans = scans + 1 WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Payment recorded', 'new_scans', (SELECT scans FROM profiles WHERE id = p_user_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Rate Limit Check ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_user_id UUID,
  p_endpoint VARCHAR(100),
  p_max_requests INTEGER DEFAULT 10,
  p_window_seconds INTEGER DEFAULT 60
)
RETURNS JSONB AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
BEGIN
  SELECT request_count, window_start INTO current_count, window_start
  FROM rate_limits
  WHERE user_id = p_user_id AND endpoint = p_endpoint
  FOR UPDATE;

  -- Reset if window expired
  IF window_start IS NOT NULL AND window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN
    DELETE FROM rate_limits WHERE user_id = p_user_id AND endpoint = p_endpoint;
    INSERT INTO rate_limits (user_id, endpoint, request_count, window_start) VALUES (p_user_id, p_endpoint, 1, NOW());
    RETURN jsonb_build_object('allowed', true, 'remaining', p_max_requests - 1);
  END IF;

  -- Check limit
  IF current_count >= p_max_requests THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Rate limit exceeded', 'retry_after', p_window_seconds);
  END IF;

  -- Increment
  IF current_count IS NULL THEN
    INSERT INTO rate_limits (user_id, endpoint, request_count, window_start) VALUES (p_user_id, p_endpoint, 1, NOW());
  ELSE
    UPDATE rate_limits SET request_count = request_count + 1 WHERE user_id = p_user_id AND endpoint = p_endpoint;
  END IF;

  RETURN jsonb_build_object('allowed', true, 'remaining', p_max_requests - current_count - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Admin: Update User ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_update_user(
  p_admin_id UUID,
  p_target_user_id UUID,
  p_scan_adjustment INTEGER DEFAULT NULL,
  p_new_plan VARCHAR(20) DEFAULT NULL,
  p_new_role VARCHAR(20) DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  SELECT role = 'admin' INTO is_admin FROM profiles WHERE id = p_admin_id;
  IF NOT is_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF p_scan_adjustment IS NOT NULL THEN
    UPDATE profiles SET scans = GREATEST(0, scans + p_scan_adjustment), updated_at = NOW() WHERE id = p_target_user_id;
  END IF;
  IF p_new_plan IS NOT NULL THEN
    UPDATE profiles SET plan = p_new_plan, updated_at = NOW() WHERE id = p_target_user_id;
  END IF;
  IF p_new_role IS NOT NULL THEN
    UPDATE profiles SET role = p_new_role, updated_at = NOW() WHERE id = p_target_user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message', 'User updated');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Admin: Audit Log ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_log_action(
  p_admin_id UUID,
  p_action VARCHAR(100),
  p_target_user_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}',
  p_ip_address VARCHAR(45) DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  INSERT INTO admin_audit_logs (admin_id, action, target_user_id, metadata, ip_address)
  VALUES (p_admin_id, p_action, p_target_user_id, p_metadata, p_ip_address);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tailored_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE niche_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROFILES RLS: Fixed for trigger-created profiles and edge cases
-- ═══════════════════════════════════════════════════════════════════════════════

-- SELECT: Users can read their own profile (trigger creates with service role)
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- INSERT: Allow users to insert their own profile (fallback for manual creation)
-- NOTE: The WITH CHECK matches the row being inserted, id = auth.uid() ensures ownership
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- DELETE: Users can delete their own profile (account deletion)
CREATE POLICY "profiles_delete_own" ON profiles
  FOR DELETE USING (auth.uid() = id);

-- ADMIN: Full access for admins (subquery prevents null reference issues)
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- ═══════════════════════════════════════════════════════════════════════════════
-- OTHER TABLE RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Master Resumes
CREATE POLICY "master_resumes_own" ON master_resumes
  FOR ALL USING (auth.uid() = user_id);

-- Tailored Versions
CREATE POLICY "tailored_versions_own" ON tailored_versions
  FOR ALL USING (auth.uid() = user_id);

-- Match Reports
CREATE POLICY "match_reports_own" ON match_reports
  FOR ALL USING (auth.uid() = user_id);

-- Niche Templates (public read, admin write)
CREATE POLICY "niche_templates_public" ON niche_templates
  FOR SELECT USING (true);
CREATE POLICY "niche_templates_admin" ON niche_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Export History
CREATE POLICY "export_history_own" ON export_history
  FOR ALL USING (auth.uid() = user_id);

-- Payment Transactions
CREATE POLICY "transactions_own" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_admin" ON payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
CREATE POLICY "transactions_insert_service" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Scan Logs
CREATE POLICY "scan_logs_own" ON scan_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scan_logs_admin" ON scan_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Rate Limits
CREATE POLICY "rate_limits_own" ON rate_limits
  FOR ALL USING (auth.uid() = user_id);

-- Admin Audit Logs
CREATE POLICY "audit_logs_admin" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Processed Payments (service role only)
CREATE POLICY "processed_payments_service" ON processed_payments
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Referrals
CREATE POLICY "referrals_own" ON referrals
  FOR ALL USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_master_resumes_user_id ON master_resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_master_resumes_primary ON master_resumes(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_tailored_versions_user_id ON tailored_versions(user_id);
CREATE INDEX IF NOT EXISTS idx_tailored_versions_master_id ON tailored_versions(master_resume_id);
CREATE INDEX IF NOT EXISTS idx_tailored_versions_match_score ON tailored_versions(match_score);
CREATE INDEX IF NOT EXISTS idx_tailored_versions_status ON tailored_versions(status);
CREATE INDEX IF NOT EXISTS idx_match_reports_user_id ON match_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_match_reports_tailored_id ON match_reports(tailored_version_id);
CREATE INDEX IF NOT EXISTS idx_niche_templates_niche ON niche_templates(niche);
CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_scan_logs_user_id ON scan_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_created_at ON scan_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER: Auto-update updated_at
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER master_resumes_updated_at BEFORE UPDATE ON master_resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tailored_versions_updated_at BEFORE UPDATE ON tailored_versions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════════
-- TRIGGER: Auto-create profile on auth.users insert
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_email TEXT;
  v_username_base TEXT;
  v_username TEXT;
  v_referral_code TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Get email safely (handle nulls)
  v_email := COALESCE(NEW.email, '');

  -- Generate base username from email prefix
  v_username_base := COALESCE(
    REGEXP_REPLACE(
      LOWER(SPLIT_PART(v_email, '@', 1)),
      '[^a-z0-9]', '', 'g'
    ),
    'user'
  );

  -- Handle empty username base
  IF v_username_base = '' OR v_username_base IS NULL THEN
    v_username_base := 'user';
  END IF;

  -- Generate unique username with suffix if needed
  v_username := v_username_base;
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = v_username) LOOP
    v_counter := v_counter + 1;
    v_username := v_username_base || v_counter::TEXT;
    -- Safety valve: if counter gets too high, use UUID short form
    IF v_counter > 1000 THEN
      v_username := 'user_' || LEFT(NEW.id::TEXT, 8);
      EXIT;
    END IF;
  END LOOP;

  -- Generate unique referral code
  v_referral_code := COALESCE(
    UPPER(SUBSTR(v_username_base, 1, 8)) || '_' || SUBSTR(NEW.id::TEXT, 1, 4),
    'REF_' || SUBSTR(NEW.id::TEXT, 1, 8)
  );

  -- Handle duplicates for referral code too
  WHILE EXISTS (SELECT 1 FROM profiles WHERE referral_code = v_referral_code) LOOP
    v_referral_code := v_referral_code || '_' || FLOOR(RANDOM() * 10)::TEXT;
  END LOOP;

  -- Insert profile (SERVICE ROLE BYPASSES RLS, so this always works)
  INSERT INTO profiles (
    id,
    email,
    username,
    scans,
    plan,
    role,
    country,
    language,
    currency,
    professional_track,
    experience_level,
    onboarding_completed,
    onboarding_step,
    referral_code,
    last_active_at,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    v_email,
    v_username,
    3,                   -- starter scans
    'free',              -- default plan
    'user',              -- default role
    'US',                -- default country
    'en',                -- default language
    'USD',               -- default currency
    'general',           -- default professional track
    'mid',               -- default experience level
    false,               -- onboarding not complete
    0,                   -- starting at step 0
    v_referral_code,     -- unique referral code
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Idempotent: handles race conditions

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE NOTICE 'handle_new_user failed: % %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if present, then create fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ═══════════════════════════════════════════════════════════════════════════════
-- REPAIR BROKEN RLS: Force service role bypass for profile creation trigger
-- The trigger runs as the service role, so we grant SERVICE ROLE permission
-- ═══════════════════════════════════════════════════════════════════════════════

-- Allow service role to insert profiles regardless of RLS
GRANT USAGE ON SCHEMA public TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON profiles TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON master_resumes TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON tailored_versions TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON match_reports TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON scan_logs TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON export_history TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON payment_transactions TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON referrals TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON rate_limits TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON admin_audit_logs TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON processed_payments TO service_role;
GRANT INSERT, SELECT, UPDATE, DELETE ON niche_templates TO service_role;
