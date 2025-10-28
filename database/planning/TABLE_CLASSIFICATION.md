# Complete Table Classification for Portal/App Separation
## Portal Migration Project

**Date**: 2025-10-14
**Purpose**: Definitive classification of all 137 database tables for migration execution
**Status**: 🔄 In Progress - Classification Phase

---

## 📊 Summary Statistics

**Total Tables**: 137 across all schemas
- **Portal Tables**: 47 (35 in public, 4 in portal schema, 8 shared email)
- **App Tables**: 27 (fleet management, scheduling, permissions)
- **Infrastructure Tables**: 48 (auth, storage, realtime, cron)
- **Undecided/Shared**: 15 (contacts, organizations, system tables)

---

## 🟣 PORTAL TABLES (47 tables)

### Portal Schema (4 tables) - Already Separated
| Table | Schema | Rows | Action | Notes |
|-------|--------|------|--------|-------|
| email_logs | portal | 28 | **KEEP** | Portal-specific email tracking |
| email_notification_batches | portal | 7 | **KEEP** | Portal notification batching |
| email_notifications | portal | 0 | **KEEP** | Portal notification queue |
| email_preferences | portal | 0 | **KEEP** | Portal user email preferences |

**Migration Action**: These tables are already in the `portal` schema. Verify they're being used correctly and consolidate with public email tables if needed.

---

### Portal-Specific Tables in Public Schema (35 tables)

#### Core Portal Features (5 tables)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| calculator_submissions | 1 | profiles(user_id) | **MOVE to portal DB** | High |
| marketing_campaign_links | 1 | portal_referrals | **MOVE to portal DB** | High |
| membership_agreements | 7 | profiles(user_id) | **MOVE to portal DB** | Critical |
| nda_agreements | 7 | profiles(user_id) | **MOVE to portal DB** | Critical |
| portal_memberships | 0 | profiles(user_id) | **MOVE to portal DB** | Medium |

**Notes**:
- membership_agreements and nda_agreements have legal significance - must not lose data
- All reference portal user profiles only

#### Events System (7 tables)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| portal_events | 1 | profiles(created_by) | **MOVE to portal DB** | High |
| portal_event_dates | 1 | portal_events | **MOVE to portal DB** | High |
| portal_event_registrations | 1 | profiles(user_id), portal_events | **MOVE to portal DB** | High |
| portal_event_guests | 0 | portal_event_registrations | **MOVE to portal DB** | Medium |
| portal_event_reminders | 0 | portal_events | **MOVE to portal DB** | Medium |
| portal_event_templates | 4 | none | **MOVE to portal DB** | Medium |

**Migration Order**: templates → events → dates → registrations → guests/reminders

#### Referrals & Marketing (6 tables)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| portal_referrals | 9 | profiles(referrer_id) | **MOVE to portal DB** | Critical |
| portal_referral_conversions | 0 | portal_referrals | **MOVE to portal DB** | High |
| portal_referral_rate_limits | 28 | profiles | **MOVE to portal DB** | High |
| portal_referrals_archive | 0 | none | **MOVE to portal DB** | Low |
| referral_conversions | 0 | marketing_campaign_links | **MOVE to portal DB** | Medium |
| referral_deletion_logs | 0 | none | **MOVE to portal DB** | Low |

**Notes**: Core business logic for portal growth - must preserve all data

#### Surveys (4 tables)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| portal_surveys | 1 | profiles(created_by) | **MOVE to portal DB** | High |
| portal_survey_questions | 5 | portal_surveys | **MOVE to portal DB** | High |
| portal_survey_responses | 1 | profiles(user_id), portal_surveys | **MOVE to portal DB** | High |
| portal_survey_answers | 0 | portal_survey_responses, portal_survey_questions | **MOVE to portal DB** | Medium |

**Migration Order**: surveys → questions → responses → answers

#### Updates/Content (2 tables)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| portal_updates | 2 | profiles(created_by) | **MOVE to portal DB** | High |
| portal_update_reads | 6 | profiles(user_id), portal_updates | **MOVE to portal DB** | High |

#### Admin/Audit (3 tables)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| portal_admin_activity | 28 | profiles(admin_id) | **MOVE to portal DB** | Critical |
| portal_audit_log | 12 | profiles(admin_id) | **MOVE to portal DB** | Critical |
| portal_user_deletion_logs | 4 | none | **MOVE to portal DB** | High |

**Notes**: Critical audit trail - regulatory compliance requirement

