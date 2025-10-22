# Integration Test Email Policy

**Last Updated**: 2025-10-22
**Status**: ✅ ACTIVE - ALL TESTS COMPLY

---

## Policy Statement

**Integration tests SHALL NEVER send emails to production users.**

All integration tests MUST follow one of two patterns:

### Pattern 1: No Email Trigger (Recommended for most tests)
```typescript
// Keep status='draft' - NO emails queued
const { data } = await adminClient.from('portal_surveys').insert({
  title: 'Test Survey',
  status: 'draft',
  is_active: false
}).select().single();
```

### Pattern 2: Queue + Validate + Delete (For testing email system)
```typescript
// 1. Publish to portal@fleetdrms.com
const { data: event } = await adminClient.from('portal_events').insert({
  title: 'Test Event Email Notification',
  status: 'draft',
  is_active: false
}).select().single();

const { data: updated } = await adminClient.from('portal_events').update({
  status: 'published',
  is_active: true,
  published_at: new Date().toISOString()  // ← Queues email to portal@fleetdrms.com
}).eq('id', event!.id).select().single();

// 2. Wait for trigger
await new Promise(resolve => setTimeout(resolve, 1000));

// 3. Validate email queued correctly
const { data: queuedEmails } = await adminClient
  .from('email_queue')
  .select('*')
  .eq('to_email', 'portal@fleetdrms.com')
  .eq('event_type', 'event_published')
  .gte('created_at', new Date(Date.now() - 5000).toISOString());

expect(queuedEmails).toBeTruthy();
expect(queuedEmails!.length).toBeGreaterThan(0);

// 4. CRITICAL: Delete queued emails before test ends
if (queuedEmails && queuedEmails.length > 0) {
  const emailIds = queuedEmails.map(e => e.id);
  await adminClient.from('email_queue').delete().in('id', emailIds);
  console.log(`Cleaned up ${emailIds.length} test emails from queue`);
}
```

---

## Why This Matters

**What Happened**: On Oct 21, 2025, integration tests:
1. Created test events/surveys titled "Publish Test" and "Publish Test Event"
2. Updated status to 'published' with `published_at` set
3. Triggered email notifications to ALL production portal users
4. Test cleanup crashed → emails remained in queue
5. Emails sent to real users 25 hours later

**The Problem**:
- Production users received test emails
- Emails titled "Publish Test Event" and "Publish Test"
- Completely unrelated to user's actual referral action
- Destroyed trust in email system

---

## Technical Details

### Email Trigger Mechanism

The database trigger `trigger_email_notification()` fires when:
```sql
-- Trigger condition
IF TG_OP = 'UPDATE'
   AND OLD.status != 'published'
   AND NEW.status = 'published'
   AND NEW.published_at IS NOT NULL
THEN
  -- Queue emails to recipient list
END IF;
```

### How to Prevent Email Trigger

**Method 1**: Don't set `published_at`
```typescript
// This WILL NOT trigger emails (no published_at)
await adminClient.from('portal_events').update({
  status: 'published',
  is_active: true
  // No published_at = no email trigger
}).eq('id', eventId);
```

**Method 2**: Keep status='draft'
```typescript
// This WILL NOT trigger emails (status != 'published')
await adminClient.from('portal_events').insert({
  title: 'Test Event',
  status: 'draft',  // ← Draft status
  is_active: false
});
```

**Method 3**: Queue + Delete (for email system testing)
```typescript
// This WILL queue email → validate → delete
// See Pattern 2 above
```

---

## Test Files Affected

### ✅ Fixed Tests

**File**: [tests/integration/portal/portal-surveys.test.ts](./portal/portal-surveys.test.ts)
- ✅ Test 1: Creates survey with status='draft' (no emails)
- ✅ Test 2: Publishes → validates → deletes queued email
- ✅ Test 3: Creates survey with status='draft' (no emails)

