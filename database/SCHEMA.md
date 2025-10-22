# Portal Database Schema Reference
## Complete table structures for the portal database

**Last Updated**: 2025-10-22
**Source**: Live database schema inspection

---

## email_queue

**Purpose**: Queue for outbound emails managed by notification system

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| email_options | jsonb | YES | '{}'::jsonb | Email delivery options |
| scheduled_for | timestamp with time zone | YES | now() | When to send |
| priority | integer | YES | 5 | Send priority (lower = higher priority) |
| status | text | YES | 'queued'::text | queued, processing, sent, failed |
| attempts | integer | YES | 0 | Number of send attempts |
| last_error | text | YES | null | Last error message |
| created_at | timestamp with time zone | YES | now() | When queued |
| updated_at | timestamp with time zone | YES | now() | Last update |
| event_type | text | NO | 'unknown'::text | Event that triggered email |
| event_id | text | YES | null | Specific event ID |
| event_payload | jsonb | YES | '{}'::jsonb | Event data for template |
| template_id | text | YES | null | Email template to use |
| recipient_list_id | text | YES | null | Recipient list reference |
| to_email | text | YES | null | Recipient email address |
| to_user_id | uuid | YES | null | Recipient user ID |
| expires_at | timestamp with time zone | YES | now() + 7 days | When to expire |
| batch_id | uuid | YES | null | Batch processing ID |
| processed_at | timestamp with time zone | YES | null | When processed |
| processor_id | text | YES | null | Which processor handled |
| max_attempts | integer | YES | 3 | Max retry attempts |
| last_attempt_at | timestamp with time zone | YES | null | Last send attempt |
| next_retry_at | timestamp with time zone | YES | null | Next retry time |
| retry_strategy | text | YES | 'exponential'::text | Retry strategy |
| error_details | jsonb | YES | null | Detailed error info |
| tags | ARRAY | YES | null | Tag array for filtering |
| metadata | jsonb | YES | '{}'::jsonb | Additional metadata |
| created_by | uuid | YES | null | Who created |

---

## email_templates

**Purpose**: Email template definitions with variables

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | text | NO | - | Template ID (unique slug) |
| name | text | NO | - | Display name |
| subject | text | NO | - | Email subject line |
| body_html | text | NO | - | HTML email body |
| body_text | text | YES | null | Plain text version |
| variables | ARRAY | YES | null | Available template variables |
| category | text | YES | 'general'::text | Template category |
| is_active | boolean | YES | true | Active/inactive |
| created_at | timestamp with time zone | YES | now() | Created timestamp |
| updated_at | timestamp with time zone | YES | now() | Last updated |
| created_by | uuid | YES | null | Creator user ID |
| metadata | jsonb | YES | '{}'::jsonb | Additional metadata |

**Common template_ids**:
- `referral_invitation` - Sent to referee when invited
- `referral_admin_notification` - Sent to admins when referral created
- `welcome_email` - New user welcome
- `event_registration_confirmation` - Event signup confirmation
- `survey_published_notification` - New survey notification
- `test_template` - Test/debug template (should be disabled)

---

## notification_events

**Purpose**: Catalog of notification event types

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | text | NO | - | Event ID (unique slug) |
| name | text | NO | - | Display name |
| description | text | YES | null | Event description |
| category | text | NO | - | Event category |
| payload_schema | jsonb | YES | null | Expected payload structure |
| created_at | timestamp with time zone | YES | now() | Created timestamp |
| updated_at | timestamp with time zone | YES | now() | Last updated |

**Common event_ids**:
- `referral_created` - When a referral is created
- `user_registered` - New user signup
- `event_registration` - Event signup
- `survey_published` - Survey goes live
- `update_published` - Portal update published
- `contact_form_submitted` - Contact form submission

---

## notification_rules

**Purpose**: Maps events to email templates and recipients

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | - | Primary key |
| event_id | text | NO | - | Which event triggers this |
| name | text | NO | - | Rule display name |
| description | text | YES | null | Rule description |
| template_id | text | NO | - | Email template to use |
| priority | integer | YES | 5 | Rule priority (higher = processed first) |
| enabled | boolean | YES | true | Active/inactive |
| conditions | jsonb | YES | {} | Conditional logic |
| metadata | jsonb | YES | {} | Additional metadata |
| created_at | timestamp with time zone | YES | now() | Created timestamp |
| updated_at | timestamp with time zone | YES | now() | Last updated |
| recipient_list_id | uuid | YES | null | Who receives emails |

**How it works**:
1. Event occurs (e.g., `referral_created`)
2. Find all enabled rules where `event_id` matches
3. For each rule, queue email using `template_id`
4. Send to recipients in `recipient_list_id`

---

## recipient_lists

**Purpose**: Define who receives notifications

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | - | Primary key |
| name | text | NO | - | List name |
| description | text | YES | null | List description |
| type | text | YES | 'static' | static, dynamic, role-based |
| filter_criteria | jsonb | YES | {} | Dynamic list filters |
| created_at | timestamp with time zone | YES | now() | Created timestamp |
| updated_at | timestamp with time zone | YES | now() | Last updated |

**Common recipient_list_ids**:
- `9bf08241-9c3a-4589-b554-c6cb985338f6` - Event recipient (dynamic)
- `68d4e941-7e5c-4cf2-87bd-4e5231cee145` - Portal admins
- `89015705-6020-4c25-8af8-a782050fe1ae` - All portal members
- `040d4fe8-26a9-45a5-bca9-add644518909` - Referral referee (dynamic)

---

## Common Queries

### Check recent emails queued
```sql
SELECT
    id,
    to_email,
    event_type,
    template_id,
    status,
    created_at
FROM email_queue
ORDER BY created_at DESC
LIMIT 10;
```

### Find notification rule for an event
```sql
SELECT
    nr.id,
    nr.event_id,
    nr.name,
    nr.template_id,
    et.name as template_name,
    et.subject as template_subject,
    nr.enabled
FROM notification_rules nr
LEFT JOIN email_templates et ON et.id = nr.template_id
WHERE nr.event_id = 'referral_created'
  AND nr.enabled = true;
```

### Check what template will be used
```sql
SELECT
    e.id as event_id,
    e.name as event_name,
    nr.name as rule_name,
    nr.template_id,
    et.subject as email_subject,
    nr.priority,
    nr.enabled
FROM notification_events e
LEFT JOIN notification_rules nr ON nr.event_id = e.id
LEFT JOIN email_templates et ON et.id = nr.template_id
WHERE e.id = 'referral_created'
ORDER BY nr.priority DESC;
```

---

## Notes

- The `email_queue` table has NO `subject` column - subject comes from the template
- Template variables are substituted from `event_payload` when processing
- Multiple notification rules can trigger for the same event (e.g., user confirmation + admin notification)
- Priority determines processing order when multiple rules match
- Disabled rules (`enabled = false`) are skipped

---

**For portal-specific tables (events, surveys, updates, referrals), see:**
- [PORTAL_SCHEMA.md](../tests/integration/portal/PORTAL_SCHEMA.md) - Portal content tables
