# Email Bug - Quick Reference for AI

**Date**: 2025-10-22
**Status**: ✅ RESOLVED

---

## For AI Assistant: Understanding This Issue

If you're reading this to understand what happened with the email system, here's what you need to know:

### 1. What Was The Fix?

**Problem**: Integration tests were sending production emails to real users.

**Fix Applied**:
- Modified integration tests to NEVER send production emails
- Tests now either skip email trigger OR queue→validate→delete
- Created policy document to prevent future incidents
- Created cleanup migration to purge test emails

**Files Changed**:
- `/tests/integration/portal/portal-events.test.ts`
- `/tests/integration/portal/portal-surveys.test.ts`
- `/tests/integration/INTEGRATION_TEST_EMAIL_POLICY.md` (new)

### 2. What We Did (Step by Step)

1. **Diagnosed the problem** (Oct 22, 2025)
   - User reported receiving wrong emails when creating referral
   - Found old test emails in queue from Oct 21
   - Traced to integration tests publishing events/surveys

2. **Identified root cause**
   - Tests set `status='published'` + `published_at`
   - This triggered `trigger_email_notification()` database function
   - Queued emails to ALL production users
   - Test cleanup failed → emails remained in queue
   - Creating referral on Oct 22 triggered processor → sent old emails

3. **Fixed integration tests**
   - Pattern 1: Keep `status='draft'` (no email trigger)
   - Pattern 2: Publish → validate email queued → DELETE from queue
   - All test emails sent to `portal@fleetdrms.com` only

4. **Created policy document**
   - Established rules for integration test email handling
   - Code review checklist for future PRs
   - Clear examples of safe vs unsafe patterns

5. **Created cleanup migration**
   - `/database/migrations/005_complete_email_system_cleanup_and_validation.sql`
   - Deletes ALL queued emails (fresh start)
   - Removes test templates/rules/events

6. **Committed and pushed changes**
   - Commit `e6fed69e`: fix integration tests
   - Commit `9d51bc81`: add email policy
   - Pushed to main branch

### 3. How It Should Work Moving Forward

#### Integration Tests

**❌ NEVER DO THIS**:
```typescript
// This sends emails to ALL production users!
await adminClient.from('portal_events').update({
  status: 'published',
  published_at: new Date().toISOString()  // ← Triggers emails!
}).eq('id', eventId);
// No cleanup = emails remain in queue forever
```

**✅ DO THIS (Pattern 1 - No Email Trigger)**:
```typescript
// This does NOT trigger emails
await adminClient.from('portal_events').insert({
  title: 'Test Event',
  status: 'draft',  // ← DRAFT = no trigger
  is_active: false
});
```

**✅ DO THIS (Pattern 2 - Queue + Validate + Delete)**:
```typescript
// 1. Publish (queues email to portal@fleetdrms.com)
await adminClient.from('portal_events').update({
  status: 'published',
  published_at: new Date().toISOString()
}).eq('id', eventId);

// 2. Wait for trigger
await new Promise(resolve => setTimeout(resolve, 1000));

// 3. Validate email queued
const { data: emails } = await adminClient
  .from('email_queue')
  .select('*')
  .eq('to_email', 'portal@fleetdrms.com')
  .eq('event_type', 'event_published');

expect(emails!.length).toBeGreaterThan(0);

// 4. CRITICAL: Delete from queue before test ends
await adminClient.from('email_queue').delete().in('id', emails.map(e => e.id));
```

#### Production Email System

**For Referrals** (automatic):
- User creates referral
- Trigger fires instantly
- 2 emails queued:
  1. To referee email (referral invitation)
  2. To portal@fleetdrms.com (admin notification)
- Email processor sends

**For Events/Surveys/Updates** (admin controlled):
- Admin creates content with `status='draft'`
- Admin clicks Publish button
- Publish dialog shows recipient list preview
- Admin confirms
- `status='published'` + `published_at` set
- Trigger fires
- Emails queued to recipient list
- Email processor sends

