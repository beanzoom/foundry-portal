# Foreign Key Dependency Map
## Portal Migration Project - Complete FK Analysis

**Date**: 2025-10-14
**Source**: Query 008 results (complete FK graph)
**Purpose**: Map all table dependencies to determine migration order
**Status**: ✅ Complete

---

## 📊 Summary Statistics

**Total Foreign Keys**: 98 FK relationships identified
- **Portal to Portal**: 39 FKs (portal tables referencing portal tables)
- **App to App**: 27 FKs (app tables referencing app tables)
- **Portal to profiles**: 23 FKs (portal tables depend on profiles)
- **App to profiles**: 13 FKs (app tables depend on profiles)
- **Mixed/Shared**: 6 FKs (ambiguous ownership)

**Critical Dependencies**:
- **profiles** table is referenced by 36 other tables (most critical!)
- **portal_referrals** is referenced by 6 tables
- **portal_events** is referenced by 5 tables
- **maintenance_records** is referenced by 5 tables
- **organizations** is referenced by 10 tables

---

## 🎯 PROFILES TABLE - Central Hub (36 FKs)

The `profiles` table is the single most critical dependency. **36 tables** reference it:

### Portal Tables Referencing profiles (23 FKs):
| From Table | From Column | Delete Rule | Migration Impact |
|------------|-------------|-------------|------------------|
| businesses | owner_id | CASCADE | Portal users' businesses deleted if user deleted |
| businesses | user_id | CASCADE | Duplicate FK? Needs investigation |
| contacts | portal_profile_id | SET NULL | Contact can exist without profile link |
| dev_auth | user_id | CASCADE | Development bypass |
| portal_admin_activity | admin_id | SET NULL | Keep admin activity even if admin deleted |
| portal_event_registrations | user_id | NO ACTION | Cannot delete user with registrations |
| portal_events | created_by | NO ACTION | Cannot delete user who created event |
| portal_referral_conversions | referee_profile_id | CASCADE | Delete conversion if referee deleted |
| portal_referral_rate_limits | user_id | CASCADE | Delete rate limits if user deleted |
| portal_referrals | referrer_id | CASCADE | **CRITICAL**: Delete referral if referrer deleted |
| referral_conversions | user_id | CASCADE | Marketing conversion tracking |

### App Tables Referencing profiles (13 FKs):
| From Table | From Column | Delete Rule | Migration Impact |
|------------|-------------|-------------|------------------|
| driver_mappings | profile_id | CASCADE | App driver integration |
| driver_schedules | profile_id | CASCADE | App scheduling |
| maintenance_notes | created_by | NO ACTION | Cannot delete user who created note |
| maintenance_notes | edited_by | NO ACTION | Cannot delete user who edited note |
| maintenance_records | assignee | NO ACTION | Cannot delete assigned technician |
| maintenance_records | created_by | NO ACTION | Cannot delete creator |
| maintenance_records | resolved_by | NO ACTION | Cannot delete resolver |
| maintenance_status_history | changed_by | NO ACTION | Preserve history |
| organization_memberships | invited_by | NO ACTION | Preserve invitation history |
| organization_memberships | user_id | CASCADE | Delete membership if user deleted |
| organizations | primary_contact | SET NULL / NO ACTION | **DUPLICATE FKs!** |
| user_roles | user_id | CASCADE | App permission system |

### Shared/Ambiguous Tables Referencing profiles (6 FKs):
| From Table | From Column | Delete Rule | Migration Impact |
|------------|-------------|-------------|------------------|
| system_user_assignments | user_id | CASCADE | System admin assignments |
| system_user_assignments | assigned_by | NO ACTION | Preserve assignment history |
| user_rankings | user_id | CASCADE | Unknown purpose table |
| user_rankings | rated_by | SET NULL | Unknown purpose table |

**Migration Strategy for profiles**:
1. **Split profiles first** - Before any other table
2. Create portal.profiles (9 portal users)
3. Create app.profiles (16 app users)
4. All other tables migrate after profiles split

---

## 🟣 PORTAL TABLE DEPENDENCIES

### portal_referrals → Referenced by 6 tables
| From Table | From Column | Delete Rule | Impact |
|------------|-------------|-------------|--------|
| contacts | referral_id | SET NULL | Contact can exist without referral |
| marketing_campaign_links | funnel_id | CASCADE | Delete campaign link if referral deleted |
| portal_referral_conversions | referral_id | CASCADE | Delete conversion record |
| portal_referral_rate_limits | referral_id | CASCADE | Delete rate limits |
| referral_conversions | referral_id | CASCADE | Delete marketing conversion |
| *Functions also reference this* | - | - | Check query 005 results |

