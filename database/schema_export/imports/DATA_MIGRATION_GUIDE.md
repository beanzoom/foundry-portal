# Data Migration Guide

## ✅ Status: Ready to Export Data

You've completed:
- ✅ Created new Supabase database
- ✅ Run Part 1 table creation (22 tables)
- ✅ Run Part 2 table creation (28 tables)

Next: **Export data from OLD database and import to NEW database**

---

## Method 1: Python Script (RECOMMENDED - Most Reliable)

### Prerequisites
```bash
# Install psycopg2 if not already installed
pip install psycopg2-binary
```

### Steps

1. **Edit the script** `export_data.py`:
   ```python
   OLD_DB_CONFIG = {
       'host': 'db.kssbljbxapejckgassgf.supabase.co',
       'database': 'postgres',
       'user': 'postgres',
       'password': 'YOUR_ACTUAL_PASSWORD',  # ← Update this!
       'port': 5432
   }
   ```

2. **Run the export**:
   ```bash
   cd /home/joeylutes/projects/foundry-portal/database/schema_export/imports
   python3 export_data.py
   ```

3. **Result**: Creates `portal_data_import.sql` with all INSERT statements

4. **Import to new database**:
   - Open NEW database in Supabase SQL Editor
   - Copy contents of `portal_data_import.sql`
   - Paste and run
   - Should complete in ~30 seconds

### If Python script fails due to WSL networking:

Try running from **Windows PowerShell** instead:
```powershell
cd C:\path\to\foundry-portal\database\schema_export\imports
python export_data.py
```

---

## Method 2: Manual Table-by-Table (If Method 1 fails)

For each table, run these two queries:

### In OLD database:
```sql
-- Export as JSON
SELECT jsonb_agg(row_to_json(t)) FROM (SELECT * FROM profiles) t;
```

### In NEW database:
```sql
-- Import from JSON
INSERT INTO profiles
SELECT * FROM jsonb_populate_recordset(NULL::profiles, '[
  -- paste JSON here
]');
```

### Table Export Order (50 tables)

Run these in sequence:

1. **Foundation**: `profiles`
2. **Independent**: `notification_events`, `recipient_lists`, `email_templates`, `regions`, `markets`, `stations`, `dsps`
3. **User relationships**: `portal_memberships`, `membership_agreements`, `nda_agreements`
4. **Notifications**: `notification_rules`
5. **Contacts**: `contacts`, `contact_interactions`
6. **Funnels**: `portal_funnels`, `portal_funnel_stages`, `portal_leads`
7. **Referrals**: `portal_referrals` (self-referencing - see note below)
8. **Calculator**: `calculator_submissions`, `portal_calculator_submissions`
9. **Events**: `portal_events`, `portal_event_dates`, `portal_event_registrations`, `portal_event_guests`, `portal_event_reminders`, `portal_event_templates`
10. **Surveys**: `portal_surveys`, `portal_survey_sections`, `portal_survey_questions`, `portal_survey_responses`, `portal_survey_answers`
11. **Updates**: `portal_updates`, `portal_update_reads`
12. **Email batches**: `email_notification_batches`
13. **Referral tracking**: `portal_referral_conversions`, `portal_referral_rate_limits`, `marketing_campaign_links`, `referral_conversions`
14. **Email queue**: `email_notifications`, `notification_logs`, `email_logs`, `email_queue`
15. **Audit**: `portal_user_deletion_logs`, `referral_deletion_logs`, `portal_audit_log`
16. **Archives**: `email_logs_backup_042`, `email_notification_batches_backup_042`, `email_notification_batches_archive`, `portal_referrals_archive`

### Special Case: Self-Referencing Tables

**portal_referrals** has `parent_referral_id` that references itself.

Import in two passes:

```sql
-- Pass 1: Insert all rows with parent_referral_id = NULL
INSERT INTO portal_referrals
SELECT * FROM jsonb_populate_recordset(NULL::portal_referrals, '[...]')
WHERE parent_referral_id IS NULL;

-- Pass 2: Insert rows with parent_referral_id
INSERT INTO portal_referrals
SELECT * FROM jsonb_populate_recordset(NULL::portal_referrals, '[...]')
WHERE parent_referral_id IS NOT NULL;
```

Same for `calculator_submissions` (has `updated_submission_id` self-reference).

---

## Method 3: Supabase CLI (If WSL networking works)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to OLD project
supabase link --project-ref kssbljbxapejckgassgf

# Export data only
supabase db dump --data-only -f old_db_data.sql

# Link to NEW project
supabase link --project-ref <NEW_PROJECT_REF>

# Import
psql "<NEW_DATABASE_URL>" -f old_db_data.sql
```

---

## After Data Import: Add Constraints

Once data is imported, you'll need to:

1. **Add Foreign Keys** (98 constraints)
2. **Add Functions** (116 functions)
3. **Add Triggers** (28 triggers)
4. **Enable RLS Policies**

I'll create those scripts after data import is confirmed.

---

## Troubleshooting

### "Connection refused" or "Network unreachable"
- WSL networking issue
- Solution: Run Python script from Windows host, or use Method 2 (manual)

### "Password authentication failed"
- Check password has no typos
- URL-encode special characters: `@` → `%40`, `%` → `%25`

### "Relation does not exist"
- Tables not created yet
- Verify you ran both Part 1 and Part 2 table creation scripts

### "Duplicate key value violates unique constraint"
- Data already exists in new database
- Solution: `TRUNCATE TABLE <tablename> CASCADE;` then re-import

---

## Next Steps

1. Choose your method (recommend Method 1)
2. Export data
3. Import to new database
4. Verify with: `SELECT COUNT(*) FROM profiles;` (should see expected row count)
5. Let me know when complete - I'll create the FK/functions/triggers scripts