#### Email System in Public Schema (8 tables) ⚠️ DUPLICATION ISSUE
| Table | Rows | Schema | Dependencies | Action | Priority |
|-------|------|--------|--------------|--------|----------|
| email_queue | 41 | public | profiles | **CONSOLIDATE** | Critical |
| email_templates | 16 | public | none | **DECIDE: Portal or Shared?** | Critical |
| email_logs | 42 | public | profiles | **CONSOLIDATE with portal.email_logs** | High |
| email_notifications | 15 | public | profiles, email_templates | **CONSOLIDATE with portal.email_notifications** | High |
| email_notification_batches | 3 | public | none | **CONSOLIDATE with portal.email_notification_batches** | High |
| email_notification_batches_archive | 28 | public | none | **Archive/Delete after consolidation** | Low |
| email_notification_batches_backup_042 | 3 | public | none | **Archive/Delete after consolidation** | Low |
| email_logs_backup_042 | 0 | public | none | **Delete (empty backup)** | Low |

**CRITICAL DECISION NEEDED**:
- Why are email tables duplicated in both `public` and `portal` schemas?
- Which is the authoritative source?
- Are these used by different systems?
- Recommendation: Consolidate into `portal` schema, as portal is primary email user

#### Email Notification System (5 tables)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| notification_rules | 15 | recipient_lists | **MOVE to portal DB** | High |
| notification_rules_backup_042 | 15 | none | **Delete after migration** | Low |
| notification_events | 15 | notification_rules | **MOVE to portal DB** | High |
| notification_logs | 0 | notification_rules | **MOVE to portal DB** | Medium |
| recipient_lists | 6 | profiles | **MOVE to portal DB** | High |

**Notes**: Portal notification infrastructure

---

## 🟦 APP TABLES (27 tables)

### Fleet Management (7 tables)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| fleet | 63 | profiles(owner?), organizations | **KEEP in app DB** | Critical |
| maintenance_records | 53 | fleet | **KEEP in app DB** | Critical |
| maintenance_assignment_history | 47 | maintenance_records, profiles | **KEEP in app DB** | High |
| maintenance_documents | 1 | maintenance_records | **KEEP in app DB** | Medium |
| maintenance_notes | 17 | maintenance_records, profiles | **KEEP in app DB** | Medium |
| maintenance_status_history | 72 | maintenance_records | **KEEP in app DB** | High |
| odometer_history | 18 | fleet | **KEEP in app DB** | Medium |

**Notes**: Core app functionality - fleet tracking and maintenance

### Driver/Scheduling Integration (5 tables)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| driver_mappings | 0 | profiles(user_id) | **KEEP in app DB** | High |
| driver_schedules | 0 | driver_mappings | **KEEP in app DB** | High |
| scheduling_providers | 0 | none | **KEEP in app DB** | Medium |
| scheduling_provider_credentials | 0 | scheduling_providers | **KEEP in app DB** | High |
| schedule_sync_logs | 0 | scheduling_providers | **KEEP in app DB** | Low |
| integration_webhooks | 0 | none | **KEEP in app DB** | Medium |

**Notes**: WhenIWork and similar scheduling integrations - app-specific

### Permissions System (4 tables)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| permissions | 55 | none | **KEEP in app DB** | Critical |
| role_permissions | 169 | permissions, user_roles | **KEEP in app DB** | Critical |
| user_roles | 17 | profiles(user_id) | **KEEP in app DB** | Critical |
| permission_audit_log | 1 | profiles, permissions | **KEEP in app DB** | High |

**Notes**: Separate from portal role system (portal_member, admin, etc.)

### App Features/Modules (2 tables)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| modules | 8 | none | **KEEP in app DB** | High |
| module_configurations | 0 | modules | **KEEP in app DB** | Medium |

### App System Tables (3 tables)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| system_settings | 5 | none | **KEEP in app DB** | Medium |
| system_user_assignments | 3 | profiles | **KEEP in app DB** | Medium |
| wiki_articles | 30 | none | **KEEP in app DB** | Low |

### App Organizations (2 tables) ⚠️ DECISION NEEDED
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| organizations | 3 | none | **DECIDE: App or separate from businesses?** | Critical |
| organization_memberships | 14 | profiles(user_id), organizations | **DECIDE with organizations** | Critical |

**CRITICAL DECISION NEEDED**:
- Are `organizations` (app) and `businesses` (portal) the same thing?
- Do they serve different purposes?
- Should they be unified or kept separate?

### Development (1 table)
| Table | Rows | Dependencies | Action | Priority |
|-------|------|--------------|--------|----------|
| dev_auth | 0 | none | **KEEP in app DB or DELETE** | Low |

**Notes**: Development authentication bypass - may not be needed in production

