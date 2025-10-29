# Data Export Instructions

## Fastest Method: Use Supabase Dashboard Export

### Option A: Table-by-Table CSV Export (Recommended for small datasets)

1. **Open OLD database in Supabase Dashboard**
   - Go to Table Editor
   - For each table, click "..." menu → "Download as CSV"
   - Save all CSV files to `/database/schema_export/exports/data/`

2. **Use provided conversion script**
   - We'll create a script to convert CSVs to SQL INSERT statements

### Option B: SQL Query Export (Better for complex data)

Run the query below in **OLD database** SQL Editor to generate INSERT statements for all critical tables:

```sql
-- This will create a file with INSERT statements for the new database
-- Copy the results and save to: portal_data_export.sql

-- 1. PROFILES (Foundation table)
SELECT 'INSERT INTO profiles (id, first_name, last_name, email, phone, company, title, avatar_url, status, is_admin, is_portal_admin, bio, linkedin_url, address, city, state, zip, country, timezone, metadata, created_at, updated_at, last_login, email_verified_at, deleted_at) VALUES ' ||
string_agg(
  '(''' || id || '''::uuid, ' ||
  COALESCE('''' || replace(first_name, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || replace(last_name, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || replace(email, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || replace(phone, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || replace(company, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || replace(title, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || avatar_url || '''', 'NULL') || ', ' ||
  COALESCE('''' || status::text || '''::user_status', 'NULL') || ', ' ||
  COALESCE(is_admin::text, 'false') || ', ' ||
  COALESCE(is_portal_admin::text, 'false') || ', ' ||
  COALESCE('''' || replace(bio, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || linkedin_url || '''', 'NULL') || ', ' ||
  COALESCE('''' || replace(address, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || replace(city, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || replace(state, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || replace(zip, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || replace(country, '''', '''''') || '''', 'NULL') || ', ' ||
  COALESCE('''' || timezone || '''', 'NULL') || ', ' ||
  COALESCE('''' || replace(metadata::text, '''', '''''') || '''::jsonb', 'NULL::jsonb') || ', ' ||
  COALESCE('''' || created_at || '''::timestamptz', 'NULL') || ', ' ||
  COALESCE('''' || updated_at || '''::timestamptz', 'NULL') || ', ' ||
  COALESCE('''' || last_login || '''::timestamptz', 'NULL') || ', ' ||
  COALESCE('''' || email_verified_at || '''::timestamptz', 'NULL') || ', ' ||
  COALESCE('''' || deleted_at || '''::timestamptz', 'NULL') || ')',
  ', '
) || ' ON CONFLICT (id) DO NOTHING;'
FROM profiles
WHERE deleted_at IS NULL;
```

This query is complex. Let me provide a **much simpler solution**:

### Option C: Simple pg_dump Alternative (RECOMMENDED)

Since WSL networking failed, use Supabase's **Database Backups** feature:

1. **In OLD database Supabase Dashboard**:
   - Go to "Database" → "Backups"
   - Click "Create backup"
   - Wait for backup to complete
   - Download the backup file

2. **The backup is a plain SQL file** - you can:
   - Extract just the INSERT statements for portal tables
   - Run them in the new database

**OR** use this simpler table-by-table approach:

### Option D: Manual Copy via SQL (EASIEST)

For each table, run this in OLD database, copy results, paste in NEW database:

```sql
-- Example for profiles table:
COPY (SELECT * FROM profiles WHERE deleted_at IS NULL) TO STDOUT WITH (FORMAT CSV, HEADER, DELIMITER ',');
```

Then in new database:
```sql
COPY profiles FROM STDIN WITH (FORMAT CSV, HEADER, DELIMITER ',');
-- paste the CSV data
-- type \. on a new line to end
```

## My Recommendation

Since you have ~500 rows total across 50 tables, the **absolute fastest method** is:

### Use Supabase SQL Editor with COPY TO/FROM

I'll create table-specific export queries that you can run sequentially. This avoids:
- Complex INSERT statement generation
- CSV parsing issues
- Manual data transformation

Let me create that now...