**portal_referrals depends on**:
- profiles(referrer_id) CASCADE

**Migration Order**: profiles → portal_referrals → all dependent tables

---

### portal_events → Referenced by 5 tables
| From Table | From Column | Delete Rule | Impact |
|------------|-------------|-------------|--------|
| portal_event_dates | event_id | CASCADE | Dates deleted if event deleted |
| portal_event_registrations | event_id | CASCADE | Registrations deleted if event deleted |
| portal_event_reminders | event_id | CASCADE | Reminders deleted if event deleted |
| email_notifications (indirectly via trigger) | event_id | SET NULL | Email queue references events |

**portal_events depends on**:
- profiles(created_by) NO ACTION

**Migration Order**: profiles → portal_events → portal_event_dates → portal_event_registrations → guests/reminders

---

### portal_surveys → Referenced by 3 tables
| From Table | From Column | Delete Rule | Impact |
|------------|-------------|-------------|--------|
| portal_survey_questions | survey_id | CASCADE | Questions deleted if survey deleted |
| portal_survey_responses | survey_id | CASCADE | **DATA LOSS RISK!** Responses deleted |

**portal_survey_responses depends on**:
- profiles(user_id) (FK not shown in query but likely exists)

**portal_survey_questions → Referenced by**:
- portal_survey_answers(question_id) CASCADE

**Migration Order**: profiles → portal_surveys → portal_survey_questions → portal_survey_responses → portal_survey_answers

---

### portal_updates → Referenced by 2 tables
| From Table | From Column | Delete Rule | Impact |
|------------|-------------|-------------|--------|
| portal_update_reads | update_id | CASCADE | Read tracking deleted |
| portal_updates (self-reference) | is_correction_of | NO ACTION | Updates can correct other updates |

**portal_updates depends on**:
- profiles(created_by) (FK not shown but likely exists)

---

### Email System Dependencies (Complex!)

**email_notification_batches → Referenced by**:
- email_logs(batch_id) SET NULL
- email_queue(batch_id) NO ACTION

**email_notifications → Referenced by**:
- notification_logs(notification_id) CASCADE

**notification_events → Referenced by**:
- notification_rules(event_id) CASCADE
- email_notifications(event_id) SET NULL

**recipient_lists → Referenced by**:
- notification_rules(recipient_list_id) NO ACTION

**notification_rules → Referenced by**:
- email_notifications(rule_id) SET NULL

**Email System Migration Order**:
1. recipient_lists (no dependencies)
2. notification_events (no dependencies)
3. notification_rules (depends on: recipient_lists, notification_events)
4. email_notification_batches (no dependencies)
5. email_notifications (depends on: notification_rules, notification_events)
6. email_queue (depends on: email_notification_batches)
7. email_logs (depends on: email_notification_batches)
8. notification_logs (depends on: email_notifications)

---

## 🟦 APP TABLE DEPENDENCIES

### maintenance_records → Referenced by 5 tables
| From Table | From Column | Delete Rule | Impact |
|------------|-------------|-------------|--------|
| maintenance_assignment_history | maintenance_record_id | CASCADE | History deleted |
| maintenance_documents | maintenance_record_id | CASCADE | Documents deleted |
| maintenance_notes | maintenance_record_id | CASCADE | Notes deleted (2 FKs!) |
| maintenance_status_history | maintenance_record_id | NO ACTION | **BLOCKS DELETION** |
| odometer_history | maintenance_record_id | SET NULL | Odometer entry can exist without maintenance record |

**maintenance_records depends on**:
- fleet(vehicle_id) CASCADE (2 FKs - duplicate?)
- organizations(organization_id) CASCADE
- profiles(assignee) NO ACTION
- profiles(created_by) NO ACTION
- profiles(resolved_by) NO ACTION

**Migration Order**: profiles, organizations, fleet → maintenance_records → all dependent tables

---

### fleet → Referenced by 3 tables
| From Table | From Column | Delete Rule | Impact |
|------------|-------------|-------------|--------|
| maintenance_records | vehicle_id | CASCADE | All maintenance deleted if vehicle deleted |
| odometer_history | vehicle_id | CASCADE | Odometer history deleted |

**fleet depends on**:
- organizations(organization_id) NO ACTION

**Migration Order**: organizations → fleet → maintenance_records, odometer_history

---

