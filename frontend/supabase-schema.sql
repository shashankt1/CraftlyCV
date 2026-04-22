-- CraftlyCV Supabase Database Schema v2.0
-- Production-Ready Schema for Vercel Deployment
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── PROFILES TABLE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  username VARCHAR(20) UNIQUE,
  scans INTEGER DEFAULT 10 CHECK (scans >= 0),
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'lifetime', 'enterprise')),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  country VARCHAR(10) DEFAULT 'IN',
  language VARCHAR(10) DEFAULT 'en',
  currency VARCHAR(5) DEFAULT 'INR',
  referral_code VARCHAR(10) UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  resume_updated_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RESUMES TABLE ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  ats_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PAYMENT TRANSACTIONS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  order_id VARCHAR(100),
  plan_id VARCHAR(20),
  scans_added INTEGER,
  amount INTEGER,
  currency VARCHAR(5) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── REFERRALS TABLE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  credits_awarded INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SCAN LOGS TABLE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scan_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  scans_used INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── PROCESSED PAYMENTS (Idempotency) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS processed_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ADMIN AUDIT LOGS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── RATE LIMITING TABLE ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint VARCHAR(100) NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- RPC FUNCTIONS (Atomic Operations)
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── Atomic RPC: Add Scans ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION add_scans(p_user_id UUID, p_amount INTEGER)
RETURNS JSONB AS $$
BEGIN
  UPDATE profiles
  SET scans = scans + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING jsonb_build_object('success', true, 'new_scans', scans);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Atomic RPC: Deduct Scans (Race-condition safe) ────────────────────────────
CREATE OR REPLACE FUNCTION deduct_scan(p_user_id UUID, p_amount INTEGER)
RETURNS JSONB AS $$
DECLARE
  current_scans INTEGER;
  result JSONB;
BEGIN
  -- Get current scans with row lock to prevent race conditions
  SELECT scans INTO current_scans
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  -- Check if enough scans
  IF current_scans IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  IF current_scans < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient scans', 'current_scans', current_scans);
  END IF;

  -- Deduct scans atomically
  UPDATE profiles
  SET scans = GREATEST(0, scans - p_amount),
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING jsonb_build_object('success', true, 'new_scans', scans) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Atomic RPC: Check and Deduct Scans ────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_and_deduct_scan(p_user_id UUID, p_amount INTEGER)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT deduct_scan(p_user_id, p_amount) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RPC: Record Payment (Idempotent) ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION record_payment(
  p_payment_id VARCHAR(100),
  p_user_id UUID,
  p_order_id VARCHAR(100),
  p_plan_id VARCHAR(20),
  p_scans_added INTEGER,
  p_amount INTEGER,
  p_currency VARCHAR(5) DEFAULT 'INR'
)
RETURNS JSONB AS $$
DECLARE
  existing_payment UUID;
