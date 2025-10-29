# Step 7: Migrate Data - Simple Guide

**Goal**: Copy portal users and their data from old database to new database

---

## Quick Decision: Which Method?

### Use Supabase Dashboard (Easiest)
- ✅ No tools to install
- ✅ Visual interface
- ❌ Slower (table by table)
- **Best for**: Small datasets (<1000 rows total)

### Use psql Command Line (Faster)
- ✅ Automated scripts
- ✅ Handles all tables at once
- ❌ Requires psql installation
- **Best for**: Larger datasets or multiple migrations

---

## Method 1: Supabase Dashboard (Start Here)

### Step 1: Get Connection Info

**Old Database** (shared):
1. Go to old Supabase project → Settings → Database
2. Copy connection string (starts with `postgresql://`)

**New Database** (portal):
1. Go to new Supabase project → Settings → Database
2. Copy connection string

### Step 2: Export Portal Users from Old Database

1. Go to OLD database → SQL Editor
2. Run this query:
```sql
SELECT *
FROM profiles
WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')
ORDER BY created_at;
```
3. Click "Download CSV"
4. Save as `portal_profiles.csv`
5. Note how many rows (should be ~9)

### Step 3: Import Portal Users to New Database

1. Go to NEW database → Table Editor
2. Select `profiles` table
3. Click "Insert" → "Import data from CSV"
4. Upload `portal_profiles.csv`
5. Map columns (should auto-match)
6. Click "Import"
7. Verify count matches

**🎉 Checkpoint**: Portal users migrated!

### Step 4: Verify Users Imported

Run in NEW database:
```sql
SELECT id, email, first_name, last_name, role
FROM profiles
ORDER BY created_at;
```

Should see your 9 portal users.

---

## Method 2: Using psql (Advanced)

### Prerequisites

1. Install psql:
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

2. Get connection strings from both Supabase projects

### Export All Data at Once

Create a script `export_portal_data.sh`:

```bash
#!/bin/bash

# Old database connection
OLD_DB="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Export portal users
psql "$OLD_DB" -c "\COPY (
  SELECT * FROM profiles
  WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')
) TO '/tmp/profiles.csv' WITH CSV HEADER"

# Export portal updates
psql "$OLD_DB" -c "\COPY portal_updates TO '/tmp/portal_updates.csv' WITH CSV HEADER"

# Export portal surveys
psql "$OLD_DB" -c "\COPY portal_surveys TO '/tmp/portal_surveys.csv' WITH CSV HEADER"

# ... (continue for other tables)

echo "✅ Export complete! Files in /tmp/"
ls -lh /tmp/*.csv
```

### Import All Data at Once

Create a script `import_portal_data.sh`:

```bash
#!/bin/bash

# New database connection
NEW_DB="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Import profiles first (most critical)
psql "$NEW_DB" -c "\COPY profiles FROM '/tmp/profiles.csv' WITH CSV HEADER"

# Import portal updates
psql "$NEW_DB" -c "\COPY portal_updates FROM '/tmp/portal_updates.csv' WITH CSV HEADER"

# Import portal surveys
psql "$NEW_DB" -c "\COPY portal_surveys FROM '/tmp/portal_surveys.csv' WITH CSV HEADER"

# ... (continue for other tables)

echo "✅ Import complete!"
```

---

## Critical Tables to Migrate (Priority Order)

### Priority 1: MUST MIGRATE (Users & Core Data)
1. **profiles** - Portal users (~9 rows)
2. **portal_memberships** - Membership records
3. **membership_agreements** - Legal agreements (~7 rows)
4. **nda_agreements** - Legal agreements (~7 rows)

### Priority 2: HIGH (Active Content)
5. **portal_updates** - Published updates (~2 rows)
6. **portal_surveys** - Active surveys (~1 row)
7. **portal_events** - Upcoming events (~1 row)
8. **portal_referrals** - Active referrals (~9 rows)

### Priority 3: MEDIUM (Reference Data)
9. **email_templates** - Email templates
10. **notification_rules** - Notification rules
11. **recipient_lists** - Email lists
12. **contacts** - CRM contacts
13. **businesses** - DSP business info
14. **calculator_submissions** - Calculator data

### Priority 4: LOW (Historical/Audit)
15. **portal_admin_activity** - Admin logs
16. **portal_audit_log** - Audit trail
17. **portal_update_reads** - Read tracking
18. **interactions** - Contact interactions

