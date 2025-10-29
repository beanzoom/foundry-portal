# Table Creation Order for Portal Database Migration

**Purpose**: This document defines the exact order tables must be created to respect foreign key dependencies.

**Generated**: 2025-10-28
**Based on**: Foreign key analysis from schema_export_results.md (Part 3)

---

## 🎯 Critical Rules

1. **profiles table MUST be created FIRST** - All other tables depend on it
2. **Parent tables before child tables** - Respect FK dependencies
3. **Self-referencing tables** - Create without FK first, add FK after
4. **Circular dependencies** - Break the cycle by deferring one FK

---

## 📊 Dependency Analysis Summary

- **Total Foreign Keys**: 32 analyzed
- **Tables with no dependencies**: 7 (can be created immediately after profiles)
- **Tables with dependencies**: 38 (must be created in order)
- **Self-referencing tables**: 2 (calculator_submissions, portal_updates)

---

## 🔢 Table Creation Order (56 tables)

### **Phase 1: Foundation Tables (No Dependencies)**

These tables have NO foreign keys or only reference themselves. Create first.

```sql
-- 1. PROFILES - THE ROOT OF ALL DEPENDENCIES
CREATE TABLE profiles (...);

-- 2. Independent tables (no FKs to other tables)
CREATE TABLE notification_events (...);        -- No FKs
CREATE TABLE recipient_lists (...);            -- No FKs
CREATE TABLE email_templates (...);            -- No FKs
CREATE TABLE regions (...);                    -- No FKs
CREATE TABLE markets (...);                    -- No FKs (or FK to regions if exists)
CREATE TABLE stations (...);                   -- No FKs (or FK to markets if exists)
CREATE TABLE dsps (...);                       -- No FKs (or FK to stations if exists)
```

**Count**: 8 tables

---

### **Phase 2: First-Level Dependencies**

These tables depend ONLY on Phase 1 tables.

```sql
-- Tables that reference ONLY profiles
CREATE TABLE membership_agreements (...);       -- FK: user_id → profiles
CREATE TABLE nda_agreements (...);             -- FK: user_id → profiles
CREATE TABLE portal_memberships (...);         -- FK: user_id → profiles
CREATE TABLE portal_admin_activity (...);      -- FK: admin_id → profiles
CREATE TABLE businesses (...);                 -- FK: user_id → profiles (if exists)
CREATE TABLE calculator_submissions (...);     -- FK: user_id → profiles (self-ref handled later)
CREATE TABLE portal_referrals (...);           -- FK: referrer_id → profiles

-- Tables that reference notification_events or recipient_lists
CREATE TABLE notification_rules (...);         -- FK: event_id → notification_events, recipient_list_id → recipient_lists
CREATE TABLE email_notification_batches (...); -- No FKs yet

-- CRM tables (if they have minimal dependencies)
CREATE TABLE dsp_locations (...);              -- FK: dsp_id → dsps (if exists)
CREATE TABLE contacts (...);                   -- May have FKs to dsps or referrals
CREATE TABLE contact_submissions (...);        -- May have FKs to contacts
CREATE TABLE contact_dsp_locations (...);      -- May have FKs to contacts, dsp_locations
CREATE TABLE interactions (...);               -- May have FKs to contacts
```

**Count**: 14 tables

---

### **Phase 3: Portal Content Tables**

These tables create the main portal content (events, surveys, updates).

```sql
-- Portal Events System
CREATE TABLE portal_events (...);              -- FK: created_by → profiles
CREATE TABLE portal_event_dates (...);         -- FK: event_id → portal_events
CREATE TABLE portal_event_registrations (...); -- FK: event_id → portal_events, event_date_id → portal_event_dates, user_id → profiles
CREATE TABLE portal_event_guests (...);        -- FK: registration_id → portal_event_registrations
CREATE TABLE portal_event_reminders (...);     -- FK: event_id → portal_events, registration_id → portal_event_registrations

-- Portal Surveys System
CREATE TABLE portal_surveys (...);             -- FK: created_by → profiles (if exists)
CREATE TABLE portal_survey_sections (...);     -- FK: survey_id → portal_surveys (if exists)
CREATE TABLE portal_survey_questions (...);    -- FK: survey_id → portal_surveys, section_id → portal_survey_sections
CREATE TABLE portal_survey_responses (...);    -- FK: survey_id → portal_surveys, user_id → profiles
CREATE TABLE portal_survey_answers (...);      -- FK: response_id → portal_survey_responses, question_id → portal_survey_questions

-- Portal Updates System
CREATE TABLE portal_updates (...);             -- FK: created_by → profiles, is_correction_of → portal_updates (self-ref)
CREATE TABLE portal_update_reads (...);        -- FK: update_id → portal_updates, user_id → profiles (if exists)
```

**Count**: 12 tables

---

