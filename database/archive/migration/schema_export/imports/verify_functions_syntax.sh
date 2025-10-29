#!/bin/bash

FILE="05_ADD_FUNCTIONS.sql"

echo "Checking $FILE for syntax issues..."
echo ""

# Check for any $function$ without semicolon (various indentations)
ISSUES=$(grep -n '^\s*\$function\$\s*$' "$FILE" | grep -v ';\s*$')

if [ -z "$ISSUES" ]; then
    echo "✅ All function delimiters have semicolons!"
    echo ""
    echo "Function counts:"
    echo "  - Total 'CREATE OR REPLACE' statements: $(grep -c '^CREATE OR REPLACE FUNCTION' "$FILE")"
    echo "  - Total '\$function\$;' delimiters: $(grep -c '\$function\$;' "$FILE")"
    echo ""
    echo "File is ready to run! 🚀"
else
    echo "❌ Found delimiters without semicolons:"
    echo "$ISSUES"
    echo ""
    echo "Run the fix:"
    echo "  sed -i 's/^\s*\$function\$$/\$function\$;/g' $FILE"
fi
