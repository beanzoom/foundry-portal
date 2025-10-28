# New Portal Database Creation Plan
## Comprehensive Schema Export and Import Strategy

**Date**: 2025-10-28
**Status**: 📋 PLANNING
**Goal**: Create standalone Supabase database for portal (Vercel-hosted)

---

## Executive Summary

**Current State**: Portal shares database with main app (a_fleetdrms)

**Target State**: Portal has its own Supabase project with complete schema

**Status**: ⚠️ **NOT READY** - Need to export schema first

---

## What We Have ✅

### 1. Migration Planning Complete
- **EXECUTIVE_SUMMARY.md** - Complete migration strategy
- **TABLE_CLASSIFICATION.md** - All 47 portal tables identified
- **FOREIGN_KEY_DEPENDENCY_MAP.md** - 98 FK relationships mapped
- **MIGRATION_PROGRESS.md** - Phase 0-2 complete

### 2. Security Hardening Complete
- ✅ 114 functions secured with search_path protection
- ✅ 9 tables have RLS enabled
- ✅ All SECURITY DEFINER functions fixed

### 3. Schema Export Tool Ready
- **Migration 110**: `110_portal_schema_export.sql`
- Exports tables, FKs, indexes, RLS policies, functions
- 6-part comprehensive export

### 4. Partial Documentation
- **foundry-portal/database/SCHEMA.md** - Email tables documented
- Needs completion for all 47 tables

---

## What We DON'T Have ❌

### Critical Missing Pieces

1. **Complete CREATE TABLE Statements**
   - Need actual DDL for all 47 tables
   - Must include exact data types, defaults, constraints
   - Status: ❌ Not exported yet

2. **Foreign Key Creation Order**
   - Must create tables in dependency order
   - profiles first, then others
   - Status: ⚠️ Mapped but not ordered

3. **All Database Functions** (116 functions)
   - Email/notification functions (16)
   - Referral functions (13)
   - Portal updates functions (14)
   - Portal surveys functions (12)
   - Portal marketing/events functions (11)
   - Portal contacts/DSP functions (8)
   - Portal general/calculator functions (7)
   - Auth/user management functions (15)
   - Roles/permissions functions (7)
   - App/system functions (9)
   - Dev/test functions (1)
   - Plus 3 triggers
   - Status: ❌ Not exported yet

4. **All Triggers**
   - trigger_email_notification()
   - Other triggers on portal tables
   - Status: ❌ Not exported yet

5. **Edge Functions**
   - send-email
   - send-update-notifications
   - Dependencies and configurations
   - Status: ❌ Not exported yet

6. **Storage Buckets**
   - Bucket configurations
   - File inventory
   - Access policies
   - Status: ❌ Not documented

7. **Environment Variables**
   - Required secrets
   - API keys
   - Configuration values
   - Status: ❌ Not documented

8. **Cron Jobs**
   - Email processing cron
   - Other scheduled jobs
   - Status: ❌ Not documented

---

## Step-by-Step Creation Plan

### Phase 1: Schema Export (Week 1)

#### Step 1.1: Run Migration 110 ✅ READY
**File**: `/database/migrations/110_portal_schema_export.sql`

**Action**: Run each part in Supabase SQL Editor:
1. Part 1: Export profiles table structure
2. Part 2: Verify all 47 portal tables exist
3. Part 3: Export foreign key constraints
4. Part 4: Export indexes
5. Part 5: Export RLS policies
6. Part 6: Export functions (partial - portal-named only)

**Save output to**:
- `/database/exports/01_profiles_structure.sql`
- `/database/exports/02_table_inventory.csv`
- `/database/exports/03_foreign_keys.sql`
- `/database/exports/04_indexes.sql`
- `/database/exports/05_rls_policies.sql`
- `/database/exports/06_functions_partial.sql`

**Time**: 1 hour

#### Step 1.2: Export ALL Functions ⏳ TODO
**Need**: Complete function export query

**Action**: Create and run query to export all 116 functions:
```sql
SELECT
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proowner != 10  -- Exclude system-owned
ORDER BY p.proname;
```

**Save output to**:
- `/database/exports/07_all_functions.sql`

**Time**: 30 minutes

#### Step 1.3: Export ALL Triggers ⏳ TODO
**Need**: Trigger export query

