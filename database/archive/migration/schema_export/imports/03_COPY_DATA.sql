/*
================================================================================
DATA MIGRATION - Direct Database-to-Database Copy
================================================================================
Run these queries in OLD database SQL Editor to export JSON data.
Then run the corresponding INSERT queries in NEW database.

This approach:
- Exports data as JSON (handles all data types correctly)
- Generates INSERT statements automatically
- Preserves UUIDs, timestamps, JSON fields, arrays, etc.
- No CSV parsing issues

PROCESS:
1. Run export query in OLD database
2. Copy the result JSON
3. Run import query in NEW database (will be generated based on export)
================================================================================
*/

-- =============================================================================
-- TABLE 1: profiles
-- =============================================================================
-- Run in OLD database:
SELECT jsonb_agg(row_to_json(t)) as profiles_data
FROM (
  SELECT * FROM profiles WHERE deleted_at IS NULL ORDER BY created_at
) t;

-- Copy the JSON output, then run this in NEW database:
-- (Will provide import script after you export the data)

-- =============================================================================
-- TABLE 2: notification_events
-- =============================================================================
SELECT jsonb_agg(row_to_json(t)) as notification_events_data
FROM (SELECT * FROM notification_events ORDER BY created_at) t;

-- =============================================================================
-- TABLE 3: recipient_lists
-- =============================================================================
SELECT jsonb_agg(row_to_json(t)) as recipient_lists_data
FROM (SELECT * FROM recipient_lists ORDER BY created_at) t;

-- =============================================================================
-- TABLE 4: email_templates
-- =============================================================================
SELECT jsonb_agg(row_to_json(t)) as email_templates_data
FROM (SELECT * FROM email_templates ORDER BY created_at) t;

-- =============================================================================
-- TABLE 5: regions
-- =============================================================================
SELECT jsonb_agg(row_to_json(t)) as regions_data
FROM (SELECT * FROM regions ORDER BY name) t;

-- =============================================================================
-- TABLE 6: markets
-- =============================================================================
SELECT jsonb_agg(row_to_json(t)) as markets_data
FROM (SELECT * FROM markets ORDER BY name) t;

-- =============================================================================
-- TABLE 7: stations
-- =============================================================================
SELECT jsonb_agg(row_to_json(t)) as stations_data
FROM (SELECT * FROM stations ORDER BY name) t;

-- =============================================================================
-- TABLE 8: dsps
-- =============================================================================
SELECT jsonb_agg(row_to_json(t)) as dsps_data
FROM (SELECT * FROM dsps ORDER BY name) t;

-- =============================================================================
-- TABLE 9: portal_memberships
-- =============================================================================
SELECT jsonb_agg(row_to_json(t)) as portal_memberships_data
FROM (SELECT * FROM portal_memberships ORDER BY created_at) t;

-- =============================================================================
-- TABLE 10: membership_agreements
-- =============================================================================
SELECT jsonb_agg(row_to_json(t)) as membership_agreements_data
FROM (SELECT * FROM membership_agreements ORDER BY created_at) t;

-- =============================================================================
-- CONTINUE FOR ALL 50 TABLES...
-- This is still tedious. Let me create a better solution.
-- =============================================================================
