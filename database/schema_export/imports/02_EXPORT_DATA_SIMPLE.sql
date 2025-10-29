/*
================================================================================
SIMPLIFIED DATA EXPORT - Run in OLD database Supabase SQL Editor
================================================================================
This exports row counts and sample data to verify before full export.

APPROACH:
1. Run this query to see what data exists
2. Then we'll use pg_dump-like approach or manual table-by-table export

Step 1: Get row counts for all tables
================================================================================
*/

SELECT
  schemaname,
  tablename,
  (SELECT COUNT(*) FROM information_schema.tables t2
   WHERE t2.table_name = t.tablename) as row_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'portal_memberships',
    'membership_agreements',
    'nda_agreements',
    'notification_events',
    'recipient_lists',
    'email_templates',
    'notification_rules',
    'regions',
    'markets',
    'stations',
    'dsps',
    'contacts',
    'contact_interactions',
    'portal_funnels',
    'portal_funnel_stages',
    'portal_leads',
    'portal_referrals',
    'portal_events',
    'portal_event_dates',
    'portal_event_registrations',
    'portal_event_guests',
    'portal_event_reminders',
    'portal_event_templates',
    'portal_surveys',
    'portal_survey_sections',
    'portal_survey_questions',
    'portal_survey_responses',
    'portal_survey_answers',
    'portal_updates',
    'portal_update_reads',
    'portal_referral_conversions',
    'portal_referral_rate_limits',
    'marketing_campaign_links',
    'referral_conversions',
    'email_notifications',
    'notification_logs',
    'email_logs',
    'email_queue',
    'portal_user_deletion_logs',
    'referral_deletion_logs',
    'portal_audit_log',
    'email_logs_backup_042',
    'email_notification_batches_backup_042',
    'email_notification_batches_archive',
    'portal_referrals_archive',
    'calculator_submissions',
    'portal_calculator_submissions',
    'email_notification_batches'
  )
ORDER BY tablename;
