# ✅ Step 6 Ready: Add Triggers

**Date**: 2025-10-28
**Status**: ✅ Ready to Run

---

## Quick Start

Run this file in your **NEW Supabase database** SQL Editor:

**File**: [06_ADD_TRIGGERS.sql](06_ADD_TRIGGERS.sql)

Expected output: "CREATE TRIGGER" messages × 48

---

## What You're About to Create

**48 triggers** that automate portal workflows:

### Critical Triggers (Must Work)

1. **`on_auth_user_created`** - Auto-creates profile when user signs up
2. **`on_portal_update_published`** - Sends email when update published
3. **`on_portal_survey_published`** - Sends email when survey published
4. **`on_portal_event_published`** - Sends email when event published
5. **`on_email_queue_insert`** - Invokes edge function to send emails
6. **`on_referral_created`** - Sends referral invitation email

### Automation Triggers (Quality of Life)

7. **20+ `update_*_updated_at`** - Auto-updates timestamps
8. **`generate_event_slug`** - Auto-generates URL-friendly event slugs
9. **`update_calculator_submission_is_latest`** - Tracks latest submission per user
10. **`update_survey_question_count`** - Keeps count accurate
11. **`update_contact_last_contacted`** - Tracks last interaction
12. **`update_event_date_attendees`** - Maintains attendee counts

---

## Trigger Breakdown

| Category | Triggers | What They Do |
|----------|----------|--------------|
| **Auth & Profile** | 2 | Create profiles, update timestamps |
| **Email & Notifications** | 5 | Queue emails, invoke processing |
| **Portal Updates** | 3 | Publish notifications, update timestamps |
| **Surveys** | 6 | Publish notifications, track completion, count questions |
| **Events** | 6 | Publish notifications, generate slugs, track attendance |
| **Referrals** | 3 | Send invitations, track conversions |
| **Calculator** | 3 | Send notifications, track latest |
| **Contacts** | 4 | Queue notifications, track interactions |
| **Portal Memberships** | 2 | Log changes, update timestamps |
| **Businesses** | 1 | Update timestamps |
| **Generic Timestamps** | 13 | Auto-update 13 tables |

---

## Why These Triggers Matter

### Without Triggers
❌ Manually create profile after signup
❌ Manually send emails when content published
❌ Manually track attendee counts
❌ Manually update timestamps
❌ Manually generate slugs
❌ Manually track latest submissions

### With Triggers
✅ Profiles auto-created on signup
✅ Emails auto-queued when content published
✅ Attendee counts auto-updated
✅ Timestamps auto-maintained
✅ Slugs auto-generated
✅ Latest submissions auto-tracked

---

## Prerequisites

✅ **Step 5 Complete** - All trigger functions must exist

Verify:
```sql
SELECT COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND data_type = 'trigger';
```
Expected: **22 trigger functions**

---

## Post-Run Verification

After running `06_ADD_TRIGGERS.sql`, verify success:

```sql
-- Should return 48 (or more if pre-existing triggers)
SELECT COUNT(*)
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- Check critical triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'on_auth_user_created',
    'on_portal_update_published',
    'on_email_queue_insert'
  );
```

---

## Known Backward Compatibility

Some triggers reference tables/functions that may not fully exist yet:

1. **`on_auth_user_created`** on `auth.users`
   - May not fire if auth schema isn't accessible
   - Alternative: Manually create profiles or use Supabase Auth hooks

2. **Email processing triggers**
   - Require edge function to be deployed
   - Will queue emails correctly, but won't send until edge function exists

3. **Notification triggers**
   - Require `notification_rules` and `recipient_lists` to be populated
   - Will work once notification rules are configured

**These are expected and OK** - the triggers are defensive and won't error.

---

## Next Steps After Running

1. ✅ Verify 48 triggers created
2. Continue to **Step 7: Migrate Data**
3. Test critical triggers after data migration
4. Configure notification rules
5. Deploy edge functions for email sending

---

## Troubleshooting

### "function does not exist"
Run Step 5 first: [05_ADD_FUNCTIONS_PORTAL_ONLY.sql](05_ADD_FUNCTIONS_PORTAL_ONLY.sql)

### "table does not exist"
Run Step 1 first: Tables must be created before triggers

### "trigger already exists"
Safe to ignore - triggers already created from previous run

### Triggers not firing
- Check RLS policies aren't blocking
- Verify trigger functions use `SECURITY DEFINER`
- Check trigger is enabled: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'trigger_name'`

---

## Files

- **Main File**: [06_ADD_TRIGGERS.sql](06_ADD_TRIGGERS.sql) - Run this
- **Instructions**: [STEP_6_INSTRUCTIONS.md](STEP_6_INSTRUCTIONS.md) - Detailed guide
- **Status**: [CURRENT_STATUS.md](CURRENT_STATUS.md) - Overall progress

---

## Migration Progress

- ✅ Step 1: Create Tables
- ✅ Step 2: Add Indexes
- ✅ Step 3: Add Foreign Keys
- ✅ Step 4: Add RLS Policies
- ✅ Step 5: Add Functions
- ⏳ **Step 6: Add Triggers** ← YOU ARE HERE
- ⏳ Step 7: Migrate Data
- ⏳ Step 8: Verify Migration

**Progress**: 75% complete (6 of 8 steps)

**Time to complete Step 6**: ~1 minute
