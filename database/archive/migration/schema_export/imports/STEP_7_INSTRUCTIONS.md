## Step 7: Migrate Data from Old to New Database

**Complexity**: Medium - Requires access to both databases
**Duration**: 30-60 minutes
**Risk Level**: Medium - Always backup before migrating

---

## Overview

Copy data from OLD shared database to NEW portal database:
- **9 portal users** (filter by role)
- **Portal content** (updates, surveys, events, referrals)
- **User data** (businesses, calculator, memberships)
- **Infrastructure** (email templates, notification rules, contacts)

---

## Prerequisites

✅ Steps 1-6 complete (all database structure in place)
✅ Access to BOTH old and new Supabase databases
✅ Either:
  - `psql` command-line tool installed, OR
  - Supabase Dashboard access for CSV export/import

---

## Migration Approaches

### Option A: Using psql (Recommended - Fastest)

**Pros**: Automated, fast, handles all tables
**Cons**: Requires psql installation and connection strings

### Option B: Using Supabase Dashboard (Easier)

**Pros**: No tools required, visual interface
**Cons**: Manual, slower, must do table-by-table

### Option C: Using pg_dump/pg_restore (Advanced)

**Pros**: Most reliable for large datasets
**Cons**: Complex, requires database admin access

**Recommendation**: Start with [STEP_7_SIMPLE_GUIDE.md](STEP_7_SIMPLE_GUIDE.md) for practical step-by-step instructions.

---

## Detailed Instructions

### Option A: Using psql (Automated)

#### 1. Install psql

```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

#### 2. Get Connection Strings

From both Supabase projects:
1. Go to Project Settings → Database
2. Copy the connection string (URI format)
3. Replace `[YOUR-PASSWORD]` with actual password

Example format:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

#### 3. Set Environment Variables

```bash
# Export connection strings
export OLD_DB="postgresql://postgres:[OLD-PASSWORD]@[OLD-HOST]:5432/postgres"
export NEW_DB="postgresql://postgres:[NEW-PASSWORD]@[NEW-HOST]:5432/postgres"

# Test connections
psql "$OLD_DB" -c "SELECT COUNT(*) FROM profiles WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor');"
psql "$NEW_DB" -c "SELECT COUNT(*) FROM profiles;"
```

#### 4. Run Export Script

The export commands are in [07_MIGRATE_DATA.sql](07_MIGRATE_DATA.sql). Extract the export section:

```bash
# Run all export commands at once
psql "$OLD_DB" -f 07_MIGRATE_DATA.sql

# Or run exports individually
psql "$OLD_DB" -c "\COPY (SELECT * FROM profiles WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')) TO '/tmp/portal_profiles.csv' WITH CSV HEADER;"

