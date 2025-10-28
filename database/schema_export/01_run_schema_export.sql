-- Portal Schema Export Script
-- This script exports the schema definitions for all 47 portal tables
-- Run this in the CURRENT (shared) database to generate CREATE TABLE statements
--
-- Purpose: Get exact table definitions to recreate in new portal database
-- Date: 2025-10-22
-- Status: Ready to execute

-- =====================================================
-- PART 1: Export profiles table structure (portal users only)
-- =====================================================

-- Get CREATE TABLE statement for profiles
-- This will need to be manually reconstructed based on the output

SELECT
    'CREATE TABLE IF NOT EXISTS ' || table_name || ' (' ||
    string_agg(
        column_name || ' ' || data_type ||
        CASE
            WHEN character_maximum_length IS NOT NULL
            THEN '(' || character_maximum_length || ')'
            ELSE ''
        END ||
        CASE
            WHEN is_nullable = 'NO'
            THEN ' NOT NULL'
            ELSE ''
        END ||
        CASE
            WHEN column_default IS NOT NULL
            THEN ' DEFAULT ' || column_default
            ELSE ''
        END,
        ', '
        ORDER BY ordinal_position
    ) || ');' as create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
GROUP BY table_name;

-- Get primary key for profiles
SELECT
    'ALTER TABLE ' || tc.table_name ||
    ' ADD CONSTRAINT ' || tc.constraint_name ||
    ' PRIMARY KEY (' || string_agg(kcu.column_name, ', ') || ');' as pk_statement
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'profiles'
  AND tc.constraint_type = 'PRIMARY KEY'
GROUP BY tc.table_name, tc.constraint_name;

-- =====================================================
-- PART 2: Export all 47 portal table structures
-- =====================================================

-- List of portal tables to export
WITH portal_tables AS (
    SELECT unnest(ARRAY[
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
        -- Email System in Public (8)
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
        -- Contact/CRM System (9 tables for portal DSP outreach)
        'contacts',
        'contact_submissions',
        'contact_dsp_locations',
        'interactions',
        'dsps',
        'dsp_locations',
        'stations',
        'markets',
        'regions',
        -- Business Data (1 table)
        'businesses'
    ]) as table_name
)
SELECT
    pt.table_name,
    EXISTS(
        SELECT 1 FROM information_schema.tables t
        WHERE t.table_schema = 'public'
          AND t.table_name = pt.table_name
    ) as exists_in_db,
    (
        SELECT count(*)
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = pt.table_name
    ) as column_count
FROM portal_tables pt
ORDER BY pt.table_name;

-- =====================================================
-- PART 3: Export Foreign Key Constraints
-- =====================================================

-- Get all foreign keys for portal tables
SELECT
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name AS to_table,
    ccu.column_name AS to_column,
    tc.constraint_name,
    rc.delete_rule,
    'ALTER TABLE ' || tc.table_name ||
    ' ADD CONSTRAINT ' || tc.constraint_name ||
    ' FOREIGN KEY (' || kcu.column_name || ')' ||
    ' REFERENCES ' || ccu.table_name || '(' || ccu.column_name || ')' ||
    ' ON DELETE ' || rc.delete_rule || ';' as fk_statement
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN (
      -- Portal tables (expanded list)
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
      'dsps', 'dsp_locations', 'stations', 'markets', 'regions', 'businesses'
  )
ORDER BY from_table, from_column;

-- =====================================================
-- PART 4: Export Indexes
-- =====================================================

SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
      -- Same portal tables list
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
ORDER BY tablename, indexname;

-- =====================================================
-- PART 5: Export Row Level Security Policies
-- =====================================================

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
      -- Same portal tables list
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
ORDER BY tablename, policyname;

-- =====================================================
-- PART 6: Export Functions used by Portal
-- =====================================================

-- Get all functions that reference portal tables
SELECT
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
      -- Functions with portal in the name
      p.proname LIKE '%portal%'
      OR p.proname LIKE '%email%'
      OR p.proname LIKE '%notification%'
      OR p.proname LIKE '%referral%'
  )
ORDER BY p.proname;

-- =====================================================
-- INSTRUCTIONS FOR NEXT STEPS
-- =====================================================

/*
NEXT STEPS:

1. Run each part of this script separately in Supabase SQL Editor
2. Save the output from each part
3. Use the output to create the import script for the new database
4. The import script will:
   - Create all tables
   - Add primary keys
   - Add foreign keys (in correct order)
   - Add indexes
   - Add RLS policies
   - Create functions

IMPORTANT:
- Save all output to text files
- Review foreign key dependencies to determine migration order
- Profiles table must be created FIRST (other tables depend on it)

*/
