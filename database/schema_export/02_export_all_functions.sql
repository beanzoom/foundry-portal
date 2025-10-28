-- Export ALL Database Functions
-- This exports complete definitions for all 116+ portal-related functions
-- Run this in Supabase SQL Editor and save output to exports/07_all_functions.txt
--
-- Date: 2025-10-28
-- Status: Ready to execute

-- =====================================================
-- Export all user-owned functions with complete definitions
-- =====================================================

SELECT
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    pg_get_functiondef(p.oid) as function_definition,
    '-- =================================================' as separator
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proowner != 10  -- Exclude system-owned functions
ORDER BY
    CASE
        -- Email/Notification functions first (highest priority)
        WHEN p.proname LIKE '%email%' OR p.proname LIKE '%notification%' THEN 1
        -- Referral functions
        WHEN p.proname LIKE '%referral%' THEN 2
        -- Portal-specific functions
        WHEN p.proname LIKE '%portal%' THEN 3
        -- Auth/User functions
        WHEN p.proname LIKE '%user%' OR p.proname LIKE '%auth%' OR p.proname LIKE '%profile%' THEN 4
        -- Everything else
        ELSE 5
    END,
    p.proname;

-- =====================================================
-- Get count by category for verification
-- =====================================================

SELECT
    CASE
        WHEN p.proname LIKE '%email%' OR p.proname LIKE '%notification%' THEN 'Email/Notification'
        WHEN p.proname LIKE '%referral%' THEN 'Referral'
        WHEN p.proname LIKE '%portal_event%' THEN 'Portal Events'
        WHEN p.proname LIKE '%portal_survey%' THEN 'Portal Surveys'
        WHEN p.proname LIKE '%portal_update%' THEN 'Portal Updates'
        WHEN p.proname LIKE '%portal%' THEN 'Portal Other'
        WHEN p.proname LIKE '%user%' OR p.proname LIKE '%auth%' OR p.proname LIKE '%profile%' THEN 'Auth/User'
        WHEN p.proname LIKE '%role%' OR p.proname LIKE '%permission%' THEN 'Roles/Permissions'
        ELSE 'Other'
    END as category,
    COUNT(*) as function_count
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proowner != 10
GROUP BY 1
ORDER BY 2 DESC;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================

/*
AFTER RUNNING:
1. Copy ALL output from the first query
2. Save to: exports/07_all_functions.txt
3. Verify the count matches expectations (~116 functions)
4. Review the category breakdown from second query

EXPECTED CATEGORIES:
- Email/Notification: ~16 functions
- Referral: ~13 functions
- Portal Events: ~11 functions
- Portal Surveys: ~12 functions
- Portal Updates: ~14 functions
- Portal Other: ~8 functions
- Auth/User: ~15 functions
- Roles/Permissions: ~7 functions
- Other: ~10 functions

TOTAL: ~116 functions

If count is significantly different, investigate why.
*/
