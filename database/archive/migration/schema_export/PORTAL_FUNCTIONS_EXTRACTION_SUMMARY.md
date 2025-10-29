# Portal Functions Extraction Summary

## Overview
Successfully extracted portal-related functions from the complete SQL functions file.

## Files
- **Source File**: `/home/joeylutes/projects/foundry-portal/database/schema_export/imports/05_ADD_FUNCTIONS.sql`
- **Output File**: `/home/joeylutes/projects/foundry-portal/database/schema_export/imports/05_ADD_FUNCTIONS_PORTAL_ONLY.sql`
- **Extraction Script**: `/home/joeylutes/projects/foundry-portal/database/schema_export/extract_portal_functions.py`

## Statistics
- **Total functions in original file**: 242
- **Functions included (portal-related)**: 102
- **Functions excluded (app-related)**: 140

## Function Breakdown by Category

| Category | Count | Examples |
|----------|-------|----------|
| Email functions | 18 | `queue_email`, `process_email_queue`, `get_email_stats` |
| Notification functions | 9 | `queue_notification`, `update_notification_status` |
| Referral functions | 16 | `create_referral`, `process_referral_registration` |
| Portal functions | 7 | `is_portal_admin`, `delete_portal_user` |
| Survey functions | 15 | `save_survey_response`, `get_survey_analytics` |
| Event functions | 9 | `register_for_event`, `cancel_event_registration` |
| Calculator functions | 4 | `handle_calculator_submission`, `get_top_calculator_savers` |
| Contact functions | 10 | `search_contacts`, `get_contact_analytics` |
| Auth/User functions | 10 | `is_admin`, `reset_user_password`, `start_user_impersonation` |
| Other helpers | 4 | `handle_updated_at`, `update_updated_at_column` |

## Inclusion Criteria

### Included Functions
Functions were included if they contained these keywords in their name:
- `email`, `notification`, `referral`, `portal_`, `survey`, `event`, `calculator`, `contact`, `recipient`, `update_read`

Or if they were specifically needed for portal authentication/user management:
- `is_admin`, `check_is_admin`, `is_portal_admin`
- `create_profile_after_signup`
- `get_my_user_info`, `get_user_context`
- `admin_reset_password`, `reset_user_password`
- `handle_updated_at`, `update_updated_at_column`
- `start_user_impersonation`, `end_user_impersonation`

### Excluded Functions
Functions were excluded if they contained these keywords:
- `fleet`, `maintenance`, `vehicle`, `driver`, `schedule`, `module`, `odometer`, `business`

Or if they were app-specific functions:
- Functions with `app_role` enum parameters
- Functions accessing `user_roles` table (except portal admin functions)
- Organization/business management functions
- Fleet/maintenance permission functions

## Verification
The extraction was verified to ensure:
1. All portal-critical functions are included (102 functions)
2. No app-specific functions leaked into the portal file
3. Functions maintain the same order as the original file
4. Complete function definitions including all code

## Usage
The output file can be used to create a portal-only database schema without any fleet management functions.
