-- =====================================================
-- STEP 7: MIGRATE DATA FROM OLD TO NEW DATABASE
-- =====================================================
-- This file shows you HOW to migrate data
-- You'll need to run these queries in BOTH databases
-- =====================================================

-- ⚠️ IMPORTANT: This file is a TEMPLATE showing the approach
-- You need to export data from OLD database and import to NEW database
-- See STEP_7_INSTRUCTIONS.md for the full process

-- =====================================================
-- PHASE 1: Export Portal Users (Run in OLD database)
-- =====================================================

-- Step 1: Export portal users to CSV
\COPY (
  SELECT *
  FROM profiles
  WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')
  ORDER BY created_at
) TO '/tmp/portal_profiles.csv' WITH CSV HEADER;

-- Expected: ~9 rows (portal users only, no app users)

-- =====================================================
-- PHASE 2: Export Portal Content (Run in OLD database)
-- =====================================================

-- Get list of portal user IDs for filtering
CREATE TEMP TABLE portal_user_ids AS
SELECT id FROM profiles
WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor');

-- Step 2: Export portal updates
\COPY (
  SELECT * FROM portal_updates
  ORDER BY created_at
) TO '/tmp/portal_updates.csv' WITH CSV HEADER;

-- Step 3: Export portal surveys
\COPY (
  SELECT * FROM portal_surveys
  ORDER BY created_at
) TO '/tmp/portal_surveys.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM portal_survey_questions
  ORDER BY survey_id, display_order
) TO '/tmp/portal_survey_questions.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM portal_survey_sections
  ORDER BY survey_id, display_order
) TO '/tmp/portal_survey_sections.csv' WITH CSV HEADER;

\COPY (
  SELECT sr.* FROM portal_survey_responses sr
  INNER JOIN portal_user_ids pui ON sr.user_id = pui.id
  ORDER BY sr.created_at
) TO '/tmp/portal_survey_responses.csv' WITH CSV HEADER;

\COPY (
  SELECT sa.* FROM portal_survey_answers sa
  INNER JOIN portal_survey_responses sr ON sa.response_id = sr.id
  INNER JOIN portal_user_ids pui ON sr.user_id = pui.id
  ORDER BY sa.created_at
) TO '/tmp/portal_survey_answers.csv' WITH CSV HEADER;

-- Step 4: Export portal events
\COPY (
  SELECT * FROM portal_events
  ORDER BY created_at
) TO '/tmp/portal_events.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM portal_event_dates
  ORDER BY event_id, event_start
) TO '/tmp/portal_event_dates.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM portal_event_templates
  ORDER BY created_at
) TO '/tmp/portal_event_templates.csv' WITH CSV HEADER;

\COPY (
  SELECT er.* FROM portal_event_registrations er
  INNER JOIN portal_user_ids pui ON er.user_id = pui.id
  ORDER BY er.created_at
) TO '/tmp/portal_event_registrations.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM portal_event_guests
  ORDER BY created_at
) TO '/tmp/portal_event_guests.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM portal_event_reminders
  ORDER BY created_at
) TO '/tmp/portal_event_reminders.csv' WITH CSV HEADER;

-- Step 5: Export referrals
\COPY (
  SELECT pr.* FROM portal_referrals pr
  INNER JOIN portal_user_ids pui ON pr.referrer_id = pui.id
  ORDER BY pr.created_at
) TO '/tmp/portal_referrals.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM portal_referral_conversions
  ORDER BY converted_at
) TO '/tmp/portal_referral_conversions.csv' WITH CSV HEADER;

\COPY (
  SELECT prl.* FROM portal_referral_rate_limits prl
  INNER JOIN portal_user_ids pui ON prl.user_id = pui.id
  ORDER BY prl.action_timestamp
) TO '/tmp/portal_referral_rate_limits.csv' WITH CSV HEADER;

-- Step 6: Export calculator submissions
\COPY (
  SELECT cs.* FROM calculator_submissions cs
  LEFT JOIN portal_user_ids pui ON cs.user_id = pui.id
  WHERE cs.user_id IS NULL OR pui.id IS NOT NULL
  ORDER BY cs.created_at
) TO '/tmp/calculator_submissions.csv' WITH CSV HEADER;

-- Step 7: Export memberships & agreements
\COPY (
  SELECT ma.* FROM membership_agreements ma
  INNER JOIN portal_user_ids pui ON ma.user_id = pui.id
  ORDER BY ma.created_at
) TO '/tmp/membership_agreements.csv' WITH CSV HEADER;

\COPY (
  SELECT na.* FROM nda_agreements na
  INNER JOIN portal_user_ids pui ON na.user_id = pui.id
  ORDER BY na.created_at
) TO '/tmp/nda_agreements.csv' WITH CSV HEADER;

\COPY (
  SELECT pm.* FROM portal_memberships pm
  INNER JOIN portal_user_ids pui ON pm.user_id = pui.id
  ORDER BY pm.created_at
) TO '/tmp/portal_memberships.csv' WITH CSV HEADER;

