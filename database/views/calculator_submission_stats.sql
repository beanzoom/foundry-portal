-- Create calculator_submission_stats view
-- This view provides aggregate statistics about calculator submissions

CREATE OR REPLACE VIEW calculator_submission_stats AS
SELECT
  COUNT(*)::integer as total_submissions,
  COUNT(DISTINCT COALESCE(user_id::text, user_email))::integer as unique_users,
  COALESCE(AVG(total_monthly_savings), 0)::numeric as avg_monthly_savings,
  COALESCE(AVG(total_annual_savings), 0)::numeric as avg_annual_savings,
  COALESCE(MAX(total_monthly_savings), 0)::numeric as max_monthly_savings,
  COALESCE(MIN(total_monthly_savings), 0)::numeric as min_monthly_savings,
  COALESCE(SUM(total_monthly_savings), 0)::numeric as total_potential_monthly,
  COALESCE(SUM(total_annual_savings), 0)::numeric as total_potential_annual,
  COALESCE(AVG(CASE WHEN afs_savings_total > 0 THEN afs_savings_total END), 0)::numeric as avg_afs_savings,
  COALESCE(SUM(afs_savings_total), 0)::numeric as total_afs_savings,
  COUNT(CASE WHEN afs_savings_total > 0 THEN 1 END)::integer as submissions_with_afs,
  COUNT(CASE WHEN submission_date >= NOW() - INTERVAL '30 days' THEN 1 END)::integer as submissions_last_30_days,
  COUNT(CASE WHEN submission_date >= NOW() - INTERVAL '7 days' THEN 1 END)::integer as submissions_last_7_days
FROM calculator_submissions;

-- Grant permissions
GRANT SELECT ON calculator_submission_stats TO authenticated, anon, service_role;
