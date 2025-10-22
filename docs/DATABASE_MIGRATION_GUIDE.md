# Portal Database Migration Guide
## Separating Portal from Main App Database

**Date Created**: 2025-10-22
**Status**: Ready to Execute
**Estimated Time**: 4-6 hours total (spread over 1-2 days)

---

## 🎯 Overview

This guide walks you through creating a **new Supabase project** for the portal and migrating the 47 portal-specific tables and ~500 rows of data from the current shared database.

**Current State**:
- Portal code repository: Separate ✅
- Portal deployment: Vercel ✅
- Portal database: **Still shared with main app** ❌

**Target State**:
- Portal database: New Supabase project
- Main app database: Current Supabase project (app tables only)
- Portal code: Points to new database
- Main app code: Points to current database

---

## 📊 Migration Summary

### Tables to Migrate (47 total)

**Portal-Specific Tables (35)**:
- calculator_submissions (1 row)
- marketing_campaign_links (1 row)
- membership_agreements (7 rows) - **CRITICAL: Legal data**
- nda_agreements (7 rows) - **CRITICAL: Legal data**
- portal_memberships (0 rows)
- portal_events (1 row) + 6 related tables
- portal_referrals (9 rows) + 5 related tables
- portal_surveys (1 row) + 3 related tables
- portal_updates (2 rows) + 1 related table
- portal_admin_activity (28 rows) - **CRITICAL: Audit trail**
- portal_audit_log (12 rows) - **CRITICAL: Audit trail**
- portal_user_deletion_logs (4 rows)

**Email System Tables (8)**:
- email_queue (41 rows)
- email_templates (16 rows)
- email_logs (42 rows)
- email_notifications (15 rows)
- email_notification_batches (3 rows)
- Plus 3 backup/archive tables

**Notification System (4)**:
- notification_rules (15 rows)
- notification_events (15 rows)
- notification_logs (0 rows)
- recipient_lists (6 rows)

**Portal Schema Tables (4)** - Already in portal schema:
- portal.email_logs (28 rows)
- portal.email_notification_batches (7 rows)
- portal.email_notifications (0 rows)
- portal.email_preferences (0 rows)

**User Profiles**: 9 portal users (roles: portal_member, admin, super_admin)

### Tables Staying in App (27 total)

**DO NOT MIGRATE** - These break the main app:
- fleet (63 rows)
- maintenance_records (53 rows)
- maintenance_* (5 more tables)
- driver_mappings, driver_schedules
- organizations (2 rows)
- permissions, role_permissions, user_roles
- system_settings, system_user_assignments
- wiki_articles
- modules, module_features

---

## 🚀 Phase 1: Create New Supabase Project (30 minutes)

### Step 1.1: Create Project in Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in details:
   - **Name**: `FleetDRMS Portal`
   - **Database Password**: Generate a strong password **SAVE THIS**
   - **Region**: Same as current project (probably `us-east-1`)
   - **Pricing Plan**: Pro ($25/month recommended)

4. Wait for project to provision (~2 minutes)