-- Step 8: Export businesses (DSP info)
\COPY (
  SELECT b.* FROM businesses b
  INNER JOIN portal_user_ids pui ON b.user_id = pui.id
  ORDER BY b.created_at
) TO '/tmp/businesses.csv' WITH CSV HEADER;

-- Step 9: Export contacts
\COPY (
  SELECT * FROM contacts
  WHERE is_active = true
  ORDER BY created_at
) TO '/tmp/contacts.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM contact_submissions
  ORDER BY created_at
) TO '/tmp/contact_submissions.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM interactions
  ORDER BY interaction_date
) TO '/tmp/interactions.csv' WITH CSV HEADER;

-- Step 10: Export email & notification data
\COPY (
  SELECT * FROM email_templates
  WHERE is_active = true
  ORDER BY created_at
) TO '/tmp/email_templates.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM recipient_lists
  ORDER BY created_at
) TO '/tmp/recipient_lists.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM notification_rules
  WHERE enabled = true
  ORDER BY priority
) TO '/tmp/notification_rules.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM notification_events
  ORDER BY created_at
) TO '/tmp/notification_events.csv' WITH CSV HEADER;

-- Step 11: Export portal admin activity
\COPY (
  SELECT * FROM portal_admin_activity
  ORDER BY created_at DESC
  LIMIT 1000
) TO '/tmp/portal_admin_activity.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM portal_audit_log
  ORDER BY created_at DESC
  LIMIT 1000
) TO '/tmp/portal_audit_log.csv' WITH CSV HEADER;

-- Step 12: Export update reads
\COPY (
  SELECT ur.* FROM portal_update_reads ur
  INNER JOIN portal_user_ids pui ON ur.user_id = pui.id
  ORDER BY ur.read_at
) TO '/tmp/portal_update_reads.csv' WITH CSV HEADER;

-- Step 13: Export DSP/Market reference data
\COPY (
  SELECT * FROM markets
  WHERE is_active = true
  ORDER BY name
) TO '/tmp/markets.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM regions
  ORDER BY name
) TO '/tmp/regions.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM stations
  WHERE is_active = true
  ORDER BY station_code
) TO '/tmp/stations.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM dsps
  WHERE is_active = true
  ORDER BY dsp_code
) TO '/tmp/dsps.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM dsp_locations
  WHERE is_active = true
  ORDER BY created_at
) TO '/tmp/dsp_locations.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM contact_dsp_locations
  ORDER BY created_at
) TO '/tmp/contact_dsp_locations.csv' WITH CSV HEADER;

-- Step 14: Export marketing data
\COPY (
  SELECT * FROM marketing_campaign_links
  ORDER BY created_at
) TO '/tmp/marketing_campaign_links.csv' WITH CSV HEADER;

\COPY (
  SELECT * FROM referral_conversions
  ORDER BY created_at
) TO '/tmp/referral_conversions.csv' WITH CSV HEADER;

-- =====================================================
-- PHASE 3: Import to NEW Database
-- =====================================================

-- Run these in the NEW database to import the data

-- Step 1: Import profiles (MOST CRITICAL - do this first)
\COPY profiles FROM '/tmp/portal_profiles.csv' WITH CSV HEADER;

-- Step 2: Import reference data (needed for foreign keys)
\COPY regions FROM '/tmp/regions.csv' WITH CSV HEADER;
\COPY markets FROM '/tmp/markets.csv' WITH CSV HEADER;
\COPY stations FROM '/tmp/stations.csv' WITH CSV HEADER;
\COPY dsps FROM '/tmp/dsps.csv' WITH CSV HEADER;
\COPY dsp_locations FROM '/tmp/dsp_locations.csv' WITH CSV HEADER;

-- Step 3: Import email/notification infrastructure
\COPY email_templates FROM '/tmp/email_templates.csv' WITH CSV HEADER;
\COPY recipient_lists FROM '/tmp/recipient_lists.csv' WITH CSV HEADER;
\COPY notification_rules FROM '/tmp/notification_rules.csv' WITH CSV HEADER;
\COPY notification_events FROM '/tmp/notification_events.csv' WITH CSV HEADER;

-- Step 4: Import portal content
\COPY portal_updates FROM '/tmp/portal_updates.csv' WITH CSV HEADER;
\COPY portal_update_reads FROM '/tmp/portal_update_reads.csv' WITH CSV HEADER;

\COPY portal_surveys FROM '/tmp/portal_surveys.csv' WITH CSV HEADER;
\COPY portal_survey_sections FROM '/tmp/portal_survey_sections.csv' WITH CSV HEADER;
\COPY portal_survey_questions FROM '/tmp/portal_survey_questions.csv' WITH CSV HEADER;
\COPY portal_survey_responses FROM '/tmp/portal_survey_responses.csv' WITH CSV HEADER;
\COPY portal_survey_answers FROM '/tmp/portal_survey_answers.csv' WITH CSV HEADER;

