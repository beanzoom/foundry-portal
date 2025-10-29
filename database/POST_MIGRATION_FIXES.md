# Post-Migration Fixes and Improvements

This document tracks fixes and improvements made to the Foundry Portal after the database migration was completed.

## Overview

After migrating from the shared FleetDRMS database to a standalone Foundry Portal database, several issues were identified and resolved to ensure full functionality of the portal.

## User Management Fixes

### Issue: User Management Page Showing 0 Users
**Date**: October 29, 2024
**Symptoms**: `/admin/users` page displayed 0 users with 404 errors for missing tables

**Root Cause**:
- Old query structure relied on `system_user_assignments` and `portal_memberships` tables
- New database uses `profiles` table with role-based filtering
- Missing `user_acquisition_details` view

**Solution**:
1. Created `user_acquisition_details` view combining profiles, businesses, referrals, and marketing data
2. Updated `PortalAdminUsers.tsx` to query `profiles` directly by role
3. Fixed role filters and badge colors to match new schema

**Files Modified**:
- `database/views/user_acquisition_details.sql`
- `src/pages/portal/admin/PortalAdminUsers.tsx`

## Contact Tracking Fixes

### Issue 1: DSPs/Stations Showing 0 with 400 Errors
**Date**: October 29, 2024
**Symptoms**: Contact tracking page showed 0 DSPs/Stations with Bad Request errors

**Root Cause**: Foreign key relationships not properly configured, queries using broken FK syntax

**Solution**:
- Removed broken foreign key relationship queries
- Fetched related data separately with individual queries
- Updated `contact-tracking.service.ts` to handle relationships at application level

**Files Modified**:
- `src/services/contact-tracking.service.ts`

### Issue 2: Orphaned Test Contacts
**Date**: October 29, 2024
**Symptoms**: Deleted test referrals still showing in recent contacts

**Root Cause**:
- `delete_referral_admin_fixed()` only deleted contacts with matching `referral_id`
- Test contacts had `referral_id = NULL` so were not deleted

**Solution**:
- Updated function to also delete contacts by matching email address
- Cleaned up 18 orphaned test contacts

**Files Modified**:
- `database/functions/fix_delete_referral_admin.sql`

**Applied**: October 29, 2024

### Issue 3: Duplicate Contacts
**Date**: October 29, 2024
**Symptoms**: Same contact appearing multiple times in listings (e.g., Rob Wheat 8 times)

**Root Cause**: Multiple contact records with same email from testing

**Solution**:
1. Created deduplication script using ROW_NUMBER() OVER PARTITION BY pattern
2. Kept most recent contact per email, deleted 17 duplicates
3. Added unique index on email to prevent future duplicates

**Files Modified**:
- `database/maintenance/deduplicate_contacts.sql` (now archived)

**Applied**: October 29, 2024
**Result**: 17 duplicate contacts removed

## Email System Unification

### Issue 1: Survey Publish Field Name Error
**Date**: October 29, 2024
**Symptoms**: Survey publish failed with "record 'new' has no field 'deadline'"

**Root Cause**: Function referenced `NEW.deadline` but column is `due_date`

**Solution**: Updated `handle_survey_published()` to use `NEW.due_date`

**Files Modified**:
- `database/functions/fix_handle_survey_published.sql`

**Applied**: October 29, 2024

### Issue 2: Survey/Event Emails Not Using Unified System
**Date**: October 29, 2024
**Symptoms**: Dialog showed "Sent 0 emails successfully!" but emails were actually sent

**Root Cause**:
- Surveys and events were using old batch system (`queue_survey_email_notifications`, `queue_event_email_notifications`)
- Updates were using new unified system (`trigger_email_notification`)
- Emails sent instantly by trigger, but dialog tried to manually process empty queue

**Solution**:
1. Replaced survey/event triggers to use `trigger_email_notification()` like updates
2. Created `getEventEmailStats()` function to query recently sent emails instead of processing queue
3. Updated `PublishConfirmDialog` to use `getEventEmailStats()` for all content types

