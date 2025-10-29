#!/usr/bin/env python3
"""
Portal Data Migration via Supabase REST API
No database connection needed - uses HTTPS REST API only
"""

import json
import sys
import time

try:
    import requests
except ImportError:
    print("Error: requests library not installed")
    print("Install with: pip install requests")
    sys.exit(1)

# ============================================================================
# CONFIGURATION - Edit these values
# ============================================================================

OLD_PROJECT = {
    'url': 'https://kssbljbxapejckgassgf.supabase.co',
    'anon_key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzc2JsamJ4YXBlamNrZ2Fzc2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4OTIwOTYsImV4cCI6MjA1NTQ2ODA5Nn0.GaMolqo-Anbj8BO51Aw7hXfJU1aeeCOhTeIffBk83GM',
    'service_key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzc2JsamJ4YXBlamNrZ2Fzc2dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTg5MjA5NiwiZXhwIjoyMDU1NDY4MDk2fQ.Utzx7q7nuJXInQta7NeZLYin8qs2XoLW_66w3fOXsvI'
}

NEW_PROJECT = {
    'url': 'https://shthtiwcbdnhvxikxiex.supabase.co',  # UPDATE THIS
    'anon_key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGh0aXdjYmRuaHZ4aWt4aWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NjM2ODQsImV4cCI6MjA3NzIzOTY4NH0.ICbmEjGYHr6fXqK024hC4rGO-Se3axdBuoC2UArqr20',  # UPDATE THIS
    'service_key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodGh0aXdjYmRuaHZ4aWt4aWV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTY2MzY4NCwiZXhwIjoyMDc3MjM5Njg0fQ.7b0k9jLdEltjWLU-awtbdApQzmonMoJhaixoZh84wn4'  # UPDATE THIS
}

# Tables in dependency order
TABLES = [
    'profiles',
    'notification_events',
    'recipient_lists',
    'email_templates',
    'regions',
    'markets',
    'stations',
    'dsps',
    'portal_memberships',
    'membership_agreements',
    'nda_agreements',
    'notification_rules',
    'contacts',
    'contact_interactions',
    'portal_funnels',
    'portal_funnel_stages',
    'portal_leads',
    'calculator_submissions',
    'portal_calculator_submissions',
    'email_notification_batches',
    'portal_referrals',
    'portal_events',
    'portal_event_dates',
    'portal_event_registrations',
    'portal_event_guests',
    'portal_event_reminders',
    'portal_event_templates',
    'portal_surveys',
    'portal_survey_sections',
    'portal_survey_questions',
    'portal_survey_responses',
    'portal_survey_answers',
    'portal_updates',
    'portal_update_reads',
    'portal_referral_conversions',
    'portal_referral_rate_limits',
    'marketing_campaign_links',
    'referral_conversions',
    'email_notifications',
    'notification_logs',
    'email_logs',
    'email_queue',
    'portal_user_deletion_logs',
    'referral_deletion_logs',
    'portal_audit_log',
]

# ============================================================================
# MIGRATION FUNCTIONS
# ============================================================================

def fetch_table_data(table_name, old_project):
    """Fetch all rows from a table in OLD database"""
    url = f"{old_project['url']}/rest/v1/{table_name}"
    headers = {
        'apikey': old_project['service_key'],
        'Authorization': f"Bearer {old_project['service_key']}",
        'Accept': 'application/json'
    }

    # Add filters for specific tables
    params = {}
    if table_name == 'profiles':
        params['is_portal_user'] = 'eq.true'

    # Fetch with pagination (max 1000 rows per request)
    params['limit'] = '1000'

    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {table_name}: {e}")
        return None

def insert_table_data(table_name, data, new_project):
    """Insert rows into NEW database"""
    if not data or len(data) == 0:
        return 0

    url = f"{new_project['url']}/rest/v1/{table_name}"
    headers = {
        'apikey': new_project['service_key'],
        'Authorization': f"Bearer {new_project['service_key']}",
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'  # Skip duplicates
    }

    # Insert in batches of 100 rows
    batch_size = 100
    total_inserted = 0

    for i in range(0, len(data), batch_size):
        batch = data[i:i+batch_size]
        try:
            response = requests.post(url, headers=headers, json=batch)
            response.raise_for_status()
            total_inserted += len(batch)
            print(f"  Inserted batch {i//batch_size + 1}: {len(batch)} rows")
            time.sleep(0.1)  # Rate limiting
        except requests.exceptions.RequestException as e:
            print(f"  Error inserting batch: {e}")
            if hasattr(e.response, 'text'):
                print(f"  Response: {e.response.text}")
            continue

    return total_inserted

def migrate_table(table_name, old_project, new_project):
    """Migrate a single table"""
    print(f"\n[{table_name}]")
    print("  Fetching data from old database...", end=' ')

    data = fetch_table_data(table_name, old_project)

    if data is None:
        print("FAILED")
        return False

    row_count = len(data)
    print(f"{row_count} rows")

    if row_count == 0:
        print("  Skipping (no data)")
        return True

    print(f"  Inserting into new database...")
    inserted = insert_table_data(table_name, data, new_project)

    if inserted == row_count:
        print(f"  ✓ Complete: {inserted} rows migrated")
        return True
    else:
        print(f"  ⚠ Partial: {inserted}/{row_count} rows migrated")
        return False

def main():
    """Main migration process"""
    print("=" * 70)
    print("Portal Data Migration via REST API")
    print("=" * 70)

    # Validate configuration
    if NEW_PROJECT['service_key'] == 'YOUR_NEW_SERVICE_KEY':
        print("\n❌ ERROR: Please update NEW_PROJECT configuration in script!")
        print("   - service_key")
        print("   - anon_key")
        sys.exit(1)

    print(f"\nOLD: {OLD_PROJECT['url']}")
    print(f"NEW: {NEW_PROJECT['url']}")
    print(f"\nMigrating {len(TABLES)} tables...\n")

    results = {
        'success': [],
        'failed': [],
        'skipped': []
    }

    for table in TABLES:
        try:
            success = migrate_table(table, OLD_PROJECT, NEW_PROJECT)
            if success:
                results['success'].append(table)
            else:
                results['failed'].append(table)
        except Exception as e:
            print(f"  ✗ Error: {e}")
            results['failed'].append(table)

    # Summary
    print("\n" + "=" * 70)
    print("MIGRATION SUMMARY")
    print("=" * 70)
    print(f"✓ Success: {len(results['success'])} tables")
    print(f"✗ Failed:  {len(results['failed'])} tables")

    if results['failed']:
        print("\nFailed tables:")
        for table in results['failed']:
            print(f"  - {table}")

    print("\n" + "=" * 70)

    if len(results['failed']) == 0:
        print("🎉 All tables migrated successfully!")
        print("\nNext steps:")
        print("1. Verify data in new database")
        print("2. Add foreign key constraints")
        print("3. Add functions and triggers")
        print("4. Enable RLS policies")
    else:
        print("⚠ Some tables failed to migrate")
        print("Review errors above and retry failed tables manually")

if __name__ == '__main__':
    main()