\COPY portal_event_templates FROM '/tmp/portal_event_templates.csv' WITH CSV HEADER;
\COPY portal_events FROM '/tmp/portal_events.csv' WITH CSV HEADER;
\COPY portal_event_dates FROM '/tmp/portal_event_dates.csv' WITH CSV HEADER;
\COPY portal_event_registrations FROM '/tmp/portal_event_registrations.csv' WITH CSV HEADER;
\COPY portal_event_guests FROM '/tmp/portal_event_guests.csv' WITH CSV HEADER;
\COPY portal_event_reminders FROM '/tmp/portal_event_reminders.csv' WITH CSV HEADER;

-- Step 5: Import referrals
\COPY portal_referrals FROM '/tmp/portal_referrals.csv' WITH CSV HEADER;
\COPY portal_referral_conversions FROM '/tmp/portal_referral_conversions.csv' WITH CSV HEADER;
\COPY portal_referral_rate_limits FROM '/tmp/portal_referral_rate_limits.csv' WITH CSV HEADER;

-- Step 6: Import user data
\COPY membership_agreements FROM '/tmp/membership_agreements.csv' WITH CSV HEADER;
\COPY nda_agreements FROM '/tmp/nda_agreements.csv' WITH CSV HEADER;
\COPY portal_memberships FROM '/tmp/portal_memberships.csv' WITH CSV HEADER;
\COPY businesses FROM '/tmp/businesses.csv' WITH CSV HEADER;
\COPY calculator_submissions FROM '/tmp/calculator_submissions.csv' WITH CSV HEADER;

-- Step 7: Import contacts
\COPY contacts FROM '/tmp/contacts.csv' WITH CSV HEADER;
\COPY contact_dsp_locations FROM '/tmp/contact_dsp_locations.csv' WITH CSV HEADER;
\COPY contact_submissions FROM '/tmp/contact_submissions.csv' WITH CSV HEADER;
\COPY interactions FROM '/tmp/interactions.csv' WITH CSV HEADER;

-- Step 8: Import marketing
\COPY marketing_campaign_links FROM '/tmp/marketing_campaign_links.csv' WITH CSV HEADER;
\COPY referral_conversions FROM '/tmp/referral_conversions.csv' WITH CSV HEADER;

-- Step 9: Import audit logs (last, least critical)
\COPY portal_admin_activity FROM '/tmp/portal_admin_activity.csv' WITH CSV HEADER;
\COPY portal_audit_log FROM '/tmp/portal_audit_log.csv' WITH CSV HEADER;

-- =====================================================
-- PHASE 4: Verification
-- =====================================================

-- Run these in NEW database to verify data was migrated

-- Count portal users
SELECT 'profiles' as table_name, COUNT(*) as row_count
FROM profiles
UNION ALL
SELECT 'portal_updates', COUNT(*) FROM portal_updates
UNION ALL
SELECT 'portal_surveys', COUNT(*) FROM portal_surveys
UNION ALL
SELECT 'portal_events', COUNT(*) FROM portal_events
UNION ALL
SELECT 'portal_referrals', COUNT(*) FROM portal_referrals
UNION ALL
SELECT 'calculator_submissions', COUNT(*) FROM calculator_submissions
UNION ALL
SELECT 'contacts', COUNT(*) FROM contacts
UNION ALL
SELECT 'businesses', COUNT(*) FROM businesses
ORDER BY table_name;

-- Verify foreign key relationships are intact
SELECT
  'profile → businesses' as relationship,
  COUNT(DISTINCT b.user_id) as unique_users,
  COUNT(*) as total_rows
FROM businesses b
JOIN profiles p ON p.id = b.user_id
UNION ALL
SELECT
  'profile → referrals',
  COUNT(DISTINCT pr.referrer_id),
  COUNT(*)
FROM portal_referrals pr
JOIN profiles p ON p.id = pr.referrer_id
UNION ALL
SELECT
  'profile → memberships',
  COUNT(DISTINCT pm.user_id),
  COUNT(*)
FROM portal_memberships pm
JOIN profiles p ON p.id = pm.user_id;

-- Check for orphaned records (should be 0)
SELECT 'Orphaned businesses' as issue, COUNT(*) as count
FROM businesses b
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = b.user_id)
UNION ALL
SELECT 'Orphaned referrals', COUNT(*)
FROM portal_referrals pr
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pr.referrer_id)
UNION ALL
SELECT 'Orphaned memberships', COUNT(*)
FROM portal_memberships pm
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pm.user_id);

-- =====================================================
-- NOTES
-- =====================================================
-- 1. The \COPY commands work in psql, not in Supabase SQL Editor
-- 2. You'll need psql installed and connection strings for both databases
-- 3. Alternative: Use Supabase Dashboard UI to export/import CSVs manually
-- 4. See STEP_7_INSTRUCTIONS.md for detailed walkthrough
-- =====================================================