**Action**: Create and run query:
```sql
SELECT
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger
WHERE tgrelid IN (
    SELECT oid FROM pg_class
    WHERE relnamespace = 'public'::regnamespace
    AND relname IN (
        -- All 47 portal tables
        'calculator_submissions', 'marketing_campaign_links',
        -- ... full list
    )
)
ORDER BY tgrelid::regclass::text, tgname;
```

**Save output to**:
- `/database/exports/08_triggers.sql`

**Time**: 15 minutes

#### Step 1.4: Export Complete Table DDL ⏳ TODO
**Need**: pg_dump or manual CREATE statements

**Option A - Use pg_dump** (recommended):
```bash
pg_dump --schema-only --table=profiles --table=portal_events ... \
  postgresql://[connection-string] > 09_complete_ddl.sql
```

**Option B - Generate from information_schema** (manual):
Run comprehensive query to build CREATE TABLE statements with:
- Exact data types
- NOT NULL constraints
- DEFAULT values
- PRIMARY KEY constraints
- CHECK constraints

**Save output to**:
- `/database/exports/09_complete_ddl.sql`

**Time**: 1-2 hours

#### Step 1.5: Document Edge Functions ⏳ TODO
**Need**: Review Edge Function code

**Action**:
1. List all Edge Functions in Supabase dashboard
2. For each function:
   - Download function code
   - Document database tables it accesses
   - Document environment variables it needs
   - Document external APIs it calls
3. Create deployment script

**Save output to**:
- `/database/exports/10_edge_functions.md`
- `/supabase/functions/` (copy all function code)

**Time**: 2 hours

#### Step 1.6: Document Storage & Cron ⏳ TODO
**Action**:
1. List all storage buckets
2. Document bucket policies
3. Inventory files in each bucket
4. Document cron jobs from Supabase dashboard

**Save output to**:
- `/database/exports/11_storage_buckets.md`
- `/database/exports/12_cron_jobs.md`

**Time**: 1 hour

---

### Phase 2: Create Import Script (Week 1)

#### Step 2.1: Order Tables by Dependencies ⏳ TODO
**Input**: Foreign key export from Step 1.1

**Action**:
1. Analyze foreign key dependencies
2. Create dependency graph
3. Determine creation order
4. Group tables by dependency level

**Output**:
- Level 0: `profiles` (no dependencies)
- Level 1: Tables that reference only profiles
- Level 2: Tables that reference Level 1 tables
- Etc.

**Save to**:
- `/database/imports/00_table_creation_order.md`

**Time**: 2 hours

#### Step 2.2: Create Master Import Script ⏳ TODO
**Input**: All exports from Phase 1

**Action**: Create single SQL script with sections:
```sql
-- =====================================================
-- PORTAL DATABASE CREATION SCRIPT
-- Generated: 2025-10-28
-- =====================================================

-- SECTION 1: EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
-- ... etc

-- SECTION 2: TABLES (in dependency order)
-- Level 0: profiles
CREATE TABLE IF NOT EXISTS profiles (...);

-- Level 1: Tables depending only on profiles
CREATE TABLE IF NOT EXISTS email_templates (...);
CREATE TABLE IF NOT EXISTS notification_events (...);
-- ... etc

-- SECTION 3: PRIMARY KEYS
ALTER TABLE profiles ADD PRIMARY KEY (id);
-- ... etc

-- SECTION 4: FOREIGN KEYS (in dependency order)
ALTER TABLE email_queue ADD CONSTRAINT fk_to_profiles ...;
-- ... etc

-- SECTION 5: INDEXES
CREATE INDEX idx_email_queue_status ON email_queue(status);
-- ... etc

-- SECTION 6: RLS POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ...;
-- ... etc

-- SECTION 7: FUNCTIONS (in dependency order)
CREATE OR REPLACE FUNCTION get_portal_user_role(...) ...;
-- ... etc

-- SECTION 8: TRIGGERS
CREATE TRIGGER trigger_email_notification ...;
-- ... etc
```

**Save to**:
- `/database/imports/01_create_portal_database.sql`

**Time**: 4-6 hours

#### Step 2.3: Create Data Migration Script ⏳ TODO
**Purpose**: Copy data from shared DB to new portal DB

**Action**: Create script that:
1. Exports data from shared database
2. Transforms data if needed (e.g., filter profiles to portal users only)
3. Imports data to new database
4. Verifies row counts match

