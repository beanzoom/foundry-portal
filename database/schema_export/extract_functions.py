#!/usr/bin/env python3
"""Extract all CREATE FUNCTION statements from all_functions_results.md"""

import re

with open('all_functions_results.md', 'r') as f:
    content = f.read()

# Find all function_definition values using regex
pattern = r'"function_definition":\s*"((?:[^"\\]|\\.)*)"'
matches = re.findall(pattern, content, re.DOTALL)

print(f"Found {len(matches)} function definitions")

with open('imports/05_ADD_FUNCTIONS.sql', 'w') as out:
    out.write('/*\n')
    out.write('================================================================================\n')
    out.write('ADD ALL DATABASE FUNCTIONS\n')
    out.write('================================================================================\n')
    out.write(f'Run this in NEW database to add all {len(matches)} functions\n')
    out.write('================================================================================\n')
    out.write('*/\n\n')

    for i, func_def in enumerate(matches, 1):
        # Unescape the string
        func_def = func_def.replace('\\n', '\n')
        func_def = func_def.replace('\\r', '')
        func_def = func_def.replace('\\"', '"')
        func_def = func_def.replace('\\\\', '\\')

        out.write(f'-- Function {i}/{len(matches)}\n')
        out.write(func_def)
        out.write('\n\n')
        out.write('-- ' + '=' * 70 + '\n\n')

    out.write('-- All functions added successfully\n')

print(f'✓ Created imports/05_ADD_FUNCTIONS.sql with {len(matches)} functions')