**File**: [tests/integration/portal/portal-events.test.ts](./portal/portal-events.test.ts)
- ✅ Test 1: Creates event with status='draft' (no emails)
- ✅ Test 2: Publishes → validates → deletes queued email
- ✅ Test 3: Creates event with status='draft' (no emails)

---

## Validation Checklist

Before committing any integration test that touches portal content:

- [ ] Does the test set `status='published'`?
  - If NO → ✅ Safe
  - If YES → Continue checklist

- [ ] Does the test set `published_at`?
  - If NO → ✅ Safe (won't trigger emails)
  - If YES → Continue checklist

- [ ] Does the test query `email_queue` after publishing?
  - If NO → ❌ UNSAFE - emails will be sent to production
  - If YES → Continue checklist

- [ ] Does the test DELETE queued emails before ending?
  - If NO → ❌ UNSAFE - emails will be sent to production
  - If YES → ✅ Safe

- [ ] Are queued emails sent to `portal@fleetdrms.com`?
  - If NO → ❌ UNSAFE - real users will get emails
  - If YES → ✅ Safe

---

## Admin UI Testing

**Only method approved for testing emails to real users**:

1. Navigate to `/admin/communications`
2. Create test content (event/survey/update)
3. Change notification rule recipient list to 'super-admin-only'
4. Click Publish → Review recipient list in dialog
5. Verify ONLY super admins listed
6. Confirm publish
7. Check email
8. Change recipient list back to intended audience
9. Delete test content

**NEVER test via**:
- Direct database inserts
- Integration tests
- SQL migrations
- Edge functions

---

## Migration Files

This policy also applies to migration files in `/database/migrations/`:

❌ **NEVER** include test content in migrations:
```sql
-- DON'T DO THIS
INSERT INTO portal_events (title, status, published_at) VALUES
  ('Test Event', 'published', NOW());  -- ← Will email ALL users!
```

✅ **Only production data** in migrations:
```sql
-- Safe - adds notification rule, doesn't trigger emails
INSERT INTO notification_rules (event_id, template_id, recipient_list_id)
VALUES ('event_published', 'event-announcement', 'all-portal-members');
```

---

## Enforcement

### Pre-Commit Hook

The pre-commit hook checks for console.log statements. Integration tests are exempt from this rule as console.log is appropriate for test output visibility.

### Code Review Checklist

Before approving any PR that touches integration tests:
- [ ] Review email trigger conditions
- [ ] Verify Pattern 1 or Pattern 2 followed
- [ ] Check for `published_at` in UPDATE statements
- [ ] Verify email queue cleanup (if Pattern 2)
- [ ] Confirm test creates NO content with status='published' + published_at

---

## Questions?

**Q**: Can I test the email system?
**A**: Yes - use Pattern 2 (queue + validate + delete)

**Q**: Can I create published content in tests?
**A**: Yes - but MUST delete queued emails before test ends

**Q**: What if I need to test with real recipient lists?
**A**: Use Admin UI with 'super-admin-only' recipient list

**Q**: Can I test email templates?
**A**: Yes - but send to portal@fleetdrms.com and delete from queue

**Q**: What about staging environment?
**A**: When staging is set up, tests can run there without email cleanup

---

## Related Files

- [portal-events.test.ts](./portal/portal-events.test.ts) - Event integration tests
- [portal-surveys.test.ts](./portal/portal-surveys.test.ts) - Survey integration tests
- [/database/migrations/005_complete_email_system_cleanup_and_validation.sql](/database/migrations/005_complete_email_system_cleanup_and_validation.sql) - Cleanup migration
- [/database/VALIDATION_TEST_PLAN.md](/database/VALIDATION_TEST_PLAN.md) - Email system validation

---

**Last Incident**: 2025-10-21 (Test emails sent to production users)
**Resolution**: 2025-10-22 (This policy implemented)
**Status**: ✅ All integration tests compliant