---

## 🟡 UNDECIDED/SHARED TABLES (15 tables)

### Contact/CRM System (9 tables) ⚠️ OWNERSHIP DECISION NEEDED
| Table | Rows | Dependencies | Purpose | Recommendation |
|-------|------|--------------|---------|----------------|
| contacts | 61 | dsps, stations, markets | DSP contact tracking | **PORTAL** (DSP outreach) |
| contact_submissions | 0 | profiles | Portal contact form | **PORTAL** |
| contact_dsp_locations | 25 | contacts, dsp_locations | Links contacts to DSPs | **PORTAL** |
| interactions | 8 | contacts, profiles | Contact interaction history | **PORTAL** |
| dsps | 24 | stations | Delivery Service Partners | **PORTAL** |
| dsp_locations | 24 | dsps | DSP office locations | **PORTAL** |
| stations | 113 | markets | Station locations | **PORTAL or SHARED** |
| markets | 41 | regions | Regional markets | **PORTAL or SHARED** |
| regions | 4 | none | US Census regions | **REFERENCE DATA** |

**Analysis**: This appears to be a **CRM system for portal admins** to track DSPs as potential investors/customers. The portal admin uses this to manage outreach to DSPs.

**Recommendation**:
- **MOVE to portal DB** - Primary use is portal admin CRM
- **Consider**: App might want read-only access to station/market data for context
- **Option**: Keep stations/markets/regions as shared reference data

### Business Data (1 table) ⚠️ RELATED TO ORGANIZATIONS DECISION
| Table | Rows | Dependencies | Purpose | Recommendation |
|-------|------|--------------|---------|----------------|
| businesses | 9 | profiles(owner_id, user_id) | User business info | **PORTAL** (DSP businesses) |

**Notes**: Stores DSP business information for portal users. All 9 rows likely correspond to portal users.

**DECISION NEEDED**: Relationship with `organizations` table (3 rows in app)

### Profiles Table (1 table) ⚠️ MOST CRITICAL
| Table | Rows | Dependencies | Purpose | Recommendation |
|-------|------|--------------|---------|----------------|
| profiles | 25 | auth.users | User profiles (both portal and app) | **SPLIT BY ROLE** |

**Structure** (50+ columns):
- Personal: first_name, last_name, email, phone, avatar, bio, title
- Portal-specific: year_dsp_began, avg_fleet_vehicles, avg_drivers, company_name, address fields, website
- App-specific: organization_id
- Critical: **role** field (portal_member, admin, super_admin, system_admin, user)

**Migration Strategy**:
```sql
-- Portal DB
INSERT INTO portal.profiles
SELECT * FROM current.profiles
WHERE role IN ('portal_member', 'admin', 'super_admin', 'system_admin');
-- Result: 9 rows

-- App DB
INSERT INTO app.profiles
SELECT * FROM current.profiles
WHERE role = 'user';
-- Result: 16 rows
```

**Foreign Key Impact**:
- **Portal**: 21 tables reference profiles (portal_*, calculator_*, etc.)
- **App**: 7 tables reference profiles (maintenance_*, driver_*, etc.)

### Shared System Tables (4 tables)
| Table | Rows | Dependencies | Purpose | Recommendation |
|-------|------|--------------|---------|----------------|
| impersonation_sessions | 26 | profiles(admin_id, user_id) | Admin user impersonation | **BOTH** (separate implementations) |
| login_history | 18 | profiles | Login tracking | **BOTH** (separate tables) |
| user_deletion_audit | 22 | auth.users | User deletion audit | **SHARED** (keep in both?) |
| user_rankings | 21 | profiles | Unknown purpose | **INVESTIGATE** |

**Recommendations**:
- **impersonation_sessions**: Both systems need admin impersonation - duplicate table structure
- **login_history**: Separate login history for each system
- **user_deletion_audit**: Potentially keep in both for compliance
- **user_rankings**: Need to investigate what this is for

### User Preferences (1 table)
| Table | Rows | Dependencies | Purpose | Recommendation |
|-------|------|--------------|---------|----------------|
| user_email_preferences | 0 | profiles | Email preferences | **CONSIDER**: Redundant with portal.email_preferences? |

**Notes**: Empty table, might be superseded by portal.email_preferences

---

## 🔧 INFRASTRUCTURE TABLES (48 tables) - DO NOT MIGRATE