#### Testing Emails (Admin UI Only)

**Safe method**:
1. Navigate to `/admin/communications`
2. Create test content
3. Change notification rule recipient list to `'super-admin-only'`
4. Publish and verify email
5. Change recipient list back
6. Delete test content

**NEVER test by**:
- Running integration tests ❌
- Direct database inserts ❌
- SQL migrations ❌

---

## Key Files for Understanding

### Documentation
1. **[EMAIL_QUEUE_ISSUE_RESOLVED.md](./EMAIL_QUEUE_ISSUE_RESOLVED.md)** - Complete timeline and root cause analysis
2. **[/tests/integration/INTEGRATION_TEST_EMAIL_POLICY.md](/tests/integration/INTEGRATION_TEST_EMAIL_POLICY.md)** - Policy for integration tests
3. **[/database/VALIDATION_TEST_PLAN.md](/database/VALIDATION_TEST_PLAN.md)** - How to validate email system works

### Code Files
1. **[/tests/integration/portal/portal-events.test.ts](/tests/integration/portal/portal-events.test.ts)** - Fixed event tests
2. **[/tests/integration/portal/portal-surveys.test.ts](/tests/integration/portal/portal-surveys.test.ts)** - Fixed survey tests

### Migration Files
1. **[/database/migrations/005_complete_email_system_cleanup_and_validation.sql](/database/migrations/005_complete_email_system_cleanup_and_validation.sql)** - Cleanup migration (user must run)

---

## What AI Should Tell User

When asked about this issue, provide:

1. **Brief summary**: Integration tests were triggering production emails. Fixed by modifying tests to either skip email trigger or delete queued emails.

2. **Current status**:
   - ✅ Integration tests fixed and committed
   - ✅ Email policy documented
   - ⏳ User needs to apply migration 005
   - ⏳ User should follow validation test plan

3. **Next steps**:
   - Apply migration `/database/migrations/005_complete_email_system_cleanup_and_validation.sql`
   - Follow validation test plan in `/database/VALIDATION_TEST_PLAN.md`
   - Test creating referral to verify correct emails sent

4. **Point to documentation**:
   - Full details: `/database/debug/EMAIL_QUEUE_ISSUE_RESOLVED.md`
   - Testing policy: `/tests/integration/INTEGRATION_TEST_EMAIL_POLICY.md`
   - Validation: `/database/VALIDATION_TEST_PLAN.md`

---

## Technical Details

### Database Trigger

The trigger that fires emails:
```sql
CREATE TRIGGER trigger_email_notification
  AFTER INSERT OR UPDATE ON portal_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_email_notification();
```

**Trigger conditions**:
- Fires when `status` changes to 'published'
- AND `published_at` is set (not null)
- Reads notification rules to find recipient list
- Queues email to each recipient

### Email Queue

**Table**: `email_queue`

**Flow**:
1. Trigger inserts row with status='queued'
2. Email processor queries for status='queued'
3. Processor sends email
4. Updates row to status='sent' + sets `processed_at`

**Problem**: No expiration check. Old queued emails would be sent forever.

**Solution**: Migration 005 deletes all queued emails (fresh start).

### Integration Test Pattern

**Why Pattern 2 works**:
- Emails queued to `portal@fleetdrms.com` (single admin email)
- Test validates email queued correctly
- Test DELETES email from queue before ending
- No emails remain after test completes
- No emails sent to production users

**Why omitting `published_at` prevents trigger**:
- Trigger checks: `NEW.status = 'published' AND NEW.published_at IS NOT NULL`
- If `published_at` not set → trigger doesn't fire
- Status can be 'published' but no emails queued

---

## Commits

**Main App** (`a_fleetdrms`):
- `e6fed69e` - fix: prevent integration tests from sending production emails
- `9d51bc81` - docs: add integration test email policy

**Portal App** (`foundry-portal`):
- Files copied from main app (not committed yet)

---

**Last Updated**: 2025-10-22
**For**: AI Assistant context and understanding
