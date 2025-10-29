# Step 6: Add Triggers

**File**: [06_ADD_TRIGGERS.sql](06_ADD_TRIGGERS.sql)
**Status**: ✅ Ready to Run
**Duration**: ~1 minute

---

## What This Does

Creates **48 triggers** that automatically invoke functions when table events occur (INSERT, UPDATE, DELETE).

### Trigger Categories

| Category | Count | Purpose |
|----------|-------|---------|
| Auth & Profile | 2 | Auto-create profiles, update timestamps |
| Email & Notifications | 5 | Queue emails, invoke processing |
| Portal Updates | 3 | Send notifications when updates published |
| Surveys | 6 | Publish notifications, track completion, count questions |
| Events | 6 | Send notifications, generate slugs, track attendance |
| Referrals | 3 | Send invitations, track registrations |
| Calculator | 3 | Send notifications, track latest submissions |
| Contacts | 4 | Queue notifications, update last contact time |
| Portal Memberships | 2 | Log changes, update timestamps |
| Businesses | 1 | Update timestamps |
| Generic Timestamps | 13 | Auto-update `updated_at` columns |

---

## Prerequisites

✅ Step 5 must be complete (all trigger functions already created)

Verify functions exist:
```sql
SELECT COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND data_type = 'trigger';
-- Should return: 22 trigger functions
```

---

## How to Run

1. Open **NEW Supabase database** SQL Editor
2. Copy entire `06_ADD_TRIGGERS.sql` file
3. Paste and click "Run"
4. Wait ~1 minute
5. Should see: "CREATE TRIGGER" × 48

---

## Key Triggers to Know

### Authentication
- **`on_auth_user_created`** - Creates profile when user signs up
- Ensures every auth.users entry gets a profiles entry

### Email System
- **`on_email_queue_insert`** - Automatically invokes edge function to process email
- **`create_update_email_batch`** - Creates batch when update published
- **`queue_notification_emails`** - Queues emails for events/referrals/contacts

### Content Publishing
- **`on_portal_update_published`** - Sends notification when update published
- **`on_portal_survey_published`** - Sends notification when survey published
- **`on_portal_event_published`** - Sends notification when event published

### Automatic Tracking
- **`update_*_updated_at`** - Auto-updates timestamps on 20+ tables
- **`update_calculator_submission_is_latest`** - Tracks user's latest calculation
- **`update_survey_question_count`** - Keeps survey question count accurate

### Smart Features
- **`generate_event_slug`** - Auto-generates URL-friendly slugs for events
- **`update_contact_last_contacted`** - Tracks when contacts were last reached
- **`update_event_date_attendees`** - Maintains accurate attendee counts

---

## Verification Queries

After running, verify triggers were created:

```sql
-- Count total triggers
SELECT COUNT(*)
FROM information_schema.triggers
WHERE trigger_schema = 'public';
-- Should be: 48 (or more if pre-existing)

-- List all triggers by table
SELECT
  event_object_table,
  trigger_name,
  action_timing,
  string_agg(event_manipulation, ', ') as events
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY event_object_table, trigger_name, action_timing
ORDER BY event_object_table, trigger_name;

-- Check specific critical triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'on_auth_user_created',
    'on_portal_update_published',
    'on_portal_survey_published',
    'on_portal_event_published',
    'on_email_queue_insert',
    'on_referral_created'
  )
ORDER BY trigger_name;
-- Should return: 6 rows

-- Verify timestamp triggers exist
SELECT COUNT(*)
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%updated_at%';
-- Should be: ~20 triggers
```

---

## Testing Triggers

After migration, test key triggers:

```sql
-- Test 1: Profile creation trigger
-- Sign up a new user and verify profile is created automatically

-- Test 2: Update timestamp trigger
UPDATE profiles
SET first_name = first_name
WHERE id = auth.uid();
-- Check updated_at changed

-- Test 3: Email queue trigger
INSERT INTO email_queue (
  event_type, to_email, template_id, status
) VALUES (
  'test_event', 'test@example.com', 'test-template', 'pending'
);
-- Check if email processing was invoked (check logs)

-- Test 4: Survey question count
INSERT INTO portal_survey_questions (
  survey_id, question_text, question_type, display_order
) VALUES (
  '<some_survey_id>', 'Test question?', 'text', 1
);
-- Check portal_surveys.question_count incremented
```

---

## Troubleshooting

### Error: "function does not exist"
**Cause**: Trigger functions not created in Step 5
**Fix**: Run Step 5 first (05_ADD_FUNCTIONS_PORTAL_ONLY.sql)

### Error: "table does not exist"
**Cause**: Tables not created in Step 1
**Fix**: Run Step 1 first (01_CREATE_TABLES_*.sql)

### Error: "trigger already exists"
**Cause**: Trigger already created
**Fix**: Either:
- Skip (if triggers already exist from previous run)
- OR Drop and recreate:
```sql
DROP TRIGGER IF EXISTS <trigger_name> ON <table_name>;
-- Then re-run the CREATE TRIGGER statement
```

### Triggers not firing
**Cause**: RLS policies may be blocking trigger execution
**Fix**: Verify trigger functions use `SECURITY DEFINER`:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND data_type = 'trigger'
  AND security_type != 'DEFINER';
-- Should return: 0 rows (all should be SECURITY DEFINER)
```

---

## What's Next

After triggers are created:

**Next Step**: Step 7 - Migrate Data
- Copy data from old database to new database
- Filter to portal users only
- See: [CURRENT_STATUS.md](CURRENT_STATUS.md)

---

## Important Notes

### Trigger Execution Order
- BEFORE triggers run before data is written
- AFTER triggers run after data is written
- Multiple triggers on same event run in alphabetical order

### Performance Impact
- Triggers add overhead to INSERT/UPDATE/DELETE operations
- Most triggers are lightweight (timestamp updates)
- Email triggers are asynchronous (won't slow down requests)

### Circular Trigger Prevention
- Triggers use `NEW` and `OLD` keywords to access row data
- Timestamp triggers only update `updated_at`, won't cause recursion
- Email triggers use status checks to prevent duplicate sends

### Maintenance
- Triggers automatically fire - no manual intervention needed
- Monitor trigger performance in production
- Can temporarily disable triggers with:
```sql
ALTER TABLE <table_name> DISABLE TRIGGER <trigger_name>;
-- Re-enable later:
ALTER TABLE <table_name> ENABLE TRIGGER <trigger_name>;
```

---

## Migration Progress

After completing this step:

- ✅ Step 1: Create Tables
- ✅ Step 2: Add Indexes
- ✅ Step 3: Add Foreign Keys
- ✅ Step 4: Add RLS Policies
- ✅ Step 5: Add Functions
- ⏳ **Step 6: Add Triggers** ← YOU ARE HERE
- ⏳ Step 7: Migrate Data
- ⏳ Step 8: Verify Migration

**Progress**: 75% complete (6 of 8 steps)
