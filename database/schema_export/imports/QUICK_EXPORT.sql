/*
================================================================================
QUICK DATA EXPORT - Run in OLD database SQL Editor
================================================================================
Copy each result and save to corresponding file, then import to NEW database.
================================================================================
*/

-- =============================================================================
-- PROFILES (Foundation - ~50 rows)
-- =============================================================================
SELECT json_agg(t) FROM (
  SELECT * FROM profiles WHERE is_portal_user = true ORDER BY created_at
) t;

-- After copying the JSON, run this in NEW database:
-- INSERT INTO profiles SELECT * FROM json_populate_recordset(NULL::profiles, 'PASTE_JSON_HERE');


-- =============================================================================
-- NOTIFICATION_EVENTS (~10 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM notification_events ORDER BY created_at) t;

-- =============================================================================
-- RECIPIENT_LISTS (~5 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM recipient_lists ORDER BY created_at) t;

-- =============================================================================
-- EMAIL_TEMPLATES (~15 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM email_templates ORDER BY created_at) t;

-- =============================================================================
-- REGIONS (~5 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM regions ORDER BY name) t;

-- =============================================================================
-- MARKETS (~20 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM markets ORDER BY name) t;

-- =============================================================================
-- STATIONS (~50 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM stations ORDER BY station_code) t;

-- =============================================================================
-- DSPS (~100 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM dsps ORDER BY dsp_name) t;

-- =============================================================================
-- PORTAL_MEMBERSHIPS (~50 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM portal_memberships ORDER BY joined_at) t;

-- =============================================================================
-- MEMBERSHIP_AGREEMENTS (~50 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM membership_agreements ORDER BY agreed_at) t;

-- =============================================================================
-- NDA_AGREEMENTS (~50 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM nda_agreements ORDER BY agreed_at) t;

-- =============================================================================
-- NOTIFICATION_RULES (~10 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM notification_rules ORDER BY created_at) t;

-- =============================================================================
-- CONTACTS (~200 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM contacts ORDER BY created_at) t;

-- =============================================================================
-- CONTACT_INTERACTIONS (interactions table - ~100 rows)
-- =============================================================================
SELECT json_agg(t) FROM (SELECT * FROM interactions ORDER BY interaction_date) t;

-- Import as: INSERT INTO contact_interactions SELECT * FROM json_populate_recordset(NULL::contact_interactions, '...');

-- =============================================================================
-- Continue for remaining tables...
-- =============================================================================
-- I'll create a script that does all 50 automatically using Supabase API