# ... (continue for other tables)
```

**Expected output**: CSV files in `/tmp/` directory

#### 5. Verify Exports

```bash
# Check files were created
ls -lh /tmp/*.csv

# Verify row counts
wc -l /tmp/portal_profiles.csv  # Should be ~10 lines (9 rows + 1 header)
wc -l /tmp/portal_updates.csv   # Should be ~3 lines (2 rows + 1 header)
```

#### 6. Run Import Script

```bash
# Import all data at once
psql "$NEW_DB" << 'EOF'
\COPY profiles FROM '/tmp/portal_profiles.csv' WITH CSV HEADER;
\COPY regions FROM '/tmp/regions.csv' WITH CSV HEADER;
\COPY markets FROM '/tmp/markets.csv' WITH CSV HEADER;
\COPY stations FROM '/tmp/stations.csv' WITH CSV HEADER;
\COPY dsps FROM '/tmp/dsps.csv' WITH CSV HEADER;
\COPY dsp_locations FROM '/tmp/dsp_locations.csv' WITH CSV HEADER;
\COPY email_templates FROM '/tmp/email_templates.csv' WITH CSV HEADER;
\COPY recipient_lists FROM '/tmp/recipient_lists.csv' WITH CSV HEADER;
\COPY notification_rules FROM '/tmp/notification_rules.csv' WITH CSV HEADER;
\COPY notification_events FROM '/tmp/notification_events.csv' WITH CSV HEADER;
\COPY portal_updates FROM '/tmp/portal_updates.csv' WITH CSV HEADER;
\COPY portal_update_reads FROM '/tmp/portal_update_reads.csv' WITH CSV HEADER;
\COPY portal_surveys FROM '/tmp/portal_surveys.csv' WITH CSV HEADER;
\COPY portal_survey_sections FROM '/tmp/portal_survey_sections.csv' WITH CSV HEADER;
\COPY portal_survey_questions FROM '/tmp/portal_survey_questions.csv' WITH CSV HEADER;
\COPY portal_survey_responses FROM '/tmp/portal_survey_responses.csv' WITH CSV HEADER;
\COPY portal_survey_answers FROM '/tmp/portal_survey_answers.csv' WITH CSV HEADER;
\COPY portal_event_templates FROM '/tmp/portal_event_templates.csv' WITH CSV HEADER;
\COPY portal_events FROM '/tmp/portal_events.csv' WITH CSV HEADER;
\COPY portal_event_dates FROM '/tmp/portal_event_dates.csv' WITH CSV HEADER;
\COPY portal_event_registrations FROM '/tmp/portal_event_registrations.csv' WITH CSV HEADER;
\COPY portal_event_guests FROM '/tmp/portal_event_guests.csv' WITH CSV HEADER;
\COPY portal_event_reminders FROM '/tmp/portal_event_reminders.csv' WITH CSV HEADER;
\COPY portal_referrals FROM '/tmp/portal_referrals.csv' WITH CSV HEADER;
\COPY portal_referral_conversions FROM '/tmp/portal_referral_conversions.csv' WITH CSV HEADER;
\COPY portal_referral_rate_limits FROM '/tmp/portal_referral_rate_limits.csv' WITH CSV HEADER;
\COPY membership_agreements FROM '/tmp/membership_agreements.csv' WITH CSV HEADER;
\COPY nda_agreements FROM '/tmp/nda_agreements.csv' WITH CSV HEADER;
\COPY portal_memberships FROM '/tmp/portal_memberships.csv' WITH CSV HEADER;
\COPY businesses FROM '/tmp/businesses.csv' WITH CSV HEADER;
\COPY calculator_submissions FROM '/tmp/calculator_submissions.csv' WITH CSV HEADER;
\COPY contacts FROM '/tmp/contacts.csv' WITH CSV HEADER;
\COPY contact_dsp_locations FROM '/tmp/contact_dsp_locations.csv' WITH CSV HEADER;
\COPY contact_submissions FROM '/tmp/contact_submissions.csv' WITH CSV HEADER;
\COPY interactions FROM '/tmp/interactions.csv' WITH CSV HEADER;
\COPY marketing_campaign_links FROM '/tmp/marketing_campaign_links.csv' WITH CSV HEADER;
\COPY referral_conversions FROM '/tmp/referral_conversions.csv' WITH CSV HEADER;
\COPY portal_admin_activity FROM '/tmp/portal_admin_activity.csv' WITH CSV HEADER;
\COPY portal_audit_log FROM '/tmp/portal_audit_log.csv' WITH CSV HEADER;
EOF
```

#### 7. Verify Import

```bash
# Run verification queries
psql "$NEW_DB" << 'EOF'
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL SELECT 'portal_updates', COUNT(*) FROM portal_updates
UNION ALL SELECT 'portal_surveys', COUNT(*) FROM portal_surveys
UNION ALL SELECT 'portal_events', COUNT(*) FROM portal_events
UNION ALL SELECT 'portal_referrals', COUNT(*) FROM portal_referrals
ORDER BY table_name;

-- Check for orphaned records (should all be 0)
SELECT 'Orphaned businesses' as issue, COUNT(*) as count
FROM businesses b
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = b.user_id)
UNION ALL
SELECT 'Orphaned referrals', COUNT(*)
FROM portal_referrals pr
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pr.referrer_id);
EOF
```

---

### Option B: Using Supabase Dashboard (Manual)

See [STEP_7_SIMPLE_GUIDE.md](STEP_7_SIMPLE_GUIDE.md) for detailed walkthrough.

**Summary**:
1. Export each table as CSV from old database (SQL Editor → Run query → Download CSV)
2. Import CSV to new database (Table Editor → Insert → Import from CSV)
3. Verify counts match after each table

**Critical order**:
1. Start with `profiles` (everything depends on this)
2. Import reference data (regions, markets, stations, dsps)
3. Import portal content (updates, surveys, events)
4. Import user data (businesses, memberships, calculator)
5. Import audit logs last

---

### Option C: Using pg_dump/pg_restore (Advanced)

This requires careful filtering to export ONLY portal data.

#### 1. Create Filter File

Create `portal_tables.txt`:
```
profiles
portal_updates
portal_surveys
portal_survey_sections
portal_survey_questions
portal_survey_responses
portal_survey_answers
portal_events
portal_event_dates
portal_event_templates
portal_event_registrations
portal_event_guests
portal_event_reminders
portal_referrals
portal_referral_conversions
portal_referral_rate_limits
membership_agreements
nda_agreements
portal_memberships
businesses
calculator_submissions
contacts
contact_submissions
contact_dsp_locations
interactions
email_templates
recipient_lists
notification_rules
notification_events
portal_admin_activity
portal_audit_log
portal_update_reads
markets
regions
stations
dsps
dsp_locations
marketing_campaign_links
referral_conversions
```

#### 2. Export Schema Only

```bash
pg_dump "$OLD_DB" \
  --schema-only \
  --no-owner \
  --no-privileges \
  -f /tmp/portal_schema.sql
```

#### 3. Export Data with Filters

```bash
# Export each table
while read table; do
  echo "Exporting $table..."
  pg_dump "$OLD_DB" \
    --data-only \
    --no-owner \
    --table="$table" \
    -f "/tmp/${table}_data.sql"
done < portal_tables.txt

# Special case: Filter profiles by role
pg_dump "$OLD_DB" \
  --data-only \
  --no-owner \
  --table=profiles \
  --where="role IN ('portal_member', 'admin', 'super_admin', 'investor')" \
  -f /tmp/profiles_data.sql
```

#### 4. Import to New Database

```bash
# Import in dependency order
psql "$NEW_DB" -f /tmp/profiles_data.sql
psql "$NEW_DB" -f /tmp/regions_data.sql
psql "$NEW_DB" -f /tmp/markets_data.sql
# ... (continue for all tables)
```

**Note**: This is complex and error-prone. Only use if you need precise control over the migration.

---

## Troubleshooting

### Common Errors

#### 1. "duplicate key value violates unique constraint"

**Cause**: Data already exists in new database
**Fix**:
```sql
-- Check what exists
SELECT id, email FROM profiles;

-- Delete if needed (BE CAREFUL!)
DELETE FROM profiles WHERE id IN ('uuid1', 'uuid2');

-- Or truncate entire table
TRUNCATE profiles CASCADE;  -- ⚠️ Deletes all related data
```

#### 2. "insert or update on table violates foreign key constraint"

**Cause**: Referenced records don't exist yet
**Fix**: Import in correct order:
1. `profiles` (no dependencies)
2. Reference tables (`regions`, `markets`, `stations`, `dsps`)
3. Content tables (`portal_updates`, `portal_surveys`, `portal_events`)
4. Related data (`businesses`, `portal_referrals`, `calculator_submissions`)

#### 3. "permission denied for table"

**Cause**: Using service role key instead of postgres password
**Fix**: Use direct postgres connection string from Supabase settings

#### 4. "COPY: could not open file for reading"

**Cause**: File path incorrect or permissions issue
**Fix**:
```bash
# Check file exists
ls -la /tmp/portal_profiles.csv

# Check permissions
chmod 644 /tmp/*.csv

# Try absolute path
\COPY profiles FROM '/tmp/portal_profiles.csv' WITH CSV HEADER;
```

#### 5. "invalid input syntax for type uuid"

**Cause**: CSV formatting issue
**Fix**:
- Ensure UUIDs are lowercase
- Remove quotes around UUIDs
- Check for NULL vs empty string

#### 6. "connection refused"

**Cause**: Connection string incorrect or database not accessible
**Fix**:
```bash
# Test connection
psql "$NEW_DB" -c "SELECT version();"

# Check connection string format
echo $NEW_DB

# Verify password is correct (no special characters unescaped)
```

---

## Safety Checklist

### Before Starting

- [ ] Backup old database (Supabase: Database → Backups → Create backup)
- [ ] Backup new database (should be empty, but just in case)
- [ ] Verify you have correct connection strings
- [ ] Test you can connect to both databases
- [ ] Run test query in old database to count portal users (should be ~9)

### During Migration

- [ ] Start with `profiles` table only (test with small dataset first)
- [ ] Verify count matches before moving to next table
- [ ] Check for orphaned records after each table
- [ ] Monitor Supabase logs for errors
- [ ] Keep notes of which tables completed successfully

### After Migration

- [ ] Run all verification queries (see below)
- [ ] Test login with portal user account
- [ ] Check portal loads content (updates, surveys, events)
- [ ] Verify admin panel works
- [ ] Test referral system
- [ ] Check email templates exist
- [ ] Review Supabase logs for any errors

---

## Verification Queries

Run these in the NEW database after migration:

### 1. Check Row Counts

```sql
SELECT
  'profiles' as table_name,
  COUNT(*) as row_count,
  9 as expected,
  CASE WHEN COUNT(*) = 9 THEN '✅' ELSE '❌' END as status
FROM profiles WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')
UNION ALL
SELECT 'portal_updates', COUNT(*), 2, CASE WHEN COUNT(*) = 2 THEN '✅' ELSE '❌' END FROM portal_updates
UNION ALL
SELECT 'portal_surveys', COUNT(*), 1, CASE WHEN COUNT(*) = 1 THEN '✅' ELSE '❌' END FROM portal_surveys
UNION ALL
SELECT 'portal_events', COUNT(*), 1, CASE WHEN COUNT(*) = 1 THEN '✅' ELSE '❌' END FROM portal_events
UNION ALL
SELECT 'portal_referrals', COUNT(*), 9, CASE WHEN COUNT(*) = 9 THEN '✅' ELSE '❌' END FROM portal_referrals
ORDER BY table_name;
```

### 2. Check Foreign Keys

```sql
-- All of these should return 0 orphaned records
SELECT 'Orphaned businesses' as issue, COUNT(*) as count
FROM businesses b
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = b.user_id)
UNION ALL
SELECT 'Orphaned referrals', COUNT(*)
FROM portal_referrals pr
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pr.referrer_id)
UNION ALL
SELECT 'Orphaned memberships', COUNT(*)
FROM portal_memberships pm
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = pm.user_id)
UNION ALL
SELECT 'Orphaned survey responses', COUNT(*)
FROM portal_survey_responses psr
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = psr.user_id)
UNION ALL
SELECT 'Orphaned event registrations', COUNT(*)
FROM portal_event_registrations per
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = per.user_id);
```

### 3. Check Portal Users

```sql
SELECT
  id,
  email,
  first_name,
  last_name,
  role,
  created_at
FROM profiles
WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')
ORDER BY role, email;
```

Should see all 9 portal users with correct roles.

### 4. Check Content Exists

```sql
-- Portal updates
SELECT id, title, status, published_at FROM portal_updates ORDER BY created_at;

-- Portal surveys
SELECT id, title, status, start_date, end_date FROM portal_surveys ORDER BY created_at;

-- Portal events
SELECT id, title, status, event_type FROM portal_events ORDER BY created_at;

-- Referrals
SELECT id, referrer_id, contact_email, status FROM portal_referrals ORDER BY created_at;
```

### 5. Check Infrastructure

```sql
-- Email templates
SELECT id, template_name, template_type, is_active FROM email_templates;

-- Notification rules
SELECT id, rule_name, trigger_table, trigger_action, enabled FROM notification_rules;

-- Contacts
SELECT COUNT(*) as total_contacts FROM contacts WHERE is_active = true;

-- Markets & DSPs
SELECT COUNT(*) as total_markets FROM markets WHERE is_active = true;
SELECT COUNT(*) as total_dsps FROM dsps WHERE is_active = true;
```

---

## Expected Data Summary

Based on current portal state:

| Table | Expected Rows | Notes |
|-------|--------------|-------|
| profiles | 9 | Portal users only |
| portal_updates | ~2 | Published updates |
| portal_surveys | ~1 | Active survey |
| portal_events | ~1 | Upcoming event |
| portal_referrals | ~9 | One per user |
| membership_agreements | ~7 | Signed agreements |
| nda_agreements | ~7 | Signed NDAs |
| businesses | ~9 | DSP business info |
| calculator_submissions | Varies | Calculator data |
| contacts | Varies | CRM contacts |
| email_templates | ~15 | Email templates |
| notification_rules | ~10 | Notification rules |

**Total critical records**: ~60-80 rows across priority tables

---

## What NOT to Migrate

❌ **App user data** (profiles with role = 'user')
❌ **Fleet/maintenance tables** (vehicles, maintenance_records, etc.)
❌ **Organization data** (organizations, user_roles - app only)
❌ **Empty tables** (no point copying nothing)
❌ **Test data** (clean start in new database)
❌ **Email queue/logs** (transient data, can recreate)

---

## Performance Tips

### For Large Datasets

1. **Disable triggers temporarily** (if needed):
```sql
ALTER TABLE profiles DISABLE TRIGGER ALL;
-- Import data
ALTER TABLE profiles ENABLE TRIGGER ALL;
```

2. **Increase CSV buffer size**:
```bash
psql "$NEW_DB" -c "SET work_mem = '256MB';"
```

3. **Import in parallel** (if using multiple CSV files):
```bash
# Run multiple imports simultaneously
psql "$NEW_DB" -c "\COPY profiles FROM '/tmp/profiles.csv' WITH CSV HEADER;" &
psql "$NEW_DB" -c "\COPY portal_updates FROM '/tmp/portal_updates.csv' WITH CSV HEADER;" &
wait
```

4. **Use COPY instead of INSERT** (much faster):
```sql
-- Fast (what we're using)
\COPY profiles FROM '/tmp/profiles.csv' WITH CSV HEADER;

-- Slow (don't use)
INSERT INTO profiles VALUES (...);
```

---

## Rollback Plan

If migration fails:

### Option 1: Drop All Data

```sql
-- Delete all data from new database (keeps structure)
TRUNCATE profiles CASCADE;  -- This will cascade to all related tables

-- Verify empty
SELECT COUNT(*) FROM profiles;  -- Should be 0
```

### Option 2: Start Fresh

```bash
# Run all migration files again from Step 1
psql "$NEW_DB" -f 01_CREATE_TABLES.sql
psql "$NEW_DB" -f 02_ADD_INDEXES.sql
# ... etc
```

### Option 3: Restore Backup

Use Supabase Dashboard → Database → Backups → Restore

---

## Next Steps

After successful migration:

1. ✅ All verification queries pass
2. ✅ No orphaned records
3. ✅ Can login with portal user
4. Continue to **Step 8: Verify Migration**

---

## Need Help?

- **Supabase Import Docs**: https://supabase.com/docs/guides/database/import-data
- **PostgreSQL COPY Docs**: https://www.postgresql.org/docs/current/sql-copy.html
- **psql Docs**: https://www.postgresql.org/docs/current/app-psql.html

## Estimated Time

| Approach | Setup | Migration | Verification | Total |
|----------|-------|-----------|--------------|-------|
| Dashboard (Priority 1-2) | 5 min | 15-30 min | 5 min | 25-40 min |
| psql (Automated) | 10 min | 5-10 min | 5 min | 20-25 min |
| pg_dump (Advanced) | 15 min | 10-15 min | 5 min | 30-35 min |