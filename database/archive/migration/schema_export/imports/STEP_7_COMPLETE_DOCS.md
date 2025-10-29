# Step 7: Data Migration Documentation Complete ✅

**Date**: 2025-10-28
**Status**: All documentation prepared, ready for execution

---

## What Was Created

### 1. Complete Migration Templates
- **[07_MIGRATE_DATA.sql](07_MIGRATE_DATA.sql)**
  - Export queries for all portal tables (run in OLD database)
  - Import commands for all portal tables (run in NEW database)
  - Verification queries to check data integrity
  - Ready to use with psql command-line tool

### 2. Beginner-Friendly Guide
- **[STEP_7_SIMPLE_GUIDE.md](STEP_7_SIMPLE_GUIDE.md)**
  - Step-by-step walkthrough for Supabase Dashboard method
  - No tools required, just your browser
  - Visual table-by-table approach
  - Includes troubleshooting and safety tips
  - Perfect for first-time migrations

### 3. Comprehensive Technical Guide
- **[STEP_7_INSTRUCTIONS.md](STEP_7_INSTRUCTIONS.md)**
  - Three migration methods (Dashboard, psql, pg_dump)
  - Detailed instructions for automated migration
  - Performance optimization tips
  - Rollback procedures
  - Advanced troubleshooting
  - Complete verification queries

### 4. Quick Reference
- **[STEP_7_READY.md](STEP_7_READY.md)**
  - Quick start instructions
  - Priority table list
  - Method comparison
  - Safety checklist
  - Time estimates
  - Expected data summary

---

## Three Migration Paths

### Path 1: Supabase Dashboard (Recommended for You)
**Time**: 25-40 minutes
**Difficulty**: Easy
**Tools needed**: Browser only
**Guide**: [STEP_7_SIMPLE_GUIDE.md](STEP_7_SIMPLE_GUIDE.md)

**Process**:
1. Export table as CSV from OLD database (SQL Editor)
2. Import CSV to NEW database (Table Editor)
3. Verify count matches
4. Repeat for each table

**Pros**:
- No command-line tools needed
- Visual interface is intuitive
- Easy to understand what's happening
- Can start/stop anytime

**Cons**:
- Manual process (table by table)
- Slower than automated methods
- More prone to human error

### Path 2: psql Command Line (Fastest)
**Time**: 10-15 minutes
**Difficulty**: Medium
**Tools needed**: psql (PostgreSQL client)
**Guide**: [STEP_7_INSTRUCTIONS.md](STEP_7_INSTRUCTIONS.md) - Option A

**Process**:
1. Install psql
2. Get connection strings from both Supabase projects
3. Run export script (exports all tables to CSV)
4. Run import script (imports all CSV files)
5. Run verification queries

**Pros**:
- Fully automated
- Much faster than manual
- Handles all tables at once
- Repeatable if needed

**Cons**:
- Requires psql installation
- Need to handle connection strings
- Less visual feedback

### Path 3: pg_dump/pg_restore (Advanced)
**Time**: 30-35 minutes
**Difficulty**: Hard
**Tools needed**: pg_dump, pg_restore
**Guide**: [STEP_7_INSTRUCTIONS.md](STEP_7_INSTRUCTIONS.md) - Option C

**Process**:
1. Export schema and data with filters
2. Transform data as needed
3. Import with pg_restore

**Pros**:
- Most powerful and flexible
- Handles complex scenarios
- Industry standard approach

**Cons**:
- Complex setup
- Requires deep PostgreSQL knowledge
- Easy to make mistakes
- Overkill for this migration

---

## Migration Strategy

### Phase 1: Test with Priority 1 (MUST MIGRATE)
**Tables**: 4 tables (~23 rows)
- `profiles` (9 portal users)
- `portal_memberships`
- `membership_agreements` (~7)
- `nda_agreements` (~7)

**Why start here**:
- Small dataset to test process
- Most critical data
- Everything else depends on profiles
- Can verify portal users can login

**Stop and verify** before continuing!

### Phase 2: Active Content (HIGH PRIORITY)
**Tables**: 4 tables (~14 rows)
- `portal_updates` (~2)
- `portal_surveys` (~1) + questions/sections
- `portal_events` (~1) + dates/registrations
- `portal_referrals` (~9)

**Verification**: Check portal loads content correctly

### Phase 3: Infrastructure (MEDIUM PRIORITY)
**Tables**: 11 tables (varies)
- Email templates, notification rules, contacts
- Businesses, calculator submissions
- Markets, regions, stations, dsps, locations

**Verification**: Check admin features work

### Phase 4: Historical Data (LOW PRIORITY)
**Tables**: 3 tables (varies)
- Admin activity logs
- Audit logs
- Update read tracking

**Note**: Can skip if time is limited

---

## Critical Data Filters

### ⚠️ Portal Users Only (NOT All Users)

**CORRECT** ✅:
```sql
SELECT * FROM profiles
WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')
ORDER BY created_at;
-- Expected: ~9 rows
```

**WRONG** ❌:
```sql
SELECT * FROM profiles;
-- This gets ALL 25 users including app users!
```

### Why This Matters
- Portal database should ONLY have portal users
- App users (role = 'user') belong in app database
- Mixing them creates confusion and security issues
- Portal roles: `portal_member`, `investor`, `admin`, `super_admin`
- App roles: `user` (and organization roles via `user_roles` table)

---

## Data Summary