### Auth Schema (19 tables)
**Action**: **KEEP SEPARATE** in each Supabase project
- auth.users
- auth.sessions
- auth.refresh_tokens
- auth.identities
- auth.audit_log_entries
- auth.flow_state
- auth.instances
- auth.mfa_amr_claims
- auth.mfa_challenges
- auth.mfa_factors
- auth.oauth_authorizations
- auth.oauth_clients
- auth.oauth_consents
- auth.one_time_tokens
- auth.saml_providers
- auth.saml_relay_states
- auth.schema_migrations
- auth.sso_domains
- auth.sso_providers

**Notes**: Supabase-managed auth infrastructure. Each project has its own.

**User Account Strategy Impact**:
- **Option B1 (Recommended)**: Users can exist in both auth systems with same email
- **Option A**: Completely separate auth.users entries
- **Option C**: Would attempt to share auth (not recommended due to Supabase limitations)

### Storage Schema (7 tables)
**Action**: **KEEP SEPARATE** in each Supabase project
- storage.buckets
- storage.migrations
- storage.objects
- storage.s3_multipart_uploads
- storage.s3_multipart_uploads_parts

**Migration Consideration**: Files in storage buckets need to be migrated separately

### Realtime Schema (10 tables)
**Action**: **KEEP SEPARATE** in each Supabase project
- realtime.messages
- realtime.schema_migrations
- realtime.subscription
- realtime.broadcasts
- (etc.)

### Cron Schema (2 tables)
**Action**: **RECONFIGURE** for each system
- cron.job
- cron.job_run_details (10,593 rows - lots of job history)

**Notes**: Background job scheduling. Portal and app will need separate cron configs.

### Security Schemas (3 tables)
**Action**: **KEEP SEPARATE**
- pgsodium.key
- vault.secrets
- supabase_migrations.schema_migrations

---

## 🔴 CRITICAL DECISIONS REQUIRED

### Decision 1: Email System Consolidation
**Issue**: Email tables exist in BOTH `public` and `portal` schemas

**Tables Affected**: 8 tables (email_logs, email_notifications, email_notification_batches, email_queue, email_templates, recipient_lists, notification_rules, notification_events)

**Questions**:
1. Which schema is the authoritative source?
2. Why were they duplicated?
3. Are they used by different systems or is this a migration in progress?

**Recommendation**:
- Consolidate into `portal` schema (portal is primary email sender)
- Keep email_templates as shared reference data if app also sends emails
- Delete backup tables (*_backup_042, *_archive) after consolidation

### Decision 2: Contact/CRM System Ownership
**Issue**: Contact tables (contacts, dsps, stations, markets, regions, interactions) could be portal or app

**Analysis**: These tables track DSPs as potential customers/investors for portal admin outreach

**Questions**:
1. Does app need access to this DSP/station/market data?
2. Is this purely for portal marketing, or does app use it for fleet operations?
3. Should stations/markets/regions be shared reference data?

**Recommendation**:
- **MOVE to portal DB** (primary use is portal CRM)
- **Option**: Keep stations/markets/regions in both as reference data

### Decision 3: Organizations vs Businesses
**Issue**: Two similar concepts with unclear relationship

**Tables**:
- `businesses` (9 rows) - Portal DSP business info
- `organizations` (3 rows) - App organizations?

**Questions**:
1. Are these the same thing or different?
2. Do portal businesses become app organizations when they join?
3. Should they be unified into one concept?

**Recommendation**:
- If separate: `businesses` → portal DB, `organizations` → app DB
- If same: Unify into one table, decide which system owns it
- Consider: Portal user's business becomes their organization when they become app user

### Decision 4: User Account Strategy (MOST CRITICAL)
**Issue**: How to handle user accounts across two separate Supabase projects

**Options**:
- **A**: Completely separate accounts (user creates new account in app)
- **B1**: Shared email, separate auth.users entries (RECOMMENDED)
- **B2**: External auth provider (Auth0, etc.)
- **C**: Attempt to share auth (not recommended with Supabase)

**Impact**:
- User experience (single sign-on vs separate logins)
- Profile data strategy (split, duplicate, or link)
- JWT validation between systems
- Future integration complexity

**Recommendation**: **Option B1** - Shared email, separate profiles
- Portal user with joey@example.com can create app account with same email
- Profiles linked by email address
- Each system has its own auth
- Allows API calls between systems using JWT validation

---

## 📋 MIGRATION EXECUTION ORDER

### Phase 1: Infrastructure Setup
1. Create new portal Supabase project
2. Set up database schemas (public, portal)
3. Configure auth settings
4. Create storage buckets

### Phase 2: Reference Data (Low dependency)
1. regions (4 rows)
2. markets (41 rows) - if portal-owned
3. stations (113 rows) - if portal-owned
4. email_templates (16 rows) - after consolidation decision