### organizations → Referenced by 10 tables  (CRITICAL!)
| From Table | From Column | Delete Rule | Impact |
|------------|-------------|-------------|--------|
| driver_mappings | organization_id | CASCADE | Driver integrations deleted |
| driver_schedules | organization_id | CASCADE | Schedules deleted |
| fleet | organization_id | NO ACTION | **BLOCKS ORG DELETION** |
| maintenance_records | organization_id | CASCADE | Maintenance deleted |
| module_configurations | organization_id | CASCADE | Module configs deleted |
| organization_memberships | organization_id | CASCADE | Memberships deleted |
| permission_audit_log | organization_id | NO ACTION | Preserve audit |
| role_permissions | organization_id | NO ACTION | Preserve permissions |
| schedule_sync_logs | organization_id | CASCADE | Sync logs deleted |
| scheduling_providers | organization_id | CASCADE | Integration configs deleted |

**organizations depends on**:
- profiles(primary_contact) SET NULL / NO ACTION (2 FKs - duplicate!)

**Migration Order**: profiles → organizations → everything else in app

---

### scheduling_providers → Referenced by 5 tables
| From Table | From Column | Delete Rule | Impact |
|------------|-------------|-------------|--------|
| driver_mappings | provider_id | CASCADE | Driver mappings deleted |
| driver_schedules | provider_id | CASCADE | Schedules deleted |
| integration_webhooks | provider_id | SET NULL | Webhooks can exist without provider |
| schedule_sync_logs | provider_id | CASCADE | Logs deleted |
| scheduling_provider_credentials | provider_id | CASCADE | Credentials deleted |

**scheduling_providers depends on**:
- organizations(organization_id) CASCADE

---

### permissions (App Permission System)

**permissions → Referenced by**:
- role_permissions(permission_id) CASCADE

**role_permissions → Referenced by**: (none)

**role_permissions depends on**:
- organizations(organization_id) NO ACTION
- permissions(permission_id) CASCADE

**Migration Order**: permissions → role_permissions

---

## 🟡 CONTACT/CRM SYSTEM DEPENDENCIES

### contacts → Referenced by 2 tables
| From Table | From Column | Delete Rule | Impact |
|------------|-------------|-------------|--------|
| contact_dsp_locations | contact_id | CASCADE | Location links deleted |
| contacts (self-reference) | referred_by_contact_id | SET NULL | Contact can refer other contacts |
| interactions | contact_id | CASCADE | Interaction history deleted |

**contacts depends on**:
- dsps(dsp_id) SET NULL
- markets(market_id) SET NULL
- stations(station_id) SET NULL
- profiles(portal_profile_id) SET NULL
- portal_referrals(referral_id) SET NULL
- contacts(referred_by_contact_id) SET NULL (self-reference)

**Migration Order**: regions → markets → stations → dsps, dsp_locations → contacts → contact_dsp_locations, interactions

---

### Geographic Hierarchy
| Table | References | Referenced By | Delete Rule |
|-------|------------|---------------|-------------|
| regions | none | markets | - |
| markets | regions(region_id) | stations, contacts | NO ACTION / CASCADE |
| stations | markets(market_id) | dsps, dsp_locations, contacts | CASCADE / SET NULL |
| dsps | stations(primary_station_id, station_id) | dsp_locations, contacts | CASCADE / NO ACTION |
| dsp_locations | dsps(dsp_id), stations(station_id) | contact_dsp_locations | CASCADE |

**Migration Order**: regions → markets → stations → dsps → dsp_locations → contacts

---

## 🔴 DUPLICATE FOREIGN KEYS (Potential Issues)

### 1. businesses → profiles (2 FKs)
```sql
businesses.owner_id → profiles.id (CASCADE)
businesses.user_id → profiles.id (CASCADE)
```
**Question**: Why two FKs? Is owner_id different from user_id?
**Investigation Needed**: Check businesses table structure

### 2. organizations → profiles (2 FKs)
```sql
organizations.primary_contact → profiles.id (SET NULL)
organizations.primary_contact → profiles.id (NO ACTION)  -- DUPLICATE!
```
**Issue**: Same column, same reference, DIFFERENT delete rules!
**Action Required**: Fix this conflict before migration

### 3. maintenance_records → fleet (2 FKs)
```sql
maintenance_records.vehicle_id → fleet.id (CASCADE)
maintenance_records.vehicle_id → fleet.id (CASCADE)  -- DUPLICATE!
```
**Issue**: Duplicate FK constraint
**Action Required**: Remove duplicate

