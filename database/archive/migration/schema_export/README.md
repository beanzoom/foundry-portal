# Portal Database Schema Export & Import
## Creating Standalone Supabase Database for Vercel-Hosted Portal

**Repository**: foundry-portal
**Date**: 2025-10-28
**Status**: 📋 READY TO START

---

## Quick Start - What You Need To Do

### Step 1: Run Schema Export (30 minutes)

1. Open Supabase SQL Editor for **current shared database**
2. Run [`01_run_schema_export.sql`](01_run_schema_export.sql) **one section at a time**
3. Save output from each section to files in [`exports/`](exports/) directory

**Sections to run**:
- Part 1 → Save to `exports/01_profiles_structure.txt`
- Part 2 → Save to `exports/02_table_inventory.txt`
- Part 3 → Save to `exports/03_foreign_keys.txt`
- Part 4 → Save to `exports/04_indexes.txt`
- Part 5 → Save to `exports/05_rls_policies.txt`
- Part 6 → Save to `exports/06_functions_partial.txt`

### Step 2: Run Additional Exports (1 hour)

Run the queries in [`02_export_all_functions.sql`](02_export_all_functions.sql), [`03_export_triggers.sql`](03_export_triggers.sql), etc.

### Step 3: Review Output

AI will review your exports and create the import scripts.

---

## Directory Structure

```
/database/schema_export/
├── README.md                          ← YOU ARE HERE
├── 01_run_schema_export.sql          ← Run this in Supabase SQL Editor
├── 02_export_all_functions.sql       ← Run this next (TODO: create)
├── 03_export_triggers.sql            ← Run this next (TODO: create)
├── exports/                           ← SAVE QUERY RESULTS HERE
│   ├── 01_profiles_structure.txt
│   ├── 02_table_inventory.txt
│   ├── 03_foreign_keys.txt
│   ├── 04_indexes.txt
│   ├── 05_rls_policies.txt
│   ├── 06_functions_partial.txt
│   ├── 07_all_functions.txt
│   └── 08_triggers.txt
└── imports/                           ← AI WILL CREATE THESE
    ├── 00_table_creation_order.md
    ├── 01_create_portal_database.sql
    ├── 02_migrate_portal_data.sql
    ├── 03_deploy_edge_functions.sh
    ├── 04_setup_storage.sql
    ├── 05_upload_files.sh
    └── 06_setup_cron_jobs.sql
```

---

## What This Export Captures

### From Current Shared Database

**47 Portal Tables**:
- profiles (9 portal users only)
- email system (8 tables)
- notification system (4 tables)
- portal events (7 tables)
- portal surveys (4 tables)
- portal referrals (6 tables)
- portal updates (2 tables)
- portal admin/audit (3 tables)
- contact system (3 tables)
- core portal features (5 tables)

**116 Database Functions**:
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
- Plus 3 system functions (cannot modify)

**Everything Else**:
- All foreign key constraints
- All indexes
- All RLS policies
- All triggers
- Edge Functions (send-email, send-update-notifications)
- Storage buckets
- Cron jobs

---

## Phase 1: Schema Export (YOU DO THIS)

### Export 1: Tables, FKs, Indexes, RLS, Functions

**File**: [`01_run_schema_export.sql`](01_run_schema_export.sql)

**Instructions**:
1. Open Supabase SQL Editor
2. Copy/paste **Part 1** from the file
3. Run query
4. Copy ALL output
5. Save to `exports/01_profiles_structure.txt`
6. Repeat for Parts 2-6

**Time**: 30 minutes

### Export 2: All Functions (TODO)

**File**: `02_export_all_functions.sql` (AI will create)

**What it does**: Exports all 116 database functions with complete definitions

**Time**: 15 minutes

### Export 3: All Triggers (TODO)

**File**: `03_export_triggers.sql` (AI will create)

**What it does**: Exports all triggers on portal tables

**Time**: 15 minutes

### Export 4: Edge Functions Documentation (MANUAL)

**Instructions**:
1. Go to Supabase Dashboard → Edge Functions
2. For each function:
   - Download function code
   - Document database tables it accesses
   - Document environment variables it needs
3. Save to `exports/edge_functions_inventory.md`

**Time**: 30 minutes

### Export 5: Storage & Cron Documentation (MANUAL)

**Instructions**:
1. Go to Supabase Dashboard → Storage
2. List all buckets and their policies
3. Inventory any files in buckets
4. Go to Database → Cron Jobs
5. Document all scheduled jobs
6. Save to `exports/storage_and_cron.md`

**Time**: 15 minutes

**TOTAL PHASE 1 TIME**: 1.5-2 hours

---

## Phase 2: Create Import Scripts (AI DOES THIS)

After you provide the exports, AI will:

1. **Analyze dependencies** → Create table creation order
2. **Build master SQL** → Complete CREATE DATABASE script
3. **Create data migration** → Script to copy data from shared DB
4. **Create deployment scripts** → Edge Functions, Storage, Cron

**Output**: 7 files in `imports/` directory ready to execute

---

## Phase 3: Create New Supabase Project (YOU DO THIS)

1. Go to supabase.com
2. Create new project: "FleetDRMS Portal"
3. Choose region (same as current)
4. Choose plan (Pro recommended: $25/month)
5. Save credentials to 1Password
6. Document project URL, service role key, anon key

---

## Phase 4: Execute Import (AI GUIDES, YOU RUN)

1. Run `imports/01_create_portal_database.sql` in new project
2. Run `imports/02_migrate_portal_data.sql` to copy data
3. Run `imports/03_deploy_edge_functions.sh` to deploy functions
4. Run `imports/04_setup_storage.sql` and `imports/05_upload_files.sh`
5. Run `imports/06_setup_cron_jobs.sql`
6. Verify everything works

---

## Phase 5: Update Vercel Deployment (YOU DO THIS)

1. Update `.env` in foundry-portal:
   ```
   VITE_SUPABASE_URL=[new-portal-url]
   VITE_SUPABASE_ANON_KEY=[new-portal-anon-key]
   ```
2. Update Vercel environment variables
3. Redeploy
4. Test production

---

## Key Reference Documents

### In This Directory
- **README.md** (this file) - Start here
- **01_run_schema_export.sql** - First script to run

### In `/database/planning/`
- **EXECUTIVE_SUMMARY.md** - Complete migration strategy
- **TABLE_CLASSIFICATION.md** - All 47 tables identified
- **FOREIGN_KEY_DEPENDENCY_MAP.md** - All FK relationships

### In `/database/`
- **NEW_DATABASE_CREATION_PLAN.md** - Detailed 6-phase plan
- **SCHEMA.md** - Current partial schema documentation

---

## Timeline

| Phase | Who | Time |
|-------|-----|------|
| 1. Schema Export | YOU | 1.5-2 hours |
| 2. Create Import Scripts | AI | 12-15 hours |
| 3. Create New Project | YOU | 1 hour |
| 4. Execute Import | YOU + AI | 5-7 hours |
| 5. Update Vercel | YOU | 1 hour |
| **TOTAL** | - | **20-26 hours** |

**Spread over**: 2-3 weeks

---

## Next Step

Run [`01_run_schema_export.sql`](01_run_schema_export.sql) in Supabase SQL Editor and save the output.

---

**Last Updated**: 2025-10-28
**Status**: 📋 READY TO START
