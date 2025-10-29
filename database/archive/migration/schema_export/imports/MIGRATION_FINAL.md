# Final Data Migration Solution

## The Problem
- Can't use `pg_dump` due to WSL networking
- 50 tables with ~500 rows total
- Need to preserve all data types, FKs, and relationships

## The Solution: Supabase's Database Migration Feature

### Step 1: Use Supabase CLI (Installed locally)

```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to OLD project
supabase link --project-ref kssbljbxapejckgassgf

# Generate migration with data
supabase db dump --data-only -f portal_data.sql

# This creates a file with all INSERT statements
```

### Step 2: Filter the dump file
```bash
# Extract only portal tables (exclude shared foundry tables)
grep -A 10000 "COPY public.profiles" portal_data.sql > portal_data_only.sql
# Add similar grep commands for all 50 portal tables
```

### Step 3: Run in new database
```bash
# Link to NEW project
supabase link --project-ref <NEW_PROJECT_ID>

# Run the data import
supabase db push --file portal_data_only.sql
```

## Alternative: If Supabase CLI also has network issues

Use the **browser-based Supabase SQL Editor** with this intelligent approach:

### Single Query to Export All Data

Run this in **OLD database**:

```sql
-- This generates INSERT statements for all 50 tables automatically
DO $$
DECLARE
  table_name text;
  insert_stmt text;
BEGIN
  FOR table_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN (
      'profiles', 'portal_memberships', 'membership_agreements',
      'nda_agreements', 'notification_events', 'recipient_lists',
      'email_templates', 'notification_rules', 'regions', 'markets',
      'stations', 'dsps', 'contacts', 'contact_interactions',
      'portal_funnels', 'portal_funnel_stages', 'portal_leads',
      'portal_referrals', 'portal_events', 'portal_event_dates',
      'portal_event_registrations', 'portal_event_guests',
      'portal_event_reminders', 'portal_event_templates',
      'portal_surveys', 'portal_survey_sections', 'portal_survey_questions',
      'portal_survey_responses', 'portal_survey_answers',
      'portal_updates', 'portal_update_reads',
      'portal_referral_conversions', 'portal_referral_rate_limits',
      'marketing_campaign_links', 'referral_conversions',
      'email_notifications', 'notification_logs', 'email_logs',
      'email_queue', 'portal_user_deletion_logs',
      'referral_deletion_logs', 'portal_audit_log',
      'calculator_submissions', 'portal_calculator_submissions',
      'email_notification_batches'
    )
    ORDER BY tablename
  LOOP
    RAISE NOTICE 'Exporting: %', table_name;
    -- Generate INSERT statements
    EXECUTE format('
      COPY (
        SELECT ''INSERT INTO '' || %L || '' SELECT * FROM json_populate_record(NULL::'' || %L || '', '''''' || row_to_json(t)::text || '''''');''
        FROM %I t
      ) TO STDOUT
    ', table_name, table_name, table_name);
  END LOOP;
END $$;
```

Actually, this is getting too complex. Let me give you the **simplest working solution**:

## RECOMMENDED: Python Script to Generate Inserts

I'll create a Python script that:
1. Connects to OLD database
2. Exports all 50 tables as INSERT statements
3. You run the output file in NEW database

This is the fastest and most reliable method for your situation.

Creating script now...
