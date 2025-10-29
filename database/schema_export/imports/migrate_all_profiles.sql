/*
================================================================================
FIND ALL PROFILES REFERENCED BY PORTAL TABLES
================================================================================
Run this in OLD database to get all profile IDs that need to be migrated
================================================================================
*/

-- Find all unique profile IDs referenced across portal tables
SELECT DISTINCT user_id FROM (
  -- Portal memberships
  SELECT user_id FROM portal_memberships WHERE user_id IS NOT NULL
  UNION
  -- Membership agreements
  SELECT user_id FROM membership_agreements WHERE user_id IS NOT NULL
  UNION
  -- NDA agreements
  SELECT user_id FROM nda_agreements WHERE user_id IS NOT NULL
  UNION
  -- Portal events (created_by)
  SELECT created_by AS user_id FROM portal_events WHERE created_by IS NOT NULL
  UNION
  -- Event registrations
  SELECT user_id FROM portal_event_registrations WHERE user_id IS NOT NULL
  UNION
  -- Survey responses
  SELECT user_id FROM portal_survey_responses WHERE user_id IS NOT NULL
  UNION
  -- Portal referrals (referrer_id)
  SELECT referrer_id AS user_id FROM portal_referrals WHERE referrer_id IS NOT NULL
  UNION
  -- Portal referral conversions (referee_profile_id)
  SELECT referee_profile_id AS user_id FROM portal_referral_conversions WHERE referee_profile_id IS NOT NULL
  UNION
  -- Portal referral rate limits
  SELECT user_id FROM portal_referral_rate_limits WHERE user_id IS NOT NULL
  UNION
  -- Referral conversions
  SELECT user_id FROM referral_conversions WHERE user_id IS NOT NULL
  UNION
  -- Calculator submissions
  SELECT user_id FROM calculator_submissions WHERE user_id IS NOT NULL
  UNION
  -- Email logs
  SELECT user_id FROM email_logs WHERE user_id IS NOT NULL
  UNION
  -- Email queue
  SELECT to_user_id AS user_id FROM email_queue WHERE to_user_id IS NOT NULL
  UNION
  -- Email queue created_by
  SELECT created_by AS user_id FROM email_queue WHERE created_by IS NOT NULL
  UNION
  -- Email notifications created_by
  SELECT created_by AS user_id FROM email_notifications WHERE created_by IS NOT NULL
  UNION
  -- Portal admin activity
  SELECT admin_id AS user_id FROM portal_admin_activity WHERE admin_id IS NOT NULL
  UNION
  -- Portal updates created_by
  SELECT created_by AS user_id FROM portal_updates WHERE created_by IS NOT NULL
  UNION
  -- Portal updates archived_by
  SELECT archived_by AS user_id FROM portal_updates WHERE archived_by IS NOT NULL
  UNION
  -- Portal update reads
  SELECT user_id FROM portal_update_reads WHERE user_id IS NOT NULL
  UNION
  -- Portal surveys created_by
  SELECT created_by AS user_id FROM portal_surveys WHERE created_by IS NOT NULL
  UNION
  -- Portal event templates created_by
  SELECT created_by AS user_id FROM portal_event_templates WHERE created_by IS NOT NULL
  UNION
  -- Email templates created_by
  SELECT created_by AS user_id FROM email_templates WHERE created_by IS NOT NULL
  UNION
  -- Portal user deletion logs
  SELECT deleted_user_id AS user_id FROM portal_user_deletion_logs WHERE deleted_user_id IS NOT NULL
  UNION
  SELECT deleted_by AS user_id FROM portal_user_deletion_logs WHERE deleted_by IS NOT NULL
  UNION
  -- Referral deletion logs
  SELECT deleted_by AS user_id FROM referral_deletion_logs WHERE deleted_by IS NOT NULL
  UNION
  -- Portal audit log
  SELECT admin_id AS user_id FROM portal_audit_log WHERE admin_id IS NOT NULL
  UNION
  -- Contacts created_by
  SELECT created_by AS user_id FROM contacts WHERE created_by IS NOT NULL
  UNION
  -- Contacts portal_profile_id
  SELECT portal_profile_id AS user_id FROM contacts WHERE portal_profile_id IS NOT NULL
  UNION
  -- Interactions created_by
  SELECT created_by AS user_id FROM interactions WHERE created_by IS NOT NULL
) AS all_user_ids
ORDER BY user_id;
