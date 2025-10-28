# Portal Database Migration - Master Index
## Creating Standalone Supabase Database for Vercel-Hosted Portal

**Repository**: foundry-portal ONLY
**Date**: 2025-10-28
**Status**: 📋 READY TO START

---

## 🚀 Quick Start

**What you need to do RIGHT NOW**:

1. **Read** [schema_export/README.md](schema_export/README.md)
2. **Run** [schema_export/01_run_schema_export.sql](schema_export/01_run_schema_export.sql) in Supabase
3. **Save** output to `schema_export/exports/` directory
4. **Tell AI** when complete

**Time**: 30-60 minutes

---

## 📁 All Documents You Need

### START HERE
1. **[PORTAL_DATABASE_MIGRATION.md](PORTAL_DATABASE_MIGRATION.md)** ← YOU ARE HERE
   - Master index of all documents
   - Quick links to everything

2. **[schema_export/README.md](schema_export/README.md)** ← READ THIS NEXT
   - Complete step-by-step instructions
   - What to run, where to save output
   - Timeline and phases

### Planning Documents (Background Reading)
3. **[planning/EXECUTIVE_SUMMARY.md](planning/EXECUTIVE_SUMMARY.md)**
   - Complete migration strategy
   - Why we're doing this
   - Timeline: 8-12 weeks for full migration

4. **[planning/TABLE_CLASSIFICATION.md](planning/TABLE_CLASSIFICATION.md)**
   - All 47 portal tables identified
   - What each table does
   - Migration actions for each

5. **[planning/FOREIGN_KEY_DEPENDENCY_MAP.md](planning/FOREIGN_KEY_DEPENDENCY_MAP.md)**
   - All 98 FK relationships mapped
   - Dependency order for table creation

6. **[NEW_DATABASE_CREATION_PLAN.md](NEW_DATABASE_CREATION_PLAN.md)**
   - Detailed 6-phase plan
   - Comprehensive timeline
   - Success criteria

### Schema Export Scripts (YOU RUN THESE)
7. **[schema_export/01_run_schema_export.sql](schema_export/01_run_schema_export.sql)**
   - Export tables, FKs, indexes, RLS policies, functions (partial)
   - **RUN THIS FIRST**
   - Save to: `schema_export/exports/01-06_*.txt`

8. **[schema_export/02_export_all_functions.sql](schema_export/02_export_all_functions.sql)**
   - Export all 116 database functions
   - **RUN THIS SECOND**
   - Save to: `schema_export/exports/07_all_functions.txt`

9. **[schema_export/03_export_triggers.sql](schema_export/03_export_triggers.sql)**
   - Export all triggers on portal tables
   - **RUN THIS THIRD**
   - Save to: `schema_export/exports/08_triggers.txt`

### Import Scripts (AI CREATES THESE - AFTER YOU RUN EXPORTS)
10. **schema_export/imports/00_table_creation_order.md**
    - Table dependency order
    - Which tables to create first

11. **schema_export/imports/01_create_portal_database.sql**
    - Master SQL script to create entire database
    - Tables, FKs, indexes, RLS, functions, triggers

12. **schema_export/imports/02_migrate_portal_data.sql**
    - Copy data from shared DB to new portal DB
    - Filters profiles to portal users only

13. **schema_export/imports/03_deploy_edge_functions.sh**
    - Deploy Edge Functions to new project

14. **schema_export/imports/04_setup_storage.sql**
    - Create storage buckets

15. **schema_export/imports/05_upload_files.sh**
    - Upload any existing files

16. **schema_export/imports/06_setup_cron_jobs.sql**
    - Set up email processing cron

### Reference Documents
17. **[SCHEMA.md](SCHEMA.md)**
    - Current partial schema documentation
    - Email tables documented

18. **[VALIDATION_TEST_PLAN.md](VALIDATION_TEST_PLAN.md)**
    - How to validate email system works
    - Test cases for verification

---

## 🗂️ Directory Structure

```
/home/joeylutes/projects/foundry-portal/
├── database/
│   ├── PORTAL_DATABASE_MIGRATION.md         ← YOU ARE HERE (master index)
│   ├── NEW_DATABASE_CREATION_PLAN.md        ← Detailed 6-phase plan
│   ├── SCHEMA.md                             ← Partial schema docs
│   ├── VALIDATION_TEST_PLAN.md               ← Testing guide
│   │
│   ├── planning/                             ← Background reading
│   │   ├── EXECUTIVE_SUMMARY.md
│   │   ├── TABLE_CLASSIFICATION.md
│   │   └── FOREIGN_KEY_DEPENDENCY_MAP.md
│   │
│   ├── schema_export/                        ← ACTIVE WORK HERE
│   │   ├── README.md                         ← START HERE for exports
│   │   ├── 01_run_schema_export.sql          ← RUN THIS FIRST
│   │   ├── 02_export_all_functions.sql       ← RUN THIS SECOND
│   │   ├── 03_export_triggers.sql            ← RUN THIS THIRD
│   │   ├── exports/                          ← SAVE OUTPUT HERE
│   │   │   ├── 01_profiles_structure.txt
│   │   │   ├── 02_table_inventory.txt
│   │   │   ├── 03_foreign_keys.txt
│   │   │   ├── 04_indexes.txt
│   │   │   ├── 05_rls_policies.txt
│   │   │   ├── 06_functions_partial.txt
│   │   │   ├── 07_all_functions.txt
│   │   │   └── 08_triggers.txt
│   │   └── imports/                          ← AI CREATES THESE
│   │       ├── 00_table_creation_order.md
│   │       ├── 01_create_portal_database.sql
│   │       ├── 02_migrate_portal_data.sql
│   │       ├── 03_deploy_edge_functions.sh
│   │       ├── 04_setup_storage.sql
│   │       ├── 05_upload_files.sh
│   │       └── 06_setup_cron_jobs.sql
│   │
│   ├── migrations/                           ← Email bug fix migrations
│   │   ├── 001-005_*.sql                     ← Existing migrations
│   │   └── APPLY_THESE_MIGRATIONS.md
│   │
│   └── debug/                                ← Email bug diagnosis
│       ├── EMAIL_QUEUE_ISSUE_RESOLVED.md
│       └── EMAIL_BUG_QUICK_REFERENCE.md
│
├── tests/integration/
│   ├── INTEGRATION_TEST_EMAIL_POLICY.md      ← Email testing policy
│   └── portal/
│       ├── portal-events.test.ts             ← Fixed tests
│       └── portal-surveys.test.ts            ← Fixed tests
│
└── EMAIL_BUG_AI_BRIEFING.md                  ← AI briefing for email bug
```

