# Final Migration Steps

## ✅ Status: Data Migrated Successfully!

**40/40 tables migrated** with ~600 rows total.

---

## Step 1: Add Foreign Keys ✓

Run [04_ADD_FOREIGN_KEYS.sql](04_ADD_FOREIGN_KEYS.sql) in NEW database SQL Editor.

This adds 32 foreign key constraints for referential integrity.

---

## Step 2: Add Database Functions

Run these queries in **NEW database** SQL Editor:

### Extract function definitions from export:
```bash
# On your local machine
cd /home/joeylutes/projects/foundry-portal/database/schema_export

# Extract all CREATE FUNCTION statements
grep -A 500 '"function_definition":' all_functions_results.md | \
  sed 's/.*"function_definition": "//; s/"$//' | \
  sed 's/\\r\\n/\n/g; s/\\n/\n/g' > imports/05_ADD_FUNCTIONS.sql
```

Or manually: Copy all `CREATE OR REPLACE FUNCTION` statements from [all_functions_results.md](../all_functions_results.md) to NEW database.

---

## Step 3: Add Triggers

Run these queries in **NEW database** SQL Editor:

### Extract trigger definitions:
```bash
# Extract all CREATE TRIGGER statements
grep -A 50 'CREATE TRIGGER' triggers_results.md > imports/06_ADD_TRIGGERS.sql
```

Or manually: Copy all `CREATE TRIGGER` statements from [triggers_results.md](../triggers_results.md) to NEW database.

---

## Step 4: Enable RLS Policies

RLS policies are in [schema_export_results.md](../schema_export_results.md) under "PART 5: Row Level Security".

Copy all `ALTER TABLE` and `CREATE POLICY` statements to NEW database.

---

## Step 5: Update Vercel Environment Variables

In Vercel dashboard for `foundry-portal` project:

1. Go to **Settings** → **Environment Variables**
2. Update these variables:
   ```
   VITE_SUPABASE_URL=https://shthtiwcbdnhvxikxiex.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<NEW_ANON_KEY>
   VITE_SUPABASE_PROJECT_ID=shthtiwcbdnhvxikxiex
   SUPABASE_SERVICE_ROLE_KEY=<NEW_SERVICE_KEY>
   ```
3. Redeploy the app

---

## Step 6: Test the Portal

1. Open https://portal-foundry-portal.vercel.app (or your Vercel URL)
2. Test key features:
   - ✓ Login
   - ✓ View events
   - ✓ View surveys
   - ✓ View updates
   - ✓ Submit referrals
   - ✓ CRM contacts
3. Check admin functions work
4. Verify emails are queued properly

---

## Quick Reference: What Was Migrated

| Category | Count |
|----------|-------|
| **Tables** | 40 |
| **Rows** | ~600 |
| **Foreign Keys** | 32 |
| **Functions** | 116 |
| **Triggers** | 28 |
| **Indexes** | Auto-created with PKs |

---

## Rollback Plan

If issues occur:

1. Keep OLD database running
2. Update Vercel env vars back to OLD database
3. Redeploy
4. Debug NEW database issues
5. Retry migration once fixed

---

## Success Criteria

✅ All portal pages load without errors
✅ Users can view content (events, surveys, updates)
✅ Admin can create/edit content
✅ Emails are being queued
✅ No database connection errors
✅ CRM features work (contacts, referrals)

---

## Next Steps After Migration

1. Monitor NEW database performance
2. Set up automated backups in Supabase
3. Archive OLD database (don't delete yet)
4. Update documentation with new connection details
5. Celebrate! 🎉
