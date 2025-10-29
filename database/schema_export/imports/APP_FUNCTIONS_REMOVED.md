# App Functions Removed from Portal Migration

**Date**: 2025-10-28
**Issue**: Original function export included BOTH portal and app (fleet management) functions

---

## Problem

The original `05_ADD_FUNCTIONS.sql` file was exported from the **shared database** which contains:
- **Portal code**: Investor portal (your project)
- **App code**: Fleet management system (separate project)

This caused:
1. **242 total functions** exported (should have been ~102 portal-only)
2. **Missing `app_role` enum** error - enum includes fleet org roles
3. **Missing `user_roles` table** error - app-only role table
4. **Contamination risk** - app functions/roles leaked into portal database

---

## Solution

Created **portal-only function file** that excludes ALL app/fleet functionality.

### Files

| File | Status | Functions | Purpose |
|------|--------|-----------|---------|
| `05_ADD_FUNCTIONS.sql` | ❌ **DO NOT USE** | 242 (mixed) | Original export with app functions |
| `05_ADD_FUNCTIONS_PORTAL_ONLY.sql` | ✅ **USE THIS** | 102 (portal) | Portal-only functions |
| `05a_CREATE_USER_ROLES_STUB.sql` | ❌ **DELETED** | N/A | App-only stub (not needed) |

---

## What Was Removed

### App-Only Functions (140 removed)

**Fleet/Maintenance** (58 functions):
- `create_maintenance_record_with_vehicle_update`
- `get_fleet_vehicles_with_context`
- `update_odometer_history`
- `vehicle_has_active_maintenance`
- `can_access_fleet_record`
- `get_maintenance_records_with_context`
- All other fleet/vehicle/maintenance functions

**Organization/Business** (28 functions):
- `upsert_user_business`
- `sync_primary_business_to_profile`
- `get_organizations_secure`
- `can_access_organization_data`
- `get_user_organization`
- All other organization management functions

**App Roles/Permissions** (32 functions):
- `get_user_roles`, `update_user_roles`
- `has_role`, `user_has_role`, `has_org_role`
- `create_new_user_v2` (with app_role parameter)
- `check_user_roles`, `sync_user_roles_to_context`
- All other app role management functions

**Other App Features** (22 functions):
- Module management (`toggle_module_status`, `get_organization_modules`)
- Schedule management (`clean_old_schedules`)
- Driver management
- Other app-specific utilities

### App-Only Tables/Types Removed

**`app_role` enum** - REMOVED
- Included org roles: `owner`, `manager`, `dispatch`, `tech`, `driver`, `developer`, `finance`
- Portal uses: `portal_member`, `investor`, `admin`, `super_admin` only

**`user_roles` table** - REMOVED
- App-only role assignment table
- Portal uses: `portal_memberships` table instead

---

## What Was Kept

### Portal Functions (102 included)

| Category | Count | Key Functions |
|----------|-------|---------------|
| **Email** | 18 | `queue_email`, `process_email_queue`, `mark_email_sent`, `get_email_stats` |
| **Notification** | 9 | `queue_notification`, `update_notification_status`, `get_notification_stats` |
| **Referral** | 16 | `create_referral`, `process_referral_registration`, `validate_referral_eligibility` |
| **Survey** | 15 | `save_survey_response`, `get_survey_analytics`, `handle_survey_completion` |
| **Event** | 9 | `register_for_event`, `cancel_event_registration`, `export_event_registrations` |
| **Calculator** | 4 | `handle_calculator_submission`, `get_top_calculator_savers` |
| **Contact** | 10 | `search_contacts`, `get_contact_analytics`, `get_dsp_contacts` |
| **Portal Admin** | 7 | `is_portal_admin`, `delete_portal_user`, `get_portal_admin_stats` |
| **Auth/User** | 10 | `is_admin`, `reset_user_password`, `start_user_impersonation` |
| **Helpers** | 4 | `handle_updated_at`, `update_updated_at_column`, `generate_slug` |

---

## Portal vs App Architecture

### Portal (This Project)

**Role System**:
- Table: `portal_memberships`
- Roles: `portal_member`, `investor`, `admin`, `super_admin`
- Context: Investor portal access only

**User Management**:
- Portal-specific user profiles
- No organization associations
- No fleet/vehicle/maintenance data

**Features**:
- Email notifications
- Referral system
- Surveys & events
- Calculator
- Contact forms

### App (Separate Project)

**Role System**:
- Table: `user_roles`
- Enum: `app_role` (owner, manager, dispatch, tech, driver, developer, finance)
- Context: Fleet management organization roles

**User Management**:
- Organization-associated users
- Fleet/vehicle assignments
- Maintenance tracking

**Features**:
- Fleet management
- Maintenance records
- Driver scheduling
- Organization management
- Permission system

---

## Verification

✅ **NO app functions in portal file**
✅ **NO organization/fleet/maintenance references**
✅ **NO app_role enum needed**
✅ **NO user_roles table needed**
✅ **All portal features covered** (email, referral, survey, event, calculator, contact)
✅ **Portal admin functions included** (`is_portal_admin`, `is_admin`)
✅ **User management functions included** (auth, password reset, impersonation)

---

## Next Steps

1. ✅ Run `05_ADD_FUNCTIONS_PORTAL_ONLY.sql` in new Supabase database
2. Should see: "CREATE FUNCTION" × 102
3. Duration: ~2 minutes
4. NO errors expected (no missing tables/enums)

See [CURRENT_STATUS.md](CURRENT_STATUS.md) for current migration status.
