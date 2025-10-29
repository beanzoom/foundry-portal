# Phase 2: Import Script Generation - Status Update

**Date**: 2025-10-28
**Status**: ⚠️ INCOMPLETE - Missing Full Table Schemas

---

## 🚨 Issue Discovered

The schema export (`01_run_schema_export.sql`) only captured **metadata** about tables (existence, column counts), but NOT the full **CREATE TABLE** statements for all 56 tables.

**What we have**:
- ✅ profiles table complete CREATE TABLE statement
- ✅ All 98 foreign key relationships
- ✅ All indexes
- ✅ All RLS policies
- ✅ All 116 functions (complete definitions)
- ✅ All 28 triggers (complete definitions)
- ✅ Table dependency order analyzed

**What we're missing**:
- ❌ CREATE TABLE statements for 55 tables (all except profiles)

---

## 💡 Solution: Use pg_dump

The most reliable way to get complete table schemas is using `pg_dump` from the current database.

### Option 1: pg_dump All Portal Tables (RECOMMENDED)

Run this command in your terminal (replace connection details):

```bash
pg_dump "postgresql://postgres:[YOUR_PASSWORD]@[YOUR_HOST]:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-privileges \
  --no-tablespaces \
  --no-security-labels \
  --no-comments \
  --table='profiles' \
  --table='notification_events' \
  --table='recipient_lists' \
  --table='email_templates' \
  --table='regions' \
  --table='markets' \
  --table='stations' \
  --table='dsps' \
  --table='membership_agreements' \
  --table='nda_agreements' \
  --table='portal_memberships' \
  --table='portal_admin_activity' \
  --table='businesses' \
  --table='dsp_locations' \
  --table='contacts' \
  --table='contact_submissions' \
  --table='contact_dsp_locations' \
  --table='interactions' \
  --table='notification_rules' \
  --table='email_notification_batches' \
  --table='portal_referrals' \
  --table='calculator_submissions' \
  --table='portal_events' \
  --table='portal_event_dates' \
  --table='portal_event_registrations' \
  --table='portal_event_guests' \
  --table='portal_event_reminders' \
  --table='portal_surveys' \
  --table='portal_survey_sections' \
  --table='portal_survey_questions' \
  --table='portal_survey_responses' \
  --table='portal_survey_answers' \
  --table='portal_updates' \
  --table='portal_update_reads' \
  --table='portal_referral_conversions' \
  --table='portal_referral_rate_limits' \
  --table='marketing_campaign_links' \
  --table='referral_conversions' \
  --table='email_notifications' \
  --table='notification_logs' \
  --table='email_logs' \
  --table='email_queue' \
  --table='portal_user_deletion_logs' \
  --table='referral_deletion_logs' \
  --table='email_logs_backup_042' \
  --table='email_notification_batches_backup_042' \
  --table='email_notification_batches_archive' \
  --table='portal_audit_log' \
  --table='portal_event_templates' \
  --table='portal_referrals_archive' \
  > database/schema_export/exports/09_complete_table_schemas.sql
```

This will create a single SQL file with ALL CREATE TABLE statements in the correct format.

### Option 2: Use Supabase SQL Query (Alternative)

Run this query in Supabase SQL Editor and save output to `09_complete_table_schemas.sql`:

```sql
SELECT
    schemaname,
    tablename,
    pg_get_tabledef(schemaname || '.' || tablename) as table_definition
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'notification_events', 'recipient_lists', 'email_templates',
    'regions', 'markets', 'stations', 'dsps', 'membership_agreements',
    'nda_agreements', 'portal_memberships', 'portal_admin_activity',
    'businesses', 'dsp_locations', 'contacts', 'contact_submissions',
    'contact_dsp_locations', 'interactions', 'notification_rules',
    'email_notification_batches', 'portal_referrals', 'calculator_submissions',
    'portal_events', 'portal_event_dates', 'portal_event_registrations',
    'portal_event_guests', 'portal_event_reminders', 'portal_surveys',
    'portal_survey_sections', 'portal_survey_questions', 'portal_survey_responses',
    'portal_survey_answers', 'portal_updates', 'portal_update_reads',
    'portal_referral_conversions', 'portal_referral_rate_limits',
    'marketing_campaign_links', 'referral_conversions', 'email_notifications',
    'notification_logs', 'email_logs', 'email_queue',
    'portal_user_deletion_logs', 'referral_deletion_logs',
    'email_logs_backup_042', 'email_notification_batches_backup_042',
    'email_notification_batches_archive', 'portal_audit_log',
    'portal_event_templates', 'portal_referrals_archive'
  )
ORDER BY tablename;
```

**Note**: `pg_get_tabledef` may not exist in all Postgres versions. If this fails, use Option 1 (pg_dump).

---

## 📋 Once You Have Complete Table Schemas

After running pg_dump, provide me with:
1. `09_complete_table_schemas.sql` - The complete table definitions

I will then:
1. ✅ Parse and organize tables by dependency order
2. ✅ Remove foreign keys (add separately in correct order)
3. ✅ Add indexes from Part 4
4. ✅ Add RLS policies from Part 5
5. ✅ Add functions from all_functions_results.md
6. ✅ Add triggers from triggers_results.md
7. ✅ Create complete `01_create_portal_database.sql`
8. ✅ Create `02_migrate_portal_data.sql`
9. ✅ Create remaining import scripts (03-06)

---

## 🎯 Next Action for You

**Choose ONE**:

### Recommended: Use pg_dump
1. Get connection string from Supabase dashboard
2. Run pg_dump command above
3. Save output to `database/schema_export/exports/09_complete_table_schemas.sql`
4. Tell me "pg_dump complete, file saved"

### Alternative: Use SQL Query
1. Open Supabase SQL Editor
2. Run the SQL query above
3. Copy all output
4. Save to `database/schema_export/exports/09_complete_table_schemas.sql`
5. Tell me "SQL export complete, file saved"

---

## ⏱️ Time Estimate

- Running pg_dump: **5-10 minutes**
- Me creating all import scripts after: **2-3 hours**

---

## 📁 Files Created So Far

✅ `00_table_creation_order.md` - Complete dependency analysis
⏳ `01_create_portal_database.sql` - Template only (needs completion)
⏳ `02_migrate_portal_data.sql` - Not started
⏳ `03_deploy_edge_functions.sh` - Not started
⏳ `04_setup_storage.sql` - Not started
⏳ `05_upload_files.sh` - Not started
⏳ `06_setup_cron_jobs.sql` - Not started

---

**Status**: ⏸️ PAUSED - Waiting for complete table schemas from pg_dump