### Expected Row Counts
| Table | Rows | Priority |
|-------|------|----------|
| profiles | 9 | P1 - MUST |
| portal_memberships | ~9 | P1 - MUST |
| membership_agreements | ~7 | P1 - MUST |
| nda_agreements | ~7 | P1 - MUST |
| portal_updates | ~2 | P2 - HIGH |
| portal_surveys | ~1 | P2 - HIGH |
| portal_events | ~1 | P2 - HIGH |
| portal_referrals | ~9 | P2 - HIGH |
| businesses | ~9 | P3 - MEDIUM |
| calculator_submissions | Varies | P3 - MEDIUM |
| contacts | Varies | P3 - MEDIUM |
| email_templates | ~15 | P3 - MEDIUM |
| notification_rules | ~10 | P3 - MEDIUM |
| markets, dsps, stations | Varies | P3 - MEDIUM |
| portal_admin_activity | ~1000 | P4 - LOW |
| portal_audit_log | ~1000 | P4 - LOW |

**Total Priority 1-2**: ~43 critical rows
**Total All Priorities**: ~80-100 rows across all tables

---

## Safety & Verification

### Before Starting
- [ ] Read [STEP_7_SIMPLE_GUIDE.md](STEP_7_SIMPLE_GUIDE.md)
- [ ] Choose migration method
- [ ] Backup OLD database
- [ ] Backup NEW database (should be empty)
- [ ] Verify access to both databases
- [ ] Test query portal user count in OLD database (should be 9)

### During Migration
- [ ] Start with profiles only
- [ ] Verify count matches before next table
- [ ] Check for errors in Supabase logs
- [ ] Stop if anything looks wrong
- [ ] Keep notes of completed tables

### After Priority 1 Migration
Run in NEW database:
```sql
-- Check portal users migrated (should be 9)
SELECT COUNT(*) FROM profiles
WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor');

-- Check no orphaned records (should be 0)
SELECT COUNT(*) FROM portal_memberships pm
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pm.user_id);

SELECT COUNT(*) FROM membership_agreements ma
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = ma.user_id);

SELECT COUNT(*) FROM nda_agreements na
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = na.user_id);
```

### After Complete Migration
- [ ] All row counts match expected values
- [ ] No orphaned records (all foreign keys valid)
- [ ] Can login with portal user account
- [ ] Portal loads updates/surveys/events correctly
- [ ] Admin panel accessible
- [ ] No errors in Supabase logs

---

## Troubleshooting Reference

### Error: "duplicate key value violates unique constraint"
**Cause**: Record with same ID already exists
**Fix**: Either skip that record or delete existing: `DELETE FROM [table] WHERE id = 'uuid'`

### Error: "violates foreign key constraint"
**Cause**: Referenced record doesn't exist (wrong import order)
**Fix**: Import parent table first (profiles → businesses, not businesses → profiles)

### Error: "column does not exist"
**Cause**: Column name mismatch between old and new schema
**Fix**: Check column names, may need to manually adjust CSV

### Wrong row count for profiles
**Cause**: Forgot to filter by role, got all users
**Fix**: Re-export with WHERE clause filtering to portal roles only

### Some tables have 0 rows
**Cause**: Either no data in old database or filter too restrictive
**Fix**: Check old database to verify data exists, adjust filter if needed

---

## What NOT to Migrate

❌ **Don't migrate these**:
- Profiles with `role = 'user'` (app users only)
- Any fleet/maintenance/vehicle tables (app only)
- Organization data (app only)
- `user_roles` table (app only - portal uses `portal_memberships`)
- Empty tables (no point copying nothing)
- Test data (start fresh)
- Transient data (email queue, logs can be recreated)

---

## Next Steps After Migration

### 1. Run Verification (Step 8)
See verification section in [STEP_7_INSTRUCTIONS.md](STEP_7_INSTRUCTIONS.md)

### 2. Test Functionality
- Login with portal user
- Check portal dashboard loads
- Verify updates/surveys/events display
- Test referral creation
- Check admin features

### 3. Update Vercel (Step 9)
Point production app to new database:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4. Monitor Production
- Check error logs
- Verify users can access portal
- Test all major features
- Monitor performance

---

## Files You'll Use

### Start Here
1. **[STEP_7_SIMPLE_GUIDE.md](STEP_7_SIMPLE_GUIDE.md)** ← Read this first!

### Reference During Migration
2. **[STEP_7_READY.md](STEP_7_READY.md)** ← Quick reference
3. **[07_MIGRATE_DATA.sql](07_MIGRATE_DATA.sql)** ← SQL templates

### If You Need More Details
4. **[STEP_7_INSTRUCTIONS.md](STEP_7_INSTRUCTIONS.md)** ← Full technical guide

### After Migration
5. **[CURRENT_STATUS.md](CURRENT_STATUS.md)** ← Update status

---

## Time Estimates

### Dashboard Method (Recommended)
- Reading guide: 10 min
- Backup databases: 2 min
- Priority 1 migration: 10-15 min
- Priority 2 migration: 10-15 min
- Priority 3 migration: 25-35 min
- Priority 4 migration: 5-10 min
- Verification: 5-10 min
- **Total**: 65-100 minutes (~1.5 hours)

### psql Method (Faster)
- Setup psql + connections: 10 min
- Run export script: 5 min
- Run import script: 5 min
- Verification: 5 min
- **Total**: 25 minutes

---

## Summary

✅ **All documentation complete**
✅ **Three migration methods available**
✅ **Safety checks documented**
✅ **Verification queries ready**
✅ **Troubleshooting guide prepared**

**You're ready to migrate!**

**Recommended**: Start with [STEP_7_SIMPLE_GUIDE.md](STEP_7_SIMPLE_GUIDE.md) and follow the Dashboard method for Priority 1 tables. Test everything works, then continue with remaining priorities.

**Remember**: Backup both databases first! 🎯