**Save to**:
- `/database/imports/02_migrate_portal_data.sql`

**Time**: 3-4 hours

#### Step 2.4: Create Edge Function Deployment Script ⏳ TODO
**Action**: Create deployment script:
```bash
#!/bin/bash
# Deploy all edge functions to new portal project

cd supabase/functions

# Deploy send-email function
supabase functions deploy send-email --project-ref [new-project]

# Deploy send-update-notifications function
supabase functions deploy send-update-notifications --project-ref [new-project]

# Set environment variables
supabase secrets set RESEND_API_KEY=[value] --project-ref [new-project]
# ... etc
```

**Save to**:
- `/database/imports/03_deploy_edge_functions.sh`

**Time**: 1 hour

#### Step 2.5: Create Storage Setup Script ⏳ TODO
**Action**: Create script to:
1. Create storage buckets
2. Set bucket policies
3. Upload files (if any)

**Save to**:
- `/database/imports/04_setup_storage.sql`
- `/database/imports/05_upload_files.sh`

**Time**: 1 hour

#### Step 2.6: Create Cron Job Setup Script ⏳ TODO
**Action**: Create SQL to set up cron jobs:
```sql
-- Email processing cron (every 5 minutes)
SELECT cron.schedule(
  'process-email-queue',
  '*/5 * * * *',
  $$SELECT process_email_queue()$$
);
```

**Save to**:
- `/database/imports/06_setup_cron_jobs.sql`

**Time**: 30 minutes

---

### Phase 3: Create New Supabase Project (Week 2)

#### Step 3.1: Create Project ⏳ TODO
**Action**:
1. Go to supabase.com
2. Create new project
3. Name: "FleetDRMS Portal"
4. Region: Same as current (for latency)
5. Plan: Pro ($25/month recommended)
6. Password: Save to 1Password

**Output**:
- Project URL
- Service Role Key
- Anon Key
- Database connection string

**Save to**:
- `/database/NEW_PROJECT_CREDENTIALS.md` (gitignored)

**Time**: 10 minutes

#### Step 3.2: Configure Project Settings ⏳ TODO
**Action**:
1. Enable email auth
2. Configure auth providers (if any)
3. Set up custom SMTP (if using Resend)
4. Configure JWT settings
5. Set auth redirects

**Time**: 30 minutes

#### Step 3.3: Set Environment Variables ⏳ TODO
**Action**: Set all required secrets:
```bash
supabase secrets set RESEND_API_KEY=[value] --project-ref [new-project]
# ... all other secrets
```

**Time**: 15 minutes

---

### Phase 4: Execute Import (Week 2)

#### Step 4.1: Run Schema Import ⏳ TODO
**Action**:
1. Connect to new database
2. Run `/database/imports/01_create_portal_database.sql`
3. Verify:
   - All tables created
   - All FKs created
   - All indexes created
   - All RLS policies created
   - All functions created
   - All triggers created

**Time**: 1 hour (plus troubleshooting)

#### Step 4.2: Run Data Migration ⏳ TODO
**Action**:
1. Run `/database/imports/02_migrate_portal_data.sql`
2. Verify row counts match:
   - profiles: 9 portal users
   - email_queue: X rows
   - email_templates: 15 templates
   - notification_rules: X rules
   - portal_events: X events
   - portal_surveys: X surveys
   - portal_referrals: X referrals
   - etc.

**Time**: 2-3 hours (plus troubleshooting)

#### Step 4.3: Deploy Edge Functions ⏳ TODO
**Action**:
1. Run `/database/imports/03_deploy_edge_functions.sh`
2. Test each function manually
3. Verify they can access database

**Time**: 1 hour

#### Step 4.4: Set Up Storage ⏳ TODO
**Action**:
1. Run `/database/imports/04_setup_storage.sql`
2. Run `/database/imports/05_upload_files.sh`
3. Verify file access

**Time**: 30 minutes

#### Step 4.5: Set Up Cron Jobs ⏳ TODO
**Action**:
1. Run `/database/imports/06_setup_cron_jobs.sql`
2. Monitor cron execution
3. Verify email queue processing works

**Time**: 30 minutes

---

### Phase 5: Testing & Verification (Week 3)

