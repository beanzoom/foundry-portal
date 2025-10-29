# psql Migration - Quick Start

Your connection strings are configured and ready to use!

## Step 1: Test Connections (30 seconds)

```bash
cd /home/joeylutes/projects/foundry-portal/database/schema_export/imports
./TEST_CONNECTIONS.sh
```

**Expected output:**
- OLD database: Shows ~25 total profiles (9 portal users, rest are app users)
- NEW database: Shows 0 profiles, 40+ tables, 102 functions

If both show ✅, you're ready to migrate!

## Step 2: Run Migration (5-10 minutes)

```bash
./RUN_MIGRATION.sh
```

**What it does:**
1. Tests connections
2. Exports 36 tables from OLD database to `/tmp/*.csv`
3. Shows row counts and pauses for confirmation
4. Imports all data to NEW database
5. Runs verification queries
6. Shows orphaned record check (should all be 0)

**The script will:**
- Export ONLY portal users (filters by role)
- Export all portal content (updates, surveys, events, referrals)
- Export reference data (markets, dsps, contacts, etc)
- Export last 1000 audit logs only
- Import everything in correct dependency order
- Verify data integrity

## Step 3: Manual Verification (2 minutes)

After migration completes, verify portal users:

```bash
export NEW_DB="postgresql://postgres:sklhzv1baIYYIqr1@db.shthtiwcbdnhvxikxiex.supabase.co:5432/postgres"

psql "$NEW_DB" -c "SELECT id, email, first_name, last_name, role FROM profiles ORDER BY role, email;"
```

Expected: 9 portal users (portal_member, investor, admin, super_admin)

---

## Individual Commands (if you want to run step-by-step)

### Export connection string (for manual use)
```bash
export OLD_DB="postgresql://postgres:QsmmiGZ6SzsdJ5os@db.kssbljbxapejckgassgf.supabase.co:5432/postgres"
export NEW_DB="postgresql://postgres:sklhzv1baIYYIqr1@db.shthtiwcbdnhvxikxiex.supabase.co:5432/postgres"
```

### Quick queries
```bash
# Count portal users in OLD database
psql "$OLD_DB" -c "SELECT COUNT(*) FROM profiles WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor');"

# Check NEW database is empty
psql "$NEW_DB" -c "SELECT COUNT(*) FROM profiles;"

# List all tables in NEW database
psql "$NEW_DB" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

### Export single table (example)
```bash
# Export portal users only
psql "$OLD_DB" -c "\COPY (SELECT * FROM profiles WHERE role IN ('portal_member', 'admin', 'super_admin', 'investor')) TO '/tmp/portal_profiles.csv' WITH CSV HEADER;"

# Verify export
wc -l /tmp/portal_profiles.csv  # Should be ~10 (9 users + 1 header)
head -3 /tmp/portal_profiles.csv  # Preview first 3 lines
```

### Import single table (example)
```bash
# Import profiles
psql "$NEW_DB" -c "\COPY profiles FROM '/tmp/portal_profiles.csv' WITH CSV HEADER;"

# Verify import
psql "$NEW_DB" -c "SELECT COUNT(*) FROM profiles;"
```

---

## Useful psql Commands for Development

### Interactive mode
```bash
# Open interactive psql session
psql "$NEW_DB"

# Then inside psql:
\dt              # List all tables
\df              # List all functions
\d profiles      # Describe profiles table
\q               # Quit
```

### Run SQL file
```bash
psql "$NEW_DB" -f my_migration.sql
```

### Multi-line query
```bash
psql "$NEW_DB" << 'EOF'
SELECT
  table_name,
  COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
GROUP BY table_name;
EOF
```

### Output to CSV
```bash
psql "$NEW_DB" -c "SELECT * FROM profiles;" --csv > portal_users.csv
```

### Quiet mode (less output)
```bash
psql "$NEW_DB" -q -c "SELECT COUNT(*) FROM profiles;"
```

---

## Troubleshooting

### Connection timeout
**Error:** `connection timed out`
**Fix:** Check your internet connection, Supabase may be updating

### Permission denied
**Error:** `permission denied for table`
**Fix:** Verify you're using the postgres password (not service role key)

### Table doesn't exist
**Error:** `relation "xxx" does not exist`
**Fix:** Run previous migration steps first (tables must exist before importing)

### Duplicate key error
**Error:** `duplicate key value violates unique constraint`
**Fix:** Data already exists, either:
- Skip that table (if re-running)
- Truncate table first: `psql "$NEW_DB" -c "TRUNCATE [table] CASCADE;"`

---

## After Migration

### Clean up CSV files
```bash
# Remove all temporary exports
rm /tmp/portal_*.csv /tmp/profiles.csv /tmp/businesses.csv /tmp/calculator*.csv /tmp/contacts*.csv /tmp/email*.csv /tmp/notification*.csv /tmp/markets.csv /tmp/regions.csv /tmp/stations.csv /tmp/dsps*.csv /tmp/interactions.csv /tmp/membership*.csv /tmp/nda*.csv /tmp/marketing*.csv /tmp/referral*.csv /tmp/recipient*.csv
```

### Save connection strings for later
```bash
# Add to your ~/.bashrc or ~/.zshrc
echo 'export PORTAL_DB="postgresql://postgres:sklhzv1baIYYIqr1@db.shthtiwcbdnhvxikxiex.supabase.co:5432/postgres"' >> ~/.bashrc
source ~/.bashrc

# Then use it:
psql "$PORTAL_DB" -c "SELECT COUNT(*) FROM profiles;"
```

---

## Time Estimates

| Task | Time |
|------|------|
| Test connections | 30 sec |
| Export all tables | 2-3 min |
| Import all tables | 2-3 min |
| Verification | 1 min |
| **Total** | **5-10 min** |

Compare to Dashboard method: **50-75 minutes**

---

## Ready?

Run this to get started:

```bash
cd /home/joeylutes/projects/foundry-portal/database/schema_export/imports
./TEST_CONNECTIONS.sh
```

If connections work, run:

```bash
./RUN_MIGRATION.sh
```

That's it! 🚀