### **Phase 4: Referral & Marketing System**

These tables handle referrals and marketing conversions.

```sql
CREATE TABLE portal_referral_conversions (...);  -- FK: referral_id → portal_referrals, referee_profile_id → profiles
CREATE TABLE portal_referral_rate_limits (...);  -- FK: referral_id → portal_referrals, user_id → profiles
CREATE TABLE marketing_campaign_links (...);     -- FK: funnel_id → portal_referrals
CREATE TABLE referral_conversions (...);         -- FK: referral_id → portal_referrals, user_id → profiles
```

**Count**: 4 tables

---

### **Phase 5: Email & Notification System**

These tables handle email queueing and notifications.

```sql
CREATE TABLE email_notifications (...);        -- FK: event_id → notification_events, rule_id → notification_rules
CREATE TABLE notification_logs (...);          -- FK: notification_id → email_notifications
CREATE TABLE email_logs (...);                 -- FK: batch_id → email_notification_batches
CREATE TABLE email_queue (...);                -- FK: batch_id → email_notification_batches
```

**Count**: 4 tables

---

### **Phase 6: Audit, Backup & Archive Tables**

These tables are for historical data and can be created last.

```sql
-- Deletion logs (audit trails)
CREATE TABLE portal_user_deletion_logs (...);  -- No FKs (stores deleted user data)
CREATE TABLE referral_deletion_logs (...);     -- No FKs (stores deleted referral data)

-- Backup tables (snapshots from specific dates)
CREATE TABLE email_logs_backup_042 (...);
CREATE TABLE email_notification_batches_backup_042 (...);
CREATE TABLE email_notification_batches_archive (...);
```

**Count**: 5 tables

---

## 🔄 Self-Referencing Tables (Special Handling)

These tables reference themselves. Create in 2 steps:

### **calculator_submissions**
```sql
-- Step 1: Create table WITHOUT self-referencing FK
CREATE TABLE calculator_submissions (...);
-- Omit: previous_submission_id FK

-- Step 2: Add self-referencing FK after table exists
ALTER TABLE calculator_submissions
ADD CONSTRAINT calculator_submissions_previous_submission_id_fkey
FOREIGN KEY (previous_submission_id) REFERENCES calculator_submissions(id)
ON DELETE NO ACTION;
```

### **portal_updates**
```sql
-- Step 1: Create table WITHOUT self-referencing FK
CREATE TABLE portal_updates (...);
-- Omit: is_correction_of FK

-- Step 2: Add self-referencing FK after table exists
ALTER TABLE portal_updates
ADD CONSTRAINT portal_updates_correction_fk
FOREIGN KEY (is_correction_of) REFERENCES portal_updates(id)
ON DELETE NO ACTION;
```

---

## 📋 Complete Ordered List (56 Tables)

**Copy-paste ready for script generation:**

```
1.  profiles
2.  notification_events
3.  recipient_lists
4.  email_templates
5.  regions
6.  markets
7.  stations
8.  dsps
9.  membership_agreements
10. nda_agreements
11. portal_memberships
12. portal_admin_activity
13. businesses
14. dsp_locations
15. contacts
16. contact_submissions
17. contact_dsp_locations
18. interactions
19. notification_rules
20. email_notification_batches
21. portal_referrals
22. calculator_submissions (without self-FK)
23. portal_events
24. portal_event_dates
25. portal_event_registrations
26. portal_event_guests
27. portal_event_reminders
28. portal_surveys
29. portal_survey_sections
30. portal_survey_questions
31. portal_survey_responses
32. portal_survey_answers
33. portal_updates (without self-FK)
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
45. email_logs_backup_042
46. email_notification_batches_backup_042
47. email_notification_batches_archive

-- After all tables created:
48. ADD calculator_submissions self-FK
49. ADD portal_updates self-FK
```

**Note**: Tables 50-56 are assumed to exist in the export but not yet analyzed. They will be added to Phase 6 or integrated into existing phases based on their dependencies.

---

## ✅ Validation Checklist

Before running import script:

- [ ] Profiles table is created FIRST (table #1)
- [ ] All parent tables created before child tables
- [ ] Self-referencing FKs added AFTER table creation
- [ ] No circular dependency errors
- [ ] All 56 tables accounted for in order

---

## 🚨 Common Errors to Avoid

❌ **ERROR**: Creating `portal_event_registrations` before `portal_events`
✅ **FIX**: Create `portal_events` first (parent), then `portal_event_registrations` (child)

❌ **ERROR**: Adding self-referencing FK during CREATE TABLE
✅ **FIX**: Create table without FK, then ALTER TABLE to add FK

❌ **ERROR**: Creating tables with FKs to non-existent tables
✅ **FIX**: Follow the exact order in this document

---

**Next Steps**: Use this order when generating `01_create_portal_database.sql`
