#!/usr/bin/env python3
"""
Fix remaining failed tables from migration
"""

import json
import requests

# Same config as migrate_via_api.py
OLD_PROJECT = {
    'url': 'https://kssbljbxapejckgassgf.supabase.co',
    'service_key': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtzc2JsamJ4YXBlamNrZ2Fzc2dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczOTg5MjA5NiwiZXhwIjoyMDU1NDY4MDk2fQ.Utzx7q7nuJXInQta7NeZLYin8qs2XoLW_66w3fOXsvI'
}

NEW_PROJECT = {
    'url': 'https://shthtiwcbdnhvxikxiex.supabase.co',
    'service_key': 'YOUR_NEW_SERVICE_KEY'  # PASTE YOUR KEY HERE
}

print("=" * 70)
print("Fixing remaining tables")
print("=" * 70)

# ============================================================================
# FIX 1: Add missing ENUM value to contact_title_enum
# ============================================================================
print("\n1. Checking contact_title_enum values...")
print("   Run this in NEW database SQL Editor:")
print("""
   -- Add 'Owner' to the enum
   ALTER TYPE contact_title_enum ADD VALUE IF NOT EXISTS 'Owner';

   -- Verify all values
   SELECT enum_range(NULL::contact_title_enum);
""")

# ============================================================================
# FIX 2: Migrate 'interactions' table to 'contact_interactions'
# ============================================================================
print("\n2. Migrating interactions → contact_interactions...")

def fetch_interactions():
    url = f"{OLD_PROJECT['url']}/rest/v1/interactions"
    headers = {
        'apikey': OLD_PROJECT['service_key'],
        'Authorization': f"Bearer {OLD_PROJECT['service_key']}",
    }
    response = requests.get(url, headers=headers, params={'limit': '1000'})
    return response.json()

def insert_contact_interactions(data):
    url = f"{NEW_PROJECT['url']}/rest/v1/contact_interactions"
    headers = {
        'apikey': NEW_PROJECT['service_key'],
        'Authorization': f"Bearer {NEW_PROJECT['service_key']}",
        'Content-Type': 'application/json',
        'Prefer': 'resolution=ignore-duplicates'
    }
    response = requests.post(url, headers=headers, json=data)
    return response

if NEW_PROJECT['service_key'] != 'YOUR_NEW_SERVICE_KEY':
    try:
        interactions = fetch_interactions()
        print(f"   Found {len(interactions)} rows in OLD 'interactions' table")

        if len(interactions) > 0:
            result = insert_contact_interactions(interactions)
            if result.status_code in [200, 201]:
                print(f"   ✓ Migrated to 'contact_interactions'")
            else:
                print(f"   ✗ Error: {result.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
else:
    print("   ⚠ Update NEW_PROJECT['service_key'] first")

# ============================================================================
# FIX 3: Contacts - retry after fixing enum
# ============================================================================
print("\n3. After fixing enum, retry contacts migration:")
print("   Run migrate_via_api.py again - it will skip duplicates")

print("\n" + "=" * 70)
print("Manual steps:")
print("1. Run the ALTER TYPE command above in NEW database")
print("2. Update service_key in this script")
print("3. Run: python3 fix_remaining_tables.py")
print("4. Then run: python3 migrate_via_api.py (to retry contacts)")
print("=" * 70)