**Files Modified**:
- `database/fixes/fix_survey_email_triggers.sql`
- `database/fixes/fix_event_email_triggers.sql`
- `src/services/email-queue.service.ts`
- `src/components/portal/admin/notifications/PublishConfirmDialog.tsx`

**Applied**: October 29, 2024

**Behavior**: All content types (updates, surveys, events) now:
- Use unified `trigger_email_notification()` function
- Send emails immediately when published
- Show accurate sent email count in dialog
- Process according to notification rules without manual queue processing

### Issue 3: Missing Test Response Stats Function
**Date**: October 29, 2024
**Symptoms**: 404 error for `get_test_response_stats` when unpublishing surveys

**Root Cause**: Function not created during migration

**Solution**: Created `get_test_response_stats()` function to return test response statistics

**Files Modified**:
- `database/functions/get_test_response_stats.sql`

**Applied**: October 29, 2024

## UI/UX Improvements

### Profile Edit Page Reorganization
**Date**: October 29, 2024
**Changes**:
- Separated profile editing into tabs (Profile Information and Business Information)
- Added individual save buttons per tab
- Ensured primary business displays first
- Matched tab styling between profile display and edit pages
- Replaced star icon with "Primary" badge
- Added Cancel and "Back to Profile" buttons

**Files Modified**:
- `src/pages/portal/PortalProfileEdit.tsx`
- `src/components/portal/BusinessManager.tsx`

### Admin Navigation
**Date**: October 29, 2024
**Changes**:
- Moved inactive Analytics and Content links to far right
- Grayed out disabled links with "Coming soon" tooltip
- Changed from clickable links to non-interactive elements

**Files Modified**:
- `src/components/portal/admin/AdminLayout.tsx`

### Dynamic Routing Fixes
**Date**: October 29, 2024
**Issue**: Hardcoded `/portal/` paths breaking navigation in different deployment contexts

**Solution**: Updated all contact tracking components to use `portalRoute()` helper

**Files Modified**:
- `src/components/portal/admin/contacts/HierarchyManager.tsx`
- `src/components/portal/admin/contacts/DSPDetailView.tsx`

## Data Integrity Improvements

### Unique Constraints Added
1. **Contacts Email Uniqueness**
   - Added unique index on `LOWER(email)` for active contacts
   - Prevents duplicate contact creation
   - Applied after deduplication cleanup

## Verified Working Features

As of October 29, 2024, the following features have been tested and verified working:

- ✅ User Management (admin users page)
- ✅ Contact Tracking (all views, DSPs, stations, markets)
- ✅ Update Publishing (with email notifications)
- ✅ Survey Publishing (with email notifications)
- ✅ Event Publishing (with email notifications)
- ✅ Referral Management (including deletion)
- ✅ Profile Editing (with business management)
- ✅ Email Queue Processing (immediate send on publish)
- ✅ Dynamic Navigation (works across deployment contexts)

## Migration Success Metrics

- **Zero data loss** during migration
- **All core features functional** after fixes applied
- **Email system unified** across all content types
- **Data integrity maintained** with deduplication and constraints
- **Performance improved** with optimized queries

## Lessons Learned

1. **Foreign Key Handling**: Some FKs not enforced in database; application layer handles referential integrity
2. **Email System Design**: Unified trigger-based system is more reliable than mixed batch/trigger approach
3. **Data Cleanup**: Importance of comprehensive deletion logic (matching by both FK and related fields)
4. **Testing**: Test referrals should be clearly marked to avoid confusion with production data
5. **Documentation**: Keep migration and fix documentation up-to-date for future reference

## Future Improvements

Potential enhancements identified during migration:

1. **Add referral_id to contacts table** to maintain referential integrity
2. **Implement soft deletes** consistently across all tables
3. **Add data validation** triggers for email format, phone format, etc.
4. **Create admin audit log** for tracking deletions and major changes
5. **Implement Analytics dashboard** (currently disabled)
6. **Implement Content management** (currently disabled)
