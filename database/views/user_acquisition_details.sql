-- Create user_acquisition_details view
-- This view combines user profiles with their acquisition source (marketing, referral, or direct)

CREATE OR REPLACE VIEW user_acquisition_details AS
SELECT
  p.id as user_id,
  p.email,
  p.first_name,
  p.last_name,
  p.role,
  p.created_at as user_created_at,
  p.profile_complete,
  p.phone,
  p.updated_at as user_updated_at,

  -- Business info (primary business)
  b.id as dsp_id,
  b.company_name as dsp_name,
  b.company_name as dsp_code,

  -- Determine acquisition source
  CASE
    WHEN rc.user_id IS NOT NULL THEN 'referral'::text
    WHEN mcl.campaign_code IS NOT NULL THEN 'marketing'::text
    ELSE 'direct'::text
  END as acquisition_source,

  CASE
    WHEN rc.user_id IS NOT NULL THEN 'Referral from ' || COALESCE(referrer.first_name || ' ' || referrer.last_name, referrer.email)
    WHEN mcl.campaign_code IS NOT NULL THEN mcl.campaign_name
    ELSE 'Direct Registration'
  END as source_display,

  -- Marketing details
  mcl.campaign_code,
  mcl.campaign_name,
  NULL as funnel_name,
  rc.converted_at as marketing_converted_at,

  -- Referral details
  pr.referrer_id,
  COALESCE(referrer.first_name || ' ' || referrer.last_name, referrer.email) as referrer_name,
  referrer.email as referrer_email,
  pr.status as referral_status

FROM profiles p

-- Left join with businesses to get primary business
LEFT JOIN businesses b ON b.user_id = p.id AND b.is_primary = true

-- Left join with referral_conversions to check if user came from referral
LEFT JOIN referral_conversions rc ON rc.user_id = p.id

-- If user came from referral, get referral details
LEFT JOIN portal_referrals pr ON pr.id = rc.referral_id

-- Get referrer profile
LEFT JOIN profiles referrer ON referrer.id = pr.referrer_id

-- Left join with marketing_campaign_links via source_metadata
LEFT JOIN LATERAL (
  SELECT mcl.*
  FROM marketing_campaign_links mcl
  WHERE pr.source_metadata->>'campaign_code' = mcl.campaign_code
  LIMIT 1
) mcl ON true

WHERE p.role IN ('portal_member', 'admin', 'super_admin', 'investor', 'system_admin');

-- Grant permissions
GRANT SELECT ON user_acquisition_details TO authenticated, anon, service_role;
