#!/usr/bin/env python3
"""
Portal Data Export Script
Connects to OLD Supabase database and generates INSERT statements for all portal tables.
Output: portal_data_import.sql (ready to run in NEW database)
"""

import os
import sys

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("Error: psycopg2 not installed")
    print("Install with: pip install psycopg2-binary")
    sys.exit(1)

# OLD database connection (edit these values)
OLD_DB_CONFIG = {
    'host': 'db.kssbljbxapejckgassgf.supabase.co',
    'database': 'postgres',
    'user': 'postgres',
    'password': 'YOUR_PASSWORD_HERE',  # Update this
    'port': 5432
}

# Tables in dependency order (same as creation order)
TABLES = [
    # Phase 1: Foundation
    'profiles',
    # Phase 2: Independent tables
    'notification_events', 'recipient_lists', 'email_templates',
    'regions', 'markets', 'stations', 'dsps',
    # Dependencies on profiles
    'portal_memberships', 'membership_agreements', 'nda_agreements',
    'notification_rules', 'contacts', 'contact_interactions',
    'portal_funnels', 'portal_funnel_stages', 'portal_leads',
    'calculator_submissions', 'portal_calculator_submissions',
    'email_notification_batches',
    # Portal referrals (self-referencing handled separately)
    'portal_referrals',
    # Phase 3: Portal content
    'portal_events', 'portal_event_dates', 'portal_event_registrations',
    'portal_event_guests', 'portal_event_reminders', 'portal_event_templates',
    'portal_surveys', 'portal_survey_sections', 'portal_survey_questions',
    'portal_survey_responses', 'portal_survey_answers',
    'portal_updates', 'portal_update_reads',
    # Phase 4: Referral & marketing
    'portal_referral_conversions', 'portal_referral_rate_limits',
    'marketing_campaign_links', 'referral_conversions',
    # Phase 5: Email system
    'email_notifications', 'notification_logs', 'email_logs', 'email_queue',
    # Phase 6: Audit/backup
    'portal_user_deletion_logs', 'referral_deletion_logs', 'portal_audit_log',
    'email_logs_backup_042', 'email_notification_batches_backup_042',
    'email_notification_batches_archive', 'portal_referrals_archive'
]

def escape_value(val):
    """Escape SQL values for INSERT statements"""
    if val is None:
        return 'NULL'
    elif isinstance(val, bool):
        return 'true' if val else 'false'
    elif isinstance(val, (int, float)):
        return str(val)
    elif isinstance(val, (dict, list)):
        # JSON/JSONB
        import json
        return f"'{json.dumps(val)}'::jsonb"
    elif isinstance(val, str):
        # Escape single quotes
        escaped = val.replace("'", "''").replace("\\", "\\\\")
        return f"'{escaped}'"
    else:
        # Timestamps, UUIDs, etc.
        escaped = str(val).replace("'", "''")
        return f"'{escaped}'"

def export_table(cursor, table_name, output_file):
    """Export a single table as INSERT statements"""
    print(f"Exporting {table_name}...", end=' ')

    # Get row count first
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]

    if count == 0:
        print(f"0 rows (skipped)")
        output_file.write(f"\n-- {table_name}: 0 rows\n")
        return 0

    # Get column names
    cursor.execute(f"""
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = '{table_name}'
        AND table_schema = 'public'
        ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    col_names = [col[0] for col in columns]
    col_types = {col[0]: col[1] for col in columns}

    # Fetch all rows
    cursor.execute(f"SELECT * FROM {table_name}")
    rows = cursor.fetchall()

    # Write to file
    output_file.write(f"\n-- =====================================================\n")
    output_file.write(f"-- {table_name}: {count} rows\n")
    output_file.write(f"-- =====================================================\n\n")

    for row in rows:
        values = []
        for i, col_name in enumerate(col_names):
            val = row[i]
            col_type = col_types[col_name]

            if val is None:
                values.append('NULL')
            elif col_type in ('uuid',):
                values.append(f"'{val}'::uuid")
            elif col_type in ('timestamp with time zone', 'timestamp without time zone'):
                values.append(f"'{val}'::timestamptz")
            elif col_type in ('jsonb', 'json'):
                import json
                escaped = json.dumps(val).replace("'", "''")
                values.append(f"'{escaped}'::jsonb")
            elif col_type in ('ARRAY', 'text[]'):
                import json
                escaped = json.dumps(val).replace("'", "''")
                values.append(f"'{escaped}'::text[]")
            elif col_type == 'USER-DEFINED':  # ENUMs
                values.append(f"'{val}'")
            elif isinstance(val, bool):
                values.append('true' if val else 'false')
            elif isinstance(val, (int, float)):
                values.append(str(val))
            elif isinstance(val, str):
                escaped = val.replace("'", "''").replace("\\", "\\\\")
                values.append(f"'{escaped}'")
            else:
                escaped = str(val).replace("'", "''")
                values.append(f"'{escaped}'")

        insert_sql = f"INSERT INTO {table_name} ({', '.join(col_names)}) VALUES ({', '.join(values)});\n"
        output_file.write(insert_sql)

    print(f"{count} rows")
    return count

def main():
    """Main export function"""
    print("=" * 60)
    print("Portal Data Export Script")
    print("=" * 60)

    # Update password before running
    if OLD_DB_CONFIG['password'] == 'YOUR_PASSWORD_HERE':
        print("\nERROR: Please update the password in the script first!")
        print("Edit export_data.py and set OLD_DB_CONFIG['password']")
        sys.exit(1)

    # Connect to database
    print(f"\nConnecting to {OLD_DB_CONFIG['host']}...")
    try:
        conn = psycopg2.connect(**OLD_DB_CONFIG)
        cursor = conn.cursor()
        print("✓ Connected successfully\n")
    except Exception as e:
        print(f"✗ Connection failed: {e}")
        print("\nTroubleshooting:")
        print("1. Check if password is correct")
        print("2. Verify network connectivity: ping db.kssbljbxapejckgassgf.supabase.co")
        print("3. If in WSL, try running from Windows host instead")
        sys.exit(1)

    # Open output file
    output_path = 'portal_data_import.sql'
    with open(output_path, 'w') as f:
        f.write("/*\n")
        f.write(" * Portal Data Import\n")
        f.write(" * Generated by export_data.py\n")
        f.write(" * Run this file in NEW database after creating all tables\n")
        f.write(" */\n\n")
        f.write("BEGIN;\n\n")

        total_rows = 0
        for table in TABLES:
            try:
                rows = export_table(cursor, table, f)
                total_rows += rows
            except Exception as e:
                print(f"Error exporting {table}: {e}")
                continue

        f.write("\nCOMMIT;\n")
        f.write(f"\n-- Total rows exported: {total_rows}\n")

    cursor.close()
    conn.close()

    print("\n" + "=" * 60)
    print(f"✓ Export complete: {output_path}")
    print(f"✓ Total rows: {total_rows}")
    print("\nNext steps:")
    print(f"1. Review {output_path}")
    print("2. Copy to new database and run in Supabase SQL Editor")
    print("3. Verify data imported correctly")
    print("=" * 60)

if __name__ == '__main__':
    main()