### 4. maintenance_notes → maintenance_records (3 FKs!)
```sql
fk_maintenance_record_id (CASCADE)
maintenance_notes_maintenance_record_id_fkey (CASCADE)
```
**Issue**: Multiple constraints on same relationship
**Action Required**: Consolidate to single FK

### 5. dsps → stations (2 FKs)
```sql
dsps.primary_station_id → stations.id (NO ACTION)
dsps.station_id → stations.id (CASCADE)
```
**Note**: This is likely intentional (primary vs current station)

---

## 📋 MIGRATION ORDER - Complete Sequence

### Phase 1: Foundation (No Dependencies)
1. **regions** (4 rows) - Reference data, no dependencies
2. **permissions** (55 rows) - App permissions, no dependencies
3. **modules** (8 rows) - App modules, no dependencies
4. **email_templates** (16 rows) - Email templates, no dependencies (if kept shared)
5. **notification_events** (15 rows) - Event types, no dependencies
6. **portal_event_templates** (4 rows) - Event templates, no dependencies
7. **system_settings** (5 rows) - App settings, no dependencies

### Phase 2: Geography/Reference Data
8. **markets** (41 rows) - depends on: regions
9. **stations** (113 rows) - depends on: markets
10. **dsps** (24 rows) - depends on: stations
11. **dsp_locations** (24 rows) - depends on: dsps, stations

### Phase 3: User Profiles ⚠️ CRITICAL SPLIT
12. **profiles** (25 rows split into 9 portal + 16 app)
    - **Portal DB**: WHERE role IN ('portal_member', 'admin', 'super_admin', 'system_admin')
    - **App DB**: WHERE role = 'user'
    - **BLOCKER**: Must complete this before ANY table that references profiles!

### Phase 4A: Portal Tables (After profiles)
13. **businesses** (9 rows) - Portal business info
14. **portal_referrals** (9 rows) - depends on: profiles(referrer_id)
15. **recipient_lists** (6 rows) - depends on: profiles (for dynamic lists)
16. **notification_rules** (15 rows) - depends on: notification_events, recipient_lists
17. **portal_events** (1 row) - depends on: profiles(created_by)
18. **portal_surveys** (1 row) - depends on: profiles(created_by)
19. **portal_updates** (2 rows) - depends on: profiles(created_by), portal_updates(is_correction_of)
20. **membership_agreements** (7 rows) - depends on: profiles(user_id)
21. **nda_agreements** (7 rows) - depends on: profiles(user_id)

### Phase 4B: App Tables (After profiles)
22. **organizations** (3 rows) - depends on: profiles(primary_contact)
23. **organization_memberships** (14 rows) - depends on: profiles(user_id, invited_by), organizations
24. **role_permissions** (169 rows) - depends on: permissions, organizations
25. **user_roles** (17 rows) - depends on: profiles(user_id)
26. **system_user_assignments** (3 rows) - depends on: profiles(user_id, assigned_by)
27. **scheduling_providers** (0 rows) - depends on: organizations
28. **fleet** (63 rows) - depends on: organizations

### Phase 5: Portal Sub-Tables
29. **portal_event_dates** (1 row) - depends on: portal_events
30. **portal_event_registrations** (1 row) - depends on: portal_events, portal_event_dates, profiles
31. **portal_event_guests** (0 rows) - depends on: portal_event_registrations
32. **portal_event_reminders** (0 rows) - depends on: portal_events, portal_event_registrations
33. **portal_survey_questions** (5 rows) - depends on: portal_surveys
34. **portal_survey_responses** (1 row) - depends on: portal_surveys, profiles
35. **portal_survey_answers** (0 rows) - depends on: portal_survey_responses, portal_survey_questions
36. **portal_update_reads** (6 rows) - depends on: portal_updates, profiles
37. **portal_referral_conversions** (0 rows) - depends on: portal_referrals, profiles
38. **portal_referral_rate_limits** (28 rows) - depends on: portal_referrals, profiles
39. **marketing_campaign_links** (1 row) - depends on: portal_referrals
40. **referral_conversions** (0 rows) - depends on: portal_referrals, profiles
41. **calculator_submissions** (1 row) - depends on: profiles, calculator_submissions(previous_submission_id)
42. **portal_admin_activity** (28 rows) - depends on: profiles(admin_id)
43. **portal_audit_log** (12 rows) - depends on: profiles(admin_id)

