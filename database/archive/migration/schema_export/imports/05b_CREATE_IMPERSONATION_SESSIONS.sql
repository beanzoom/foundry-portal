-- =====================================================
-- CREATE MISSING TABLE: impersonation_sessions
-- =====================================================
-- This table is used by portal admin impersonation feature
-- Allows admins to impersonate users for support purposes
-- =====================================================

CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  impersonated_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now() NOT NULL,
  ended_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT impersonation_sessions_no_self_impersonation CHECK (admin_id != impersonated_user_id),
  CONSTRAINT impersonation_sessions_valid_timeframe CHECK (ended_at IS NULL OR ended_at > started_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_admin_id
  ON impersonation_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_impersonated_user_id
  ON impersonation_sessions(impersonated_user_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_active
  ON impersonation_sessions(admin_id, impersonated_user_id)
  WHERE ended_at IS NULL;

-- RLS
ALTER TABLE impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can see all impersonation sessions
CREATE POLICY "Admins can view all impersonation sessions"
  ON impersonation_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Policy: Admins can create impersonation sessions
CREATE POLICY "Admins can create impersonation sessions"
  ON impersonation_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
    AND admin_id = auth.uid()
  );

-- Policy: Admins can end their own impersonation sessions
CREATE POLICY "Admins can end their own sessions"
  ON impersonation_sessions FOR UPDATE
  TO authenticated
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

-- Policy: Service role has full access
CREATE POLICY "Service role has full access"
  ON impersonation_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE impersonation_sessions IS 'Tracks admin impersonation sessions for portal support';
COMMENT ON COLUMN impersonation_sessions.admin_id IS 'Admin user who is impersonating';
COMMENT ON COLUMN impersonation_sessions.impersonated_user_id IS 'User being impersonated';
COMMENT ON COLUMN impersonation_sessions.started_at IS 'When impersonation session started';
COMMENT ON COLUMN impersonation_sessions.ended_at IS 'When impersonation session ended (NULL if active)';

-- Verification
DO $$
DECLARE
  table_count INTEGER;
  index_count INTEGER;
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'impersonation_sessions';

  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE schemaname = 'public' AND tablename = 'impersonation_sessions';

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public' AND tablename = 'impersonation_sessions';

  IF table_count = 1 AND index_count >= 3 AND policy_count >= 3 THEN
    RAISE NOTICE '✅ impersonation_sessions table created successfully';
    RAISE NOTICE '   - Table: Created';
    RAISE NOTICE '   - Indexes: % created', index_count;
    RAISE NOTICE '   - RLS Policies: % created', policy_count;
    RAISE NOTICE '   - Ready for triggers';
  ELSE
    RAISE WARNING '⚠ Verification incomplete';
    RAISE WARNING '   - Table: % (expected 1)', table_count;
    RAISE WARNING '   - Indexes: % (expected 3+)', index_count;
    RAISE WARNING '   - Policies: % (expected 3+)', policy_count;
  END IF;
END $$;