### Phase 3: Portal User Profiles
1. **CRITICAL**: Create portal profiles table
2. Migrate 9 portal user profiles (WHERE role IN ('portal_member', 'admin', 'super_admin', 'system_admin'))
3. Verify auth.users entries exist in portal project

### Phase 4: Portal Core Features (High priority)
1. businesses (9 rows)
2. membership_agreements (7 rows) - legal requirement
3. nda_agreements (7 rows) - legal requirement
4. portal_memberships (0 rows)

### Phase 5: Portal Marketing System
1. portal_referrals (9 rows)
2. marketing_campaign_links (1 row)
3. portal_referral_conversions (0 rows)
4. portal_referral_rate_limits (28 rows)
5. referral_conversions (0 rows)
6. calculator_submissions (1 row)

### Phase 6: Portal CRM (If portal-owned)
1. dsps (24 rows)
2. dsp_locations (24 rows)
3. contacts (61 rows)
4. contact_dsp_locations (25 rows)
5. interactions (8 rows)
6. contact_submissions (0 rows)

### Phase 7: Portal Events System
1. portal_event_templates (4 rows)
2. portal_events (1 row)
3. portal_event_dates (1 row)
4. portal_event_registrations (1 row)
5. portal_event_guests (0 rows)
6. portal_event_reminders (0 rows)

### Phase 8: Portal Surveys
1. portal_surveys (1 row)
2. portal_survey_questions (5 rows)
3. portal_survey_responses (1 row)
4. portal_survey_answers (0 rows)

### Phase 9: Portal Content/Updates
1. portal_updates (2 rows)
2. portal_update_reads (6 rows)

### Phase 10: Portal Email System (After consolidation)
1. Consolidate public + portal schema email tables
2. email_queue (41 rows)
3. recipient_lists (6 rows)
4. notification_rules (15 rows)
5. notification_events (15 rows)
6. email_logs (consolidated)
7. email_notifications (consolidated)
8. email_notification_batches (consolidated)

### Phase 11: Portal Audit/Admin
1. portal_admin_activity (28 rows)
2. portal_audit_log (12 rows)
3. portal_user_deletion_logs (4 rows)

### Phase 12: Portal Archives (Low priority)
1. portal_referrals_archive (0 rows)
2. referral_deletion_logs (0 rows)
3. email_notification_batches_archive (28 rows)
4. Delete backup tables

### Phase 13: Storage Migration
1. Migrate avatar images from storage
2. Migrate business documents
3. Migrate event images
4. Update avatar_url and avatar_path in profiles

### Phase 14: Edge Functions
1. Migrate send-email function to portal project
2. Migrate send-update-notifications function
3. Update function secrets and environment variables

### Phase 15: Verification
1. Verify all row counts match source
2. Verify all foreign key relationships intact
3. Test RLS policies
4. Test user authentication
5. Test email sending
6. Test admin features

---

## 🎯 NEXT STEPS

1. **ANSWER CRITICAL DECISIONS** (above)
2. **Review this classification** - any corrections needed?
3. **Clarify ambiguous tables** - especially organizations, contacts, email system
4. **Create migration scripts** based on agreed classification
5. **Set up portal Supabase project**
6. **Test migration on database copy**

---

## 📊 STATISTICS BREAKDOWN

### Tables by Schema:
- `public`: 94 tables (mixed portal/app)
- `auth`: 19 tables (infrastructure)
- `portal`: 4 tables (already separated)
- `storage`: 7 tables (infrastructure)
- `realtime`: 10 tables (infrastructure)
- `cron`: 2 tables (infrastructure)
- `pgsodium`, `vault`, `supabase_migrations`: 1 table each (infrastructure)

### Tables by Action:
- **MOVE to portal DB**: 47 tables
- **KEEP in app DB**: 27 tables
- **INFRASTRUCTURE (separate in each)**: 48 tables
- **UNDECIDED**: 15 tables

### Data Volume:
- **Total database rows**: ~15,000 rows (excluding infrastructure)
- **Portal data**: ~500 rows
- **App data**: ~400 rows
- **Infrastructure/logs**: ~14,000 rows (mostly cron logs and auth audit)

**Migration Time Estimate**: 2-4 hours for data migration (small dataset)

---

**Status**: ⏸️ **BLOCKED** - Awaiting decisions on:
1. Email system consolidation strategy
2. Contact/CRM ownership
3. Organizations vs businesses clarification
4. User account strategy confirmation (recommend B1)

**Next Document**: `MIGRATION_SCRIPTS.md` (after decisions and review)