### Phase 6: App Sub-Tables
44. **maintenance_records** (53 rows) - depends on: fleet, organizations, profiles (assignee, created_by, resolved_by)
45. **maintenance_assignment_history** (47 rows) - depends on: maintenance_records
46. **maintenance_status_history** (72 rows) - depends on: maintenance_records, profiles
47. **maintenance_documents** (1 row) - depends on: maintenance_records
48. **maintenance_notes** (17 rows) - depends on: maintenance_records, profiles
49. **odometer_history** (18 rows) - depends on: fleet, maintenance_records
50. **driver_mappings** (0 rows) - depends on: scheduling_providers, organizations, profiles
51. **driver_schedules** (0 rows) - depends on: scheduling_providers, organizations, profiles
52. **scheduling_provider_credentials** (0 rows) - depends on: scheduling_providers
53. **schedule_sync_logs** (0 rows) - depends on: scheduling_providers, organizations
54. **integration_webhooks** (0 rows) - depends on: scheduling_providers
55. **module_configurations** (0 rows) - depends on: modules, organizations
56. **permission_audit_log** (1 row) - depends on: organizations

### Phase 7: Contact/CRM System (After decision on ownership)
57. **contacts** (61 rows) - depends on: dsps, markets, stations, profiles, portal_referrals, contacts
58. **contact_dsp_locations** (25 rows) - depends on: contacts, dsp_locations
59. **interactions** (8 rows) - depends on: contacts, profiles
60. **contact_submissions** (0 rows) - depends on: profiles

### Phase 8: Email System (After consolidation)
61. **email_notification_batches** (consolidated)
62. **email_notifications** (consolidated)
63. **email_queue** (41 rows) - depends on: email_notification_batches, profiles
64. **email_logs** (consolidated) - depends on: email_notification_batches, profiles
65. **notification_logs** (0 rows) - depends on: email_notifications

### Phase 9: Misc/Archives
66. **portal_referrals_archive** (0 rows)
67. **referral_deletion_logs** (0 rows)
68. **portal_user_deletion_logs** (4 rows)
69. **portal_memberships** (0 rows) - depends on: profiles
70. **user_rankings** (21 rows) - depends on: profiles (user_id, rated_by)
71. **user_deletion_audit** (22 rows) - depends on: auth.users
72. **wiki_articles** (30 rows) - depends on: profiles(created_by)
73. **dev_auth** (0 rows) - depends on: profiles

---

## ⚠️ CRITICAL ISSUES TO RESOLVE

### 1. Duplicate FK Constraints
**Action Required**: Remove duplicate constraints before migration:
- organizations.primary_contact (conflicting delete rules)
- maintenance_records.vehicle_id (duplicate)
- maintenance_notes.maintenance_record_id (triplicate!)

### 2. Profiles Split Impact
**36 tables** reference profiles. After split:
- Portal DB will have profiles with IDs for 9 users
- App DB will have profiles with IDs for 16 users
- **No ID conflicts** (different users)
- All FK relationships will work correctly in separate databases

### 3. Email System Dependencies
Email system references **profiles** heavily:
- email_queue.to_user_id → profiles.id
- email_logs.user_id → profiles.id
- email_notifications metadata contains user IDs

**Decision**: Email system must be portal-owned (primary sender)

### 4. Contact System Dependencies
Contacts reference both:
- profiles(portal_profile_id) - Portal users
- portal_referrals(referral_id) - Portal referrals

**Decision**: Contacts are portal-owned (CRM for DSP outreach)

### 5. NO ACTION Delete Rules
Several FKs have `NO ACTION` delete rules, meaning:
- Cannot delete parent if children exist
- Must delete children first
- Examples: maintenance_records blocks deletion of assigned profiles

**Migration Impact**: Must handle deletions carefully during testing

---

## 🎯 Next Steps

1. **Fix Duplicate FKs** - Create migration to remove duplicates:
   - organizations.primary_contact (keep SET NULL version)
   - maintenance_records.vehicle_id (remove one)
   - maintenance_notes FKs (consolidate to one)

2. **Verify No Missing FKs** - Check if any implicit relationships aren't represented by FKs

3. **Create Migration Scripts** - Use this dependency map to generate correct migration order

4. **Test FK Constraints** - Ensure all CASCADE rules work as expected

5. **Document Circular Dependencies** - Check if any exist (none found so far)

---

**Status**: ✅ **COMPLETE** - Full dependency map documented

**Next Document**: `MIGRATION_SCRIPTS.md` (after FK fixes)

---

## Appendix: FK Query Used

Query 008: [portal_separation_008_foreign_key_map.sql](../queries/portal_separation_008_foreign_key_map.sql)

Result: 98 foreign key relationships across public schema tables