5. **Save these values** (you'll need them):
   ```
   Project URL: https://[project-ref].supabase.co
   Project ID: [project-ref]
   Anon/Public Key: eyJhbGc...
   Service Role Key: eyJhbGc... (secret!)
   Database Password: [your generated password]
   ```

### Step 1.2: Initial Configuration

1. **Enable Extensions** (SQL Editor):
```sql
-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
```

2. **Create portal schema**:
```sql
CREATE SCHEMA IF NOT EXISTS portal;
GRANT USAGE ON SCHEMA portal TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA portal TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA portal TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA portal TO anon, authenticated, service_role;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA portal
GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA portal
GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA portal
GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
```

---

## 🗄️ Phase 2: Export Schema from Current Database (1 hour)

I'll create SQL scripts to export the schema definitions for all 47 portal tables.

### Step 2.1: Generate Schema Export Script

Run this in the **CURRENT database** to get table definitions:

```sql
-- This will be created as a migration script
-- See: /database/migrations/portal_schema_export.sql
```

### Step 2.2: Export Data

For each table, export as CSV or use pg_dump:

```bash
# Use Supabase dashboard: Table Editor -> Export as CSV
# Or use SQL:
COPY (SELECT * FROM profiles WHERE role IN ('portal_member', 'admin', 'super_admin', 'system_admin'))
TO '/tmp/portal_profiles.csv' CSV HEADER;
```

---

## 🔄 Phase 3: Import to New Database (2 hours)

### Step 3.1: Run Schema Creation Scripts

In the **NEW portal database**, run migration scripts in order:

1. Create profiles table (portal users only)
2. Create all 47 portal tables
3. Create indexes
4. Create RLS policies
5. Create database functions
6. Create triggers

### Step 3.2: Import Data

Import data in correct dependency order:

1. **profiles** (9 portal users) - **FIRST** (other tables depend on this)
2. **email_templates** (no dependencies)
3. **portal_event_templates** (no dependencies)
4. **recipient_lists** (depends on profiles)
5. **notification_rules** (depends on recipient_lists)
6. Then all other tables...

### Step 3.3: Verify Row Counts

```sql
-- Check row counts match
SELECT
  'profiles' as table_name,
  COUNT(*) as rows,
  9 as expected
FROM profiles
UNION ALL
SELECT 'portal_referrals', COUNT(*), 9 FROM portal_referrals
UNION ALL
SELECT 'membership_agreements', COUNT(*), 7 FROM membership_agreements
-- ... etc for all tables
```

---

## ⚙️ Phase 4: Update Portal Code (30 minutes)

### Step 4.1: Update Environment Variables

In Vercel dashboard for `foundry-portal`:

**REPLACE** these variables:
```
VITE_SUPABASE_URL=https://[NEW-PROJECT-REF].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[NEW-ANON-KEY]
VITE_SUPABASE_PROJECT_ID=[NEW-PROJECT-REF]
```

**ADD** service role key (for admin functions):
```
SUPABASE_SERVICE_ROLE_KEY=[NEW-SERVICE-ROLE-KEY]
```

### Step 4.2: Update Local .env

In `/home/joeylutes/projects/foundry-portal/.env`:

```env
VITE_SUPABASE_PROJECT_ID="[NEW-PROJECT-REF]"
VITE_SUPABASE_PUBLISHABLE_KEY="[NEW-ANON-KEY]"
VITE_SUPABASE_URL="https://[NEW-PROJECT-REF].supabase.co"
VITE_PRODUCTION_PORTAL_DOMAIN="https://portal.fleetdrms.com"
VITE_PRODUCTION_BASE_DOMAIN="fleetdrms.com"
SUPABASE_SERVICE_ROLE_KEY="[NEW-SERVICE-ROLE-KEY]"
```

### Step 4.3: Deploy to Vercel

```bash
git add .env
git commit -m "Update Supabase connection to new portal database"
git push origin main
```

Wait for Vercel deployment to complete.

---

## ✅ Phase 5: Testing & Verification (1-2 hours)

### Step 5.1: Verify Portal Functionality

Test on Vercel preview URL:

- [ ] Login with existing portal user
- [ ] View dashboard
- [ ] Check events page
- [ ] Check surveys page
- [ ] Check updates page
- [ ] Check referrals page
- [ ] Admin: View users
- [ ] Admin: View analytics
- [ ] Send test email

### Step 5.2: Verify Data Integrity

```sql
-- In NEW portal database
-- Verify all data migrated correctly

SELECT table_name, row_count
FROM (
  SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
  UNION ALL
  SELECT 'portal_events', COUNT(*) FROM portal_events
  UNION ALL
  SELECT 'portal_referrals', COUNT(*) FROM portal_referrals
  UNION ALL
  SELECT 'membership_agreements', COUNT(*) FROM membership_agreements
  -- ... etc
) counts
ORDER BY table_name;
```

### Step 5.3: Verify Main App Still Works

**CRITICAL**: Test on https://app.fleetdrms.com (or staging):

- [ ] Login with app user (NOT portal user)
- [ ] View fleet list
- [ ] View maintenance records
- [ ] Check that app features work
- [ ] Verify no portal tables being accessed

---

## 🔙 Rollback Plan

If anything goes wrong:

### Immediate Rollback (< 5 minutes)

In Vercel, revert environment variables to old Supabase:

```
VITE_SUPABASE_URL=https://kssbljbxapejckgassgf.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[OLD-KEY]
```

Redeploy. Portal will reconnect to old database.

### Data Recovery

- Keep old Supabase project running for 1 week
- Don't delete any data from old database for 2 weeks
- Have database backups before starting

---

## 📋 Pre-Migration Checklist

Before you start, verify:

- [ ] Portal is working on Vercel with current shared database
- [ ] You have admin access to Supabase dashboard
- [ ] You have admin access to Vercel dashboard
- [ ] You have exported full database backup of current Supabase
- [ ] You understand rollback procedure
- [ ] Email functionality is tested and working
- [ ] You have 4-6 hours available (can spread over 2 days)
- [ ] Users are notified of possible brief outage

---

## 🚨 Critical Data - Handle with Care

These tables contain **irreplaceable legal/compliance data**:

1. **membership_agreements** (7 rows) - Legal contracts
2. **nda_agreements** (7 rows) - Legal NDAs
3. **portal_admin_activity** (28 rows) - Audit trail
4. **portal_audit_log** (12 rows) - Compliance audit
5. **profiles** (9 portal users) - User accounts

**Verify these specifically** after migration.

---

## 📊 Success Criteria

Migration is successful when:

- ✅ All 47 portal tables exist in new database
- ✅ Row counts match (9 profile rows, 7 membership agreements, etc.)
- ✅ Portal loads and works on Vercel
- ✅ Users can login to portal
- ✅ Email sending works
- ✅ Main app still works (uses old database)
- ✅ No errors in logs
- ✅ All features tested successfully

---

## 📞 Next Steps

1. **Review this guide** - Understand each phase
2. **Create new Supabase project** - Phase 1
3. **Run migration scripts** - I'll create these next
4. **Test thoroughly** - Phase 5
5. **Monitor for 24 hours** - Watch for issues
6. **Cleanup old database** - Remove portal tables after 1 week

---

## 🔧 Migration Scripts

I'll create these scripts next:

1. `portal_schema_export.sql` - Export schema from current DB
2. `portal_schema_import.sql` - Import schema to new DB
3. `portal_data_migration.sql` - Data migration scripts
4. `portal_verification.sql` - Verify migration success
5. `cleanup_old_database.sql` - Remove portal tables from app DB (after 1 week)

---

**Ready to proceed?** Let me know and I'll generate the migration SQL scripts.