---

## 📋 Phase Overview

### Phase 1: Schema Export (YOU DO THIS - Week 1)
**Time**: 1.5-2 hours

1. Run `01_run_schema_export.sql` → Save 6 files
2. Run `02_export_all_functions.sql` → Save 1 file
3. Run `03_export_triggers.sql` → Save 1 file
4. Document Edge Functions (manual)
5. Document Storage/Cron (manual)

**Output**: 8-10 export files

### Phase 2: Create Import Scripts (AI DOES THIS - Week 1)
**Time**: 12-15 hours (AI work)

1. Analyze dependencies
2. Create table creation order
3. Build master SQL import script
4. Create data migration script
5. Create deployment scripts

**Output**: 7 import scripts ready to run

### Phase 3: Create New Supabase Project (YOU DO THIS - Week 2)
**Time**: 1 hour

1. Create new Supabase project
2. Configure settings
3. Set environment variables
4. Save credentials

**Output**: New empty Supabase project ready for import

### Phase 4: Execute Import (YOU + AI - Week 2)
**Time**: 5-7 hours

1. Run schema import SQL
2. Run data migration SQL
3. Deploy Edge Functions
4. Set up Storage
5. Set up Cron jobs
6. Verify everything

**Output**: Fully populated portal database

### Phase 5: Testing (YOU + AI - Week 3)
**Time**: 8-11 hours

1. Run integration tests
2. Manual feature testing
3. Performance testing

**Output**: Verified working portal database

### Phase 6: Deploy to Vercel (YOU DO THIS - Week 3-4)
**Time**: 1 hour

1. Update `.env` in foundry-portal
2. Update Vercel env vars
3. Redeploy
4. Test production

**Output**: Portal running on new database

---

## ✅ What's Been Completed

### Security Hardening ✅
- 114 functions secured with `search_path` protection
- 9 tables have RLS enabled
- All SECURITY DEFINER functions fixed
- **Status**: COMPLETE (from a_fleetdrms migration work)

### Planning ✅
- All 47 portal tables identified
- All 98 FK relationships mapped
- Migration strategy documented
- **Status**: COMPLETE

### Email Bug Fix ✅
- Integration tests fixed
- Email policy established
- Documentation complete
- **Status**: COMPLETE

---

## 🔴 What's NOT Done Yet

### Schema Export ⏳
- Need to run 3 export scripts
- Need to document Edge Functions
- Need to document Storage/Cron
- **Status**: READY TO START (that's YOUR next step)

### Import Scripts ⏳
- Will be created after you provide exports
- **Status**: WAITING for your exports

### New Supabase Project ⏳
- Create when ready to import
- **Status**: Not started

---

## 🎯 Your Next Action

1. **Go to**: [schema_export/README.md](schema_export/README.md)
2. **Read**: Complete instructions
3. **Run**: [schema_export/01_run_schema_export.sql](schema_export/01_run_schema_export.sql)
4. **Save**: Output to `schema_export/exports/` directory
5. **Tell AI**: "Exports complete, ready for import script creation"

**Estimated Time**: 30-60 minutes

---

## 📞 Questions? Issues?

If you have questions or run into issues:

1. **Check** [schema_export/README.md](schema_export/README.md) first
2. **Check** [NEW_DATABASE_CREATION_PLAN.md](NEW_DATABASE_CREATION_PLAN.md) for details
3. **Ask AI** in foundry-portal repo Claude instance

---

## 🔄 Communication Between Two AI Instances

**For User** (to coordinate between a_fleetdrms Claude and foundry-portal Claude):

All migration work should happen in **foundry-portal** repo only.

**Tell foundry-portal Claude**:
- "Run the schema export scripts"
- "Create import scripts from the exports I provided"
- "Help me execute the import"
- "Help me test the new database"

**Tell a_fleetdrms Claude** (if needed):
- "What tables/functions does the app (not portal) use?"
- "Will removing portal tables break the app?"
- "What are the app-specific dependencies?"

But for actual migration work, everything happens in foundry-portal.

---

**Last Updated**: 2025-10-28
**Status**: 📋 READY TO START - Run schema exports
**Location**: `/home/joeylutes/projects/foundry-portal/database/`