#### Step 5.1: Run Integration Tests ⏳ TODO
**Action**:
1. Update `.env` to point to new database
2. Run integration test suite
3. Fix any failures
4. Verify 0 emails sent to production

**Time**: 4-6 hours

#### Step 5.2: Manual Feature Testing ⏳ TODO
**Action**: Test all portal features:
- ✅ User authentication
- ✅ Create event
- ✅ Publish event (check emails)
- ✅ Create survey
- ✅ Publish survey (check emails)
- ✅ Create referral
- ✅ Register for event
- ✅ Submit calculator
- ✅ Contact form
- ✅ View updates

**Time**: 3-4 hours

#### Step 5.3: Performance Testing ⏳ TODO
**Action**:
- Check query performance
- Monitor database load
- Verify response times acceptable

**Time**: 1 hour

---

### Phase 6: Update foundry-portal Code (Week 3-4)

#### Step 6.1: Update Environment Variables ⏳ TODO
**Action**: Update `.env` files:
```bash
VITE_SUPABASE_URL=[new-portal-project-url]
VITE_SUPABASE_ANON_KEY=[new-portal-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[new-portal-service-key]
```

**Time**: 15 minutes

#### Step 6.2: Update Vercel Environment Variables ⏳ TODO
**Action**:
1. Go to Vercel dashboard
2. Update all Supabase-related env vars
3. Redeploy

**Time**: 15 minutes

#### Step 6.3: Smoke Test Production ⏳ TODO
**Action**:
- Visit foundry-portal.vercel.app
- Test login
- Test one feature
- Verify working

**Time**: 30 minutes

---

## Timeline Summary

| Phase | Tasks | Time Estimate |
|-------|-------|---------------|
| Phase 1: Schema Export | 6 steps | 6-8 hours |
| Phase 2: Create Import Script | 6 steps | 12-15 hours |
| Phase 3: Create New Project | 3 steps | 1 hour |
| Phase 4: Execute Import | 5 steps | 5-7 hours |
| Phase 5: Testing | 3 steps | 8-11 hours |
| Phase 6: Update Code | 3 steps | 1 hour |
| **TOTAL** | **26 steps** | **33-43 hours** |

**Spread over**: 3-4 weeks (part-time work)

**Calendar Time**: 4-6 weeks

---

## Critical Success Factors

### 1. Complete Schema Export ✅
- Must have EXACT table definitions
- Must have ALL foreign keys
- Must have ALL functions
- Must have ALL triggers

### 2. Correct Dependency Order ✅
- Tables created in FK dependency order
- Functions created before triggers that use them
- RLS policies created after tables

### 3. Data Integrity ✅
- Row counts match after migration
- No data loss
- No data corruption

### 4. Feature Parity ✅
- All portal features work identically
- Email system works
- Auth works
- No regressions

### 5. Clean Separation ✅
- Portal database completely independent
- No references to app data
- App database unaffected

---

## Risks & Mitigation

### Risk 1: Incomplete Schema Export
**Mitigation**:
- Use multiple export methods (pg_dump + custom queries)
- Verify table count matches (47 tables)
- Verify function count matches (116 functions)

### Risk 2: Data Migration Failures
**Mitigation**:
- Keep shared database running during migration
- Verify row counts after each table
- Easy rollback (just point back to shared DB)

### Risk 3: Missing Dependencies
**Mitigation**:
- Comprehensive dependency mapping
- Test import script on staging first
- Have rollback plan ready

### Risk 4: Edge Function Failures
**Mitigation**:
- Test each function individually
- Verify database access
- Monitor error logs

---

## Next Steps - THIS WEEK

1. ✅ Review this plan
2. ⏳ Create `/database/exports/` directory
3. ⏳ Run Step 1.1: Migration 110 in Supabase
4. ⏳ Save all output to exports directory
5. ⏳ Review output and identify any issues

**Estimated Time This Week**: 2-3 hours

---

## Questions to Answer

Before starting, we need to answer:

1. ❓ What Supabase plan for new portal project? (Pro recommended: $25/month)
2. ❓ What region for new project? (Same as current for latency)
3. ❓ Timeline preference? (Can we spread over 4-6 weeks?)
4. ❓ Who will create new Supabase project? (User needs to do this)
5. ❓ Do we have all environment variable values documented?

---

**Status**: 📋 READY TO START - Awaiting user approval to begin Phase 1

**Last Updated**: 2025-10-28
