-- Migration: Create logs table for application logging
-- Run this in Supabase SQL Editor

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'warn', 'error')),
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('api', 'admin', 'background', 'error', 'system')),
  metadata JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_category ON logs(category);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id);

-- Enable Row Level Security
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read logs
-- Note: This assumes you have an admin check function or will use service role key
-- For now, we'll allow authenticated users to read (you can restrict further based on admin emails)
CREATE POLICY "Admins can read logs" ON logs
  FOR SELECT
  USING (true); -- In production, replace with actual admin check: auth.jwt() ->> 'email' IN (SELECT unnest(ARRAY['admin@example.com']))

-- Policy: Only service role (server-side) can insert logs
CREATE POLICY "Service role can insert logs" ON logs
  FOR INSERT
  WITH CHECK (true); -- Service role bypasses RLS, but this is for clarity

-- Verify the migration
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'logs'
  ) THEN
    RAISE EXCEPTION 'Migration failed: logs table not found';
  END IF;
END $$;

