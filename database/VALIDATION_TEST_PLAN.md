## Email System Validation Test Plan

**After applying migration 005**, follow these steps to validate the entire email notification system works exactly as intended.

---

## Pre-Validation: Apply Migration

1. Run migration 005 in Supabase SQL Editor
2. Verify results:
   - Email queue: 0 queued/pending/failed emails
   - Notification rules: Only production rules (no test rules)
   - Templates: Only production templates (no test templates)

---

## Test 1: Referral Flow ✅

**Expected Behavior**:
- User creates referral
- 2 emails queued instantly
- No publish dialog (automatic)

**Steps**:
1. Go to portal → Referrals
2. Click "Create Referral"
3. Enter referee email (use your test email)
4. Click "Send Invitation"

**Validation Query**:
```sql
-- Check emails were queued
SELECT
    to_email,
    template_id,
    event_type,
    status,
    created_at
FROM email_queue
WHERE event_type = 'referral_created'
ORDER BY created_at DESC
LIMIT 5;
```

**Expected Results**:
- 2 emails queued
- Email 1: `to_email` = referee email, `template_id` = 'referral_invitation'
- Email 2: `to_email` = 'portal@fleetdrms.com', `template_id` = 'referral_admin_notification'
- Both have `status` = 'queued'
- Created within 1 second of each other

**✅ Pass Criteria**: Exactly 2 emails queued with correct templates and recipients

---

## Test 2: Event Publish Flow ✅

**Expected Behavior**:
- Admin publishes event
- Publish dialog shows recipient list and all email addresses
- Admin verifies then clicks "Publish & Send Now"
- Emails queued/sent to all users in recipient list

**Steps**:
1. Go to portal → Events (admin)
2. Create new event (status = 'draft')
3. Fill in title, description, location, date
4. Click "Publish Event"
5. **Verify publish dialog shows**:
   - Recipient list name: "All Users"
   - List of all email addresses to receive notification
   - Template: "Event Published Notification"
6. Click "Publish & Send Now"

**Validation Query**:
```sql
-- Check event emails were queued
SELECT
    to_email,
    template_id,
    event_type,
    status,
    event_payload->>'title' as event_title,
    created_at
FROM email_queue
WHERE event_type = 'event_published'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Results**:
- 1 email per user in "All Users" recipient list
- All have `template_id` = 'event_published_notification'
- All have `event_payload.title` = your event title
- All have `status` = 'queued' (or 'sent' if processor ran)

**✅ Pass Criteria**:
- Number of emails = number of portal users
- All use correct template
- All show correct event title in payload

---

## Test 3: Survey Publish Flow ✅

**Expected Behavior**: Same as events

**Steps**:
1. Go to portal → Surveys (admin)
2. Create new survey (status = 'draft')
3. Fill in title, description, questions
4. Click "Publish Survey"
5. **Verify publish dialog shows**:
   - Recipient list name: "All Users"
   - List of all email addresses
   - Template: "Survey Published Notification"
6. Click "Publish & Send Now"

**Validation Query**:
```sql
-- Check survey emails were queued
SELECT
    to_email,
    template_id,
    event_type,
    status,
    event_payload->>'title' as survey_title,
    created_at
FROM email_queue
WHERE event_type = 'survey_published'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Results**:
- 1 email per user
- All have `template_id` = 'survey_published_notification'
- All have correct survey title

**✅ Pass Criteria**: Same as events

---

## Test 4: Update Publish Flow ✅

**Expected Behavior**: Same as events/surveys

**Steps**:
1. Go to portal → Updates (admin)
2. Create new update (status = 'draft')
3. Fill in title, content
4. Click "Publish Update"
5. **Verify publish dialog shows**:
   - Recipient list name: "All Users"
   - List of all email addresses
   - Template: "Update Published Notification"
6. Click "Publish & Send Now"

**Validation Query**:
```sql
-- Check update emails were queued
SELECT
    to_email,
    template_id,
    event_type,
    status,
    event_payload->>'title' as update_title,
    created_at
FROM email_queue
WHERE event_type = 'update_published'
ORDER BY created_at DESC
LIMIT 10;
```

**Expected Results**:
- 1 email per user
- All have `template_id` = 'update_published_notification'
- All have correct update title

**✅ Pass Criteria**: Same as events

---

## Test 5: Email Processing ✅

**Expected Behavior**: Queued emails are processed and sent

**Steps**:
1. After creating test referral/event/survey/update above
2. Trigger email processor (manually or wait for cron)
3. Check that emails were actually sent

**Validation Query**:
```sql
-- Check emails were processed
SELECT
    event_type,
    template_id,
    status,
    COUNT(*) as count,
    MAX(processed_at) as last_processed
FROM email_queue
WHERE created_at > now() - interval '1 hour'
GROUP BY event_type, template_id, status
ORDER BY event_type, status;
```

**Expected Results**:
- All emails have `status` = 'sent'
- All have `processed_at` timestamp
- No emails stuck in 'queued' status for > 5 minutes

**✅ Pass Criteria**: All test emails processed successfully

---

## Test 6: Publish Dialog Accuracy ✅

**Expected Behavior**: Publish dialog shows accurate recipient information

**Steps**:
1. Create draft event/survey/update
2. Click "Publish"
3. **Verify dialog shows**:
   - Correct recipient list name (not hardcoded "All Users")
   - Correct template name
   - Accurate list of all email addresses that will receive notification
   - Matches the notification rule configuration

**Manual Verification**:
- Open notification rules admin
- Find rule for event_published/survey_published/update_published
- Verify recipient list matches what dialog shows
- Verify template matches what dialog shows

**✅ Pass Criteria**: Dialog shows accurate, live data from notification_rules

---

## Final Validation Checklist

After all tests:

- [ ] Referrals: 2 emails queued instantly with correct templates
- [ ] Events: Publish dialog accurate, emails sent to all users
- [ ] Surveys: Publish dialog accurate, emails sent to all users
- [ ] Updates: Publish dialog accurate, emails sent to all users
- [ ] Email processor: All emails processed and sent
- [ ] No test emails in queue
- [ ] No test templates exist
- [ ] No test notification rules exist
- [ ] Publish dialogs show accurate recipient information

---

## If Tests Fail

### Referral emails not queued
- Check trigger exists: `SELECT * FROM information_schema.triggers WHERE event_object_table = 'portal_referrals'`
- Check notification rules: `SELECT * FROM notification_rules WHERE event_id = 'referral_created' AND enabled = true`

### Event/survey/update emails not queued
- Check trigger exists on respective table
- Check notification rule enabled
- Check recipient list configured correctly

### Publish dialog shows wrong information
- Check `PortalAdminEvents.tsx`, `PortalAdminSurveys.tsx`, `PortalAdminUpdates.tsx`
- Verify `handleOpenPublishDialog` function fetches from notification_rules

### Emails stuck in queue
- Check email processor is running (cron job or manual trigger)
- Check for errors in processor logs

---

**After validation, the system should work exactly as intended with zero test infrastructure.**
