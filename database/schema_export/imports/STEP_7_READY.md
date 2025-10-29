# Step 7: Ready to Migrate Data ✅

**Status**: Documentation complete, ready for execution
**Created**: All migration documentation and templates

---

## What's Been Prepared

### 1. Migration Templates
- ✅ [07_MIGRATE_DATA.sql](07_MIGRATE_DATA.sql) - Complete psql commands for export/import
- ✅ [STEP_7_SIMPLE_GUIDE.md](STEP_7_SIMPLE_GUIDE.md) - Beginner-friendly walkthrough
- ✅ [STEP_7_INSTRUCTIONS.md](STEP_7_INSTRUCTIONS.md) - Comprehensive technical guide

### 2. Three Migration Methods Available

#### Method 1: Supabase Dashboard (Recommended for Beginners)
- **File**: [STEP_7_SIMPLE_GUIDE.md](STEP_7_SIMPLE_GUIDE.md) - Start here!
- **Tools**: Just your browser
- **Time**: 25-40 minutes
- **Best for**: Visual learners, small datasets

#### Method 2: psql Command Line (Recommended for Speed)
- **File**: [STEP_7_INSTRUCTIONS.md](STEP_7_INSTRUCTIONS.md) - Option A
- **Tools**: psql (need to install)
- **Time**: 20-25 minutes
- **Best for**: Developers, larger datasets, automation

#### Method 3: pg_dump/pg_restore (Advanced)
- **File**: [STEP_7_INSTRUCTIONS.md](STEP_7_INSTRUCTIONS.md) - Option C
- **Tools**: pg_dump, pg_restore
- **Time**: 30-35 minutes
- **Best for**: Complex migrations, precise control

---

## Quick Start (Dashboard Method)

### Phase 1: Export Portal Users from OLD Database

1. Go to OLD Supabase project → SQL Editor
2. Run this query:
```sql
SELECT *
FROM profiles
WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')
ORDER BY created_at;
```
3. Click "Download CSV"
4. Save as `portal_profiles.csv`
5. **Verify**: Should have ~9 rows (not 25!)

### Phase 2: Import to NEW Database

1. Go to NEW Supabase project → Table Editor
2. Select `profiles` table
3. Click "Insert" → "Import data from CSV"
4. Upload `portal_profiles.csv`
5. Map columns (should auto-match)
6. Click "Import"

### Phase 3: Verify

Run in NEW database:
```sql
SELECT id, email, first_name, last_name, role
FROM profiles
ORDER BY created_at;
```

Should see your 9 portal users!

---

## Migration Priority Order

### Priority 1: MUST MIGRATE (Start Here)
1. **profiles** (~9 portal users)
2. **portal_memberships** (membership records)
3. **membership_agreements** (~7 agreements)
4. **nda_agreements** (~7 NDAs)

**Stop here and verify everything works before continuing!**

### Priority 2: HIGH (Active Content)
5. **portal_updates** (~2 published updates)
6. **portal_surveys** (~1 active survey)
7. **portal_events** (~1 upcoming event)
8. **portal_referrals** (~9 referrals)

### Priority 3: MEDIUM (Reference Data)
9. **email_templates** (email templates)
10. **notification_rules** (notification rules)
11. **recipient_lists** (email lists)
12. **contacts** (CRM contacts)
13. **businesses** (DSP business info)
14. **calculator_submissions** (calculator data)
15. **markets**, **regions**, **stations**, **dsps** (reference data)

### Priority 4: LOW (Historical/Audit)
16. **portal_admin_activity** (admin logs - last 1000 only)
17. **portal_audit_log** (audit trail - last 1000 only)
18. **portal_update_reads** (read tracking)

### Priority 5: SKIP
- ❌ **email_logs** (transient, can recreate)
- ❌ **email_queue** (should be empty)
- ❌ **email_notifications** (should be empty)

---

## Critical Reminders

### ⚠️ Filter Portal Users Only
```sql
-- CORRECT (9 portal users)
WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')

-- WRONG (25 users including app users)
SELECT * FROM profiles  -- Don't do this!
```

### ⚠️ Import Order Matters
1. **profiles** first (everything depends on it)
2. Reference data next (markets, dsps, etc.)
3. Content tables (updates, surveys, events)
4. User data (businesses, referrals)
5. Audit logs last

### ⚠️ Verify After Each Table
```sql
-- Check count matches
SELECT COUNT(*) FROM [table_name];

-- Check for orphaned records (should be 0)
SELECT COUNT(*) FROM businesses b
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = b.user_id);
```

---

## Safety Checklist

Before you start:
- [ ] Backup old database (Supabase: Database → Backups)
- [ ] Backup new database (should be empty, but just in case)
- [ ] Verify you have access to BOTH databases
- [ ] Test query to count portal users (should be ~9)

During migration:
- [ ] Start with profiles only
- [ ] Verify count after each table
- [ ] Stop immediately if you see unexpected data
- [ ] Keep notes of completed tables

---

## Troubleshooting Quick Reference

### Error: "duplicate key value violates unique constraint"
**Fix**: Data already exists, either skip or `DELETE FROM [table] WHERE id IN (...)`

### Error: "violates foreign key constraint"
**Fix**: Import parent table first (e.g., profiles before businesses)

### Error: "column does not exist"
**Fix**: Check column names match exactly between old and new schema

### Wrong row count
**Fix**: Verify filter query - should only get portal users, not all users

---

## Next Steps

1. **Choose your method**:
   - Beginner? → [STEP_7_SIMPLE_GUIDE.md](STEP_7_SIMPLE_GUIDE.md)
   - Developer? → [STEP_7_INSTRUCTIONS.md](STEP_7_INSTRUCTIONS.md)

2. **Start with Priority 1 tables** (profiles, memberships, agreements)

3. **Verify before continuing** to Priority 2

4. **After all data migrated**, proceed to **Step 8: Verify Migration**

---

## Files Reference

| File | Purpose | Audience |
|------|---------|----------|
| [STEP_7_SIMPLE_GUIDE.md](STEP_7_SIMPLE_GUIDE.md) | Practical walkthrough | Beginners, manual migration |
| [STEP_7_INSTRUCTIONS.md](STEP_7_INSTRUCTIONS.md) | Technical reference | Developers, automated migration |
| [07_MIGRATE_DATA.sql](07_MIGRATE_DATA.sql) | SQL command templates | psql users |

---

## Estimated Time by Priority

| Priority Level | Tables | Time (Dashboard) | Time (psql) |
|----------------|--------|------------------|-------------|
| Priority 1 (Must) | 4 tables | 10-15 min | 2-3 min |
| Priority 2 (High) | 4 tables | 10-15 min | 2-3 min |
| Priority 3 (Medium) | 11 tables | 25-35 min | 5-7 min |
| Priority 4 (Low) | 3 tables | 5-10 min | 1-2 min |
| **Total** | **22 tables** | **50-75 min** | **10-15 min** |

---

## Expected Data Summary

You should migrate approximately:
- **9 portal users** (profiles)
- **~2 portal updates** (published content)
- **~1 active survey** with questions/responses
- **~1 upcoming event** with registrations
- **~9 referrals** (one per user)
- **~7 membership agreements**
- **~7 NDA agreements**
- **~9 businesses** (DSP info)
- **Email templates, notification rules, contacts** (varies)

**Total critical records**: ~60-80 rows across priority tables

---

## Ready to Start?

1. Read [STEP_7_SIMPLE_GUIDE.md](STEP_7_SIMPLE_GUIDE.md) for step-by-step instructions
2. Backup both databases
3. Start with profiles export/import
4. Verify and continue with other tables

**You got this! 🚀**
