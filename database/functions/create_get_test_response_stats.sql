-- Create get_test_response_stats function
-- This function returns statistics about test survey responses
-- Returns a summary of test responses across all surveys

CREATE OR REPLACE FUNCTION public.get_test_response_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    jsonb_build_object(
      'total_test_responses', COUNT(*),
      'surveys_with_test_responses', COUNT(DISTINCT survey_id),
      'last_test_response', MAX(started_at)
    ),
    jsonb_build_object(
      'total_test_responses', 0,
      'surveys_with_test_responses', 0,
      'last_test_response', null
    )
  )
  FROM portal_survey_responses
  WHERE is_test_response = true;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_test_response_stats() TO authenticated, anon, service_role;
