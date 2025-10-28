# Instructions for AI Assistant
## Portal Database Migration - foundry-portal Repo

**Date**: 2025-10-28
**Context**: Creating standalone Supabase database for Vercel-hosted portal

---

## Quick Context

The portal currently shares a Supabase database with the main app (a_fleetdrms). We're creating a new standalone database for the portal.

**Your repo**: foundry-portal
**Migration location**: `/database/` directory
**Status**: Ready to start Phase 1 (Schema Export)

---

## Start Here

1. **Read**: [database/PORTAL_DATABASE_MIGRATION.md](PORTAL_DATABASE_MIGRATION.md)
   - Master index of all documents
   - Complete overview

2. **Read**: [database/schema_export/README.md](schema_export/README.md)
   - Step-by-step instructions for schema export
   - What user needs to do next

---

## What User Needs To Do (Phase 1)

### Step 1: Run Schema Export Scripts

**Location**: `/database/schema_export/`

**Scripts to run** (in Supabase SQL Editor):
1. `01_run_schema_export.sql` - Tables, FKs, indexes, RLS, functions
2. `02_export_all_functions.sql` - All 116 database functions
3. `03_export_triggers.sql` - All triggers on portal tables

**Where to save output**: `database/schema_export/exports/`

**Files to create**:
- `01_profiles_structure.txt`
- `02_table_inventory.txt`
- `03_foreign_keys.txt`
- `04_indexes.txt`
- `05_rls_policies.txt`
- `06_functions_partial.txt`
- `07_all_functions.txt`
- `08_triggers.txt`

**Time**: 1.5-2 hours

### Step 2: Document Edge Functions & Storage (Manual)

User needs to document:
- Edge Functions (send-email, send-update-notifications)
- Storage buckets and policies
- Cron jobs

Save to: `database/schema_export/exports/`

---

## What You (AI) Will Do (Phase 2)

After user provides exports, you will:

1. **Analyze dependencies** → Create table creation order
2. **Build master SQL** → Complete CREATE DATABASE script
3. **Create data migration** → Script to copy data
4. **Create deployment scripts** → Edge Functions, Storage, Cron

**Output location**: `database/schema_export/imports/`

**Files to create**:
- `00_table_creation_order.md`
- `01_create_portal_database.sql`
- `02_migrate_portal_data.sql`
- `03_deploy_edge_functions.sh`
- `04_setup_storage.sql`
- `05_upload_files.sh`
- `06_setup_cron_jobs.sql`

**Time**: 12-15 hours of work

---

## Key Facts

### Portal Tables (47 total)
- profiles (9 portal users)
- email system (8 tables)
- notification system (4 tables)
- portal events (7 tables)
- portal surveys (4 tables)
- portal referrals (6 tables)
- portal updates (2 tables)
- portal admin/audit (3 tables)
- contact system (3 tables)
- core portal features (5 tables)

### Database Functions (116 total)
- Email/notification: 16
- Referral: 13
- Portal updates: 14
- Portal surveys: 12
- Portal marketing/events: 11
- Portal contacts/DSP: 8
- Portal general/calculator: 7
- Auth/user management: 15
- Roles/permissions: 7
- App/system: 9
- Dev/test: 1
- System (cannot modify): 3

### Security Status
✅ All 114 user-owned functions secured with search_path protection
✅ 9 tables have RLS enabled
✅ Security hardening complete

### Email Bug Status
✅ Integration tests fixed (won't send production emails)
✅ Email policy established
✅ Documentation complete

---

## Important Notes

### ⚠️ This Is foundry-portal Repo ONLY
All migration work happens here. Do NOT reference or work in a_fleetdrms.

### ⚠️ Planning Already Complete
Don't redo the planning. Use existing docs in `/database/planning/`:
- EXECUTIVE_SUMMARY.md
- TABLE_CLASSIFICATION.md
- FOREIGN_KEY_DEPENDENCY_MAP.md

### ⚠️ Don't Create New Database Yet
User will create new Supabase project in Phase 3 (after you create import scripts).

### ⚠️ Security Already Fixed
The 116 functions have already been secured. Don't try to fix them again.

---

## Timeline

| Phase | Who | Time | Status |
|-------|-----|------|--------|
| 1. Schema Export | User | 1.5-2 hours | ⏳ NEXT |
| 2. Create Import Scripts | AI | 12-15 hours | ⏳ Waiting |
| 3. Create New Project | User | 1 hour | ⏳ Pending |
| 4. Execute Import | User+AI | 5-7 hours | ⏳ Pending |
| 5. Testing | User+AI | 8-11 hours | ⏳ Pending |
| 6. Deploy to Vercel | User | 1 hour | ⏳ Pending |

---

## When User Says "Exports Complete"

1. **Ask for exports** - Request user paste/upload the 8 export files
2. **Verify completeness**:
   - All 47 tables present?
   - All 116 functions present?
   - All FK relationships captured?
   - All triggers captured?
3. **Analyze dependencies** - Determine table creation order
4. **Create import scripts** - All 7 scripts in `imports/` directory
5. **Document next steps** - What user needs to do in Phase 3

---

## If User Has Questions

Direct them to:
1. [PORTAL_DATABASE_MIGRATION.md](PORTAL_DATABASE_MIGRATION.md) - Master index
2. [schema_export/README.md](schema_export/README.md) - Detailed instructions
3. [NEW_DATABASE_CREATION_PLAN.md](NEW_DATABASE_CREATION_PLAN.md) - Complete plan

---

## Commands You May Need

### To check file structure:
```bash
ls -la /home/joeylutes/projects/foundry-portal/database/schema_export/exports/
```

### To read an export file:
```bash
cat /home/joeylutes/projects/foundry-portal/database/schema_export/exports/01_profiles_structure.txt
```

### To create an import script:
```bash
# Use Write tool to create files in:
/home/joeylutes/projects/foundry-portal/database/schema_export/imports/
```

---

## Success Criteria

### Phase 1 Success (User's exports)
✅ 8 export files created
✅ All 47 tables captured
✅ All 116 functions captured
✅ All triggers captured
✅ Edge Functions documented
✅ Storage/Cron documented

### Phase 2 Success (Your import scripts)
✅ Table creation order determined
✅ Master SQL script creates all tables
✅ Master SQL script creates all FKs (in order)
✅ Master SQL script creates all indexes
✅ Master SQL script creates all RLS policies
✅ Master SQL script creates all functions
✅ Master SQL script creates all triggers
✅ Data migration script copies data correctly
✅ Deployment scripts ready for Edge Functions
✅ Storage setup scripts ready
✅ Cron setup scripts ready

---

## Current State

**Last commit**: 2307134
**Branch**: main
**Files added**: 9 (planning + schema export scripts)
**Status**: ✅ Ready for user to run exports

---

**Your Next Action**: Wait for user to run exports and provide output files

**When User Provides Exports**: Start Phase 2 (create import scripts)

---

**Last Updated**: 2025-10-28
**For**: AI Assistant in foundry-portal repo
