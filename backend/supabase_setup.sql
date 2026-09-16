-- NIRIKSHAN AI - Supabase Table Setup
-- Run this SQL in: Supabase Dashboard → SQL Editor → New Query
-- Then click "Run"

-- ─── Store Tables (JSONB-based, flexible schema) ─────────────────────────────

CREATE TABLE IF NOT EXISTS store_agencies (
  id VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_projects (
  id VARCHAR(255) PRIMARY KEY,
  mp_id VARCHAR(255),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_proposals (
  id VARCHAR(255) PRIMARY KEY,
  mp_id VARCHAR(255),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_complaints (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_progress_updates (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_community_reports (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS store_external_schemes (
  id VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Audit Ledger ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_ledger (
  id BIGSERIAL PRIMARY KEY,
  table_name VARCHAR(100),
  record_id VARCHAR(255),
  action VARCHAR(100),
  actor VARCHAR(255),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Grant anon key access (needed for the backend's anon key) ────────────────

GRANT ALL ON store_agencies TO anon, authenticated;
GRANT ALL ON store_projects TO anon, authenticated;
GRANT ALL ON store_proposals TO anon, authenticated;
GRANT ALL ON store_complaints TO anon, authenticated;
GRANT ALL ON store_progress_updates TO anon, authenticated;
GRANT ALL ON store_community_reports TO anon, authenticated;
GRANT ALL ON store_external_schemes TO anon, authenticated;
GRANT ALL ON audit_ledger TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE audit_ledger_id_seq TO anon, authenticated;
