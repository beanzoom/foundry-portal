#!/bin/bash
# Portal Verification Script
# Run this to verify the portal repository is properly set up

echo "🔍 Verifying Foundry Portal Repository..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in portal repository root${NC}"
    exit 1
fi

# Check package name
PKG_NAME=$(grep -o '"name": "[^"]*"' package.json | cut -d'"' -f4)
if [ "$PKG_NAME" != "foundry-portal" ]; then
    echo -e "${RED}❌ Error: package.json name is '$PKG_NAME', expected 'foundry-portal'${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ Package name correct: foundry-portal${NC}"
fi

# Check port configuration
PORT=$(grep -o '"dev": "vite --port [0-9]*"' package.json | grep -o '[0-9]*')
if [ "$PORT" != "8082" ]; then
    echo -e "${RED}❌ Error: Dev server port is $PORT, expected 8082${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ Port configured correctly: 8082${NC}"
fi

# Check for app-specific directories that should NOT exist
echo ""
echo "Checking for app-specific code..."

if [ -d "src/pages/bridge" ]; then
    echo -e "${RED}❌ Error: src/pages/bridge exists (should be removed)${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ No bridge pages found${NC}"
fi

if [ -d "src/features" ]; then
    echo -e "${RED}❌ Error: src/features exists (should be removed)${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ No features directory found${NC}"
fi

if [ -d "src/components/dialog-library" ]; then
    echo -e "${RED}❌ Error: src/components/dialog-library exists (should be removed)${NC}"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ No dialog-library found${NC}"
fi

# Check for portal-specific directories that SHOULD exist
echo ""
echo "Checking for portal-specific code..."

if [ ! -d "src/pages/portal" ]; then
    echo -e "${RED}❌ Error: src/pages/portal missing${NC}"
    ((ERRORS++))
else
    PORTAL_PAGES=$(find src/pages/portal -name "*.tsx" -o -name "*.ts" | wc -l)
    echo -e "${GREEN}✅ Portal pages found: $PORTAL_PAGES files${NC}"
fi

if [ ! -d "src/components/portal" ]; then
    echo -e "${RED}❌ Error: src/components/portal missing${NC}"
    ((ERRORS++))
else
    PORTAL_COMPONENTS=$(find src/components/portal -name "*.tsx" -o -name "*.ts" | wc -l)
    echo -e "${GREEN}✅ Portal components found: $PORTAL_COMPONENTS files${NC}"
fi

# Check for incorrect import patterns
echo ""
echo "Checking for incorrect import patterns..."

BAD_IMPORTS=$(grep -r "@/features/auth/hooks/useAuth" src 2>/dev/null | wc -l)
if [ "$BAD_IMPORTS" -gt 0 ]; then
    echo -e "${RED}❌ Error: Found $BAD_IMPORTS files with @/features/auth/hooks/useAuth imports${NC}"
    echo "   Should use @/hooks/useAuth instead"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ No incorrect @/features imports found${NC}"
fi

BRIDGE_IMPORTS=$(grep -r "@/pages/bridge" src 2>/dev/null | grep -v "//" | grep "import" | wc -l)
if [ "$BRIDGE_IMPORTS" -gt 0 ]; then
    echo -e "${RED}❌ Error: Found $BRIDGE_IMPORTS active imports from bridge${NC}"
    echo "   (commented imports are OK)"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ No active bridge imports found${NC}"
fi

# Check for required files
echo ""
echo "Checking required configuration files..."

REQUIRED_FILES=(
    ".env"
    "vite.config.ts"
    "tsconfig.json"
    "tsconfig.app.json"
    "tsconfig.node.json"
    "vercel.json"
    "CLAUDE_HANDOFF.md"
    "README.md"
    "SETUP.md"
)

for FILE in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$FILE" ]; then
        echo -e "${RED}❌ Error: $FILE missing${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅ $FILE exists${NC}"
    fi
done

# Check for company logos
echo ""
echo "Checking assets..."

if [ ! -f "public/logo-transparent.png" ]; then
    echo -e "${YELLOW}⚠️  Warning: public/logo-transparent.png missing${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ Company logo found${NC}"
fi

# Check environment variables
echo ""
echo "Checking environment variables..."

if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file missing${NC}"
    ((ERRORS++))
else
    if ! grep -q "VITE_SUPABASE_URL" .env; then
        echo -e "${RED}❌ Error: VITE_SUPABASE_URL not set in .env${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅ Supabase URL configured${NC}"
    fi

    if ! grep -q "VITE_SUPABASE_PUBLISHABLE_KEY" .env; then
        echo -e "${RED}❌ Error: VITE_SUPABASE_PUBLISHABLE_KEY not set in .env${NC}"
        ((ERRORS++))
    else
        echo -e "${GREEN}✅ Supabase publishable key configured${NC}"
    fi
fi

# Try to build
echo ""
echo "Testing production build..."
if npm run build > /tmp/portal-build.log 2>&1; then
    echo -e "${GREEN}✅ Production build successful${NC}"
else
    echo -e "${RED}❌ Error: Production build failed${NC}"
    echo "   See /tmp/portal-build.log for details"
    ((ERRORS++))
fi

# Final summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 VERIFICATION COMPLETE - NO ISSUES FOUND${NC}"
    echo ""
    echo "Portal repository is properly configured and ready for development!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: npm run dev"
    echo "  2. Access: http://portal.localhost:8082/"
    echo "  3. Test portal features"
    echo "  4. Deploy to Vercel when ready"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  VERIFICATION COMPLETE - $WARNINGS WARNING(S)${NC}"
    echo ""
    echo "Portal repository is mostly configured, but please review warnings above."
    exit 0
else
    echo -e "${RED}❌ VERIFICATION FAILED - $ERRORS ERROR(S), $WARNINGS WARNING(S)${NC}"
    echo ""
    echo "Please fix the errors above before proceeding."
    exit 1
fi
