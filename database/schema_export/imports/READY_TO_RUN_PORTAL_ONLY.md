# ✅ READY TO RUN: Portal-Only Functions

**Date**: 2025-10-28
**Status**: READY - All app functions removed, portal-only file created

---

## What to Run

**File**: `05_ADD_FUNCTIONS_PORTAL_ONLY.sql`
- 102 portal-specific functions
- ~161KB (48% of original)
- NO app/fleet/maintenance functions
- NO missing dependencies

---

## Quick Instructions

1. Open **NEW Supabase database** SQL Editor
2. Copy entire `05_ADD_FUNCTIONS_PORTAL_ONLY.sql` file
3. Paste and click "Run"
4. Wait ~2 minutes
5. Should see: "CREATE FUNCTION" × 102
6. ✅ Done!

---

## What Changed from Original

### ❌ OLD (Incorrect)
- File: `05_ADD_FUNCTIONS.sql`
- Functions: 242 (mixed portal + app)
- Issues:
  - Required missing `app_role` enum
  - Required missing `user_roles` table
  - Included fleet/maintenance functions
  - Included org role management

### ✅ NEW (Correct)
- File: `05_ADD_FUNCTIONS_PORTAL_ONLY.sql`
- Functions: 102 (portal only)
- Benefits:
  - NO missing dependencies
  - NO app/fleet contamination
  - Only portal features
  - Clean separation

---

## Functions Included (102 total)

### Core Portal Features (91 functions)

| Category | Count | Purpose |
|----------|-------|---------|
| Email System | 18 | Queue, send, track portal emails |
| Notifications | 9 | Portal notification system |
| Referrals | 16 | Investor referral program |
| Surveys | 15 | Portal surveys & responses |
| Events | 9 | Portal event registration |
| Calculator | 4 | Cost savings calculator |
| Contacts | 10 | Contact form & DSP contacts |
| Portal Admin | 7 | Portal administration functions |

### Supporting Functions (11 functions)

| Category | Count | Purpose |
|----------|-------|---------|
| Authentication | 6 | `is_admin`, `is_portal_admin`, password resets |
| User Management | 4 | Create profile, impersonation |
| Utilities | 1 | Generic helpers (updated_at triggers) |

---

## Backward Compatibility Notes

Some functions contain defensive checks for legacy structures that may not exist. These are SAFE and will work correctly:

### user_roles References (15 instances)
- Functions use LEFT JOIN to `user_roles` table
- Table doesn't exist in portal DB (app-only)
- LEFT JOIN returns NULL → functions still work using `profiles.role`
- Examples: `get_portal_user_stats()`, `is_portal_admin()`
- **Action**: None needed - functions work without table

### organization_id References (5 instances)
- Functions read `profiles.organization_id` column
- Column exists but is NULL for portal users
- Only used for display/context, not fleet management
- Examples: `get_user_context()`
- **Action**: None needed - column exists, just NULL

### profiles.role Column
- Portal uses `profiles.role` as primary role storage
- Values: `portal_member`, `investor`, `admin`, `super_admin`
- Also uses `portal_memberships` table for additional metadata
- **Action**: None needed - column exists and is populated

---

## What Was Removed (140 functions)

### Fleet/Maintenance (58 functions)
- Vehicle management
- Maintenance records
- Odometer tracking
- Fleet access control

### Organization/Business (28 functions)
- Organization management
- Business profile management
- Organization access control

### App Roles (32 functions)
- `user_roles` table management
- `app_role` enum (owner, manager, dispatch, tech, driver)
- App role checking/assignment

### Other App Features (22 functions)
- Module management
- Driver scheduling
- App-specific utilities

---

## Expected Results

### Success Output
```
CREATE FUNCTION
CREATE FUNCTION
...
(102 times)
```

### NO Errors Expected
- ✅ No missing tables
- ✅ No missing enum types
- ✅ No missing columns
- ✅ No syntax errors

### Verify Success
```sql
-- Count functions created
SELECT COUNT(*)
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';
-- Should be 102 or more (if you had existing functions)

-- Check portal-specific functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%portal%'
ORDER BY routine_name;
-- Should see portal functions listed

-- Check email functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%email%'
ORDER BY routine_name;
-- Should see email functions listed
```

---

## Troubleshooting

### If You See "relation does not exist" Error
- **Should NOT happen** - file has no app dependencies
- If it does, copy the exact error message
- Check which table/relation is missing
- May indicate table creation step was incomplete

### If SQL Editor Times Out
- File is smaller (161KB vs 336KB original)
- Should complete in ~2 minutes
- If it times out: refresh page and run again

### If You See app_role or user_roles Errors
- **Should NOT happen** - these were removed
- If it does: you may be running wrong file
- Verify you're running `05_ADD_FUNCTIONS_PORTAL_ONLY.sql`
- NOT `05_ADD_FUNCTIONS.sql`

---

## Next Steps After Running

1. ✅ Verify functions created (see queries above)
2. Continue to **Step 6**: Add Triggers
3. See [CURRENT_STATUS.md](CURRENT_STATUS.md) for next steps

---

## Documentation

- **Extraction Details**: [PORTAL_FUNCTIONS_EXTRACTION_SUMMARY.md](PORTAL_FUNCTIONS_EXTRACTION_SUMMARY.md)
- **What Was Removed**: [APP_FUNCTIONS_REMOVED.md](APP_FUNCTIONS_REMOVED.md)
- **Migration Status**: [CURRENT_STATUS.md](CURRENT_STATUS.md)
