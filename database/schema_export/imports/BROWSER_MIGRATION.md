# Browser-Based Data Migration

Since `psql` authentication is failing and you don't need Supabase CLI, use this **100% browser-based** approach.

## Process

For each table:
1. Run export query in **OLD database** SQL Editor
2. Copy the JSON result
3. Run import query in **NEW database** SQL Editor with pasted JSON

## Table 1: profiles

### OLD database - Export:
```sql
SELECT json_agg(t) FROM (
  SELECT * FROM profiles WHERE deleted_at IS NULL ORDER BY created_at
) t;
```

### NEW database - Import:
```sql
INSERT INTO profiles
SELECT * FROM json_populate_recordset(NULL::profiles,
'PASTE_JSON_HERE'
);
```

## Table 2: notification_events

### OLD database:
```sql
SELECT json_agg(t) FROM (SELECT * FROM notification_events ORDER BY created_at) t;
```

### NEW database:
```sql
INSERT INTO notification_events
SELECT * FROM json_populate_recordset(NULL::notification_events,
'PASTE_JSON_HERE'
);
```

## Repeat for all 50 tables

This is tedious but guaranteed to work. Each table takes ~30 seconds.

## Full Table List (in order):

1. profiles
2. notification_events
3. recipient_lists
4. email_templates
5. regions
6. markets
7. stations
8. dsps
9. portal_memberships
10. membership_agreements
11. nda_agreements
12. notification_rules
13. contacts
14. contact_interactions
15. portal_funnels
16. portal_funnel_stages
17. portal_leads
18. portal_referrals (see special note below)
19. calculator_submissions (see special note below)
20. portal_calculator_submissions
21. email_notification_batches
22. portal_events
23. portal_event_dates
24. portal_event_registrations
25. portal_event_guests
26. portal_event_reminders
27. portal_event_templates
28. portal_surveys
29. portal_survey_sections
30. portal_survey_questions
31. portal_survey_responses
32. portal_survey_answers
33. portal_updates
34. portal_update_reads
35. portal_referral_conversions
36. portal_referral_rate_limits
37. marketing_campaign_links
38. referral_conversions
39. email_notifications
40. notification_logs
41. email_logs
42. email_queue
43. portal_user_deletion_logs
44. referral_deletion_logs
45. portal_audit_log
46. email_logs_backup_042
47. email_notification_batches_backup_042
48. email_notification_batches_archive
49. portal_referrals_archive

## Special Cases

### portal_referrals (self-referencing)

Export twice:

**First - rows without parent:**
```sql
SELECT json_agg(t) FROM (
  SELECT * FROM portal_referrals WHERE parent_referral_id IS NULL ORDER BY created_at
) t;
```

**Then - rows with parent:**
```sql
SELECT json_agg(t) FROM (
  SELECT * FROM portal_referrals WHERE parent_referral_id IS NOT NULL ORDER BY created_at
) t;
```

### calculator_submissions (self-referencing)

Same two-pass approach using `updated_submission_id`

## Automation Option

If this is too tedious, I can create a Python script that uses the Supabase REST API instead of direct database connection. Would require the service role keys from both projects.

Let me know if you want that approach instead!