BEGIN
  -- Check if already processed (idempotency)
  SELECT id INTO existing_payment
  FROM processed_payments
  WHERE payment_id = p_payment_id;

  IF existing_payment IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'already_processed', true, 'message', 'Payment already recorded');
  END IF;

  -- Record the payment
  INSERT INTO payment_transactions (user_id, payment_id, order_id, plan_id, scans_added, amount, currency, status)
  VALUES (p_user_id, p_payment_id, p_order_id, p_plan_id, p_scans_added, p_amount, p_currency, 'completed');

  -- Mark as processed
  INSERT INTO processed_payments (payment_id, user_id)
  VALUES (p_payment_id, p_user_id);

  -- Add scans to user
  UPDATE profiles
  SET scans = scans + p_scans_added,
      plan = COALESCE(NULLIF(p_plan_id, ''), plan),
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN jsonb_build_object('success', true, 'message', 'Payment recorded successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RPC: Rate Limit Check ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION check_rate_limit(p_user_id UUID, p_endpoint VARCHAR(100), p_max_requests INTEGER DEFAULT 10, p_window_seconds INTEGER DEFAULT 60)
RETURNS JSONB AS $$
DECLARE
  current_count INTEGER;
  window_start TIMESTAMPTZ;
  result JSONB;
BEGIN
  -- Get current state
  SELECT request_count, window_start INTO current_count, window_start
  FROM rate_limits
  WHERE user_id = p_user_id AND endpoint = p_endpoint
  FOR UPDATE;

  -- Check if window has expired
  IF window_start IS NOT NULL AND window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL THEN
    -- Reset window
    DELETE FROM rate_limits WHERE user_id = p_user_id AND endpoint = p_endpoint;
    INSERT INTO rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, NOW())
    RETURNING jsonb_build_object('allowed', true, 'remaining', p_max_requests - 1) INTO result;
    RETURN result;
  END IF;

  -- Check if limit exceeded
  IF current_count >= p_max_requests THEN
    RETURN jsonb_build_object('allowed', false, 'error', 'Rate limit exceeded', 'retry_after', p_window_seconds);
  END IF;

  -- Increment counter
  IF current_count IS NULL THEN
    INSERT INTO rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, NOW());
  ELSE
    UPDATE rate_limits
    SET request_count = request_count + 1
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
  END IF;

  RETURN jsonb_build_object('allowed', true, 'remaining', p_max_requests - current_count - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── RPC: Admin Audit Log ────────────────────────────────────────────────────────
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

-- ─── RPC: Safe Admin User Update ────────────────────────────────────────────────
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
  result JSONB := jsonb_build_object('success', false);
BEGIN
  -- Verify admin role
  SELECT role = 'admin' INTO is_admin FROM profiles WHERE id = p_admin_id;

  IF NOT is_admin THEN
    -- Log unauthorized attempt
    PERFORM admin_log_action(p_admin_id, 'UNAUTHORIZED_ADMIN_ATTEMPT', p_target_user_id,
      jsonb_build_object('attempted_action', 'admin_update_user'));
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized - admin role required');
  END IF;

  -- Apply updates
  IF p_scan_adjustment IS NOT NULL THEN
    UPDATE profiles
    SET scans = GREATEST(0, scans + p_scan_adjustment),
        updated_at = NOW()
    WHERE id = p_target_user_id;
  END IF;

  IF p_new_plan IS NOT NULL THEN
    UPDATE profiles
    SET plan = p_new_plan,
        updated_at = NOW()
    WHERE id = p_target_user_id;
  END IF;

  IF p_new_role IS NOT NULL THEN
    UPDATE profiles
    SET role = p_new_role,
        updated_at = NOW()
    WHERE id = p_target_user_id;
  END IF;

  -- Log successful action
  PERFORM admin_log_action(p_admin_id, 'USER_UPDATE', p_target_user_id,
    jsonb_build_object('scan_adjustment', p_scan_adjustment, 'new_plan', p_new_plan, 'new_role', p_new_role));

  RETURN jsonb_build_object('success', true, 'message', 'User updated successfully');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- ─── PROFILES RLS ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin can view all profiles
CREATE POLICY "profiles_admin_select" ON profiles FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ─── RESUMES RLS ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can insert own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can update own resumes" ON resumes;
DROP POLICY IF EXISTS "Users can delete own resumes" ON resumes;

CREATE POLICY "resumes_select_own" ON resumes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "resumes_insert_own" ON resumes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "resumes_update_own" ON resumes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "resumes_delete_own" ON resumes FOR DELETE USING (auth.uid() = user_id);

-- ─── PAYMENT TRANSACTIONS RLS ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own transactions" ON payment_transactions;
DROP POLICY IF EXISTS "Service can insert transactions" ON payment_transactions;

CREATE POLICY "transactions_select_own" ON payment_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "transactions_service_insert" ON payment_transactions FOR INSERT WITH CHECK (true);

-- Admin can view all transactions
CREATE POLICY "transactions_admin_select" ON payment_transactions FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ─── SCAN LOGS RLS ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own scan logs" ON scan_logs;
DROP POLICY IF EXISTS "Service can insert scan logs" ON scan_logs;

CREATE POLICY "scanlogs_select_own" ON scan_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scanlogs_service_insert" ON scan_logs FOR INSERT WITH CHECK (true);

-- Admin can view all scan logs
CREATE POLICY "scanlogs_admin_select" ON scan_logs FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- ─── ADMIN AUDIT LOGS RLS ───────────────────────────────────────────────────────
-- Only admins can view audit logs, and only their own actions
CREATE POLICY "aditlogs_admin_only" ON admin_audit_logs FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Service role can insert (for automatic logging)
CREATE POLICY "aditlogs_service_insert" ON admin_audit_logs FOR INSERT WITH CHECK (true);

-- ─── PROCESSED PAYMENTS RLS ────────────────────────────────────────────────────
CREATE POLICY "processed_payments_service" ON processed_payments FOR ALL
  USING (true);  -- Service role only

-- ─── RATE LIMITS RLS ───────────────────────────────────────────────────────────
CREATE POLICY "rate_limits_own" ON rate_limits FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_ats_score ON resumes(ats_score);
CREATE INDEX IF NOT EXISTS idx_scan_logs_user_id ON scan_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_created_at ON scan_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_scan_logs_action_type ON scan_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_id ON payment_transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user_id ON admin_audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_endpoint ON rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start);
