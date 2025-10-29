#!/usr/bin/env python3
"""
Extract portal-related functions from the complete SQL functions file.
"""

import re
from pathlib import Path

# Function classification rules
INCLUDE_KEYWORDS = [
    'email', 'notification', 'referral', 'portal_', 'survey', 'event',
    'calculator', 'contact', 'recipient', 'update_read'
]

EXCLUDE_KEYWORDS = [
    'fleet', 'maintenance', 'vehicle', 'driver', 'schedule',
    'module', 'odometer', 'business'
]

# Specific functions to include (portal auth/user management)
INCLUDE_SPECIFIC = [
    'is_admin',
    'check_is_admin',
    'is_portal_admin',
    'create_profile_after_signup',
    'get_my_user_info',
    'get_user_context',
    'admin_reset_password',
    'reset_user_password',
    'handle_updated_at',
    'update_updated_at_column',
    'start_user_impersonation',
    'end_user_impersonation',
]

# Specific functions to exclude (app functions)
EXCLUDE_SPECIFIC = [
    'get_user_roles',
    'has_role',
    'user_has_role',
    'update_user_roles',
    'create_new_user',
    'create_new_user_v2',
    'create_user_with_supabase_auth',
    'sync_user_roles_to_context',
    'get_user_organization',
    'can_access_organization',
    'can_owner_access_organization',
    'can_access_organization_data',
    'sync_primary_business_to_profile',
    'upsert_user_business',
    'ensure_primary_business',
    'get_organizations_secure',
    'get_total_organizations_count',
    'get_organization_modules',
    'can_access_fleet_record',
    'can_access_maintenance_note',
    'can_access_maintenance_record',
    'can_access_module',
    'has_org_role',
    'has_system_role',
    'has_fleet_permission',
    'has_fleet_maintenance_permission',
    'has_fleet_role',
    'is_fleet_enabled',
    'is_fleet_maintenance_enabled',
    'is_module_enabled',
]

def extract_function_name(create_statement):
    """Extract the function name from CREATE OR REPLACE FUNCTION statement."""
    match = re.search(r'CREATE OR REPLACE FUNCTION\s+(?:public\.)?(\w+)\s*\(', create_statement)
    if match:
        return match.group(1)
    return None

def should_include_function(func_name, func_body):
    """Determine if a function should be included in portal-only file."""
    func_name_lower = func_name.lower()
    func_body_lower = func_body.lower()

    # Check specific inclusions FIRST (highest priority)
    if func_name in INCLUDE_SPECIFIC:
        return True, f"included specific: {func_name}"

    # Check specific exclusions
    if func_name in EXCLUDE_SPECIFIC:
        return False, f"excluded specific: {func_name}"

    # Check include keywords (high priority)
    for keyword in INCLUDE_KEYWORDS:
        if keyword in func_name_lower:
            return True, f"included keyword '{keyword}' in name"

    # Check exclude keywords (in name or body)
    for keyword in EXCLUDE_KEYWORDS:
        if keyword in func_name_lower:
            # Special cases: organization when in portal context
            if keyword == 'organization' and 'portal' in func_name_lower:
                continue
            return False, f"excluded keyword '{keyword}' in name"

    # Check if it references app-specific tables/types (only if not already included)
    if 'app_role' in func_body_lower:
        return False, "references app_role enum"

    if 'user_roles' in func_body_lower and 'user_roles.' in func_body_lower:
        return False, "references user_roles table"

    return False, "no matching criteria"

def extract_functions(input_file):
    """Extract all functions from the SQL file."""
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()

    functions = []
    current_func = []
    in_function = False
    function_start_line = 0

    lines = content.split('\n')

    for i, line in enumerate(lines, 1):
        if line.startswith('CREATE OR REPLACE FUNCTION'):
            in_function = True
            function_start_line = i
            current_func = [line]
        elif in_function:
            current_func.append(line)
            # Functions end with $function$;
            if line.strip() == '$function$;':
                func_text = '\n'.join(current_func)
                func_name = extract_function_name(func_text)
                functions.append({
                    'name': func_name,
                    'text': func_text,
                    'start_line': function_start_line,
                    'end_line': i
                })
                in_function = False
                current_func = []

    return functions

def main():
    input_file = Path('/home/joeylutes/projects/foundry-portal/database/schema_export/imports/05_ADD_FUNCTIONS.sql')
    output_file = Path('/home/joeylutes/projects/foundry-portal/database/schema_export/imports/05_ADD_FUNCTIONS_PORTAL_ONLY.sql')

    print(f"Reading functions from {input_file}...")
    all_functions = extract_functions(input_file)
    print(f"Found {len(all_functions)} total functions")

    portal_functions = []
    excluded_functions = []

    print("\nAnalyzing functions...")
    for func in all_functions:
        include, reason = should_include_function(func['name'], func['text'])
        if include:
            portal_functions.append(func)
            print(f"  ✓ INCLUDE: {func['name']} - {reason}")
        else:
            excluded_functions.append(func)
            print(f"  ✗ EXCLUDE: {func['name']} - {reason}")

    print(f"\nPortal functions: {len(portal_functions)}")
    print(f"Excluded functions: {len(excluded_functions)}")
    print(f"Total: {len(all_functions)}")

    # Write output file
    print(f"\nWriting portal functions to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        # Write header
        f.write("-- =====================================================\n")
        f.write("-- PORTAL-ONLY FUNCTIONS\n")
        f.write("-- =====================================================\n")
        f.write(f"-- Extracted from: 05_ADD_FUNCTIONS.sql\n")
        f.write(f"-- Total functions in original file: {len(all_functions)}\n")
        f.write(f"-- Functions included (portal-related): {len(portal_functions)}\n")
        f.write(f"-- Functions excluded (app-related): {len(excluded_functions)}\n")
        f.write("-- =====================================================\n\n")

        # Write functions
        for i, func in enumerate(portal_functions, 1):
            f.write(f"-- Function {i}/{len(portal_functions)}: {func['name']}\n")
            f.write(func['text'])
            f.write("\n\n")

    print(f"✓ Successfully created {output_file}")
    print(f"  - Included: {len(portal_functions)} functions")
    print(f"  - Excluded: {len(excluded_functions)} functions")

if __name__ == '__main__':
    main()