### Priority 5: SKIP (Can Recreate)
- **email_logs** - Email send logs (can be recreated)
- **email_queue** - Email queue (should be empty)
- **email_notifications** - Notification queue (should be empty)

---

## Table-by-Table: Dashboard Method

For each table in priority order:

### 1. Export from Old Database

```sql
-- Example: Export portal_updates
SELECT * FROM portal_updates ORDER BY created_at;
```
- Click "Download CSV"
- Save as `[table_name].csv`

### 2. Import to New Database

- Go to Table Editor → Select table
- Click "Insert" → "Import data from CSV"
- Upload CSV file
- Verify column mapping
- Click "Import"

### 3. Verify

```sql
-- Check count matches
SELECT COUNT(*) FROM [table_name];
```

---

## Verification Queries

After migration, run these in NEW database:

### Check Portal Users
```sql
SELECT COUNT(*) as portal_users
FROM profiles
WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor');
-- Expected: ~9
```

### Check Content
```sql
SELECT
  'portal_updates' as table_name, COUNT(*) as rows FROM portal_updates
UNION ALL
SELECT 'portal_surveys', COUNT(*) FROM portal_surveys
UNION ALL
SELECT 'portal_events', COUNT(*) FROM portal_events
UNION ALL
SELECT 'portal_referrals', COUNT(*) FROM portal_referrals;
```

### Check Relationships (Should have NO orphans)
```sql
-- Orphaned businesses (should be 0)
SELECT COUNT(*) as orphaned_businesses
FROM businesses b
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = b.user_id);

-- Orphaned referrals (should be 0)
SELECT COUNT(*) as orphaned_referrals
FROM portal_referrals pr
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pr.referrer_id);
```

---

## Troubleshooting

### Error: "duplicate key value violates unique constraint"

**Cause**: Data already exists in new database
**Fix**: Either:
- Delete existing data: `DELETE FROM [table] WHERE id IN (...)`
- OR Skip importing that table

### Error: "insert or update on table violates foreign key constraint"

**Cause**: Referenced records don't exist yet
**Fix**: Import tables in this order:
1. Profiles (no dependencies)
2. Reference data (markets, dsps, etc.)
3. Content tables (updates, surveys, events)
4. Related data (responses, registrations)

### Error: "column does not exist"

**Cause**: Schema mismatch between old and new
**Fix**:
- Check column names match exactly
- Remove columns that don't exist in new schema
- Add missing columns with ALTER TABLE

### CSV Import Shows Wrong Data Types

**Cause**: CSV formatting issues
**Fix**:
- Ensure dates are in ISO format (YYYY-MM-DD)
- Ensure UUIDs are lowercase
- Ensure booleans are true/false
- Remove any quotes around NULL values

---

## Safety Tips

### Before Migrating
✅ Backup both databases
✅ Test with one table first (profiles)
✅ Verify you're connected to correct database
✅ Check you have ~9 portal users, not 25 (all users)

### During Migration
✅ Import profiles first (everything depends on it)
✅ Check counts after each table
✅ Stop if you see unexpected orphans

### After Migration
✅ Run all verification queries
✅ Test login with a portal user
✅ Check portal loads content correctly
✅ Verify no error logs in Supabase

---

## What NOT to Migrate

❌ **App user data** (role = 'user')
❌ **Fleet/maintenance data** (app-only tables)
❌ **Organization data** (app-only)
❌ **Empty tables** (no point copying nothing)
❌ **Test data** (clean start)

---

## Estimated Time

| Method | Time |
|--------|------|
| Dashboard (Priority 1-2 only) | 15-30 min |
| Dashboard (all priorities) | 60-90 min |
| psql scripts | 10-15 min |
| pg_dump/restore | 5-10 min |

---

## Next Steps

After data migration is complete:

1. ✅ Verify all portal users exist
2. ✅ Test login with portal user
3. ✅ Check portal content loads
4. Continue to **Step 8: Verify Migration**

---

## Need Help?

- **Supabase Docs**: https://supabase.com/docs/guides/database/import-data
- **psql Docs**: https://www.postgresql.org/docs/current/app-psql.html
- **CSV Format Issues**: Use UTF-8 encoding, Unix line endings (LF)

