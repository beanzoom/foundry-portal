-- Export ALL Triggers on Portal Tables
-- This exports trigger definitions for all portal tables
-- Run this in Supabase SQL Editor and save output to exports/08_triggers.txt
--
-- Date: 2025-10-28
-- Status: Ready to execute

-- =====================================================
-- Export all triggers on portal tables
-- =====================================================

SELECT
    tgrelid::regclass as table_name,
    tgname as trigger_name,
    CASE tgtype & 1
        WHEN 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END as trigger_level,
    CASE tgtype & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as trigger_timing,
    CASE
        WHEN tgtype & 4 = 4 THEN 'INSERT'
        WHEN tgtype & 8 = 8 THEN 'DELETE'
        WHEN tgtype & 16 = 16 THEN 'UPDATE'
        ELSE 'TRUNCATE'
    END as trigger_event,
    pg_get_triggerdef(oid) as trigger_definition,
    '-- =================================================' as separator
FROM pg_trigger
WHERE tgrelid IN (
    SELECT oid FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
    AND relname IN (
        -- Core Portal Features (5)
        'calculator_submissions',
        'marketing_campaign_links',
        'membership_agreements',
        'nda_agreements',
        'portal_memberships',
        -- Events System (7)
        'portal_events',
        'portal_event_dates',
        'portal_event_registrations',
        'portal_event_guests',
        'portal_event_reminders',
        'portal_event_templates',
        'portal_event_waitlist',
        -- Referrals & Marketing (6)
        'portal_referrals',
        'portal_referral_conversions',
        'portal_referral_rate_limits',
        'portal_referrals_archive',
        'referral_conversions',
        'referral_deletion_logs',
        -- Surveys (4)
        'portal_surveys',
        'portal_survey_questions',
        'portal_survey_responses',
        'portal_survey_answers',
        -- Updates/Content (2)
        'portal_updates',
        'portal_update_reads',
        -- Admin/Audit (3)
        'portal_admin_activity',
        'portal_audit_log',
        'portal_user_deletion_logs',
        -- Email System (8)
        'email_queue',
        'email_templates',
        'email_logs',
        'email_notifications',
        'email_notification_batches',
        'email_notification_batches_archive',
        'email_notification_batches_backup_042',
        'email_logs_backup_042',
        -- Notification System (4)
        'notification_rules',
        'notification_events',
        'notification_logs',
        'recipient_lists',
        -- Contact System (3)
        'contact_tracking',
        'contact_interactions',
        'portal_solutions',
        -- Profiles (portal users)
        'profiles'
    )
)
AND NOT tgisinternal  -- Exclude internal triggers
ORDER BY tgrelid::regclass::text, tgname;

-- =====================================================
-- Get trigger summary
-- =====================================================

SELECT
    tgrelid::regclass as table_name,
    COUNT(*) as trigger_count,
    string_agg(tgname, ', ' ORDER BY tgname) as trigger_names
FROM pg_trigger
WHERE tgrelid IN (
    SELECT oid FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
    AND relname IN (
        'calculator_submissions', 'marketing_campaign_links', 'membership_agreements',
        'nda_agreements', 'portal_memberships', 'portal_events', 'portal_event_dates',
        'portal_event_registrations', 'portal_event_guests', 'portal_event_reminders',
        'portal_event_templates', 'portal_event_waitlist', 'portal_referrals',
        'portal_referral_conversions', 'portal_referral_rate_limits', 'portal_referrals_archive',
        'referral_conversions', 'referral_deletion_logs', 'portal_surveys',
        'portal_survey_questions', 'portal_survey_responses', 'portal_survey_answers',
        'portal_updates', 'portal_update_reads', 'portal_admin_activity',
        'portal_audit_log', 'portal_user_deletion_logs', 'email_queue',
        'email_templates', 'email_logs', 'email_notifications', 'email_notification_batches',
        'notification_rules', 'notification_events', 'notification_logs', 'recipient_lists',
        'contacts', 'contact_submissions', 'contact_dsp_locations', 'interactions',
        'dsps', 'dsp_locations', 'stations', 'markets', 'regions', 'businesses', 'profiles'
    )
)
AND NOT tgisinternal
GROUP BY tgrelid
ORDER BY trigger_count DESC, tgrelid::regclass::text;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
AFTER RUNNING:
1. Copy ALL output from the first query
2. Save to: exports/08_triggers.txt
3. Review the trigger summary to verify all tables have expected triggers

CRITICAL TRIGGERS TO VERIFY:
- trigger_email_notification (on portal_events, portal_surveys, portal_updates)
- trigger_referral_notification (on portal_referrals)
- Any audit/logging triggers
- Any updated_at timestamp triggers

EXPECTED TRIGGERS:
- email_queue: email notification triggers
- portal_events: email notification trigger, updated_at trigger
- portal_surveys: email notification trigger, updated_at trigger
- portal_updates: email notification trigger, updated_at trigger
- portal_referrals: referral notification trigger, updated_at trigger
- Most other tables: updated_at trigger

If triggers are missing, investigate why.
*/
